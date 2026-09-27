export type VideoKind = 'youtube' | 'vimeo' | 'instagram' | 'file' | 'external' | 'none';

export interface VideoInfo {
  kind: VideoKind;
  embedUrl: string;
  watchUrl: string;
  videoId: string;
}

export function youtubeIdFromUrl(raw: string): string {
  try {
    const u = new URL(raw, 'https://nitesh.local');
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0] || '';
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v');
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'shorts' || p === 'embed' || p === 'live' || p === 'v');
      if (idx >= 0 && parts[idx + 1] && /^[A-Za-z0-9_-]{11}$/.test(parts[idx + 1])) return parts[idx + 1];
    }
  } catch { /* not a parseable url */ }
  return '';
}

export function parseVideoUrl(raw: string): VideoInfo {
  const url = (raw || '').trim();
  if (!url) return { kind: 'none', embedUrl: '', watchUrl: '', videoId: '' };
  const yt = youtubeIdFromUrl(url);
  if (yt) {
    return {
      kind: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`,
      watchUrl: `https://www.youtube.com/watch?v=${yt}`,
      videoId: yt,
    };
  }
  try {
    const u = new URL(url, 'https://nitesh.local');
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.split('/').find((p) => /^\d+$/.test(p)) || '';
      if (id) return { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`, watchUrl: `https://vimeo.com/${id}`, videoId: id };
    }
    if (host === 'instagram.com') {
      const m = u.pathname.match(/^\/(reel|p|tv)\/([A-Za-z0-9_-]+)/);
      if (m) return { kind: 'instagram', embedUrl: `https://www.instagram.com/${m[1]}/${m[2]}/embed/`, watchUrl: url, videoId: m[2] };
    }
  } catch { /* ignore */ }
  if (/\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url) || url.includes('/storage/v1/object/')) {
    return { kind: 'file', embedUrl: url, watchUrl: url, videoId: '' };
  }
  return { kind: 'external', embedUrl: url, watchUrl: url, videoId: '' };
}
