import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { retargetAnimationFromUrl } from 'vrm-mixamo-retarget';
import { listVoices, resolveYunaVoice, whenVoicesReady } from '@/lib/yunaVoice';

export const YUNA_API = 'https://hana.makron.app';

const FACE_EMOTIONS = ['happy', 'relaxed', 'sad', 'angry', 'surprised'];
const VISEMES = ['aa', 'ih', 'ou', 'ee', 'oh'];
const EMOTION_HOLD_MS = 8000;

export class YunaAvatarEngine {
  constructor() {
    this.vrm = null;
    this.mixer = null;
    this.clips = {};
    this.currentAction = null;
    this.root = null;
    this.pointer = { x: 0, y: 0 };
    this.clock = new THREE.Clock();
    this.emotionUntil = 0;
    this.visemeTimer = null;
    this.disposed = false;
    this.onSpeakingChange = null;
    this.handlePointerMove = (event) => {
      const rect = this.container?.getBoundingClientRect();
      if (!rect) return;
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };
  }

  async mount(container, onSpeakingChange) {
    this.container = container;
    this.onSpeakingChange = onSpeakingChange;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 40);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'pan-y';
    container.appendChild(this.renderer.domElement);

    const keyLight = new THREE.DirectionalLight(0xfff4ff, 2.4);
    keyLight.position.set(0.9, 2.1, 1.7);
    const rimLight = new THREE.DirectionalLight(0xa78bfa, 2.6);
    rimLight.position.set(-1.4, 1.7, -1.3);
    const fillLight = new THREE.DirectionalLight(0xf0abfc, 1.3);
    fillLight.position.set(1.7, 1.1, -0.9);
    this.scene.add(keyLight, rimLight, fillLight, new THREE.HemisphereLight(0xffffff, 0x1b1030, 1.7));

    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    container.addEventListener('pointermove', this.handlePointerMove);

