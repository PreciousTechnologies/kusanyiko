import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Church,
  ClipboardList,
  Flame,
  HandHeart,
  LogIn,
  MapPin,
  Mic2,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserPlus,
  Users,
} from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { useTheme } from '../context/ThemeContext';
import { SunMoonIcon } from '../components/ui-bits';
import { ClayButton, StatusPill } from '../components/ui-bits';
import { springs } from '../lib/motion-tokens';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { ...springs.gentle, delay },
});

const pillars = [
  {
    icon: <Mic2 className="w-4 h-4" />,
    title: 'Worship',
    text: 'Voices raised as one — opening every gathering with thanksgiving and praise that sets the atmosphere for all that follows.',
  },
  {
    icon: <Flame className="w-4 h-4" />,
    title: 'Prayer',
    text: 'Extended times of intercession for families, churches and the nation — praying until burdens lift and direction comes.',
  },
  {
    icon: <BookOpen className="w-4 h-4" />,
    title: 'Teaching',
    text: 'Grounded, practical teaching on leadership, character and ministry — truth members can carry straight back to their churches.',
  },
  {
    icon: <HandHeart className="w-4 h-4" />,
    title: 'Ministry',
    text: 'Personal ministry and prayer for everyone present — healing, renewal and fresh impartation for the work ahead.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Sign in',
    text: 'Access your account with the credentials issued by your church administrator. New here? Your registrar or admin will set you up.',
  },
  {
    n: '02',
    title: 'Register members',
    text: 'Capture each member completely — personal details, contact and location, church information, and a clear profile photo for gate verification.',
  },
  {
    n: '03',
    title: 'Verified at the gate',
    text: 'Every arrival is checked against the live member register, so entry stays smooth, orderly and secure for everyone.',
  },
];

const faqs = [
  {
    q: 'Who can register members?',
    a: 'Registration is done by authorized registrars through this portal. If you serve in registration and need an account, ask your church administrator to issue you one.',
  },
  {
    q: 'What details are required for each member?',
    a: 'Full name, age, gender and marital status, a mobile number, region and residence, church position and registration number where available — plus a clear, recent profile photo used for verification at the gate.',
  },
  {
    q: 'Can a registration be corrected later?',
    a: 'Yes. Registrars can open any member record from their dashboard and update details, replace the photo, or correct errors at any time before and during the camp.',
  },
  {
    q: 'How does gate verification work?',
      a: 'Security teams search the live register by name, phone or email and confirm each member against their photo and details — no printed lists to lose, no long queues.',
  },
];

