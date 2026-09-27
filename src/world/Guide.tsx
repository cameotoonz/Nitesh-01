import { motion, AnimatePresence } from 'framer-motion';

const TIPS = [
  'Welcome to Platform 01. The Nitesh Express has arrived — doors are open. Step in.',
  'Creator Gallery. Every frame here passed through one timeline, one pair of eyes.',
  'Skill relays hum along this wall — six crafts wired to a single obsession: story.',
  'Follow the process signals: Understand, Build, Polish, Deliver. No skipped stops.',
  'Long-form cinema hall. Pick a film, take a seat in the cinema car, press play.',
  'Shorts bay. Vertical stories cut for full attention — sound on, thumbs ready.',
  'Terminus. Every great edit starts with a message — the conductor recommends WhatsApp.',
];

export default function Guide({ station, visible }: { station: number; visible: boolean }) {
  if (!visible) return null;
  const tip = TIPS[Math.min(Math.max(station, 0), TIPS.length - 1)];
  return (
    <div className="pointer-events-none fixed right-3 bottom-24 z-30 flex flex-col items-end gap-3 md:right-8 md:bottom-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={station}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="hud-panel pointer-events-auto max-w-[230px] rounded-xl px-4 py-3 md:max-w-[280px]"
        >
          <p className="label-mono mb-1.5 text-volt">GUIDE N-07 · PIXEL</p>
          <p className="text-[13px] leading-relaxed text-mist md:text-sm">{tip}</p>
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-auto flex items-end gap-2">
        {/* mini survey drone */}
        <div className="anim-floaty mb-6 hidden sm:block" style={{ animationDelay: '-2.2s' }}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-signal/40 bg-navy/80 shadow-[0_0_24px_rgba(90,162,255,0.35)]">
            <span className="anim-blink h-2 w-2 rounded-full bg-signal" />
            <span className="absolute -top-1.5 left-1/2 h-1.5 w-px -translate-x-1/2 bg-signal/60" />
          </div>
        </div>
        {/* conductor bot */}
        <div className="anim-floaty relative h-20 w-16 md:h-24 md:w-20" aria-hidden="true">
          <span className="absolute top-0 left-1/2 h-3 w-0.5 -translate-x-1/2 bg-steel/60" />
          <span className="anim-blink absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ember" />
          <div className="absolute top-3 right-0 left-0 rounded-2xl border border-mist/25 bg-gradient-to-b from-panel to-ink p-1.5 shadow-[0_10px_36px_rgba(0,0,0,0.6),0_0_28px_rgba(255,176,32,0.15)]">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#0a1428] px-2 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-volt shadow-[0_0_10px_rgba(255,176,32,0.9)] md:h-3 md:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-signal shadow-[0_0_10px_rgba(90,162,255,0.9)] md:h-3 md:w-3" />
            </div>
            <div className="mx-auto mt-1.5 h-1 w-8 rounded-full bg-mint/70" />
          </div>
          <div className="absolute right-2 bottom-0 left-2 h-5 rounded-t-lg border border-t-0 border-mist/20 bg-panel/90 md:h-6">
            <div className="mx-auto mt-1.5 h-0.5 w-6 rounded-full bg-line" />
          </div>
          <div className="absolute -bottom-2 left-1/2 h-2 w-12 -translate-x-1/2 rounded-full bg-volt/25 blur-md" />
        </div>
      </div>
    </div>
  );
}
