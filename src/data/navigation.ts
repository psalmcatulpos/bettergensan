import type { NavigationItem } from '../types';
import { serviceCategories as servicesData } from './yamlLoader';

interface Subcategory {
  name: string;
  slug: string;
}

interface Category {
  category: string;
  slug: string;
  subcategories: Subcategory[];
}

export const mainNavigation: NavigationItem[] = [
  {
    label: 'Services',
    href: '/services',
    // Curated list of citizen-facing service categories. Hardcoded (instead of
    // mapped from services.yaml) so the navbar surface stays predictable as
    // YAML categories are added/renamed.
    children: [
      { label: 'Certificates', href: '/services/certificates' },
      { label: 'Business', href: '/services/business' },
      { label: 'Tax Payments', href: '/services/tax-payments' },
      { label: 'Social Services', href: '/services/social-welfare' },
      { label: 'Health', href: '/services/health-services' },
      { label: 'Agriculture', href: '/services/agriculture-fisheries' },
      {
        label: 'Infrastructure',
        href: '/services/infrastructure-public-works',
      },
      { label: 'Housing & Land Use', href: '/services/housing-land-use' },
      { label: 'Education', href: '/services/education' },
      { label: 'Public Safety', href: '/services/disaster-preparedness' },
      { label: 'Environment', href: '/services/environment' },
    ],
  },
  {
    label: 'Government',
    href: '/government/departments',
    children: [
      { label: 'Departments', href: '/government/departments' },
      { label: 'Local Officials', href: '/government/officials' },
      { label: 'Executive Orders', href: '/eo' },
      { label: 'Sangguniang Panglungsod', href: '/splis' },
      { label: 'Procurement', href: '/procurement' },
    ],
  },
  {
    label: 'Opportunities',
    href: '/jobs',
    children: [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Procurement', href: '/procurement' },
    ],
  },
  {
    label: 'City',
    href: '/city-profile',
    children: [
      { label: 'Profile', href: '/city-profile' },
      { label: 'Demographics', href: '/population' },
      { label: 'Infrastructure', href: '/city-map' },
    ],
  },
];

export const footerNavigation = {
  mainSections: [
    {
      title: 'About',
      links: [
        { label: 'About BetterGensan', href: '/about' },
        { label: 'Join Us', href: '/join-us' },
        { label: 'Accessibility', href: '/accessibility' },
        { label: 'Contact Us', href: '/about' },
        { label: 'Official City Website', href: 'https://gensantos.gov.ph' },
        { label: 'Official Gov.ph', href: 'https://www.gov.ph' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'All Services', href: '/services' },
        ...(servicesData.categories as Category[])
          .slice(0, 6)
          .map(category => ({
            label: category.category,
            href: `/services/${category.slug}`,
          })),
        { label: 'Hotlines', href: '/philippines/hotlines' },
        { label: 'Holidays', href: '/philippines/holidays' },
      ],
    },
    {
      title: 'Government',
      links: [
        { label: 'Open Data', href: 'https://data.gov.ph' },
        { label: 'Freedom of Information', href: 'https://www.foi.gov.ph' },
        {
          label: 'Contact Center',
          href: 'https://contactcenterngbayan.gov.ph',
        },
        {
          label: 'Official Gazette',
          href: 'https://www.officialgazette.gov.ph',
        },
      ],
    },
  ],
  socialLinks: [
    { label: 'Facebook', href: 'https://facebook.com/gaborgensan' },
  ],
};
