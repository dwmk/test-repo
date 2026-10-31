import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import MoodEnergyChip from '@/components/yuna/MoodEnergyChip';
import VoiceChip from '@/components/yuna/VoiceChip';
import ProjectInfoDialog from '@/components/yuna/ProjectInfoDialog';

export default function GestureDock({ mood, speaking, thinking }) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="relative z-20 flex items-center gap-2 px-4 pb-4">
      <button
        type="button"
        onClick={() => setInfoOpen(true)}
        aria-label="How this project was made"
        title="How this project was made"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/50 text-foreground/85 backdrop-blur transition-colors hover:border-primary/60 hover:text-primary"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      <MoodEnergyChip mood={mood} speaking={speaking} thinking={thinking} />
      <VoiceChip speaking={speaking} />

      <ProjectInfoDialog open={infoOpen} onOpenChange={setInfoOpen} />
    </div>
  );
}