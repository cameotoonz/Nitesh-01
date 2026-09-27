export const STATIONS = [
  { id: 'gate', num: '00', label: 'GATE' },
  { id: 'about', num: '01', label: 'PROFILE' },
  { id: 'skills', num: '02', label: 'SKILLS' },
  { id: 'process', num: '03', label: 'PROCESS' },
  { id: 'longform', num: '04', label: 'LONG FORM' },
  { id: 'shortform', num: '05', label: 'SHORTS' },
  { id: 'contact', num: '06', label: 'CONTACT' },
];

interface Props {
  active: number;
  onTravel: (index: number) => void;
}

export default function RouteHud({ active, onTravel }: Props) {
  return (
    <>
      {/* Desktop: left vertical rail */}
      <nav aria-label="Station route" className="fixed top-1/2 left-5 z-40 hidden -translate-y-1/2 md:block lg:left-8">
        <div className="relative flex flex-col items-center gap-1 py-2">
          <div className="absolute top-3 bottom-3 left-1/2 w-px -translate-x-1/2 bg-line" aria-hidden="true" />
          <div
            className="absolute top-3 left-1/2 w-px -translate-x-1/2 bg-volt transition-all duration-500"
            style={{ height: `calc(${(active / (STATIONS.length - 1)) * 100}% * 0.94)` }}
            aria-hidden="true"
          />
          {STATIONS.map((s, i) => {
            const isActive = i === active;
            const isPast = i < active;
            return (
              <button
                key={s.id}
                onClick={() => onTravel(i)}
                aria-label={`Travel to ${s.label}`}
                aria-current={isActive ? 'true' : undefined}
                className="group relative flex items-center gap-3 py-2 outline-none"
              >
                <span
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border font-mono text-[10px] transition-all duration-300 ${
                    isActive
                      ? 'border-volt bg-volt text-ink shadow-[0_0_20px_rgba(255,176,32,0.5)]'
                      : isPast
                        ? 'border-signal/70 bg-navy text-signal'
                        : 'border-line bg-ink/80 text-steel group-hover:border-signal group-hover:text-mist'
                  }`}
                >
                  {s.num}
                </span>
                <span
                  className={`absolute left-12 font-mono text-[10px] tracking-[0.25em] whitespace-nowrap transition-all duration-300 ${
                    isActive ? 'translate-x-0 text-volt opacity-100' : '-translate-x-1 text-steel opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile: bottom route bar */}
      <nav aria-label="Station route" className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-ink/85 backdrop-blur-md md:hidden">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-3 py-2.5">
          {STATIONS.map((s, i) => {
            const isActive = i === active;
            return (
              <button
                key={s.id}
                onClick={() => onTravel(i)}
                aria-label={`Travel to ${s.label}`}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[10px] tracking-[0.15em] transition-all ${
                  isActive
                    ? 'border-volt bg-volt/15 text-volt'
                    : 'border-line bg-navy/60 text-steel'
                }`}
              >
                <span className={isActive ? 'text-volt' : 'text-signal'}>{s.num}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
