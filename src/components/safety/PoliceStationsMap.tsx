// PoliceStationsMap — Leaflet + OpenStreetMap interactive map of the 10
// PNP police stations of General Santos City. Used on the Public Safety
// page (/services/disaster-preparedness).
//
// Coordinates: stations 1, 2, and 3 are pinned to verified OSM entries
// (Police Station 1, Police Precinct No. 2, Lagao Police Station 3).
// The remaining seven stations don't have direct OSM listings, so they
// are placed at the centroid of the barangay they serve. Markers for
// approximate positions are noted with a small "approx." tag in the
// popup so users know the difference.

import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { POLICE_STATIONS } from './policeStations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Center on the rough centroid of the cluster so all 10 markers fit
// at the default zoom.
const GENSAN_CENTER: [number, number] = [6.13, 125.18];

const PoliceStationsMap = () => {
  useEffect(() => {
    const t = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
      <MapContainer
        center={GENSAN_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '460px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {POLICE_STATIONS.map(s => (
          <Marker key={s.number} position={s.position}>
            <Popup>
              <div className="text-xs">
                <div className="font-semibold text-gray-900">
                  {s.name}
                  {s.approximate && (
                    <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700">
                      approx
                    </span>
                  )}
                </div>
                <div className="mt-1 text-gray-600">{s.address}</div>
                <a
                  href={`tel:${s.phone.replace(/\D/g, '')}`}
                  className="mt-1 inline-block font-bold text-primary-700 hover:text-primary-800"
                >
                  {s.phone}
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default PoliceStationsMap;
