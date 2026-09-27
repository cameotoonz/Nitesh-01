import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Film, Smartphone } from 'lucide-react';
import type { Project } from '../lib/api';
import ProjectCard from './ProjectCard';

interface Props {
  title: string;
  eyebrow: string;
  icon: 'film' | 'shorts';
  projects: Project[];
  perPage: number;
  layout: 'wide' | 'tall';
  emptyText: string;
  onPlay: (p: Project) => void;
}

export default function WorkHall({ title, eyebrow, icon, projects, perPage, layout, emptyText, onPlay }: Props) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(projects.length / perPage));
  const safePage = Math.min(page, pageCount - 1);
  const items = useMemo(
    () => projects.slice(safePage * perPage, safePage * perPage + perPage),
    [projects, safePage, perPage]
  );

  const go = (p: number) => {
    setPage((p + pageCount) % pageCount);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-signal/40 bg-signal/10 text-signal">
            {icon === 'film' ? <Film size={20} /> : <Smartphone size={20} />}
          </span>
          <div>
            <p className="eyebrow !text-[10px]">{eyebrow}</p>
            <h3 className="font-display text-xl font-bold text-paper md:text-2xl">{title}</h3>
          </div>
        </div>
        {projects.length > 0 && (
          <p className="font-mono text-[10px] tracking-[0.25em] text-steel">
            {projects.length} FILM{projects.length === 1 ? '' : 'S'} · PAGE {safePage + 1}/{pageCount}
          </p>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="hud-panel rounded-2xl p-10 text-center">
          <p className="text-steel">{emptyText}</p>
          <a href="#contact" className="mt-3 inline-block font-mono text-[11px] tracking-[0.2em] text-volt hover:text-paper">
            LET'S MAKE THE NEXT ONE TOGETHER ↗
          </a>
        </div>
      ) : (
        <>
          <div className={layout === 'wide' ? 'grid gap-5 md:grid-cols-2' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-4'}>
            {items.map((p, i) => (
              <ProjectCard key={p.id} project={p} layout={layout} index={i} onPlay={onPlay} />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="mt-7 flex items-center justify-center gap-3">
              <button
                onClick={() => go(safePage - 1)}
                aria-label="Previous page"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-steel transition-colors hover:border-volt hover:text-volt"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    aria-label={`Go to page ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === safePage ? 'w-8 bg-volt' : 'w-2 bg-line hover:bg-steel'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => go(safePage + 1)}
                aria-label="Next page"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-steel transition-colors hover:border-volt hover:text-volt"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
