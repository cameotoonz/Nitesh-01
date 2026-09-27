import supabase from './db-client.js';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const attempts = new Map();
function isLimited(ip) {
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, reset: now + 5 * 60 * 1000 };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + 5 * 60 * 1000; }
  rec.count += 1;
  attempts.set(ip, rec);
  if (attempts.size > 2000) attempts.clear();
  return rec.count > 10;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) return res.status(401).json({ error: 'Invalid session' });
      return res.status(200).json({ user: { id: data.user.id, email: data.user.email } });
    }
    if (req.method === 'POST') {
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString().split(',')[0].trim();
      if (isLimited(ip)) return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes.' });
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Email and password are required' });
      const em = email.trim().slice(0, 160);
      if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(em) || password.length < 6 || password.length > 128) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: em, password });
      if (error || !data?.session) return res.status(401).json({ error: 'Invalid email or password' });
      return res.status(200).json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: { id: data.user.id, email: data.user.email },
      });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('auth api error:', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
