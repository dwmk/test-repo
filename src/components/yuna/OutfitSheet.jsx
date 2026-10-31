import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchOutfits } from '@/lib/yunaApi';

export default function OutfitSheet({ open, onOpenChange, currentId, onSelect }) {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchOutfits()
      .then((list) => setOutfits(list.length ? list : []))
      .catch(() => setOutfits([]))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/70 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal tracking-tight">Wardrobe</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening her closet…
          </div>
        ) : outfits.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Her wardrobe is out of reach right now.</p>
        ) : (
          <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto pr-1 scroll-slim">
            {outfits.map((outfit) => {
              const active = outfit.id === currentId;
              return (
                <button
                  key={outfit.id}
                  type="button"
                  onClick={() => {
                    onSelect(outfit);
                    onOpenChange(false);
                  }}
                  className={`group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-2.5 text-left transition-colors ${
                    active ? 'border-primary/70 bg-primary/10' : 'border-border/60 bg-secondary/30 hover:border-primary/40'
                  }`}
                >
                  <span className="h-16 w-full rounded-lg bg-gradient-to-br from-primary/25 via-accent/15 to-transparent transition-transform group-hover:scale-[1.02]" />
                  <span className="text-xs font-medium leading-tight text-foreground">{outfit.name}</span>
                  {active && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}