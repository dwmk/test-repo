import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import AvatarStage from '@/components/yuna/AvatarStage';
import StageHeader from '@/components/yuna/StageHeader';
import GestureDock from '@/components/yuna/GestureDock';
import ChatTranscript from '@/components/yuna/ChatTranscript';
import Composer from '@/components/yuna/Composer';
import OutfitSheet from '@/components/yuna/OutfitSheet';
import { DEFAULT_OUTFIT, detectEmotion } from '@/lib/yunaApi';

export default function Yuna() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [outfit, setOutfit] = useState(DEFAULT_OUTFIT);
  const [face, setFace] = useState({ name: 'neutral', id: 0 });
  const [gesture, setGesture] = useState(null);
  const [speech, setSpeech] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated()
      .then((authed) => {
        setSignedIn(authed);
        if (!authed) return null;
        return base44.entities.YunaMessage.list({ sort: 'created_date', limit: 60 })
          .then((page) => setMessages(page.items || []));
      })
      .finally(() => setLoading(false));
  }, []);

  const send = async (raw) => {
    const content = raw.trim();
    if (!content || sending) return;

    setError('');
    const userMessage = { id: `local-${Date.now()}`, role: 'user', content };
    const history = [...messages, userMessage];
    setMessages(history);
    setSending(true);

    try {
      if (signedIn) await base44.entities.YunaMessage.create({ role: 'user', content });

      const response = await base44.functions.invoke('yunaChat', {
        messages: history.slice(-14).map((message) => ({ role: message.role, content: message.content })),
      });

      const reply = response.data?.text;
      if (!reply) throw new Error(response.data?.error || 'No reply');

      if (signedIn) await base44.entities.YunaMessage.create({ role: 'assistant', content: reply });
      setMessages((prev) => [...prev, { id: `reply-${Date.now()}`, role: 'assistant', content: reply }]);
      if (voiceOn) setSpeech({ text: reply, id: Date.now() });
      setGesture(Math.random() < 0.3 ? { name: 'wave', id: Date.now() } : null);

      const emotion = await detectEmotion(reply);
      if (emotion) setFace({ name: emotion, id: Date.now() });
    } catch (err) {
      setError('She lost her voice for a moment. Try that again.');
    } finally {
      setSending(false);
    }
  };

  const toggleVoice = () => {
    setVoiceOn((prev) => !prev);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background md:flex-row">
      <section className="aurora-stage flex min-h-0 flex-1 flex-col">
        <AvatarStage
          outfitFile={outfit.file}
          face={face}
          gesture={gesture}
          speech={voiceOn ? speech : null}
          voiceOn={voiceOn}
          onSpeakingChange={setSpeaking}
        />
        <StageHeader
          speaking={speaking}
          voiceOn={voiceOn}
          onToggleVoice={toggleVoice}
          onOpenWardrobe={() => setWardrobeOpen(true)}
        />
        <div className="mt-auto">
          <GestureDock mood={face.name} speaking={speaking} thinking={sending} />
        </div>
      </section>

      <section className="glass-panel relative flex h-[56%] min-h-0 flex-col rounded-t-[28px] border-t border-border/60 md:h-full md:w-[420px] md:rounded-none md:border-l md:border-t-0">
        <ChatTranscript
          messages={messages}
          thinking={sending}
          loading={loading}
          onPick={send}
        />

        {error && (
          <p className="px-4 pb-1 text-xs text-destructive">{error}</p>
        )}

        <Composer onSend={send} disabled={sending} />
      </section>

      <OutfitSheet
        open={wardrobeOpen}
        onOpenChange={setWardrobeOpen}
        currentId={outfit.id}
        onSelect={setOutfit}
      />
    </div>
  );
}