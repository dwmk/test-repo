export default function MessageBubble({ role, content }) {
  const isUser = role === 'user';

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <span className="mb-1 h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent shadow-[0_0_14px_hsl(var(--primary)/0.55)]" />
      )}
      <div
        className={`max-w-[84%] whitespace-pre-wrap break-words text-[15px] leading-relaxed ${
          isUser
            ? 'rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 font-medium text-primary-foreground'
            : 'rounded-2xl rounded-bl-md border border-border/60 bg-card/70 px-3.5 py-2.5 text-foreground'
        }`}
      >
        {content}
      </div>
    </div>
  );
}