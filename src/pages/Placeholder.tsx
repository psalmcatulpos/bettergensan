// Placeholder — generic "coming soon" page used for footer destinations that
// don't have a real implementation yet (sitemap, terms, privacy, FAQ, etc.).
//
// Each route in App.tsx mounts <Placeholder /> with a `title`, `description`,
// and optional `eyebrow`. Keeps the footer fully linked without scattering
// dozens of one-off stub files across /pages.

import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';

interface PlaceholderProps {
  title: string;
  description?: string;
  eyebrow?: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({
  title,
  description,
  eyebrow = 'Coming soon',
}) => {
  return (
    <>
      <SEO
        title={title}
        description={
          description ??
          `${title} on BetterGensan — General Santos City citizen portal.`
        }
      />

      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: title }]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm shadow-primary-900/10">
              <Construction className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                {eyebrow}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="mt-2 max-w-2xl text-sm text-gray-900">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-12">
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm shadow-gray-900/[0.04]">
          <p className="text-sm text-gray-600">
            This page is on the BetterGensan roadmap and isn't live yet.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            We're building BetterGensan in the open — check back soon, or head
            home to explore what's already available.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </>
  );
};

export default Placeholder;
