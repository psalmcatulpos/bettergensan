import { NuqsAdapter } from 'nuqs/adapters/react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import ScrollToTop from './components/ui/ScrollToTop';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import Home from './pages/Home';
import Services from './pages/Services';
import Document from './pages/Document';
import Government from './pages/Government';
import Jobs from './pages/Jobs';
import Procurement from './pages/Procurement';
import CivicRecordDetail from './pages/CivicRecordDetail';
import ExecutiveOrders from './pages/ExecutiveOrders';
import Splis from './pages/Splis';
import CityProfile from './pages/CityProfile';
import About from './pages/About';
import Certificates from './pages/Certificates';
import Business from './pages/Business';
import TaxPayments from './pages/TaxPayments';
import SocialServices from './pages/SocialServices';
import Health from './pages/Health';
import Agriculture from './pages/Agriculture';
import Infrastructure from './pages/Infrastructure';
import Education from './pages/Education';
import PublicSafety from './pages/PublicSafety';
import Environment from './pages/Environment';
import HousingLandUse from './pages/HousingLandUse';
import Departments from './pages/Departments';
import LocalOfficials from './pages/LocalOfficials';
import Population from './pages/Population';
import CityMap from './pages/CityMap';
import InfrastructureDetail from './pages/InfrastructureDetail';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Accessibility from './pages/Accessibility';
import FAQ from './pages/FAQ';
import Placeholder from './pages/Placeholder';
import CommandCenter from './pages/CommandCenter';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Sources from './pages/admin/Sources';
import SourceDetail from './pages/admin/SourceDetail';
import Runs from './pages/admin/Runs';
import RunDetail from './pages/admin/RunDetail';
import Alerts from './pages/admin/Alerts';
import Freshness from './pages/admin/Freshness';
import DataQuality from './pages/admin/DataQuality';
import SnapshotsPage from './pages/admin/Snapshots';
import SnapshotDetail from './pages/admin/SnapshotDetail';
import Settings from './pages/admin/Settings';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <NuqsAdapter>
          <ScrollToTop />
          <Routes>
            {/* Command Center — standalone full-page, no navbar/footer */}
            <Route path="/command-center" element={<CommandCenter />} />

            {/* Admin login — bare layout, no sidebar */}
            <Route path="/admin/login" element={<Login />} />

            {/* Admin app — protected + sidebar layout */}
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="sources" element={<Sources />} />
                <Route path="sources/:slug" element={<SourceDetail />} />
                <Route path="runs" element={<Runs />} />
                <Route path="runs/:id" element={<RunDetail />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="freshness" element={<Freshness />} />
                <Route path="data-quality" element={<DataQuality />} />
                <Route path="snapshots" element={<SnapshotsPage />} />
                <Route path="snapshots/:id" element={<SnapshotDetail />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Public site */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/procurement" element={<Procurement />} />
              <Route path="/eo" element={<ExecutiveOrders />} />
              <Route path="/splis" element={<Splis />} />
              <Route path="/city-profile" element={<CityProfile />} />
              <Route path="/population" element={<Population />} />
              <Route path="/city-map" element={<CityMap />} />
              <Route
                path="/city-map/:projectId"
                element={<InfrastructureDetail />}
              />
              <Route path="/about" element={<About />} />

              {/* Footer mock pages — placeholder routes for destinations
                  that are linked from the footer but don't have a real page
                  yet. Each renders the generic Placeholder with a custom
                  title so the footer is fully linked. */}
              {/* Real legal / info pages, replacing the earlier Placeholder
                  stubs once we wrote the actual content. */}
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/accessibility" element={<Accessibility />} />
              <Route path="/faq" element={<FAQ />} />

              <Route
                path="/join-us"
                element={
                  <Placeholder
                    title="Volunteer with BetterGensan"
                    description="Help build the citizen portal — design, code, content, or local research."
                    eyebrow="Get involved"
                  />
                }
              />
              <Route
                path="/cost"
                element={
                  <Placeholder
                    title="Cost to the People of GenSan"
                    description="BetterGensan is built and run by volunteers. Cost to taxpayers: ₱0."
                    eyebrow="Transparency"
                  />
                }
              />
              <Route path="/eboss" element={<Navigate to="/services/business#apply-online" replace />} />
              <Route path="/services" element={<Services />} />
              {/* Specific service category pages — must come BEFORE the
                  generic /services/:category catchall so curated slugs win.
                  Certificates is its own dedicated component; the rest are
                  driven by the registry in src/data/serviceCategories.ts. */}
              <Route path="/services/certificates" element={<Certificates />} />
              <Route path="/services/business" element={<Business />} />
              <Route path="/services/tax-payments" element={<TaxPayments />} />
              <Route
                path="/services/social-welfare"
                element={<SocialServices />}
              />
              <Route
                path="/services/health-services"
                element={<Health />}
              />
              <Route
                path="/services/agriculture-fisheries"
                element={<Agriculture />}
              />
              <Route
                path="/services/infrastructure-public-works"
                element={<Infrastructure />}
              />
              <Route path="/services/education" element={<Education />} />
              <Route
                path="/services/disaster-preparedness"
                element={<PublicSafety />}
              />
              <Route path="/services/environment" element={<Environment />} />
              <Route
                path="/services/housing-land-use"
                element={<HousingLandUse />}
              />
              <Route path="/services/:category" element={<Services />} />
              <Route
                path="/services/:category/:documentSlug"
                element={<Document categoryType="service" />}
              />
              <Route path="/government" element={<Government />} />
              {/* Specific Departments page — must come BEFORE the generic
                  category route so 'departments' wins over :category */}
              <Route
                path="/government/departments"
                element={<Departments />}
              />
              <Route
                path="/government/officials"
                element={<LocalOfficials />}
              />
              {/* Specific civic-record detail routes — must come BEFORE the
                  generic category routes so 'executive-orders' / 'sp-records'
                  win over :category. Both reuse CivicRecordDetail with a
                  recordKind prop. */}
              <Route
                path="/government/executive-orders/:id"
                element={<CivicRecordDetail recordKind="eo" />}
              />
              <Route
                path="/government/sp-records/:id"
                element={<CivicRecordDetail recordKind="sp" />}
              />
              <Route path="/government/:category" element={<Government />} />
              <Route
                path="/government/:category/:documentSlug"
                element={<Document categoryType="government" />}
              />
            </Route>
          </Routes>
        </NuqsAdapter>
      </Router>
    </HelmetProvider>
  );
}

export default App;
