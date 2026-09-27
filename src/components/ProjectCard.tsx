import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clapperboard } from 'lucide-react';
import type { Project } from '../lib/api';

interface Props {
  project: Project;
  layout: 'wide' | 'tall';
  index: number;
  onPlay: (p: Project) => void;
}

export default function ProjectCard({ project, layout, index, onPlay }: Props) {
  const [imgOk, setImgOk] = useState(true);
  const tall = layout === 'tall';

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.08, ease: [0.2, 0.7, 0.3, 1] }}
      className="hud-panel group overflow-hidden rounded-2xl transition-colors duration-300 hover:border-volt/40"
    >
      <button
        onClick={() => onPlay(project)}
        className="relative block w-full cursor-pointer text-left"
        aria-label={`Play ${project.title}`}
      >
        <div className={`relative w-full overflow-hidden bg-abyss ${tall ? 'aspect-[9/14]' : 'aspect-video'}`}>
          {project.thumbnail && imgOk ? (
            <img
              src={project.thumbnail}
              alt={project.title}
              loading="lazy"
              decoding="async"
              onError={() => setImgOk(false)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy via-abyss to-ink">
              <Clapperboard size={40} className="text-line" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
          <span className="absolute top-3 left-3 rounded-full border border-mist/20 bg-ink/70 px-3 py-1 font-mono text-[9px] tracking-[0.25em] text-mist backdrop-blur-sm">
            {project.category === 'long' ? 'LONG FORM' : 'SHORT FORM'}
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-volt text-ink opacity-0 shadow-[0_8px_30px_rgba(245,154,26,0.5)] transition-all duration-300 group-hover:opacity-100 md:h-16 md:w-16">
              <Play size={24} className="ml-1" fill="currentColor" />
            </span>
          </span>
        </div>
      </button>

      <div className="p-4 md:p-5">
        <h3 className="font-display text-base leading-snug font-bold text-paper md:text-lg">
          {project.title}
        </h3>
        {project.description && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-steel">{project.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.18em] text-steel">
            {project.client && <span>{project.client.toUpperCase()}</span>}
            {project.year && <span className="text-signal">{project.year}</span>}
          </div>
          <button
            onClick={() => onPlay(project)}
            className="shrink-0 font-mono text-[10px] tracking-[0.25em] text-volt transition-colors hover:text-paper"
          >
            PLAY ▸
          </button>
        </div>
      </div>
    </motion.article>
  );
}
