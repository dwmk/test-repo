import { useEffect, useRef, useState } from 'react';
import { YunaAvatarEngine } from '@/lib/yunaAvatar';

export default function AvatarStage({ outfitFile, face, gesture, speech, voiceOn = true, onSpeakingChange }) {
  const hostRef = useRef(null);
  const engineRef = useRef(null);
  const loadedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    const engine = new YunaAvatarEngine();
    engineRef.current = engine;
    engine
      .mount(hostRef.current, onSpeakingChange)
      .then(() => setReady(true))
      .catch(() => setFailed(true));

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !outfitFile) return;
    let cancelled = false;
    const first = !loadedRef.current;
    if (!first) setSwapping(true);

    engineRef.current
      ?.loadModel(outfitFile)
      .catch(() => setFailed(true))
      .finally(() => {
        loadedRef.current = true;
        if (!cancelled) setSwapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, [outfitFile, ready]);

  useEffect(() => {
    if (face?.name) engineRef.current?.setEmotion(face.name);
  }, [face]);

  useEffect(() => {
    if (gesture?.name) engineRef.current?.play(gesture.name);
  }, [gesture]);

  useEffect(() => {
    if (speech?.text) engineRef.current?.speak(speech.text);
  }, [speech]);

  useEffect(() => {
    if (!voiceOn) engineRef.current?.stopSpeaking();
  }, [voiceOn]);

  return (
    <div className="absolute inset-0">
      <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />

      {!ready && !failed && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">waking yuna</p>
          </div>
        </div>
      )}

      {swapping && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center">
          <span className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground backdrop-blur">
            changing
          </span>
        </div>
      )}

      {failed && (
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-card/70 p-4 text-center text-sm leading-relaxed text-muted-foreground backdrop-blur">
          Her avatar could not load on this connection, but she can still talk with you.
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}