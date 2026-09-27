import { motion } from 'framer-motion';
import { MessageCircle, Mail, Instagram, ArrowUp, MapPin } from 'lucide-react';
import type { Profile } from '../lib/api';

export default function ContactTerminus({ profile }: { profile: Profile | null }) {
  const ig = (profile?.instagram || 'framesbyniteshh').replace(/^@/, '');
  const wa = (profile?.whatsapp || '').replace(/\D/g, '');
  const waNum = wa.length === 10 ? `91${wa}` : wa;
  const email = profile?.email || 'niteshedits2002@gmail.com';

  const cards = [
    {
      label: 'WHATSAPP',
      value: wa ? `+${waNum}` : '—',
      href: `https://wa.me/${waNum}`,
      icon: MessageCircle,
      accent: 'text-mint border-mint/40',
      external: true,
    },
    {
      label: 'EMAIL',
      value: email,
      href: `mailto:${email}`,
      icon: Mail,
      accent: 'text-signal border-signal/40',
      external: false,
    },
    {
      label: 'INSTAGRAM',
      value: `@${ig}`,
      href: `https://www.instagram.com/${ig}`,
      icon: Instagram,
      accent: 'text-magenta border-magenta/40',
      external: true,
    },
  ];

  return (
    <div className="hud-panel relative overflow-hidden rounded-2xl px-6 py-10 text-center md:px-12 md:py-14">
      <div className="scanbeam" aria-hidden="true" />
      <p className="eyebrow">TERMINUS · END OF THE LINE</p>
      <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl leading-tight font-bold text-paper md:text-5xl">
        LET'S WORK{' '}
        <span className="bg-gradient-to-r from-volt to-magenta bg-clip-text text-transparent">
          TOGETHER.
        </span>
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-steel md:text-base">
        Have a video, idea, or project in mind? Let's turn it into something people want to watch.
      </p>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
        {cards.map((c, i) => (
          <motion.a
            key={c.label}
            href={c.href}
            target={c.external ? '_blank' : undefined}
            rel={c.external ? 'noreferrer' : undefined}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`group rounded-xl border bg-ink/60 p-5 transition-all hover:-translate-y-1 ${c.accent} hover:bg-ink`}
          >
            <c.icon size={22} />
            <p className="mt-3 font-mono text-[10px] tracking-[0.3em] text-steel">{c.label}</p>
            <p className="mt-1 truncate font-display text-sm font-bold text-paper">{c.value}</p>
          </motion.a>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer" className="btn-volt text-xs md:text-sm">
          <MessageCircle size={17} /> START A CONVERSATION
        </a>
        <a href="#gate" className="btn-ghost">
          <ArrowUp size={15} /> BACK TO GATE
        </a>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 border-t border-line/60 pt-5 font-mono text-[10px] tracking-[0.25em] text-steel">
        <MapPin size={13} className="text-signal" />
        {(profile?.location || 'DELHI, INDIA').toUpperCase()} · {(profile?.name || 'NITESH KUMAR').toUpperCase()} · {new Date().getFullYear()}
      </div>
    </div>
  );
}