    this.clock.start();
    this.renderer.setAnimationLoop(this.tick);
  }

  resize() {
    if (!this.renderer || !this.container) return;
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    const portrait = height > width;
    this.camera.position.set(0, 1.34, portrait ? 2.32 : 1.96);
    this.camera.lookAt(0, 1.36, 0);
    this.camera.updateProjectionMatrix();
  }

  tick = () => {
    if (this.disposed || !this.renderer) return;
    const delta = this.clock.getDelta();
    const time = this.clock.elapsedTime;

    if (this.vrm) {
      if (this.root) {
        this.root.rotation.y = Math.sin(time * 0.4) * 0.05 + this.pointer.x * 0.09;
        this.root.position.y = Math.sin(time * 0.85) * 0.004;
      }
      if (this.lookTarget) {
        this.lookTarget.position.set(this.pointer.x * 0.55, 1.42 + this.pointer.y * 0.25, 1.25);
      }
      if (this.emotionUntil && performance.now() > this.emotionUntil) {
        this.emotionUntil = 0;
        this.applyEmotion('neutral', 0);
      }
      this.vrm.update(delta);
    }

    if (this.mixer) this.mixer.update(delta);
    this.renderer.render(this.scene, this.camera);
  };

  async loadModel(fileName) {
    if (!this.renderer) return;
    this.loadToken = (this.loadToken || 0) + 1;
    const token = this.loadToken;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const url = `${YUNA_API}/api/vrm?file=${encodeURIComponent(fileName)}`;
    const gltf = await loader.loadAsync(url);
    if (this.disposed || this.loadToken !== token) return;

    const vrm = gltf.userData.vrm;
    if (!vrm) throw new Error('Avatar model could not be read');

    if (this.root) {
      this.scene.remove(this.root);
      this.root.traverse((node) => {
        node.geometry?.dispose?.();
      });
      this.root = null;
    }

    try {
      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.combineSkeletons(gltf.scene);
    } catch (error) {
      /* optimization only */
    }
    VRMUtils.rotateVRM0(vrm);
    vrm.scene.traverse((node) => {
      node.frustumCulled = false;
    });

    this.root = new THREE.Group();
    this.root.add(vrm.scene);
    this.scene.add(this.root);

    // Retargeting reads hips world positions, so the rig must be positioned first.
    this.scene.updateMatrixWorld(true);
    try {
      vrm.update(0);
    } catch (error) {
      /* ignore */
    }
    this.root.updateMatrixWorld(true);

    this.vrm = vrm;
    this.clips = {};
    this.mixer = new THREE.AnimationMixer(vrm.scene);
    this.mixer.addEventListener('finished', () => {
      this.play('idle');
    });

    this.lookTarget = new THREE.Object3D();
    this.scene.add(this.lookTarget);
    try {
      vrm.lookAt.target = this.lookTarget;
    } catch (error) {
      /* older models may not expose lookAt */
    }

    await this.play('idle');
  }

  async play(type = 'idle') {
    if (!this.vrm || !this.mixer || this.disposed) return;
    try {
      let clip = this.clips[type];
      if (!clip) {
        clip = await retargetAnimationFromUrl(`${YUNA_API}/api/animation/${type}`, this.vrm);
        if (clip && type === 'idle') {
          clip.tracks = clip.tracks.filter((track) => !/head|neck/i.test(track.name));
        }
        if (clip) this.clips[type] = clip;
      }
      if (!clip || this.disposed) return;

      const looping = type === 'idle' || type === 'walk';
      const action = this.mixer.clipAction(clip);
      if (this.currentAction === action && action.isRunning()) return;
      action.setLoop(looping ? THREE.LoopRepeat : THREE.LoopOnce, looping ? Infinity : 1);
      action.clampWhenFinished = true;
      action.reset().fadeIn(0.3).play();
      if (this.currentAction && this.currentAction !== action) this.currentAction.fadeOut(0.3);
      this.currentAction = action;
    } catch (error) {
      /* a missing gesture never breaks the scene */
    }
  }

  applyEmotion(name, weight = 0.85) {
    const expressions = this.vrm?.expressionManager;
    if (!expressions) return;
    FACE_EMOTIONS.forEach((emotion) => {
      try {
        expressions.setValue(emotion, emotion === name ? weight : 0);
      } catch (error) {
        /* model may lack this blend shape */
      }
    });
  }

  setEmotion(name) {
    if (!name) return;
    this.applyEmotion(name, 0.85);
    this.emotionUntil = name === 'neutral' ? 0 : performance.now() + EMOTION_HOLD_MS;
  }

  speak(text) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this.stopSpeaking();
    const clean = String(text || '')
      .replace(/\*[^*]*\*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    const applyVoice = (voice) => {
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || 'en-US';
      }
    };

    utterance.pitch = 1.18;
    utterance.rate = 1.04;

    utterance.onstart = () => this.onSpeakingChange?.(true);
    utterance.onboundary = (event) => this.visemeFor(clean, event.charIndex, event.charLength);
    utterance.onend = () => this.finishSpeaking();
    utterance.onerror = () => this.finishSpeaking();

    this.utterance = utterance;

    const start = () => {
      if (this.utterance !== utterance) return;
      applyVoice(this.voice || resolveYunaVoice());
      window.speechSynthesis.speak(utterance);
    };

    this.voice = this.voice || resolveYunaVoice(listVoices());
    if (this.voice || listVoices().length) start();
    else whenVoicesReady().then((voices) => {
      this.voice = resolveYunaVoice(voices);
      start();
    });
  }

  visemeFor(text, index, length) {
    const expressions = this.vrm?.expressionManager;
    if (!expressions) return;
    const word = text.slice(index, index + (length || 6)).toLowerCase();
    VISEMES.forEach((viseme) => {
      try {
        expressions.setValue(viseme, 0);
      } catch (error) {
        /* ignore */
      }
    });
    const set = (name, value) => {
      try {
        expressions.setValue(name, value);
      } catch (error) {
        /* ignore */
      }
    };
    if (word.includes('o')) set('oh', 0.42);
    if (word.includes('a')) set('aa', 0.34);
    if (word.includes('u')) set('ou', 0.3);
    if (word.includes('i')) set('ih', 0.22);
    if (word.includes('e')) set('ee', 0.24);

    clearTimeout(this.visemeTimer);
    this.visemeTimer = setTimeout(() => this.clearMouth(), 150);
  }

  clearMouth() {
    const expressions = this.vrm?.expressionManager;
    if (!expressions) return;
    VISEMES.forEach((viseme) => {
      try {
        expressions.setValue(viseme, 0);
      } catch (error) {
        /* ignore */
      }
    });
  }

  finishSpeaking() {
    this.clearMouth();
    this.onSpeakingChange?.(false);
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    this.finishSpeaking();
  }

  dispose() {
    this.disposed = true;
    this.stopSpeaking();
    clearTimeout(this.visemeTimer);
    this.container?.removeEventListener('pointermove', this.handlePointerMove);
    this.resizeObserver?.disconnect();
    this.renderer?.setAnimationLoop(null);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement?.remove();
    }
    this.scene?.clear();
  }
}