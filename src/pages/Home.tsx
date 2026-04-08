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

import SEO from '../components/SEO';
import SearchHero from '../components/home/SearchHero';
import PlatformValue from '../components/home/PlatformValue';
import PopularServices from '../components/home/PopularServices';
import JobsNearYou from '../components/dashboard/JobsNearYou';
import PopulationSpotlight from '../components/dashboard/PopulationSpotlight';
import CivicDecisions from '../components/dashboard/CivicDecisions';
import GovOpportunities from '../components/dashboard/GovOpportunities';
import JoinBetterGov from '../components/dashboard/JoinBetterGov';

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
