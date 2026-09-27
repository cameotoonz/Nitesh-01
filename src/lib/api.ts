import supabase from './supabase';

export interface Project {
  id: number;
  title: string;
  description: string;
  category: 'long' | 'short';
  video_url: string;
  thumbnail: string;
  year: string;
  client: string;
  published: boolean;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: number;
  name: string;
  role: string;
  experience: string;
  location: string;
  photo: string;
  about: string;
  hero_title: string;
  hero_accent: string;
  hero_description: string;
  email: string;
  whatsapp: string;
  instagram: string;
  available: boolean;
}

export interface Skill {
  id: number;
  name: string;
  detail: string;
  position: number;
}

export interface ProcessStep {
  id: number;
  name: string;
  short: string;
  detail: string;
  tag: string;
  icon: string;
  position: number;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' } });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data as T;
}

export async function apiMut<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: await authHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data as T;
}

export async function loginEmail(email: string, password: string) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'Sign in failed');
  const { error } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function uploadFile(file: File, folder: string): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
  if (!base64) throw new Error('Could not read file');
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ fileName: file.name, fileBase64: base64, contentType: file.type, folder }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'Upload failed');
  return data.url as string;
}
