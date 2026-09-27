import { useState } from 'react';
import { Armchair, ChevronLeft, ChevronRight, Play, Ticket } from 'lucide-react';
import type { Project } from '../lib/api';

interface Props {
  features: Project[];
  onPlay: (p: Project) => void;
}

const ROWS = ['A', 'B', 'C', 'D'];
const COLS = [1, 2, 3, 4, 5, 6];

function isOccupied(r: number, c: number) {
  return (r * 5 + c * 2) % 7 === 3;
}

export default function CinemaCar({ features, onPlay }: Props) {
  const [featureIdx, setFeatureIdx] = useState(0);
  const [seat, setSeat] = useState<string | null>(null);
  const [imgOk, setImgOk] = useState(true);

  if (!features.length) {
    return (
      <div className="hud-panel rounded-2xl p-8 text-center">
        <p className="eyebrow mb-3">CINEMA CAR · SCREEN 01</p>
        <p className="text-steel">New stories are in the making. The cinema car opens soon.</p>
      </div>
    );
  }

  const feature = features[featureIdx % features.length];
  const seatLabel = seat ? `SEAT ${seat}` : 'NO SEAT SELECTED';

  return (
    <div className="hud-panel overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-4 md:px-7">
        <div>
          <p className="eyebrow !text-[10px]">CINEMA CAR · SCREEN 01</p>
          <h3 className="mt-1 font-display text-lg font-bold text-paper md:text-xl">
            Take a seat. The film starts when you do.
          </h3>
        </div>
        <Ticket size={26} className="hidden shrink-0 text-volt sm:block" />
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
        {/* screen */}
        <div className="relative border-b border-line/60 lg:border-r lg:border-b-0">
          <div className="relative aspect-video w-full bg-black">
            {feature.thumbnail ? (
              <img
                key={feature.id}
                src={feature.thumbnail}
                alt={feature.title}
                loading="lazy"
                decoding="async"
                onError={() => setImgOk(false)}
                className={imgOk ? 'absolute inset-0 h-full w-full object-cover opacity-90' : 'hidden'}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-transparent to-ink/30" />
            <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[9px] tracking-[0.3em] text-volt">
                  NOW SHOWING · {(featureIdx % features.length) + 1}/{features.length}
                </p>
                <p className="mt-1 truncate font-display text-base font-bold text-paper md:text-lg">
                  {feature.title}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  aria-label="Previous feature"
                  onClick={() => {
                    setImgOk(true);
                    setFeatureIdx((i) => (i - 1 + features.length) % features.length);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-mist/25 bg-ink/70 text-mist transition-colors hover:border-volt hover:text-volt"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  aria-label="Next feature"
                  onClick={() => {
                    setImgOk(true);
                    setFeatureIdx((i) => (i + 1) % features.length);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-mist/25 bg-ink/70 text-mist transition-colors hover:border-volt hover:text-volt"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
            <p className="font-mono text-[10px] tracking-[0.25em] text-steel">
              {seatLabel} · <span className="text-signal">NITESH EXPRESS</span>
            </p>
            <button
              onClick={() => seat && onPlay(feature)}
              disabled={!seat}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-display text-xs font-bold tracking-[0.18em] transition-all ${
                seat
                  ? 'bg-gradient-to-b from-[#ffc35c] to-[#f59a1a] text-[#140b00] shadow-[0_10px_30px_rgba(245,154,26,0.4)] hover:-translate-y-0.5'
                  : 'cursor-not-allowed border border-line text-steel/60'
              }`}
            >
              <Play size={15} fill="currentColor" /> PLAY FROM THIS SEAT
            </button>
          </div>
          {!seat && (
            <p className="px-5 pb-4 font-mono text-[10px] tracking-[0.2em] text-volt/90 md:px-7">
              ▸ SELECT A SEAT ON THE RIGHT TO BOARD
            </p>
          )}
        </div>

        {/* seats */}
        <div className="px-5 py-6 md:px-7">
          <div className="mb-4 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-steel">
            <span>COACH C-01 · 24 SEATS</span>
            <span className="text-signal">◉ SCREEN THIS WAY ↑</span>
          </div>
          <div className="flex flex-col items-center gap-2.5">
            {ROWS.map((row, r) => (
              <div key={row} className="flex items-center gap-2.5">
                <span className="w-4 font-mono text-[10px] text-steel">{row}</span>
                <div className="flex gap-2">
                  {COLS.map((col, c) => {
                    const id = `${row}${col}`;
                    const occupied = isOccupied(r, c);
                    const selected = seat === id;
                    return (
                      <button
                        key={id}
                        disabled={occupied}
                        onClick={() => setSeat(selected ? null : id)}
                        aria-label={occupied ? `Seat ${id} occupied` : `Select seat ${id}`}
                        title={occupied ? `${id} · occupied` : `${id} · available`}
                        className={`flex h-9 w-9 items-center justify-center rounded-t-xl rounded-b-md border transition-all duration-200 md:h-10 md:w-10 ${
                          occupied
                            ? 'cursor-not-allowed border-line/50 bg-line/20 text-steel/30'
                            : selected
                              ? 'anim-pulse-ring border-volt bg-volt text-ink'
                              : 'border-signal/40 bg-navy/60 text-signal hover:-translate-y-0.5 hover:border-volt hover:text-volt'
                        }`}
                      >
                        <Armchair size={16} />
                      </button>
                    );
                  })}
                </div>
                <span className="w-4 font-mono text-[10px] text-steel">{row}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-5 font-mono text-[9px] tracking-[0.2em] text-steel">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-signal/60 bg-navy" /> AVAILABLE
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-volt" /> YOURS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-line/40" /> TAKEN
            </span>
          </div>
          {seat && (
            <div className="anim-rise mt-5 rounded-xl border border-dashed border-volt/50 bg-volt/5 px-4 py-3 text-center font-mono text-[10px] tracking-[0.25em] text-volt">
              ┈ ADMIT ONE · SEAT {seat} · {feature.title.toUpperCase().slice(0, 26)} ┈
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
