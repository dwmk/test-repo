import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { listVoices, resolveYunaVoice, whenVoicesReady } from '@/lib/yunaVoice';

const tidy = (name) =>
  String(name || '')
    .replace(/\s*Online \(Natural\)/i, '')
    .replace(/\s*-\s*English.*$/i, '')
    .replace(/\s*\(United States\)/i, '')
    .trim();

export default function VoiceChip({ speaking }) {
  const [voiceName, setVoiceName] = useState('finding voice…');

  useEffect(() => {
    let alive = true;
    const apply = (voices) => {
      const voice = resolveYunaVoice(voices);
      if (alive) setVoiceName(voice ? tidy(voice.name) : 'no voice pack');
    };

    apply(listVoices());
    whenVoicesReady().then(apply);

    const synth = window.speechSynthesis;
    const onVoices = () => apply(listVoices());
    synth?.addEventListener?.('voiceschanged', onVoices);
    return () => {
      alive = false;
      synth?.removeEventListener?.('voiceschanged', onVoices);
    };
  }, []);

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs backdrop-blur"
      title={`Voice pack: ${voiceName}`}
    >
      <Volume2 className={`h-3.5 w-3.5 shrink-0 ${speaking ? 'text-primary' : 'text-primary/70'}`} />
      <span className="truncate text-foreground/85">{voiceName}</span>
      {speaking && (
        <span className="flex h-3 items-end gap-[2px]">
          <span className="h-1.5 w-[2px] animate-pulse rounded-full bg-primary" />
          <span className="h-3 w-[2px] animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
          <span className="h-2 w-[2px] animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
        </span>
      )}
    </div>
  );
}