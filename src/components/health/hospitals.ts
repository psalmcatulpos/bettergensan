// Hospital data — extracted from HospitalsMap.tsx so the component file only
// exports React components. Mixing component and non-component exports breaks
// Vite Fast Refresh and forces a full page invalidation on every save, which
// unmounts every active fetch in the app.
//
// Coordinates verified against OpenStreetMap (Nominatim search). Phone numbers
// from official directories.

export interface Hospital {
  name: string;
  type: string;
  position: [number, number];
  address?: string;
  phones?: string[];
}

export const HOSPITALS: Hospital[] = [
  {
    name: 'Dr. Jorge P. Royeca City Hospital',
    type: 'Government',
    position: [6.1257494, 125.1858132],
    address: 'Amado Fenequito Street, Lagao',
    phones: ['552-2811', '0912-376-2331'],
  },
  {
    name: 'Mindanao Medical Center',
    type: 'Private',
    position: [6.1281074, 125.1598557],
    address: 'Rafael A. Salvani Sr. Street, City Heights',
    phones: ['554-9640', '0917-718-7564'],
  },
  {
    name: 'General Santos Doctors Hospital',
    type: 'Private',
    position: [6.1201941, 125.1783572],
    address: 'Digos-Makar Road, Dadiangas East',
    phones: ['250-2777', '0962-713-3743', '0945-435-6421', '0962-713-3745'],
  },
  {
    name: 'Saint Elizabeth Hospital',
    type: 'Private',
    position: [6.1182496, 125.1799487],
    address:
      "Irineo Santiago Boulevard, Fishermen's Village, Dadiangas South",
    phones: ['552-3162', '0999-221-6988'],
  },
  {
    name: 'Socsargen County Hospital',
    type: 'Private · Cooperative',
    position: [6.1183067, 125.1898312],
    address: "Honorio Arriola Street, Fishermen's Village, Bula",
    phones: ['553-8906', '0962-009-1613'],
  },
  {
    name: 'Auguis Clinic & Hospital',
    type: 'Private',
    position: [6.1130050, 125.1677703],
    address: 'M. Quezon Avenue, Santa Cruz, Dadiangas West',
    phones: ['552-4911', '0912-084-3385'],
  },
  {
    name: 'R. O. Diagan Community Hospital',
    type: 'Government',
    position: [6.1144786, 125.1671546],
    address: 'Tieza Street, Dadiangas North',
  },
  {
    name: 'Gensan Medical Center',
    type: 'Private',
    position: [6.0825003, 125.1476721],
    address: 'Makar-Kiamba Road, Lower Acharon, Calumpang',
    phones: ['887-9898', '0998-847-9137'],
  },
];

// Hospitals not yet pinned to OpenStreetMap. Listed in the cards section
// of the Health page so residents still see them, just without a marker.
export interface UnmappedHospital {
  name: string;
  type: string;
  phones: string[];
}

export const UNMAPPED_HOSPITALS: UnmappedHospital[] = [
  {
    name: 'Sarangani Bay Specialists Medical Center',
    type: 'Private',
    phones: ['887-8888', '0919-067-8395'],
  },
  {
    name: 'Dadiangas Cooperative Hospital',
    type: 'Private · Cooperative',
    phones: ['552-3942', '0923-809-4705'],
  },
  {
    name: 'Dadiangas Medical Center',
    type: 'Private',
    phones: ['0917-190-2561'],
  },
  {
    name: 'Labella Hospital',
    type: 'Private',
    phones: ['0918-927-4593'],
  },
];
