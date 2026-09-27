import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Film, User, Zap, Route as RouteIcon, LogOut,
  Plus, Pencil, Trash2, Eye, EyeOff, Save, X, ArrowLeft,
  Loader2, Upload, ExternalLink, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  apiGet, apiMut, uploadFile,
  type Profile, type Project, type Skill, type ProcessStep,
} from '../lib/api';
import { parseVideoUrl } from '../lib/video';

type Tab = 'overview' | 'projects' | 'profile' | 'skills' | 'process';

const TABS: { id: Tab; label: string; icon: typeof Film }[] = [
  { id: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
  { id: 'projects', label: 'PROJECTS', icon: Film },
  { id: 'profile', label: 'PROFILE', icon: User },
  { id: 'skills', label: 'SKILLS', icon: Zap },
  { id: 'process', label: 'PROCESS', icon: RouteIcon },
];

function Toast({ msg }: { msg: { kind: 'ok' | 'err'; text: string } | null }) {
  if (!msg) return null;
  return (
    <div
      role="status"
      className={`anim-rise fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2.5 rounded-full border px-5 py-3 font-mono text-xs tracking-wider backdrop-blur-md ${
        msg.kind === 'ok' ? 'border-mint/50 bg-ink/90 text-mint' : 'border-ember/50 bg-ink/90 text-ember'
      }`}
    >
      {msg.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {msg.text}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label-mono mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-steel/80">{hint}</span>}
    </label>
  );
}

function UploadField({ label, value, folder, onDone }: { label: string; value: string; folder: string; onDone: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr('');
    setBusy(true);
    try {
      const url = await uploadFile(f, folder);
      onDone(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="block">
      <span className="label-mono mb-1.5 block">{label}</span>
      <div className="flex gap-2">
        <input
          className="field"
          value={value}
          placeholder="/thumbs/… or https://…"
          onChange={(e) => onDone(e.target.value)}
        />
        <label className="btn-ghost !shrink-0 !px-4 !py-2.5 cursor-pointer">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          <input
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
      </div>
      {err && <span className="mt-1 block text-[11px] text-ember">{err}</span>}
      {value && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(value) && (
        <img src={value} alt="" loading="lazy" className="mt-2 h-20 rounded-lg border border-line object-cover" />
      )}
    </div>
  );
}

interface ProjectDraft {
  id?: number;
  title: string;
  description: string;
  category: 'long' | 'short';
  video_url: string;
  thumbnail: string;
  year: string;
  client: string;
  published: boolean;
  position: number;
}

const emptyProject: ProjectDraft = { title: '', description: '', category: 'long', video_url: '', thumbnail: '', year: '', client: '', published: true, position: 0 };

export default function Admin() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);

  const [filter, setFilter] = useState<'all' | 'long' | 'short'>('all');
  const [editing, setEditing] = useState<ProjectDraft | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [projectError, setProjectError] = useState('');

  const [profileDraft, setProfileDraft] = useState<Partial<Profile>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [skillDraft, setSkillDraft] = useState<{ id?: number; name: string; detail: string; position: number } | null>(null);
  const [stepDraft, setStepDraft] = useState<(Partial<ProcessStep> & { id?: number }) | null>(null);

  const flash = (kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 3200);
  };

  const refresh = async () => {
    try {
      const [p, projs, sk, st] = await Promise.all([
        apiGet<Profile>('/api/profile').catch(() => null),
        apiGet<Project[]>('/api/projects').catch(() => []),
        apiGet<Skill[]>('/api/skills').catch(() => []),
        apiGet<ProcessStep[]>('/api/process-steps').catch(() => []),
      ]);
      setProfile(p);
      if (p) setProfileDraft({ ...p });
      setProjects(Array.isArray(projs) ? projs : []);
      setSkills(Array.isArray(sk) ? sk : []);
      setSteps(Array.isArray(st) ? st : []);
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Refresh failed');
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- projects ----------
  const openNew = () => {
    setProjectError('');
    const maxPos = projects.reduce((m, p) => Math.max(m, p.position ?? 0), -1);
    setEditing({ ...emptyProject, position: maxPos + 1 });
  };

  const saveProject = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setProjectError('Title is required.');
      return;
    }
    if (editing.video_url && editing.video_url.trim()) {
      const v = editing.video_url.trim();
      const okLocal = v.startsWith('/') && !v.startsWith('//');
      const okHttps = v.slice(0, 8).toLowerCase() === 'https://';
      if (!okLocal && !okHttps) {
        setProjectError('Video URL must be a /local/path or an https:// link.');
        return;
      }
    }
    setSavingProject(true);
    setProjectError('');
    try {
      if (editing.id === undefined) {
        await apiMut('/api/projects', 'POST', editing);
        flash('ok', 'Project added to the line');
      } else {
        await apiMut('/api/projects', 'PUT', editing);
        flash('ok', 'Project updated');
      }
      setEditing(null);
      await refresh();
    } catch (e) {
      setProjectError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingProject(false);
    }
  };

  const togglePublish = async (p: Project) => {
    try {
      await apiMut('/api/projects', 'PUT', { id: p.id, published: !p.published });
      flash('ok', p.published ? 'Project hidden from station' : 'Project is now live');
      await refresh();
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Update failed');
    }
  };

  const removeProject = async (p: Project) => {
    if (!window.confirm(`Remove "${p.title}" from the portfolio? This cannot be undone.`)) return;
    try {
      await apiMut('/api/projects', 'DELETE', { id: p.id });
      flash('ok', 'Project removed');
      await refresh();
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Delete failed');
    }
  };

  // ---------- profile ----------
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const data = await apiMut<Profile>('/api/profile', 'PUT', profileDraft);
      setProfile(data);
      setProfileDraft({ ...data });
      flash('ok', 'Profile file updated');
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingProfile(false);
    }
  };

  // ---------- skills / steps ----------
  const saveSkill = async () => {
    if (!skillDraft || !skillDraft.name.trim()) {
      flash('err', 'Skill name is required');
      return;
    }
    try {
      if (skillDraft.id === undefined) await apiMut('/api/skills', 'POST', skillDraft);
      else await apiMut('/api/skills', 'PUT', skillDraft);
      setSkillDraft(null);
      flash('ok', 'Skill relay saved');
      await refresh();
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Save failed');
    }
  };

  const removeSkill = async (s: Skill) => {
    if (!window.confirm(`Remove skill "${s.name}"?`)) return;
    try {
      await apiMut('/api/skills', 'DELETE', { id: s.id });
      flash('ok', 'Skill removed');
      await refresh();
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const saveStep = async () => {
    if (!stepDraft || !(stepDraft.name || '').trim()) {
      flash('err', 'Step name is required');
      return;
    }
    try {
      if (stepDraft.id === undefined) await apiMut('/api/process-steps', 'POST', stepDraft);
      else await apiMut('/api/process-steps', 'PUT', stepDraft);
      setStepDraft(null);
      flash('ok', 'Process signal saved');
      await refresh();
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Save failed');
    }
  };

  const removeStep = async (s: ProcessStep) => {
    if (!window.confirm(`Remove step "${s.name}"?`)) return;
    try {
      await apiMut('/api/process-steps', 'DELETE', { id: s.id });
      flash('ok', 'Step removed');
      await refresh();
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const visible = projects.filter((p) => (filter === 'all' ? true : p.category === filter));
  const longCount = projects.filter((p) => p.category === 'long').length;
  const shortCount = projects.filter((p) => p.category === 'short').length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-ink font-mono text-xs tracking-[0.3em] text-steel">
        <Loader2 size={18} className="animate-spin text-volt" /> OPENING CONTROL ROOM…
      </div>
    );
  }

  return (
    <div className="grain min-h-screen bg-ink font-body text-mist">
      <Toast msg={toast} />
      <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-steel hover:border-signal hover:text-paper" aria-label="Back to station">
              <ArrowLeft size={17} />
            </Link>
            <div>
              <p className="font-display text-sm font-bold tracking-[0.15em] text-paper">CONTROL ROOM</p>
              <p className="font-mono text-[9px] tracking-[0.3em] text-steel">CONTENT MANAGEMENT · {user?.email}</p>
            </div>
          </div>
          <button onClick={signOut} className="btn-ghost !px-4 !py-2.5 !text-[10px]">
            <LogOut size={14} /> SIGN OUT
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 md:px-6" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.2em] transition-colors ${
                tab === t.id ? 'border-volt bg-volt/15 text-volt' : 'border-line text-steel hover:border-signal hover:text-mist'
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'TOTAL PROJECTS', value: projects.length, sub: `${projects.filter((p) => p.published).length} live` },
                { label: 'LONG FORM', value: longCount, sub: 'cinema hall films' },
                { label: 'SHORT FORM', value: shortCount, sub: 'vertical shorts' },
                { label: 'STATUS', value: profile?.available ? 'OPEN' : 'BOOKED', sub: profile?.name || 'profile' },
              ].map((s) => (
                <div key={s.label} className="hud-panel rounded-2xl p-5">
                  <p className="label-mono">{s.label}</p>
                  <p className="mt-2 font-display text-3xl font-bold text-paper">{s.value}</p>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-steel">{s.sub.toUpperCase()}</p>
                </div>
              ))}
            </div>
            <div className="hud-panel rounded-2xl p-6 md:p-8">
              <h2 className="font-display text-xl font-bold text-paper">Station handbook</h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-steel">
                <li>· <span className="text-mist">Projects</span> — every film on the line. Paste the original video URL (YouTube, Vimeo, Instagram or a direct file link) and it stays editable forever.</li>
                <li>· <span className="text-mist">Profile</span> — name, photo, about story, contact details and availability badge.</li>
                <li>· <span className="text-mist">Skills & Process</span> — the relay wall and the signal track on the journey.</li>
                <li>· Unpublished projects are hidden from visitors but kept safe in the database.</li>
                <li>· Use <span className="text-mist">Position</span> to order items — lower numbers arrive first.</li>
              </ul>
              <button onClick={openNew} className="btn-volt mt-6 text-xs">
                <Plus size={15} /> ADD A PROJECT
              </button>
            </div>
          </div>
        )}

        {tab === 'projects' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {(['all', 'long', 'short'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.2em] ${
                      filter === f ? 'border-signal bg-signal/15 text-signal' : 'border-line text-steel hover:text-mist'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <button onClick={openNew} className="btn-volt !px-5 !py-2.5 text-xs">
                <Plus size={15} /> NEW PROJECT
              </button>
            </div>

            {visible.length === 0 && (
              <div className="hud-panel rounded-2xl p-10 text-center text-steel">
                No projects on this track yet.
              </div>
            )}

            <div className="space-y-3">
              {visible.map((p) => {
                const info = parseVideoUrl(p.video_url);
                return (
                  <div key={p.id} className="hud-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row md:p-5">
                    <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-abyss sm:w-44">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-steel">NO THUMB</div>
                      )}
                      <span className="absolute top-2 left-2 rounded-full bg-ink/75 px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-volt">
                        {p.category === 'long' ? 'LONG' : 'SHORT'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-paper">{p.title}</h3>
                        {!p.published && (
                          <span className="rounded-full border border-ember/40 px-2.5 py-0.5 font-mono text-[9px] tracking-[0.2em] text-ember">
                            HIDDEN
                          </span>
                        )}
                      </div>
                      {p.description && <p className="mt-1 line-clamp-1 text-[13px] text-steel">{p.description}</p>}
                      <p className="mt-1.5 truncate font-mono text-[10px] text-signal">
                        {p.video_url ? (
                          <a href={p.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-paper">
                            {p.video_url.slice(0, 72)} <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-ember">NO VIDEO URL SET</span>
                        )}
                      </p>
                      <p className="mt-1 font-mono text-[10px] tracking-[0.15em] text-steel">
                        SOURCE: {info.kind.toUpperCase()} · POS {p.position}
                        {p.client ? ` · ${p.client.toUpperCase()}` : ''}{p.year ? ` · ${p.year}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                      <button
                        onClick={() => { setProjectError(''); setEditing({ ...emptyProject, ...p }); }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 font-mono text-[10px] tracking-[0.15em] text-steel hover:border-signal hover:text-paper sm:flex-none"
                      >
                        <Pencil size={13} /> EDIT
                      </button>
                      <button
                        onClick={() => togglePublish(p)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 font-mono text-[10px] tracking-[0.15em] text-steel hover:border-volt hover:text-volt sm:flex-none"
                      >
                        {p.published ? <EyeOff size={13} /> : <Eye size={13} />} {p.published ? 'HIDE' : 'SHOW'}
                      </button>
                      <button
                        onClick={() => removeProject(p)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ember/40 px-3 py-2 font-mono text-[10px] tracking-[0.15em] text-ember hover:bg-ember/10 sm:flex-none"
                      >
                        <Trash2 size={13} /> DROP
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div className="hud-panel rounded-2xl p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-paper">Profile file</h2>
            <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-steel">POWERS THE GATE BOARD, ID CARD & TERMINUS</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="FULL NAME">
                <input className="field" value={profileDraft.name || ''} onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })} />
              </Field>
              <Field label="ROLE / TITLE">
                <input className="field" value={profileDraft.role || ''} onChange={(e) => setProfileDraft({ ...profileDraft, role: e.target.value })} />
              </Field>
              <Field label="EXPERIENCE (SHORT, E.G. 1+)">
                <input className="field" value={profileDraft.experience || ''} onChange={(e) => setProfileDraft({ ...profileDraft, experience: e.target.value })} />
              </Field>
              <Field label="LOCATION">
                <input className="field" value={profileDraft.location || ''} onChange={(e) => setProfileDraft({ ...profileDraft, location: e.target.value })} />
              </Field>
              <Field label="HERO TITLE">
                <input className="field" value={profileDraft.hero_title || ''} onChange={(e) => setProfileDraft({ ...profileDraft, hero_title: e.target.value })} />
              </Field>
              <Field label="HERO ACCENT">
                <input className="field" value={profileDraft.hero_accent || ''} onChange={(e) => setProfileDraft({ ...profileDraft, hero_accent: e.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label="HERO DESCRIPTION (ONE LINE)">
                  <input className="field" value={profileDraft.hero_description || ''} onChange={(e) => setProfileDraft({ ...profileDraft, hero_description: e.target.value })} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="ABOUT STORY (BLANK LINE = NEW PARAGRAPH)">
                  <textarea className="field min-h-36" value={profileDraft.about || ''} onChange={(e) => setProfileDraft({ ...profileDraft, about: e.target.value })} />
                </Field>
              </div>
              <Field label="EMAIL">
                <input className="field" type="email" value={profileDraft.email || ''} onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })} />
              </Field>
              <Field label="WHATSAPP NUMBER">
                <input className="field" value={profileDraft.whatsapp || ''} onChange={(e) => setProfileDraft({ ...profileDraft, whatsapp: e.target.value })} />
              </Field>
              <Field label="INSTAGRAM HANDLE (WITHOUT @)">
                <input className="field" value={profileDraft.instagram || ''} onChange={(e) => setProfileDraft({ ...profileDraft, instagram: e.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <UploadField label="PROFILE PHOTO" value={profileDraft.photo || ''} folder="profile" onDone={(url) => setProfileDraft({ ...profileDraft, photo: url })} />
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-abyss/60 px-4 py-3">
                <input
                  type="checkbox"
                  checked={!!profileDraft.available}
                  onChange={(e) => setProfileDraft({ ...profileDraft, available: e.target.checked })}
                  className="h-4 w-4 accent-[#ffb020]"
                />
                <span className="font-mono text-xs tracking-[0.15em] text-mist">OPEN FOR WORK BADGE</span>
              </label>
            </div>
            <button onClick={saveProfile} disabled={savingProfile} className="btn-volt mt-7 text-xs disabled:opacity-60">
              {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {savingProfile ? 'SAVING…' : 'SAVE PROFILE'}
            </button>
          </div>
        )}

        {tab === 'skills' && (
          <div className="space-y-5">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  const maxPos = skills.reduce((m, s) => Math.max(m, s.position ?? 0), -1);
                  setSkillDraft({ name: '', detail: '', position: maxPos + 1 });
                }}
                className="btn-volt !px-5 !py-2.5 text-xs"
              >
                <Plus size={15} /> NEW SKILL
              </button>
            </div>
            {skillDraft && (
              <div className="hud-panel rounded-2xl p-5 md:p-6">
                <h3 className="font-display text-lg font-bold text-paper">
                  {skillDraft.id === undefined ? 'New skill relay' : 'Edit skill relay'}
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_120px]">
                  <Field label="NAME">
                    <input className="field" value={skillDraft.name} onChange={(e) => setSkillDraft({ ...skillDraft, name: e.target.value })} placeholder="e.g. Color Grading" />
                  </Field>
                  <Field label="DETAIL">
                    <input className="field" value={skillDraft.detail} onChange={(e) => setSkillDraft({ ...skillDraft, detail: e.target.value })} placeholder="One-line description" />
                  </Field>
                  <Field label="POSITION">
                    <input className="field" type="number" min={0} value={skillDraft.position} onChange={(e) => setSkillDraft({ ...skillDraft, position: +e.target.value || 0 })} />
                  </Field>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={saveSkill} className="btn-volt !px-5 !py-2.5 text-xs"><Save size={14} /> SAVE</button>
                  <button onClick={() => setSkillDraft(null)} className="btn-ghost !px-5 !py-2.5 !text-[10px]">CANCEL</button>
                </div>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {skills.map((s) => (
                <div key={s.id} className="hud-panel flex items-center justify-between gap-3 rounded-2xl p-4">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-paper">{s.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-steel">{s.detail || '—'} · POS {s.position}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => setSkillDraft({ ...s })} aria-label={`Edit ${s.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-steel hover:border-signal hover:text-paper">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => removeSkill(s)} aria-label={`Remove ${s.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-ember/40 text-ember hover:bg-ember/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'process' && (
          <div className="space-y-5">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  const maxPos = steps.reduce((m, s) => Math.max(m, s.position ?? 0), -1);
                  setStepDraft({ name: '', short: '', detail: '', tag: '', icon: 'understand', position: maxPos + 1 });
                }}
                className="btn-volt !px-5 !py-2.5 text-xs"
              >
                <Plus size={15} /> NEW STEP
              </button>
            </div>
            {stepDraft && (
              <div className="hud-panel rounded-2xl p-5 md:p-6">
                <h3 className="font-display text-lg font-bold text-paper">
                  {stepDraft.id === undefined ? 'New process signal' : 'Edit process signal'}
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="NAME">
                    <input className="field" value={stepDraft.name || ''} onChange={(e) => setStepDraft({ ...stepDraft, name: e.target.value })} />
                  </Field>
                  <Field label="TAG (E.G. THE FIRST CUT)">
                    <input className="field" value={stepDraft.tag || ''} onChange={(e) => setStepDraft({ ...stepDraft, tag: e.target.value })} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="SHORT LINE">
                      <input className="field" value={stepDraft.short || ''} onChange={(e) => setStepDraft({ ...stepDraft, short: e.target.value })} />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="DETAIL">
                      <textarea className="field min-h-24" value={stepDraft.detail || ''} onChange={(e) => setStepDraft({ ...stepDraft, detail: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="ICON">
                    <select className="field" value={stepDraft.icon || 'understand'} onChange={(e) => setStepDraft({ ...stepDraft, icon: e.target.value })}>
                      <option value="understand">Understand (compass)</option>
                      <option value="build">Build (hammer)</option>
                      <option value="polish">Polish (sparkles)</option>
                      <option value="deliver">Deliver (rocket)</option>
                    </select>
                  </Field>
                  <Field label="POSITION">
                    <input className="field" type="number" min={0} value={stepDraft.position ?? 0} onChange={(e) => setStepDraft({ ...stepDraft, position: +e.target.value || 0 })} />
                  </Field>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={saveStep} className="btn-volt !px-5 !py-2.5 text-xs"><Save size={14} /> SAVE</button>
                  <button onClick={() => setStepDraft(null)} className="btn-ghost !px-5 !py-2.5 !text-[10px]">CANCEL</button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {steps.map((s) => (
                <div key={s.id} className="hud-panel flex items-center justify-between gap-3 rounded-2xl p-4">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-paper">{s.name} <span className="ml-2 font-mono text-[9px] font-normal tracking-[0.2em] text-steel">{(s.tag || '').toUpperCase()} · POS {s.position}</span></p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-steel">{s.short || s.detail || '—'}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => setStepDraft({ ...s })} aria-label={`Edit ${s.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-steel hover:border-signal hover:text-paper">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => removeStep(s)} aria-label={`Remove ${s.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-ember/40 text-ember hover:bg-ember/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* project editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Project editor">
          <div className="hud-panel anim-rise mx-auto my-8 w-full max-w-2xl rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-paper">
                {editing.id === undefined ? 'New project' : 'Edit project'}
              </h2>
              <button onClick={() => setEditing(null)} aria-label="Close editor" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-steel hover:border-ember hover:text-paper">
                <X size={17} />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <Field label="TITLE *">
                <input className="field" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. A designer's journey" />
              </Field>
              <Field label="DESCRIPTION">
                <textarea className="field min-h-20" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="e.g. UI/UX student success story · ADMEC" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CATEGORY">
                  <select className="field" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as 'long' | 'short' })}>
                    <option value="long">Long form</option>
                    <option value="short">Short form</option>
                  </select>
                </Field>
                <Field label="POSITION">
                  <input className="field" type="number" min={0} value={editing.position} onChange={(e) => setEditing({ ...editing, position: +e.target.value || 0 })} />
                </Field>
              </div>
              <Field label="VIDEO URL (ORIGINAL — YOUTUBE / VIMEO / INSTAGRAM / FILE)" hint="The original link is preserved exactly as entered and stays editable here.">
                <input className="field font-mono !text-xs" value={editing.video_url} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" />
              </Field>
              <UploadField label="THUMBNAIL (URL OR UPLOAD)" value={editing.thumbnail} folder="thumbs" onDone={(url) => setEditing({ ...editing, thumbnail: url })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="YEAR">
                  <input className="field" value={editing.year} onChange={(e) => setEditing({ ...editing, year: e.target.value })} placeholder="e.g. 2025" />
                </Field>
                <Field label="CLIENT">
                  <input className="field" value={editing.client} onChange={(e) => setEditing({ ...editing, client: e.target.value })} placeholder="e.g. ADMEC" />
                </Field>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-abyss/60 px-4 py-3">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                  className="h-4 w-4 accent-[#ffb020]"
                />
                <span className="font-mono text-xs tracking-[0.15em] text-mist">PUBLISHED (VISIBLE ON STATION)</span>
              </label>
              {projectError && (
                <p role="alert" className="rounded-lg border border-ember/40 bg-ember/10 px-3 py-2.5 text-[13px] text-ember">
                  {projectError}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={saveProject} disabled={savingProject} className="btn-volt flex-1 justify-center text-xs disabled:opacity-60">
                  {savingProject ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {savingProject ? 'SAVING…' : 'SAVE PROJECT'}
                </button>
                <button onClick={() => setEditing(null)} className="btn-ghost !text-[10px]">CANCEL</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
