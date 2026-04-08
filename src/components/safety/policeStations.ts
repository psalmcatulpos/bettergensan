// Police station data — extracted from PoliceStationsMap.tsx so the
// component file only exports React components. Mixing component and
// non-component exports breaks Vite Fast Refresh.
//
// Coordinates: stations 1, 2, and 3 are pinned to verified OSM entries.
// Stations 4-10 use the centroid of the barangay they serve (also from
// Nominatim) since they don't have direct OSM listings yet — markers for
// approximate positions are noted with `approximate: true`.

export interface PoliceStation {
  number: number;
  name: string;
  address: string;
  phone: string;
  position: [number, number];
  /** True when the marker is the barangay centroid, not the exact station. */
  approximate?: boolean;
}

export const POLICE_STATIONS: PoliceStation[] = [
  {
    number: 1,
    name: 'Police Station 1',
    address: 'Pendanita St., Brgy. Dadiangas East',
    phone: '0998-598-7208',
    position: [6.1139924, 125.1706377],
  },
  {
    number: 2,
    name: 'Police Station 2',
    address: 'Malakas Wharf, Brgy. Labangal',
    phone: '0918-921-3580',
    position: [6.0945442, 125.1545658],
  },
  {
    number: 3,
    name: 'Police Station 3',
    address: 'Brgy. Lagao',
    phone: '0998-598-7212',
    position: [6.1281258, 125.1969371],
  },
  {
    number: 4,
    name: 'Police Station 4',
    address: 'Purok Malakas, Brgy. San Isidro',
    phone: '0998-598-7214',
    position: [6.1437473, 125.1791678],
    approximate: true,
  },
  {
    number: 5,
    name: 'Police Station 5',
    address: 'Makar-Siguel Road, Brgy. Calumpang',
    phone: '0907-313-4517',
    position: [6.0825, 125.155],
    approximate: true,
  },
  {
    number: 6,
    name: 'Police Station 6',
    address: 'Brgy. Bula',
    phone: '0998-598-7218',
    position: [6.1037621, 125.1934639],
    approximate: true,
  },
  {
    number: 7,
    name: 'Police Station 7',
    address: 'F.L. Awaño Ave., Brgy. Fatima',
    phone: '0916-272-6009',
    position: [6.0741531, 125.1140770],
    approximate: true,
  },
  {
    number: 8,
    name: 'Police Station 8',
    address: 'Brgy. Tinagacan',
    phone: '0998-598-7223',
    position: [6.2111432, 125.2382604],
    approximate: true,
  },
  {
    number: 9,
    name: 'Police Station 9',
    address: 'Prk. Malinawon, Brgy. Buayan',
    phone: '0948-874-1661',
    position: [6.1110684, 125.2307266],
    approximate: true,
  },
  {
    number: 10,
    name: 'Police Station 10',
    address: 'Purok Malinawon, Brgy. Calumpang',
    phone: '0999-548-9244',
    position: [6.0728933, 125.1404719],
    approximate: true,
  },
];
