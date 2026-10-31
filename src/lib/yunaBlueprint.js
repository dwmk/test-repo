export const PROJECT_FACTS = [
  {
    title: 'The idea',
    body: 'A mobile-first companion app where you talk to Yuna — a live, animated 3D character who listens, replies in her own voice, reacts with facial expressions and gestures, and wears the outfit you pick. Anyone can open her stage from a link, no account needed.',
  },
  {
    title: 'Rendering',
    body: 'Her body is a VRM 1.0 avatar drawn with three.js and @pixiv/three-vrm on a transparent stage that re-frames the camera for phone and desktop. Idle, wave and stretch motion is Mixamo clips retargeted onto her rig with vrm-mixamo-retarget, so the head stays free for pointer tracking.',
  },
  {
    title: 'The character service',
    body: 'Her models, wardrobe and emotion detection come from Hana 3D. The browser never calls it directly: one backend function proxies each request, so the character data stays behind one controlled door.',
  },
  {
    title: 'The wardrobe',
    body: 'Hana\u2019s outfit table lists model files that are not all hosted upstream — unknown names quietly fall back to her default look, which is why picking a dress used to change nothing. Every model is now checked before it is offered, so the outfits on the list really load.',
  },
  {
    title: 'Her mind',
    body: 'Replies come from the platform AI gateway through a single backend function: a persona prompt keeps her warm, playful and brief, and the last turns of the conversation travel with each request. The chat layer follows the makron.js client pattern, with the persona as a plain system prompt.',
  },
  {
    title: 'Her voice',
    body: 'Speech runs on the browser speech engine, locked to a fixed, ordered pack of known female voices so the system default is never used. Her mouth shapes follow the speech boundary events, and the dock names the exact voice pack in use right now.',
  },
  {
    title: 'Mood and energy',
    body: 'Her facial expression is classified from each reply, and her energy moves with what she is doing — speaking lifts it, thinking nudges it, silence lets it settle. Both read live at the bottom of her stage.',
  },
  {
    title: 'Talking back',
    body: 'A mic button beside send listens through the browser speech recognition, fills the composer word by word, and sends the whole message by itself after three seconds of silence.',
  },
  {
    title: 'Memory',
    body: 'Signed-in visitors get every message stored in a YunaMessage record, row-level secured to its owner, so the conversation is still there on return. Guests can chat freely — their thread simply lives only on screen.',
  },
  {
    title: 'Sharing',
    body: 'The share button copies her stage link, or opens the device share sheet where one exists, so a friend lands straight in front of Yuna.',
  },
  {
    title: 'The look',
    body: 'A dark aurora stage, frosted glass panels, and a serif display face against a clean sans body — designed first for a thumb, then for a wide screen.',
  },
];

