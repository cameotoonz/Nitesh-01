import supabase from './db-client.js';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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
const cleanMail = (v) => {
  const s = clean(v, 160);
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s) ? s : '';
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('profile').select('*').order('id', { ascending: true }).limit(1);
      if (error) throw error;
      if (!data || !data.length) return res.status(404).json({ error: 'Profile not found' });
      return res.status(200).json(data[0]);
    }
    const user = await requireUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.method === 'PUT') {
      const b = req.body || {};
      const patch = {};
      if (b.name !== undefined) patch.name = clean(b.name, 120);
      if (b.role !== undefined) patch.role = clean(b.role, 160);
      if (b.experience !== undefined) patch.experience = clean(b.experience, 40);
      if (b.location !== undefined) patch.location = clean(b.location, 120);
      if (b.photo !== undefined) patch.photo = cleanUrl(b.photo);
      if (b.about !== undefined) patch.about = clean(b.about, 4000);
      if (b.hero_title !== undefined) patch.hero_title = clean(b.hero_title, 120);
      if (b.hero_accent !== undefined) patch.hero_accent = clean(b.hero_accent, 120);
      if (b.hero_description !== undefined) patch.hero_description = clean(b.hero_description, 400);
      if (b.email !== undefined) patch.email = cleanMail(b.email);
      if (b.whatsapp !== undefined) patch.whatsapp = clean(b.whatsapp, 24).replace(/[^0-9+]/g, '');
      if (b.instagram !== undefined) patch.instagram = clean(b.instagram, 60).replace(/[^A-Za-z0-9._]/g, '');
      if (b.available !== undefined) patch.available = !!b.available;
      patch.updated_at = new Date().toISOString();
      const { data: existing } = await supabase.from('profile').select('id').order('id', { ascending: true }).limit(1);
      let data = null;
      if (existing && existing.length) {
        const upd = await supabase.from('profile').update(patch).eq('id', existing[0].id).select().single();
        if (upd.error) throw upd.error;
        data = upd.data;
      } else {
        const ins = await supabase.from('profile').insert({ ...patch, name: patch.name || 'Nitesh Kumar' }).select().single();
        if (ins.error) throw ins.error;
        data = ins.data;
      }
      return res.status(200).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('profile api error:', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
