import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Mail, Instagram, ArrowUpRight, Loader2 } from 'lucide-react';
import type { Profile } from '../lib/api';

interface Props {
  profile: Profile | null;
  stationIndex: number;
}

export default function HeroGate({ profile, stationIndex }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setStarted(true);
        });
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const exp = profile?.experience ? `${profile.experience} YEAR+ EXPERIENCE` : '1+ YEAR+ EXPERIENCE';
  const loc = (profile?.location || 'DELHI, INDIA').toUpperCase();
  const ig = (profile?.instagram || 'framesbyniteshh').replace(/^@/, '');
  const wa = (profile?.whatsapp || '').replace(/\D/g, '');
  const waNum = wa.length === 10 ? `91${wa}` : wa;

  return (
    <div ref={boardRef} className="relative overflow-hidden rounded-2xl border border-line/80 bg-ink/70 shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur-md">
      {/* board header */}
      <div className="flex items-center justify-between gap-3 border-b border-line/70 bg-navy/60 px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${stationIndex >= 0 ? 'bg-mint' : 'bg-volt'}`} />
          <span className="font-mono text-[9px] tracking-[0.3em] text-steel md:text-[10px]">
            DEPARTURE BOARD · PLATFORM 01
          </span>
        </div>
        <span className="hidden font-mono text-[9px] tracking-[0.3em] text-signal sm:block md:text-[10px]">
          CREATIVE LINE → ALL STATIONS
        </span>
      </div>

      <div className="relative px-5 py-8 text-center md:px-10 md:py-12">
        <div className="scanbeam" aria-hidden="true" />
        <p
          className={`font-mono text-[10px] tracking-[0.4em] text-signal transition-all delay-100 duration-700 md:text-xs ${
            started ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          VIDEO EDITOR · MOTION DESIGNER
        </p>
        <h1
          className={`mt-4 font-display text-4xl leading-[0.95] font-bold tracking-tight text-paper transition-all delay-200 duration-700 sm:text-6xl md:text-7xl lg:text-8xl ${
            started ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          NITESH
          <span className="anim-flicker mt-1 block bg-gradient-to-r from-volt via-[#ff8a3d] to-magenta bg-clip-text text-transparent">
            PORTFOLIO
          </span>
        </h1>
        <p
          className={`mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-mist transition-all delay-300 duration-700 md:text-lg ${
            started ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          I turn raw footage into visual stories that people remember.
        </p>
        <p
          className={`mt-3 font-mono text-[10px] tracking-[0.35em] text-steel transition-all delay-[400ms] duration-700 md:text-xs ${
            started ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {exp} · {loc}
        </p>

        <div
          className={`mt-8 flex flex-col items-center justify-center gap-3 transition-all delay-500 duration-700 sm:flex-row ${
            started ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <a href="#about" className="btn-volt text-xs md:text-sm">
            ENTER THE JOURNEY <ArrowUpRight size={18} className="rotate-90" />
          </a>
          <a
            href={`https://wa.me/${waNum}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <MessageCircle size={16} /> WHATSAPP
          </a>
        </div>

        <div
          className={`mt-7 flex items-center justify-center gap-5 border-t border-line/60 pt-5 transition-all delay-[600ms] duration-700 ${
            started ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <a
            href={`mailto:${profile?.email || 'niteshedits2002@gmail.com'}`}
            aria-label="Email Nitesh"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-steel transition-all hover:-translate-y-0.5 hover:border-signal hover:text-signal"
          >
            <Mail size={17} />
          </a>
          <a
            href={`https://www.instagram.com/${ig}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-steel transition-all hover:-translate-y-0.5 hover:border-magenta hover:text-magenta"
          >
            <Instagram size={17} />
          </a>
          <span className="font-mono text-[10px] tracking-[0.25em] text-steel">
            @{ig.toUpperCase()}
          </span>
        </div>
      </div>

      {/* board footer ticker */}
      <div className="overflow-hidden border-t border-line/70 bg-navy/60 py-2">
        <div className="flex w-max gap-10 font-mono text-[9px] tracking-[0.3em] whitespace-nowrap text-steel md:text-[10px]">
          {[0, 1].map((k) => (
            <span key={k} className="flex gap-10">
              <span>CUTS · MOTION · COLOR · SOUND</span>
              <span className="text-volt">● NOW BOARDING</span>
              <span>NITESH EXPRESS · PLATFORM 01</span>
              <span className="text-signal">● DOORS OPEN</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadingBoard() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-line/80 bg-ink/80 px-6 py-20 backdrop-blur-md">
      <Loader2 size={28} className="animate-spin text-volt" />
      <p className="font-mono text-xs tracking-[0.3em] text-steel">OPENING THE STATION…</p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-line/50">
        <div className="anim-barload h-full rounded-full bg-gradient-to-r from-signal to-volt" />
      </div>
    </div>
  );
}
