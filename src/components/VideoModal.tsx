import { useEffect, useRef } from 'react';
import { X, ExternalLink, Play } from 'lucide-react';
import type { Project } from '../lib/api';
import { parseVideoUrl } from '../lib/video';

interface Props {
  project: Project | null;
  onClose: () => void;
}

export default function VideoModal({ project, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!project) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [project, onClose]);

  if (!project) return null;
  const info = parseVideoUrl(project.video_url);
  const vertical = project.category === 'short';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`hud-panel anim-rise w-full overflow-hidden rounded-2xl ${vertical ? 'max-w-sm' : 'max-w-4xl'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-4">
          <p className="eyebrow !text-[10px]">
            {project.category === 'long' ? 'LONG FORM' : 'SHORT FORM'} / NOW PLAYING
          </p>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close video"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-steel transition-colors hover:border-ember hover:text-paper"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`relative bg-black ${vertical ? 'aspect-[9/16] max-h-[62vh] w-full' : 'aspect-video w-full'}`}>
          {info.kind === 'file' ? (
            <video
              key={project.id}
              src={info.embedUrl}
              controls
              autoPlay
              playsInline
              poster={project.thumbnail || undefined}
              className="absolute inset-0 h-full w-full"
            />
          ) : info.kind === 'youtube' || info.kind === 'vimeo' || info.kind === 'instagram' ? (
            <iframe
              key={project.id}
              src={info.embedUrl}
              title={project.title}
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-volt/50 text-volt">
                <Play size={26} />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-paper">Watch the full story</h3>
                <p className="mt-2 text-sm text-steel">
                  This film lives on its original platform. Open it in a new tab to watch.
                </p>
              </div>
              {info.watchUrl && (
                <a
                  href={info.watchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-volt !px-6 !py-3 text-xs"
                >
                  OPEN ORIGINAL <ExternalLink size={15} />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 md:px-6 md:py-5">
          <h3 className="font-display text-lg font-bold text-paper md:text-xl">{project.title}</h3>
          {project.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-steel">{project.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.2em] text-steel">
            {project.client && <span>CLIENT · {project.client.toUpperCase()}</span>}
            {project.year && <span>YEAR · {project.year}</span>}
            {info.watchUrl && (info.kind === 'youtube' || info.kind === 'vimeo' || info.kind === 'instagram') && (
              <a
                href={info.watchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-signal hover:text-paper"
              >
                WATCH ORIGINAL <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
