import { useEffect, useState } from 'react';
import { Smile, Meh, Frown, Angry, Sparkles } from 'lucide-react';

const MOODS = {
  happy: { label: 'Happy', Icon: Smile },
  relaxed: { label: 'Content', Icon: Sparkles },
  surprised: { label: 'Curious', Icon: Sparkles },
  sad: { label: 'Down', Icon: Frown },
  angry: { label: 'Cross', Icon: Angry },
  neutral: { label: 'Calm', Icon: Meh },
};

export default function MoodEnergyChip({ mood, speaking, thinking }) {
  const shown = MOODS[mood] || MOODS.neutral;
  const target = 56 + (speaking ? 26 : 0) + (thinking ? 12 : 0);
  const [energy, setEnergy] = useState(56);

  useEffect(() => {
    const id = setInterval(() => {
      setEnergy((prev) => {
        const drift = (Math.random() - 0.5) * 4;
        const next = prev + (target - prev) * 0.3 + drift;
        return Math.max(8, Math.min(100, Math.round(next)));
      });
    }, 900);
    return () => clearInterval(id);
  }, [target]);

  const Icon = shown.Icon;

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs backdrop-blur"
      title={`Mood: ${shown.label} · Energy: ${energy}%`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="whitespace-nowrap text-foreground/85">{shown.label}</span>
      <span className="h-1 w-9 overflow-hidden rounded-full bg-foreground/15">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700 ease-out"
          style={{ width: `${energy}%` }}
        />
      </span>
      <span className="tabular-nums text-[10px] text-muted-foreground">{energy}%</span>
    </div>
  );
}