import { motion } from 'framer-motion';
import { MapPin, BadgeCheck, Mail, MessageCircle, Instagram } from 'lucide-react';
import type { Profile } from '../lib/api';

interface Props {
  profile: Profile | null;
}

const rise = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.2, 0.7, 0.3, 1] as const },
};

export function SectionHead({ num, eyebrow, title, sub }: { num: string; eyebrow: string; title: string; sub?: string }) {
  return (
    <motion.div {...rise} className="mb-8 md:mb-10">
      <div className="flex items-center gap-4">
        <span className="font-display text-5xl font-bold text-outline md:text-7xl">{num}</span>
        <span className="hairline w-16 md:w-28" />
        <p className="eyebrow">{eyebrow}</p>
      </div>
      <h2 className="mt-3 font-display text-3xl font-bold text-paper md:text-5xl">{title}</h2>
      {sub && <p className="mt-2 max-w-xl text-sm leading-relaxed text-steel md:text-base">{sub}</p>}
    </motion.div>
  );
}

export function AboutSection({ profile }: Props) {
  const paras = (profile?.about || '').split(/\n\s*\n/).filter(Boolean);
  const ig = (profile?.instagram || 'framesbyniteshh').replace(/^@/, '');
  const wa = (profile?.whatsapp || '').replace(/\D/g, '');
  const waNum = wa.length === 10 ? `91${wa}` : wa;

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      {/* ID card */}
      <motion.div {...rise} className="hud-panel overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-3">
          <p className="font-mono text-[10px] tracking-[0.3em] text-steel">CREATOR ID · VERIFIED</p>
          <BadgeCheck size={16} className="text-mint" />
        </div>
        <div className="relative">
          {profile?.photo ? (
            <img
              src={profile.photo}
              alt={`${profile?.name || 'Nitesh Kumar'}, video editor and motion designer`}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover object-top"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center bg-navy font-mono text-xs tracking-[0.3em] text-steel">
              PHOTO PENDING
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
          {profile?.available && (
            <span className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-mint/40 bg-ink/70 px-3 py-1.5 font-mono text-[9px] tracking-[0.25em] text-mint backdrop-blur-sm">
              <span className="anim-blink h-1.5 w-1.5 rounded-full bg-mint" /> OPEN FOR WORK
            </span>
          )}
        </div>
        <div className="space-y-2.5 px-5 py-5 md:px-6">
          <p className="font-display text-xl font-bold text-paper md:text-2xl">
            {profile?.name || 'Nitesh Kumar'}
          </p>
          <p className="font-mono text-[11px] tracking-[0.2em] text-volt">
            {(profile?.role || 'Video Editor & Motion Graphic Designer').toUpperCase()}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1 font-mono text-[10px] tracking-[0.18em] text-steel">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-signal" /> {(profile?.location || 'Delhi, India').toUpperCase()}
            </span>
            <span>{profile?.experience || '1+'} YR ON THE LINE</span>
          </div>
        </div>
      </motion.div>

      {/* About narrative */}
      <motion.div {...rise} transition={{ ...rise.transition, delay: 0.12 }} className="hud-panel flex flex-col rounded-2xl px-6 py-7 md:px-9 md:py-9">
        <p className="eyebrow">PROFILE FILE · 01</p>
        <h3 className="mt-3 font-display text-2xl leading-tight font-bold text-paper md:text-3xl">
          {profile?.hero_title || 'Every frame.'}{' '}
          <span className="bg-gradient-to-r from-volt to-magenta bg-clip-text text-transparent">
            {profile?.hero_accent || 'A feeling.'}
          </span>
        </h3>
        <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-mist md:text-base">
          {paras.length ? (
            paras.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <p className="text-steel">Profile story is being written. Check back soon.</p>
          )}
        </div>
        {profile?.hero_description && (
          <p className="mt-5 border-l-2 border-volt/60 pl-4 text-sm text-steel italic md:text-[15px]">
            {profile.hero_description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-3 pt-7">
          <a
            href={`https://wa.me/${waNum}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost !border-mint/40 !text-mint hover:!border-mint"
          >
            <MessageCircle size={15} /> CHAT
          </a>
          <a href={`mailto:${profile?.email || ''}`} className="btn-ghost">
            <Mail size={15} /> EMAIL
          </a>
          <a
            href={`https://www.instagram.com/${ig}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <Instagram size={15} /> @{ig.toUpperCase().slice(0, 14)}
          </a>
        </div>
      </motion.div>
    </div>
  );
}
