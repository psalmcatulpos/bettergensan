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
import { MapPin } from 'lucide-react';
import SEO from '../components/SEO';
import SearchHero from '../components/home/SearchHero';
import PlatformValue from '../components/home/PlatformValue';
import PopularServices from '../components/home/PopularServices';
import JobsNearYou from '../components/dashboard/JobsNearYou';
import PopulationSpotlight from '../components/dashboard/PopulationSpotlight';
import CivicDecisions from '../components/dashboard/CivicDecisions';
import GovOpportunities from '../components/dashboard/GovOpportunities';
import JoinBetterGov from '../components/dashboard/JoinBetterGov';

function InfraAnnouncement() {
  return (
    <div className="border-b border-[#f58900]/20" style={{ backgroundColor: '#f58900' }}>
      <div className="mx-auto flex max-w-[1100px] items-start gap-3 px-4 py-3 sm:items-center">
        <MapPin className="h-5 w-5 shrink-0 text-white" />

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white">
            New: Smart Map Command Center
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-white/80 sm:line-clamp-1">
            Live incident monitoring, hazard maps, infrastructure tracking,
            marine analytics, and flight/ship tracking for General Santos
            City — all in one 3D operational map.
          </p>
        </div>

        <Link
          to="/command-center"
          className="hidden shrink-0 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-[#f58900] transition hover:bg-white/90 sm:inline-flex"
        >
          Open Smart Map
        </Link>
      </div>

      {/* Mobile CTA — below text */}
      <div className="mx-auto max-w-[1100px] px-4 pb-3 sm:hidden">
        <Link
          to="/command-center"
          className="inline-flex rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-[#f58900] transition hover:bg-white/90"
        >
          Open Smart Map
        </Link>
      </div>
    </div>
  );
}

const Home: React.FC = () => {
  return (
    <>
      <SEO
        title="Home"
        description="BetterGensan — your citizen portal for General Santos City. Find jobs, start a business, make money, and stay informed."
        keywords="General Santos City, GenSan, jobs, business, MSME, livelihood, government services"
      />
      <main className="flex-grow">
        {/* ---------- Hero ---------- */}
        <SearchHero />

        {/* ---------- Announcement strip ---------- */}
        <InfraAnnouncement />

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
