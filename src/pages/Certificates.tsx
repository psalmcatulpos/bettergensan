// /services/certificates — citizen-facing index for the most-requested civic
// certificates in General Santos City. Pure information page: cards explain
// what each certificate is for and which official portal handles it. Every
// transactional link goes straight to the responsible national or LGU office
// — BetterGensan never collects forms or payments itself.

import {
  Baby,
  BadgeCheck,
  Building2,
  ExternalLink,
  FileText,
  Heart,
  IdCard,
  Landmark,
  Shield,
  ShieldAlert,
  Skull,
  Stamp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

interface Certificate {
  icon: LucideIcon;
  title: string;
  body: string;
  issuer: string;
  href: string;
  cta: string;
}

const CERTIFICATES: Certificate[] = [
  {
    icon: Baby,
    title: 'Birth Certificate',
    body: 'Proof of birth issued by the Philippine Statistics Authority. Required for school enrollment, passports, and most government applications.',
    issuer: 'PSA · Civil Registration',
    href: 'https://psaserbilis.com.ph/Civil/BirthRequirements.aspx',
    cta: 'Order from PSA',
  },
  {
    icon: Heart,
    title: 'Marriage Certificate',
    body: 'Official record of marriage. Needed for spousal benefits, visa applications, change of civil status, and inheritance matters.',
    issuer: 'PSA · Civil Registration',
    href: 'https://psaserbilis.com.ph/Civil/MarriageRequirements.aspx',
    cta: 'Order from PSA',
  },
  {
    icon: Skull,
    title: 'Death Certificate',
    body: 'Official proof of death. Used for estate settlement, insurance claims, GSIS/SSS benefits, and burial permits.',
    issuer: 'PSA · Civil Registration',
    href: 'https://psaserbilis.com.ph/Civil/DeathRequirements.aspx',
    cta: 'Order from PSA',
  },
  {
    icon: Stamp,
    title: 'Barangay Clearance',
    body: 'Local clearance from your barangay office stating you are a resident in good standing. Required for employment, business permits, and other transactions.',
    issuer: 'Barangay Hall · GenSan',
    href: 'https://gensantos.gov.ph/',
    cta: 'Find your barangay',
  },
  {
    icon: IdCard,
    title: 'Barangay ID',
    body: 'Locally-issued identification card recognized for low-stakes transactions. Issued by your barangay hall after presenting proof of residency.',
    issuer: 'Barangay Hall · GenSan',
    href: 'https://gensantos.gov.ph/',
    cta: 'Find your barangay',
  },
  {
    icon: ShieldAlert,
    title: 'Police Clearance',
    body: 'PNP-issued clearance certifying no record of pending criminal cases. Required by most employers and many government offices.',
    issuer: 'Philippine National Police',
    href: 'https://pnpclearance.ph/',
    cta: 'Apply on PNP portal',
  },
];

interface Office {
  icon: LucideIcon;
  name: string;
  scope: string;
  href: string;
  domain: string;
}

const OFFICES: Office[] = [
  {
    icon: BadgeCheck,
    name: 'Philippine Statistics Authority (PSA)',
    scope: 'Birth, Marriage, Death, CENOMAR. Official civil registry of the Philippines.',
    href: 'https://psa.gov.ph/civil-registration',
    domain: 'psa.gov.ph',
  },
  {
    icon: FileText,
    name: 'PSA e-Serbisyo (PSA Serbilis)',
    scope: 'Online ordering and home delivery for PSA civil registry documents.',
    href: 'https://psaserbilis.com.ph/',
    domain: 'psaserbilis.com.ph',
  },
  {
    icon: Landmark,
    name: 'City Civil Registry Office — GenSan',
    scope: 'Local civil registration: late registration, corrections, supplemental reports.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Building2,
    name: 'Barangay Hall',
    scope: 'Barangay clearance, barangay ID, residency certifications, blotter records.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Shield,
    name: 'Philippine National Police — National Clearance',
    scope: 'Official PNP national police clearance with biometrics verification.',
    href: 'https://pnpclearance.ph/',
    domain: 'pnpclearance.ph',
  },
  {
    icon: Stamp,
    name: 'NBI Clearance',
    scope: 'National Bureau of Investigation clearance, often required alongside police clearance.',
    href: 'https://clearance.nbi.gov.ph/',
    domain: 'clearance.nbi.gov.ph',
  },
];

const Certificates: React.FC = () => {
  return (
    <>
      <SEO
        title="Certificates & Clearances — GenSan"
        description="Quick guide to the most-requested civic certificates in General Santos City — birth, marriage, death, barangay clearance, barangay ID, and police clearance — plus direct links to the responsible government offices."
        keywords="gensan certificates, psa birth certificate, barangay clearance gensan, police clearance, nbi clearance, civil registry general santos"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Certificates' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Civic Documents
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Certificates & Clearances
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                What each certificate is for, and the exact official portal
                that issues it. BetterGensan never processes documents itself
                — every link below goes straight to the responsible office.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Certificates grid ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Stamp}
          eyebrow="Most requested"
          title="Available certificates"
          helper="Six everyday civic documents and where to get each one."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CERTIFICATES.map(cert => (
            <article
              key={cert.title}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <cert.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold leading-snug text-gray-900">
                {cert.title}
              </h3>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-700">
                {cert.issuer}
              </p>
              <p className="mt-2 flex-grow text-sm leading-relaxed text-gray-600">
                {cert.body}
              </p>
              <a
                href={cert.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
              >
                {cert.cta}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </PageSection>

      {/* ---------- Responsible Offices ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Landmark}
          eyebrow="Where to go"
          title="Responsible Offices"
          helper="The government offices and official portals that issue each certificate above."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OFFICES.map(office => (
            <a
              key={office.name}
              href={office.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <office.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                    {office.name}
                  </h4>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-primary-700" />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  {office.scope}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-primary-700">
                  {office.domain}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          <strong>Heads up:</strong> Always confirm requirements with the
          official portal before paying any fee. BetterGensan does not collect
          payments, accept documents, or process applications on your behalf.
        </div>
      </PageSection>
    </>
  );
};

export default Certificates;
