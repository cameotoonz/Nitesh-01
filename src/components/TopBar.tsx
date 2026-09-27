import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  docked: boolean;
  available: boolean;
}

function useClock() {
  const [now, setNow] = useState('');
  useEffect(() => {
    const tick = () => {
      try {
        setNow(
          new Intl.DateTimeFormat('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata',
          }).format(new Date())
        );
      } catch {
        setNow(new Date().toLocaleTimeString());
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export default function TopBar({ docked, available }: Props) {
  const time = useClock();
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line/60 bg-ink/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 md:px-8">
        <a href="#gate" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-volt bg-navy font-display text-sm font-bold text-volt">
            N
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-[13px] font-bold tracking-[0.18em] text-paper md:text-sm">
              NITESH PORTFOLIO
            </span>
            <span className="block font-mono text-[9px] tracking-[0.3em] text-steel">
              CREATIVE LINE · PLATFORM 01
            </span>
          </span>
        </a>

        <div
          className="hidden items-center gap-2.5 rounded-full border border-line bg-navy/70 px-4 py-2 lg:flex"
          role="status"
          aria-live="polite"
        >
          <span className={`h-2 w-2 rounded-full ${docked ? 'bg-mint' : 'anim-blink bg-volt'}`} />
          <span className="font-mono text-[10px] tracking-[0.25em] text-mist">
            {docked ? 'NITESH EXPRESS · DOORS OPEN' : 'NITESH EXPRESS · ARRIVING'}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <span className="hidden font-mono text-[11px] tracking-[0.2em] text-steel sm:block">
            {time} <span className="text-signal">IST</span>
          </span>
          <span
            className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] sm:flex ${
              available ? 'border-mint/40 text-mint' : 'border-ember/40 text-ember'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-mint' : 'bg-ember'}`} />
            {available ? 'OPEN FOR WORK' : 'BOOKED'}
          </span>
          <Link
            to="/login"
            className="rounded-full border border-line px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-steel transition-colors hover:border-signal hover:text-mist"
          >
            STAFF
          </Link>
        </div>
      </div>
    </header>
  );
}