const LandingPage = () => {
  const { branding } = useBranding();
  const { theme, cycleTheme } = useTheme();
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans antialiased flex flex-col scroll-smooth">
      {/* Ambient washes */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full bg-[var(--info)] opacity-10 blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        {...rise(0)}
        className="relative z-10 flex items-center justify-between px-6 lg:px-10 h-20 max-w-7xl w-full mx-auto"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] block flex-shrink-0">
            <img
              src={`${process.env.PUBLIC_URL}/image.png`}
              alt={`${branding.app_name} logo`}
              className="w-full h-full object-cover"
            />
          </span>
          <span className="min-w-0">
            <span className="block font-display font-bold text-sm tracking-tight truncate">
              {branding.landing_header_title}
            </span>
            <span className="block text-[11px] text-muted-foreground font-medium truncate">
              {branding.landing_header_subtitle}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={cycleTheme}
            title={`Theme: ${theme} — click to switch`}
            aria-label="Switch theme"
            className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-[var(--border)] bg-[var(--card)] shadow-sm text-muted-foreground hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-colors focus-ring"
          >
            {theme === 'mint' ? (
              <Sun className="w-5 h-5 shrink-0 text-amber-500" />
            ) : theme === 'brown' ? (
              <SunMoonIcon size={20} className="shrink-0 text-amber-600" />
            ) : (
              <Moon className="w-5 h-5 shrink-0 text-indigo-400" />
            )}
          </button>
          <Link to="/login">
            <ClayButton tone="primary" icon={<LogIn className="w-4 h-4" />}>
              Sign In
            </ClayButton>
          </Link>
        </div>
      </motion.header>

      {/* Main */}
      <main className="relative z-10 px-6 lg:px-10 max-w-7xl w-full mx-auto flex-1 flex flex-col">
        {/* Hero */}
        <section className="pt-10 pb-8 text-center flex flex-col items-center">
          <motion.div {...rise(0.05)}>
            <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
              {branding.registration_status_label}
            </span>
          </motion.div>
          <motion.h1
            {...rise(0.1)}
            className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight max-w-4xl"
          >
            {branding.landing_hero_prefix}{' '}
            <span className="text-[var(--primary)]">{branding.landing_hero_highlight}</span>{' '}
            {branding.landing_hero_suffix}
          </motion.h1>
          <motion.p {...rise(0.15)} className="mt-4 text-muted-foreground text-base lg:text-lg leading-relaxed max-w-2xl">
            {branding.landing_description}
          </motion.p>
          <motion.p {...rise(0.17)} className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
            {branding.app_subtitle}
          </motion.p>
          <motion.div {...rise(0.2)} className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login">
              <ClayButton tone="primary" icon={<ArrowRight className="w-4 h-4" />} className="!px-6 !py-3 !text-base">
                Sign In to Register
              </ClayButton>
            </Link>
            <a href="#how-it-works">
              <ClayButton tone="neutral" className="!px-6 !py-3 !text-base">
                How it works
              </ClayButton>
            </a>
          </motion.div>
          <motion.div {...rise(0.24)} className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span className="tnum font-semibold">{branding.camp_start_date} – {branding.camp_end_date}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span className="font-semibold">{branding.camp_location}</span>
            </span>
          </motion.div>
        </section>

        {/* Bento highlights */}
        <section aria-label="Camp highlights" className="py-4">
          <motion.p {...rise(0.22)} className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
            The Gathering
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.article {...rise(0.24)} className="surface bento p-5 sm:col-span-2 lg:row-span-1">
              <div className="flex items-start justify-between gap-3">
                <span className="icon-badge">
                  <Church className="w-4 h-4" />
                </span>
                <span className="tnum text-[11px] font-bold text-muted-foreground">01</span>
              </div>
              <h3 className="mt-3 font-display text-base font-bold">What to Expect</h3>
              <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                Multiple days of worship, prayer, teaching and ministry sessions. Experience
                spiritual renewal, healing, and prophetic ministry under the leadership of{' '}
                <span className="font-semibold text-[var(--foreground)]">{branding.ministry_lead}</span>.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Worship', 'Prayer', 'Teaching', 'Ministry'].map((c) => (
                  <span key={c} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--secondary)] border border-[var(--border)] text-muted-foreground">
                    {c}
                  </span>
                ))}
              </div>
            </motion.article>

            <motion.article {...rise(0.28)} className="surface bento p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="icon-badge">
                  <CalendarDays className="w-4 h-4" />
                </span>
                <span className="tnum text-[11px] font-bold text-muted-foreground">02</span>
              </div>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Camp Dates</p>
              <p className="tnum font-display text-xl font-bold mt-0.5">{branding.camp_start_date}</p>
              <p className="text-xs text-muted-foreground mt-0.5">to {branding.camp_end_date}</p>
            </motion.article>

            <motion.article {...rise(0.32)} className="surface bento p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="icon-badge">
                  <MapPin className="w-4 h-4" />
                </span>
                <span className="tnum text-[11px] font-bold text-muted-foreground">03</span>
              </div>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Location</p>
              <p className="font-display text-xl font-bold mt-0.5 leading-snug">{branding.camp_location}</p>
            </motion.article>

            <motion.article {...rise(0.36)} className="surface bento p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="icon-badge">
                  <ClipboardList className="w-4 h-4" />
                </span>
                <span className="tnum text-[11px] font-bold text-muted-foreground">04</span>
              </div>
              <h3 className="mt-3 font-display text-base font-bold">Registration Info</h3>
              <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                Register church members from different regions and branches. Complete details
                support smooth coordination, ministry planning, and event participation.
              </p>
            </motion.article>

            <motion.article {...rise(0.4)} className="surface bento p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="icon-badge">
                  <Users className="w-4 h-4" />
                </span>
                <span className="tnum text-[11px] font-bold text-muted-foreground">05</span>
              </div>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Who registers</p>
              <p className="font-display text-xl font-bold mt-0.5">All</p>
              <p className="text-xs text-muted-foreground mt-0.5">Church Members</p>
            </motion.article>

            <motion.article {...rise(0.44)} className="surface bento p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="icon-badge">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="tnum text-[11px] font-bold text-muted-foreground">06</span>
              </div>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</p>
              <div className="mt-1">
                <StatusPill stage="Live" tone="success" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{branding.registration_status_label}</p>
            </motion.article>
          </div>
        </section>

        {/* About */}
        <section aria-label="About the camp" className="py-10 max-w-3xl mx-auto text-center">
          <motion.p {...rise(0.1)} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            About the Camp
          </motion.p>
          <motion.h2 {...rise(0.14)} className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight">
            A gathering for those who carry the work
          </motion.h2>
          <motion.div {...rise(0.18)} className="mt-4 space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>
              Church members from across regions and branches gather at {branding.camp_location} for
              days set apart — worship, prayer, teaching and ministry, under the leadership of{' '}
              {branding.ministry_lead}.
            </p>
            <p>
              It is a time of renewal and equipping: members return to their churches refreshed,
              aligned, and ready to serve their congregations with fresh strength. Every member
              is registered beforehand so the camp team can prepare, coordinate and welcome
              each arrival by name.
            </p>
          </motion.div>
        </section>

        {/* Pillars */}
        <section aria-label="Ministry pillars" className="py-4">
          <motion.p {...rise(0.1)} className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
            What fills the days
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pillars.map((p, i) => (
              <motion.article key={p.title} {...rise(0.12 + i * 0.04)} className="surface bento p-5">
                <span className="icon-badge">{p.icon}</span>
                <h3 className="mt-3 font-display text-base font-bold">{p.title}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{p.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-label="How registration works" className="py-10 scroll-mt-24">
          <motion.p {...rise(0.1)} className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Registration
          </motion.p>
          <motion.h2 {...rise(0.14)} className="mt-2 text-center font-display text-2xl sm:text-3xl font-bold tracking-tight">
            From sign-in to gate in three steps
          </motion.h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <motion.article key={s.n} {...rise(0.16 + i * 0.05)} className="surface bento p-5">
                <div className="flex items-center justify-between">
                  <span className="tnum w-9 h-9 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-bold text-sm">
                    {s.n}
                  </span>
                  {i < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground hidden md:block" aria-hidden="true" />
                  )}
                </div>
                <h3 className="mt-3 font-display text-base font-bold">{s.title}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{s.text}</p>
              </motion.article>
            ))}
          </div>
          <motion.div {...rise(0.3)} className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login">
              <ClayButton tone="primary" icon={<UserPlus className="w-4 h-4" />}>
                Start Registering
              </ClayButton>
            </Link>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground px-1 py-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
              Checked against the live register on arrival
            </span>
          </motion.div>
        </section>

        {/* FAQ */}
        <section aria-label="Frequently asked questions" className="py-4 max-w-3xl w-full mx-auto">
          <motion.p {...rise(0.1)} className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Good to know
          </motion.p>
          <motion.h2 {...rise(0.14)} className="mt-2 text-center font-display text-2xl sm:text-3xl font-bold tracking-tight mb-6">
            Questions, answered
          </motion.h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <motion.details key={f.q} {...rise(0.16 + i * 0.04)} className="surface group rounded-2xl px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-display text-sm font-semibold focus-ring rounded-lg">
                  {f.q}
                  <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{f.a}</p>
              </motion.details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.section
          {...rise(0.2)}
          aria-label="Get started"
          className="surface my-10 p-6 flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold tracking-tight">Ready to register your members?</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account or look up an existing registration.</p>
          </div>
          <Link to="/login" className="flex-shrink-0">
            <ClayButton tone="primary" icon={<LogIn className="w-4 h-4" />}>
              Sign In
            </ClayButton>
          </Link>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)]">
        <div className="px-6 lg:px-10 py-5 max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--card)] block flex-shrink-0">
              <img src={`${process.env.PUBLIC_URL}/image.png`} alt="" aria-hidden="true" className="w-full h-full object-cover" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{branding.app_name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{branding.ministry_lead}</p>
            </div>
          </div>
          <p className="tnum text-[11px] text-muted-foreground sm:ml-auto text-center">
            {branding.camp_location} • {branding.camp_start_date} – {branding.camp_end_date} • © {year} {branding.app_name}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
