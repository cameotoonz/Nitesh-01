import supabase from './db-client.js';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

async function requireUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

function stripControls(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 32 && c !== 127) out += s[i];
  }
  return out;
}
const clean = (v, max = 500) => stripControls(String(v ?? '')).trim().slice(0, max);
const cleanUrl = (v) => {
  const s = clean(v, 1000);
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  if (s.slice(0, 8).toLowerCase() === 'https://') return s;
  return '';
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('projects').select('*').order('position', { ascending: true }).order('id', { ascending: true });
      const { category, published } = req.query || {};
      if (category === 'long' || category === 'short') q = q.eq('category', category);
      if (published === 'true') q = q.eq('published', true);
      if (published === 'false') q = q.eq('published', false);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    const user = await requireUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const b = req.body || {};
      const row = {
        title: clean(b.title, 160) || 'Untitled project',
        description: clean(b.description, 600),
        category: b.category === 'short' ? 'short' : 'long',
        video_url: cleanUrl(b.video_url),
        thumbnail: cleanUrl(b.thumbnail),
        year: clean(b.year, 12),
        client: clean(b.client, 120),
        published: b.published !== false,
        position: Number.isFinite(+b.position) ? Math.max(0, Math.min(9999, +b.position)) : 0,
      };
      const { data, error } = await supabase.from('projects').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const b = req.body || {};
      if (b.id === undefined || b.id === null || b.id === '') return res.status(400).json({ error: 'Missing id' });
      const patch = {};
      if (b.title !== undefined) patch.title = clean(b.title, 160) || 'Untitled project';
      if (b.description !== undefined) patch.description = clean(b.description, 600);
      if (b.category !== undefined) patch.category = b.category === 'short' ? 'short' : 'long';
      if (b.video_url !== undefined) patch.video_url = cleanUrl(b.video_url);
      if (b.thumbnail !== undefined) patch.thumbnail = cleanUrl(b.thumbnail);
      if (b.year !== undefined) patch.year = clean(b.year, 12);
      if (b.client !== undefined) patch.client = clean(b.client, 120);
      if (b.published !== undefined) patch.published = !!b.published;
      if (b.position !== undefined && Number.isFinite(+b.position)) patch.position = Math.max(0, Math.min(9999, +b.position));
      patch.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('projects').update(patch).eq('id', b.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const b = req.body || {};
      const id = b.id ?? req.query?.id;
      if (id === undefined || id === null || id === '') return res.status(400).json({ error: 'Missing id' });
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('projects api error:', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
