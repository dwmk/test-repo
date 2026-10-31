import { useState } from 'react';
import { Check, Share2, Shirt, Volume2, VolumeX } from 'lucide-react';

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-card/50 text-foreground/90 backdrop-blur transition-colors hover:border-primary/60 hover:text-primary"
    >
      {children}
    </button>
  );
}

export default function StageHeader({ speaking, voiceOn, onToggleVoice, onOpenWardrobe }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Yuna', text: 'Come talk to Yuna.', url });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative z-20 flex items-start justify-between gap-3 px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
      <div>
        <h1 className="font-display text-[32px] leading-none tracking-tight text-foreground">Yuna</h1>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          {speaking ? 'speaking' : 'here with you'}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton label={copied ? 'Link copied' : 'Share Yuna'} onClick={share}>
          {copied ? <Check className="h-[18px] w-[18px] text-primary" /> : <Share2 className="h-[18px] w-[18px]" />}
        </IconButton>
        <IconButton label={voiceOn ? 'Mute her voice' : 'Unmute her voice'} onClick={onToggleVoice}>
          {voiceOn ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
        </IconButton>
        <IconButton label="Wardrobe" onClick={onOpenWardrobe}>
          <Shirt className="h-[18px] w-[18px]" />
        </IconButton>
      </div>
    </div>
  );
}