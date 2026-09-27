import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loginEmail } from '../lib/api';
import { signInWithGoogle } from '../lib/googleAuth';

export default function Login() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) nav('/admin', { replace: true });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setBusy(true);
    try {
      await loginEmail(email.trim(), password);
      nav('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grain flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <div className="hud-panel w-full max-w-md rounded-2xl p-7 md:p-9">
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-steel hover:text-paper">
          <ArrowLeft size={14} /> BACK TO STATION
        </Link>
        <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-volt/40 bg-volt/10 text-volt">
          <Lock size={24} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-paper md:text-3xl">Control Room Access</h1>
        <p className="mt-2 font-mono text-[10px] tracking-[0.25em] text-steel">
          STAFF ONLY · CONTENT MANAGEMENT
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="label-mono mb-1.5 block">EMAIL</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="label-mono mb-1.5 block">PASSWORD</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-ember/40 bg-ember/10 px-3 py-2.5 text-[13px] text-ember">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn-volt w-full justify-center text-xs disabled:opacity-60"
          >
            <Mail size={15} /> {busy ? 'VERIFYING PASS…' : 'SIGN IN WITH EMAIL'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-steel">
          <span className="hairline flex-1" /> OR <span className="hairline flex-1" />
        </div>
        <button onClick={() => signInWithGoogle('Nitesh Portfolio CMS')} className="btn-ghost w-full justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5.1l-.1.1-3.6 2.8v.1C3.5 21.3 7.5 24 12 24z" />
            <path fill="#FBBC05" d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-.1-.1-3.6-2.8-.1.1C.5 8.7 0 10.3 0 12s.5 3.3 1.4 4.9l3.8-2.6z" />
            <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.4 6.9l3.8 2.9c.9-3 3.6-5.1 6.8-5.1z" />
          </svg>
          SIGN IN WITH GOOGLE
        </button>
        <p className="mt-6 text-center font-mono text-[9px] leading-relaxed tracking-[0.2em] text-steel/70">
          SESSIONS ARE SHORT-LIVED · FAILED ATTEMPTS ARE RATE-LIMITED
        </p>
      </div>
    </div>
  );
}
