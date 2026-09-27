import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Church,
  ClipboardList,
  LogIn,
  MapPin,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import '../styles/landing.css';
import { useBranding } from '../context/BrandingContext';

const LandingPage = () => {
  const { branding } = useBranding();

  return (
    <div className="landing-container">
      {/* Aurora background */}
      <div className="landing-bg-element landing-bg-element-1" aria-hidden="true" />
      <div className="landing-bg-element landing-bg-element-2" aria-hidden="true" />
      <div className="landing-bg-element landing-bg-element-3" aria-hidden="true" />
      <div className="landing-grain" aria-hidden="true" />

      {/* Floating glass header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <div className="landing-logo">
            <div className="landing-logo-icon">
              <img
                src={`${process.env.PUBLIC_URL}/image.png`}
                alt="Efatha Members logo"
                className="landing-logo-image"
              />
            </div>
            <div className="landing-logo-text">
              <h1>{branding.landing_header_title}</h1>
              <p>{branding.landing_header_subtitle}</p>
            </div>
          </div>
          <nav className="landing-nav" aria-label="Primary">
            <Link to="/member-search" className="nav-btn nav-btn-ghost">
              <Search size={16} />
              Search
            </Link>
            <Link to="/login" className="nav-btn nav-btn-primary">
              <LogIn size={16} />
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <span className="hero-badge animate-fadeInUp">
            <span className="hero-live-dot" aria-hidden="true" />
            {branding.registration_status_label}
          </span>
          <h1 className="hero-title animate-fadeInUp stagger-1">
            {branding.landing_hero_prefix}{' '}
            <span className="hero-title-gradient">{branding.landing_hero_highlight}</span>{' '}
            {branding.landing_hero_suffix}
          </h1>
          <p className="hero-description animate-fadeInUp stagger-2">{branding.landing_description}</p>
          <div className="hero-buttons animate-fadeInUp stagger-3">
            <Link to="/login" className="hero-btn hero-btn-primary">
              Sign In to Register
              <ArrowRight size={18} />
            </Link>
            <Link to="/member-search" className="hero-btn hero-btn-secondary">
              <Search size={18} />
              Search Members
            </Link>
          </div>

          {/* Bento grid */}
          <div className="bento-grid animate-fadeInUp stagger-4">
            {/* Feature tile — What to expect */}
            <article className="liquid-glass bento-tile bento-feature">
              <div className="bento-icon-tile">
                <Church size={22} />
              </div>
              <h3 className="bento-title">What to Expect</h3>
              <p className="bento-text">
                Multiple days of worship, prayer, teaching and ministry sessions. Experience
                spiritual renewal, healing, and prophetic ministry under the leadership of{' '}
                <span className="bento-highlight">{branding.ministry_lead}</span>.
              </p>
              <div className="bento-chips">
                <span className="bento-chip">Worship</span>
                <span className="bento-chip">Prayer</span>
                <span className="bento-chip">Teaching</span>
                <span className="bento-chip">Ministry</span>
              </div>
            </article>

            {/* Dates tile */}
            <article className="liquid-glass bento-tile">
              <div className="bento-icon-tile bento-icon-cyan">
                <CalendarDays size={22} />
              </div>
              <p className="bento-kicker">Camp Dates</p>
              <p className="bento-big">{branding.camp_start_date}</p>
              <p className="bento-sub">to {branding.camp_end_date}</p>
            </article>

            {/* Location tile */}
            <article className="liquid-glass bento-tile">
              <div className="bento-icon-tile bento-icon-violet">
                <MapPin size={22} />
              </div>
              <p className="bento-kicker">Location</p>
              <p className="bento-big">Kibaha</p>
              <p className="bento-sub">{branding.camp_location}</p>
            </article>

            {/* Registration tile */}
            <article className="liquid-glass bento-tile bento-wide">
              <div className="bento-icon-tile bento-icon-amber">
                <ClipboardList size={22} />
              </div>
              <h3 className="bento-title">Registration Info</h3>
              <p className="bento-text">
                Register church leaders from different regions and branches for this special
                Kibaha camp. Ensure each leader&apos;s details are complete to support smooth
                coordination, ministry planning, and event participation.
              </p>
            </article>

            {/* Leaders tile */}
            <article className="liquid-glass bento-tile">
              <div className="bento-icon-tile bento-icon-emerald">
                <Users size={22} />
              </div>
              <p className="bento-kicker">Who attends</p>
              <p className="bento-big">All</p>
              <p className="bento-sub">Church Leaders</p>
            </article>

            {/* Status tile */}
            <article className="liquid-glass bento-tile">
              <div className="bento-icon-tile bento-icon-rose">
                <Sparkles size={22} />
              </div>
              <p className="bento-kicker">Status</p>
              <p className="bento-big bento-live">
                <span className="hero-live-dot" aria-hidden="true" />
                Live
              </p>
              <p className="bento-sub">{branding.registration_status_label}</p>
            </article>
          </div>

          {/* CTA banner */}
          <div className="liquid-glass cta-banner animate-fadeInUp stagger-5">
            <div className="cta-text">
              <h2 className="cta-title">Ready to register your leaders?</h2>
              <p className="cta-sub">Sign in to your account or look up an existing registration.</p>
            </div>
            <div className="cta-actions">
              <Link to="/login" className="hero-btn hero-btn-primary">
                <LogIn size={18} />
                Sign In
              </Link>
              <Link to="/member-search" className="hero-btn hero-btn-secondary">
                <Search size={18} />
                Search
              </Link>
            </div>
          </div>

          <p className="landing-footnote">
            {branding.ministry_lead} • {branding.camp_location}
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
