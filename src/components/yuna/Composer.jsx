import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Mic } from 'lucide-react';
import useDictation from '@/hooks/useDictation';

export default function Composer({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const areaRef = useRef(null);

  const dictation = useDictation({
    onText: (text) => setValue(text),
    onComplete: (text) => {
      if (disabled) return;
      setValue('');
      onSend(text);
    },
  });

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = 'auto';
    area.style.height = `${Math.min(area.scrollHeight, 120)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  return (
    <div className="border-t border-border/50 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex items-end gap-2 rounded-2xl border border-border/70 bg-secondary/40 px-3 py-2 transition-colors focus-within:border-primary/70">
        <textarea
          ref={areaRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={dictation.listening ? 'Listening…' : 'Say something to Yuna…'}
          aria-label="Message Yuna"
          className="max-h-[120px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
        />

        <button
          type="button"
          onClick={() => dictation.toggle(value)}
          disabled={!dictation.supported}
          aria-label={dictation.listening ? 'Stop listening' : 'Speak to Yuna'}
          title={
            dictation.supported
              ? dictation.listening
                ? 'Stop listening'
                : 'Speak — sends after 3s of silence'
              : 'Voice input is not available in this browser'
          }
          className={`mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
            dictation.listening
              ? 'animate-pulse border-primary bg-primary/20 text-primary'
              : 'border-border/70 text-foreground/75 hover:border-primary/60 hover:text-primary'
          } disabled:opacity-30`}
        >
          <Mic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:brightness-110 disabled:opacity-35 disabled:hover:brightness-100"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}