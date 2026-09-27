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

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('skills').select('*').order('position', { ascending: true }).order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    const user = await requireUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.method === 'POST') {
      const b = req.body || {};
      const row = {
        name: clean(b.name, 120) || 'Untitled skill',
        detail: clean(b.detail, 600),
        position: Number.isFinite(+b.position) ? Math.max(0, Math.min(9999, +b.position)) : 0,
      };
      const { data, error } = await supabase.from('skills').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const b = req.body || {};
      if (b.id === undefined || b.id === null || b.id === '') return res.status(400).json({ error: 'Missing id' });
      const patch = {};
      if (b.name !== undefined) patch.name = clean(b.name, 120);
      if (b.detail !== undefined) patch.detail = clean(b.detail, 600);
      if (b.position !== undefined && Number.isFinite(+b.position)) patch.position = Math.max(0, Math.min(9999, +b.position));
      const { data, error } = await supabase.from('skills').update(patch).eq('id', b.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const b = req.body || {};
      const id = b.id ?? req.query?.id;
      if (id === undefined || id === null || id === '') return res.status(400).json({ error: 'Missing id' });
      const { error } = await supabase.from('skills').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('skills api error:', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
