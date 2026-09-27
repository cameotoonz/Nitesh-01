import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
const MetroWorld = lazy(() => import('../world/MetroWorld'));
import Guide from '../world/Guide';
import TopBar from '../components/TopBar';
import RouteHud, { STATIONS } from '../components/RouteHud';
import HeroGate, { LoadingBoard } from '../components/HeroGate';
import { SectionHead, AboutSection } from '../components/Sections';
import { SkillsWall, ProcessTrack } from '../components/SkillsProcess';
import WorkHall from '../components/WorkHall';
import CinemaCar from '../components/CinemaCar';
import ContactTerminus from '../components/ContactTerminus';
import VideoModal from '../components/VideoModal';
import { apiGet, type Profile, type Project, type Skill, type ProcessStep } from '../lib/api';

export default function Journey() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [docked, setDocked] = useState(false);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [activeStation, setActiveStation] = useState(0);
  const [travelPulse, setTravelPulse] = useState(0);
  const [travelling, setTravelling] = useState(false);
  const [playing, setPlaying] = useState<Project | null>(null);
  const travellingRef = useRef(false);

  // ---- data ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, projs, sk, st] = await Promise.all([
          apiGet<Profile>('/api/profile').catch(() => null),
          apiGet<Project[]>('/api/projects?published=true').catch(() => []),
          apiGet<Skill[]>('/api/skills').catch(() => []),
          apiGet<ProcessStep[]>('/api/process-steps').catch(() => []),
        ]);
        if (!alive) return;
        setProfile(p);
        setProjects(Array.isArray(projs) ? projs : []);
        setSkills(Array.isArray(sk) ? sk : []);
        setSteps(Array.isArray(st) ? st : []);
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : 'Could not load station data');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- scroll spy ----
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = STATIONS.findIndex((s) => s.id === e.target.id);
            if (idx >= 0) setActiveStation(idx);
            if (e.target.id !== 'gate') setJourneyStarted(true);
          }
        });
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
    );
    STATIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [loading]);

  const travelTo = useCallback((index: number) => {
    const el = document.getElementById(STATIONS[index].id);
    if (!el || travellingRef.current) return;
    travellingRef.current = true;
    setTravelling(true);
    setTravelPulse((p) => p + 1);
    if (index > 0) setJourneyStarted(true);
    window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveStation(index);
    }, 180);
    window.setTimeout(() => {
      setTravelling(false);
      travellingRef.current = false;
    }, 1000);
  }, []);

  const handleDocked = useCallback(() => setDocked(true), []);

  const longForm = projects.filter((p) => p.category === 'long');
  const shortForm = projects.filter((p) => p.category === 'short');

  return (
    <div className="grain relative min-h-screen bg-ink font-body text-mist">
      <Suspense fallback={<div className="fixed inset-0 z-0 bg-ink" aria-hidden="true" />}>
        <MetroWorld
          journeyStarted={journeyStarted}
          activeStation={activeStation}
          travelPulse={travelPulse}
          onDocked={handleDocked}
        />
      </Suspense>
      {/* cinematic legibility veil — station stays visible through it */}
      <div className="pointer-events-none fixed inset-0 z-[5] bg-gradient-to-b from-ink/72 via-ink/38 to-ink/80" aria-hidden="true" />

      <TopBar docked={docked} available={profile?.available ?? true} />
      <RouteHud active={activeStation} onTravel={travelTo} />
      <Guide station={activeStation} visible={docked && !playing} />
      {travelling && <div className="travel-flash" aria-hidden="true" />}

      <main className="relative z-10">
        {/* 00 · GATE */}
        <section id="gate" className="flex min-h-screen items-center px-4 pt-24 pb-16 md:px-8">
          <div className="mx-auto w-full max-w-4xl">
            {loading ? (
              <LoadingBoard />
            ) : loadError && !profile && projects.length === 0 ? (
              <div className="hud-panel rounded-2xl p-10 text-center">
                <p className="eyebrow mb-3">SIGNAL LOST</p>
                <p className="text-steel">{loadError}</p>
                <button onClick={() => window.location.reload()} className="btn-volt mt-6 text-xs">
                  RETRY BOARDING
                </button>
              </div>
            ) : (
              <HeroGate profile={profile} stationIndex={activeStation} />
            )}
            {!loading && (
              <div className="mt-8 flex justify-center">
                <a
                  href="#about"
                  aria-label="Scroll to profile station"
                  className="anim-cue flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink/70 font-mono text-sm text-volt backdrop-blur-sm"
                >
                  ↓
                </a>
              </div>
            )}
          </div>
        </section>

        {/* 01 · PROFILE */}
        <section id="about" className="px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto w-full max-w-6xl">
            <SectionHead
              num="01"
              eyebrow="STATION · CREATOR GALLERY"
              title="The editor behind the express."
              sub="Step off the platform and meet the person cutting every frame of this journey."
            />
            <AboutSection profile={profile} />
          </div>
        </section>

        {/* 02 · SKILLS */}
        <section id="skills" className="px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto w-full max-w-6xl">
            <SectionHead
              num="02"
              eyebrow="RELAY WALL · CRAFT SYSTEMS"
              title="Skills wired to the story."
              sub="Six live relays power everything on this line — hover each one to feel the current."
            />
            <SkillsWall skills={skills} />
          </div>
        </section>

        {/* 03 · PROCESS */}
        <section id="process" className="px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto w-full max-w-6xl">
            <SectionHead
              num="03"
              eyebrow="SIGNAL TRACK · WORKFLOW"
              title="Four stops. Zero skipped signals."
              sub="From first conversation to final export — this is the route every project travels."
            />
            <ProcessTrack steps={steps} />
          </div>
        </section>

        {/* 04 · LONG FORM */}
        <section id="longform" className="px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto w-full max-w-6xl">
            <SectionHead
              num="04"
              eyebrow="CINEMA HALL · LONG FORM"
              title="Stories with room to breathe."
              sub="Documentaries, journeys and brand films — pick a feature, take a seat in the cinema car."
            />
            <CinemaCar features={longForm} onPlay={setPlaying} />
            <div className="mt-10">
              <WorkHall
                title="All long-form films"
                eyebrow="FULL ARCHIVE"
                icon="film"
                projects={longForm}
                perPage={4}
                layout="wide"
                emptyText="New stories are in the making."
                onPlay={setPlaying}
              />
            </div>
          </div>
        </section>

        {/* 05 · SHORT FORM */}
        <section id="shortform" className="px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto w-full max-w-6xl">
            <SectionHead
              num="05"
              eyebrow="SHORTS BAY · VERTICAL CINEMA"
              title="Seconds that hold attention."
              sub="YouTube Shorts cut for maximum impact — sound on, thumbs ready."
            />
            <WorkHall
              title="All short-form films"
              eyebrow="FULL ARCHIVE"
              icon="shorts"
              projects={shortForm}
              perPage={8}
              layout="tall"
              emptyText="New shorts are in the making."
              onPlay={setPlaying}
            />
          </div>
        </section>

        {/* 06 · CONTACT */}
        <section id="contact" className="px-4 pt-16 pb-28 md:px-8 md:pt-24 md:pb-32">
          <div className="mx-auto w-full max-w-4xl">
            <ContactTerminus profile={profile} />
          </div>
        </section>
      </main>

      <VideoModal project={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
