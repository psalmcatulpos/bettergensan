// /city-map — General Santos City Map
//
// Placeholder page for the upcoming Bisto.ph map integration.
// Will serve as a broader geographic / data view for BetterGensan.

import { MapPin } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

function CityMap() {
  return (
    <>
      <SEO
        title="City Map — General Santos City"
        description="Interactive map of General Santos City. Explore barangays, landmarks, and city data."
        keywords="General Santos City map, GenSan map, barangay map, city map"
      />

      <Breadcrumbs />

      <PageSection>
        <SectionHeading tier="primary" icon={MapPin} title="City Map" />

        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-20 text-center">
          <MapPin className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-600">
            Map integration coming soon
          </p>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            This page will feature an interactive map of General Santos
            City powered by Bisto.ph, covering barangays, points of
            interest, and city-wide data layers.
          </p>
        </div>
      </PageSection>
    </>
  );
}

export default CityMap;
