// Home — homepage composed in 4 rhythm tiers (after the hero):
//
//   Featured        PlatformValue              identity statement
//   Primary         MakeMoney · Jobs ·         heaviest weight, more padding,
//                   Safety · GovOpps           larger headings, signature beat
//   Secondary       Local Prices ·             lighter weight, breathable
//                   Transport · Community
//   Utility         Government Services        smallest weight, compact
//
// Section headers all use <SectionHeading tier="..." />, and PageSection
// padding is matched to the same tier so the page reads as deliberate
// hierarchy instead of equal-weight stacked widgets.

import { Link } from 'react-router-dom';
import { Siren } from 'lucide-react';
import SEO from '../components/SEO';
import SearchHero from '../components/home/SearchHero';
import PlatformValue from '../components/home/PlatformValue';
import PopularServices from '../components/home/PopularServices';
import JobsNearYou from '../components/dashboard/JobsNearYou';
import PopulationSpotlight from '../components/dashboard/PopulationSpotlight';
import CivicDecisions from '../components/dashboard/CivicDecisions';
import GovOpportunities from '../components/dashboard/GovOpportunities';
import JoinBetterGov from '../components/dashboard/JoinBetterGov';
import BangonHomeSector from '../components/bangon/BangonHomeSector';

function InfraAnnouncement() {
  return (
    <div
      className="announcement-shimmer relative overflow-hidden border-b border-red-700/30"
      style={{ backgroundColor: '#dc2626' }}
    >
      <div className="mx-auto flex max-w-[1100px] items-start gap-3 px-4 py-3 sm:items-center">
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
          <Siren className="relative h-5 w-5 text-white" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white">
            New: #BangonGensan — Emergency Response Map
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-white/80 sm:line-clamp-1">
            Report needs, request relief, and coordinate response in real
            time. A live operational map for the people of General Santos
            during disasters and recovery.
          </p>
        </div>

        <Link
          to="/bangon-gensan"
          className="hidden shrink-0 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 transition-[background-color] duration-[var(--dur-fast)] hover:bg-white/80 sm:inline-flex"
        >
          Open #BangonGensan
        </Link>
      </div>

      {/* Mobile CTA — below text */}
      <div className="mx-auto max-w-[1100px] px-4 pb-3 sm:hidden">
        <Link
          to="/bangon-gensan"
          className="inline-flex rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 transition-[background-color] duration-[var(--dur-fast)] hover:bg-white/80"
        >
          Open #BangonGensan
        </Link>
      </div>
    </div>
  );
}

const Home: React.FC = () => {
  return (
    <>
      <SEO
        path="/"
        title="Home"
        description="BetterGensan — your citizen portal for General Santos City. Find jobs, start a business, make money, and stay informed."
        keywords="General Santos City, GenSan, jobs, business, MSME, livelihood, government services"
      />
      <main className="flex-grow">
        {/* ---------- Hero ---------- */}
        <SearchHero />

        {/* ---------- Announcement strip ---------- */}
        <InfraAnnouncement />

        {/* ---------- TEMPORARY: BangonGenSan active relief operation ----------
            Remove this component + its import when the operation winds down. */}
        <BangonHomeSector />

        {/* ---------- Featured: platform identity ---------- */}
        <PlatformValue />

        {/* ---------- Popular services entry point ---------- */}
        <PopularServices />

        {/* ---------- Primary tier ---------- */}
        <div id="jobs">
          <JobsNearYou />
        </div>
        <CivicDecisions />
        <div id="gov-opportunities">
          <GovOpportunities />
        </div>

        {/* ---------- Secondary tier ---------- */}
        <div id="population">
          <PopulationSpotlight />
        </div>

        {/* ---------- Utility tier ---------- */}
        <JoinBetterGov />
      </main>
    </>
  );
};

export default Home;
