import { useState } from 'react';
import { Check, Copy, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LinkedText from '@/components/yuna/LinkedText';
import { PROJECT_FACTS, REBUILD_PROMPT } from '@/lib/yunaBlueprint';

export default function ProjectInfoDialog({ open, onOpenChange }) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(REBUILD_PROMPT);
    } catch (error) {
      const area = document.createElement('textarea');
      area.value = REBUILD_PROMPT;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] max-w-xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-5 pb-4 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-normal">How Yuna was made</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            A 3D character, a voice, and a conversation — built as one small screen.
          </DialogDescription>
        </DialogHeader>

        <div className="scroll-slim min-h-0 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
          {PROJECT_FACTS.map((fact) => (
            <div key={fact.title} className="rounded-2xl border border-border/60 bg-card/50 px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/90">{fact.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                <LinkedText text={fact.body} />
              </p>
            </div>
          ))}

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-[13px] font-semibold text-foreground">Rebuild prompt</p>
              </div>
              <button
                type="button"
                onClick={copyPrompt}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[11px] text-foreground/85 transition-colors hover:border-primary/60 hover:text-primary"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              Paste this into a new project to recreate Yuna from scratch.
            </p>
            <pre className="mt-2.5 whitespace-pre-wrap break-words rounded-xl border border-border/50 bg-background/70 p-3 font-mono text-[11px] leading-relaxed text-foreground/75">
              {REBUILD_PROMPT}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}