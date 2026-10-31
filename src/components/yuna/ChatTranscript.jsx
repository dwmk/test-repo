import { useEffect, useRef } from 'react';
import MessageBubble from '@/components/yuna/MessageBubble';

const STARTERS = ['How was your day?', 'Tell me something sweet', 'I need a little motivation'];

export default function ChatTranscript({ messages, thinking, loading, onPick }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, thinking]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 px-4 py-5">
        {[0, 1, 2].map((row) => (
          <div key={row} className={`h-12 animate-pulse rounded-2xl bg-card/50 ${row % 2 ? 'ml-auto w-2/3' : 'w-3/4'}`} />
        ))}
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex flex-1 flex-col justify-end px-5 pb-5">
        <p className="font-display text-[26px] leading-tight text-foreground">Hey, you're here.</p>
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
          I've been keeping this spot warm. Tell me how your day went.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => onPick(starter)}
              className="rounded-full border border-border/70 bg-card/50 px-3 py-1.5 text-xs text-foreground/90 transition-colors hover:border-primary/60 hover:text-primary"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-slim flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.map((message, index) => (
        <MessageBubble key={message.id || `${message.role}-${index}`} role={message.role} content={message.content} />
      ))}

      {thinking && (
        <div className="flex items-end gap-2">
          <span className="mb-1 h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-70" />
          <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border/60 bg-card/70 px-3.5 py-3">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: `${dot * 140}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}