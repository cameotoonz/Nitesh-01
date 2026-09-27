import supabase from './db-client.js';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

async function requireUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = new Set(['png', 'jpg', 'webp', 'gif', 'mp4', 'webm']);
const MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm' };

function sniff(buf) {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buf.length > 3 && buf.toString('ascii', 0, 3) === 'GIF') return 'gif';
  if (buf.length > 12 && buf.toString('ascii', 4, 8) === 'ftyp') return 'mp4';
  if (buf.length > 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'webm';
  return '';
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const user = await requireUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { fileName, fileBase64, contentType, folder } = req.body || {};
    if (typeof fileBase64 !== 'string' || !fileBase64) return res.status(400).json({ error: 'Missing file data' });
    const buf = Buffer.from(fileBase64, 'base64');
    if (!buf.length || buf.length > MAX_BYTES) return res.status(400).json({ error: 'File must be between 1 byte and 6 MB' });
    const kind = sniff(buf);
    if (!kind || !ALLOWED.has(kind)) return res.status(400).json({ error: 'Unsupported file type. Use PNG, JPG, WEBP, GIF, MP4 or WEBM.' });
    if (contentType && typeof contentType === 'string' && !contentType.startsWith(kind === 'mp4' || kind === 'webm' ? 'video/' : 'image/')) {
      return res.status(400).json({ error: 'File content does not match its type' });
    }
    const safeFolder = String(folder || 'misc').replace(/[^a-z0-9-]/gi, '').slice(0, 24) || 'misc';
    const safeName = String(fileName || `file.${kind}`).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || `file.${kind}`;
    const path = `${safeFolder}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('portfolio-media').upload(path, buf, { contentType: MIME[kind], upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('portfolio-media').getPublicUrl(path);
    return res.status(200).json({ url: urlData.publicUrl, path });
  } catch (err) {
    console.error('upload api error:', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