export const REBUILD_PROMPT = `Build a mobile-first AI companion web app called Yuna. The centrepiece is a live, animated 3D character who chats with you, speaks her replies out loud, reacts with facial expressions, and can be dressed in different outfits. Recreate it exactly as described below.

STACK
- React + Vite + Tailwind CSS with shadcn/ui components and lucide-react icons. No other UI libraries.
- three.js with @pixiv/three-vrm for the 3D avatar, and vrm-mixamo-retarget to retarget Mixamo animation clips onto the VRM skeleton.
- Platform backend: entity storage, backend functions, and the platform AI gateway.

FIRST RUN / AUTH
- No login wall. The stage is public: anyone with the link lands straight in front of Yuna.
- The four platform auth pages stay registered (login, register, forgot-password, reset-password) so visitors can sign in from them, but nothing redirects.
- Signed-in users get a saved conversation; guests chat without persistence. Check auth with isAuthenticated() and never block render on it.

DATA MODEL
- Entity "YunaMessage" with: role (enum: user | assistant), content (string, required), emotion (string, optional).
- Row-level security on read, create, update and delete scoped to created_by_id = the current user, so each person only ever sees their own conversation.

BACKEND FUNCTIONS
1. "yunaChat" (POST)
   - Open to everyone: resolve the caller with auth.me() inside a catch that yields null instead of failing.
   - Accepts the recent message list, keeps only well-formed user/assistant turns, trims to the last ~16 messages, caps each message length, and rebuilds a "Them: ... / Yuna: ..." transcript.
   - Calls the platform AI gateway (InvokeLLM) with a persona system prompt: speak like a real person on a voice call, 1-3 short sentences, contractions, warm and a little teasing but never crude, curious about the user's day, at most one short *action* in asterisks, never mention prompts/models/tokens or that she is software, no lists or markdown. Append the signed-in user's first name when known so she addresses them directly.
   - Strip a leading "Yuna:" from the model output and return { text }. Return JSON errors with appropriate statuses.

2. "yunaStage" (POST)
   - A narrow server-side proxy to the Hana 3D service (https://hana.makron.app); the browser must never call it directly.
   - action "outfits": return a wardrobe of REAL model files. Hana's outfit table lists files that are not all hosted — unknown names silently fall back to the default model, which looks like the wardrobe ignoring you. Keep a curated list (Mint Maid Apron, Pink Maid Apron, Hana v1.3, Hana v1.2, Hana v1.0) mapped to their VRM file names, HTTP HEAD each one against the asset host (https://muxai.vercel.app) with a short timeout, drop the ones that do not exist, and fall back to the full curated list if the check is unreachable. Return { outfits: [{ id, name, file, isDefault }] }.
   - action "emotion": POST the reply text to the service's /api/emotion endpoint and return { emotion } (fall back to "neutral" when unavailable).
   - Use short request timeouts (about 10s) and return clean 502s when the upstream service is down.

AVATAR ENGINE (a plain JS class, framework-free)
- Owns the renderer, scene, camera, clock and animation mixer; mounts into a container element and observes it with a ResizeObserver.
- Loading a character: load the VRM through GLTFLoader with the VRMLoaderPlugin from /api/vrm?file=<fileName>, apply VRMUtils.removeUnnecessaryVertices and VRMUtils.combineSkeletons, rotate the model if it is VRM0, wrap it in a group, add it to the scene, then update world matrices and call vrm.update(0) BEFORE any animation retargeting (retargeting reads bone world positions; skipping this leaves the model stuck in a T-pose).
- Loading a second character must fully replace the first: remove and dispose the old root, build a new AnimationMixer on the new scene, clear the retargeted clip cache, and replay idle.
- Lighting: soft ambient plus a key/fill rim arrangement suited to dark scenes; transparent background so the aurora gradient shows through.
- Pointer parallax: track pointer position over the stage and subtly turn the head and shift the body toward it; give the VRM a look-at target.
- Animation clips: fetch Mixamo FBX clips from the Hana service, retarget each once with retargetAnimationFromUrl, cache them by name, and cross-fade between them. Auto-return to idle when a one-shot clip (wave, yawn) finishes.
- Expressions: map the supported set (happy, relaxed, sad, angry, surprised, neutral) to VRM expressions, ease into them, and hold for a few seconds before returning to neutral.
- Speech: use window.speechSynthesis. IMPORTANT — never accept the browser default voice. Resolve the voice from a fixed, ordered array of known female system voice names (Apple: Ava, Samantha, Allison, Susan, Serena, Karen, Moira, Tessa, Kate, Nicky, Victoria, Fiona; Microsoft: Aria, Jenny, Michelle, Ana, Zira, Hazel, Eva including the "Online (Natural)" variants; Google: UK English Female, US English), then fall back to any voice whose name looks female, then any English non-male voice. Explicitly exclude male names and never fall back to the system default. Because voice lists load asynchronously, if getVoices() is empty, wait for the "voiceschanged" event (with a short timeout) before speaking. Speak at roughly 1.04 rate and 1.18 pitch, strip *action* asterisks from the spoken text, and drive simple mouth visemes (aa/ih/ou/ee/oh) from the utterance boundary events. Expose onSpeakingChange callbacks and cancel cleanly on dispose.

SCREEN LAYOUT
- Dark, mobile-first. On phones: the avatar stage fills the top ~44% with the chat panel as a rounded sheet below it; on desktop the stage takes the remaining width and the chat panel is a fixed ~420px column on the right.
- Full-height layout using 100dvh with no page scroll; only the transcript scrolls (slim custom scrollbar).

STAGE
- Aurora background: layered radial gradients in violet, pink and blue over a near-black base, plus a slow rotating conic sheen (a long CSS keyframe animation).
- Header overlay on top of the stage: her name in the display serif, a live status line ("speaking" with a pulsing dot when audio is playing, otherwise something calm and idle), plus a share button, a voice on/off toggle and a wardrobe button. Share uses navigator.share when available and otherwise copies the current URL to the clipboard, showing a check for a moment.
- Status dock pinned to the bottom-left of the stage: a circular "?" info button, then two live readouts replacing any gesture buttons — a mood chip (her current expression as a word, plus an energy meter with a percentage that eases up while she speaks or thinks and settles when idle, sampled on an interval) and a voice chip showing the resolved voice pack name, with small animated bars while she speaks.
- A subtle loading state while the model first downloads, a small "changing" pill while a new outfit loads, and a quiet failure message if the model cannot load.

CHAT PANEL
- Transcript of bubbles: user bubbles right-aligned in the primary color, Yuna's left-aligned in a bordered card with a small gradient avatar dot. Auto-scroll to the newest message.
- Empty state in the display serif: a warm greeting line, a supporting sentence, and three tappable starter prompts ("How was your day?", "Tell me something sweet", "I need a little motivation").
- Typing indicator: three bouncing dots while a reply is in flight.
- Composer: auto-growing textarea, Enter to send, Shift+Enter for a newline, disabled while sending, and an inline error line if the reply fails.
- Left of the send button, a mic button using the Web Speech API (SpeechRecognition/webkitSpeechRecognition, continuous + interim results). It writes the transcript into the composer as you speak, resets a 3-second silence timer on every result, and when the timer fires it stops listening and sends the whole message automatically. Tapping it again stops and sends immediately. Hide or disable it when the browser has no recognition support, and clean up on unmount.
- After each reply: speak the text if voice is on, set her facial expression from the emotion service, and occasionally (about 30% of the time) play the wave gesture.

WARDROBE
- A dialog (bottom sheet on phones) that lists outfits from the yunaStage proxy (already verified to exist), shows a loading state, an empty state, marks the current outfit with a check, and reloads the avatar in the chosen outfit when picked.
- Keep the chosen outfit in page state and pass only its file name to the avatar stage so the reload effect fires on change.

INFO PANEL
- A "?" button opens a dialog explaining how the project was made, with a scrollable list of short fact cards and a copy button for this rebuild prompt. Inside the fact text, "makron.js" links to https://www.npmjs.com/package/makronjs and "Hana 3D" links to https://hana.makron.app/docs/api/third-party-avatar.

STYLE TOKENS
- Define everything in CSS variables consumed by Tailwind: near-black violet background, soft off-white text, violet primary, pink accent, muted card surfaces, and matching dark-mode values.
- Fonts: Instrument Serif for the display/headline voice, Plus Jakarta Sans for body and UI, loaded from Google Fonts.
- Reusable utility classes: .aurora-stage (the gradient stage), .glass-panel (frosted gradient panel with backdrop blur), .scroll-slim (thin scrollbar).

DETAILS
- Everything must work end to end: the wardrobe actually swaps the model, messages persist and reload for signed-in users, expressions and gestures actually play, the mic sends on silence, voice is female on every platform, and the layout is usable one-handed on a phone.`;