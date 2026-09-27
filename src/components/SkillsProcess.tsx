import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Compass, Hammer, Sparkles, Rocket, ChevronDown } from 'lucide-react';
import type { Skill, ProcessStep } from '../lib/api';

const ICONS = [Zap, Compass, Hammer, Sparkles, Rocket, Zap];

export function SkillsWall({ skills }: { skills: Skill[] }) {
  if (!skills.length) {
    return (
      <div className="hud-panel rounded-2xl p-8 text-center text-steel">
        Skill relays are being wired. Check back soon.
      </div>
    );
  }
  return (
    <div className="relative">
      {/* relay spine */}
      <div className="absolute top-0 bottom-0 left-[27px] hidden w-px bg-gradient-to-b from-volt/60 via-signal/40 to-magenta/40 md:block" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:pl-16">
        {skills.map((s, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="hud-panel group relative overflow-hidden rounded-2xl p-5 transition-colors hover:border-signal/50 md:p-6"
            >
              <span className="absolute top-4 right-4 font-mono text-[10px] tracking-[0.2em] text-steel">
                R-{String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-volt/40 bg-volt/10 text-volt transition-all group-hover:shadow-[0_0_20px_rgba(255,176,32,0.35)]">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-paper">{s.name}</h3>
              {s.detail && <p className="mt-1.5 text-[13px] leading-relaxed text-steel">{s.detail}</p>}
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-volt to-signal transition-all duration-500 group-hover:w-full" aria-hidden="true" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const STEP_ICONS: Record<string, typeof Compass> = {
  understand: Compass,
  build: Hammer,
  polish: Sparkles,
  deliver: Rocket,
};

export function ProcessTrack({ steps }: { steps: ProcessStep[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!steps.length) {
    return (
      <div className="hud-panel rounded-2xl p-8 text-center text-steel">
        Process signals are being calibrated. Check back soon.
      </div>
    );
  }
  return (
    <div className="relative">
      <div className="absolute top-7 right-4 left-4 hidden h-px bg-line lg:block" aria-hidden="true" />
      <div className="absolute top-7 right-4 left-4 hidden h-px origin-left bg-gradient-to-r from-volt via-signal to-magenta lg:block" style={{ transform: 'scaleX(0.9)' }} aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => {
          const Icon = STEP_ICONS[(s.icon || '').toLowerCase()] || STEP_ICONS[['understand', 'build', 'polish', 'deliver'][i % 4]];
          const isOpen = open === i;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`hud-panel relative rounded-2xl p-5 transition-colors md:p-6 ${isOpen ? 'border-volt/45' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-display text-sm font-bold ${
                  isOpen ? 'border-volt bg-volt text-ink' : 'border-signal/50 bg-navy text-signal'
                }`}>
                  {isOpen ? <Icon size={20} /> : `0${i + 1}`}
                </span>
                {s.tag && (
                  <span className="font-mono text-[9px] tracking-[0.22em] text-steel">{s.tag.toUpperCase()}</span>
                )}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-paper">{s.name}</h3>
              {s.short && <p className="mt-1 font-mono text-[11px] tracking-wide text-volt">{s.short}</p>}
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.25em] text-signal hover:text-paper"
              >
                {isOpen ? 'CLOSE FILE' : 'OPEN FILE'}
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <div
                className={`grid transition-all duration-300 ${isOpen ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <p className="overflow-hidden text-[13px] leading-relaxed text-steel">{s.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
