// HospitalsMap — Leaflet + OpenStreetMap interactive map of hospitals in
// General Santos City. Used on the Health Services page (/services/health).
//
// Hospital coordinates are sourced directly from OpenStreetMap (verified via
// Nominatim) so the markers land on the actual buildings. They should still
// not be relied on for emergency dispatch — always dial 911 first.
//
// We import the Leaflet CSS here so any page that mounts this component gets
// the marker styles automatically. We also patch the default icon URLs so
// markers render correctly in a Vite bundle (Leaflet's defaults break under
// bundlers because they reference relative image paths).

import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ---- Fix Leaflet default marker icon for Vite ----
// Leaflet's default Icon._getIconUrl tries to read from a relative img path
// that doesn't exist after bundling. Replace with the official CDN URLs so
// markers render reliably in dev and in production.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

import { HOSPITALS } from './hospitals';

// Center the view on the rough centroid of the marker cluster so all
// hospitals are visible at the default zoom.
const GENSAN_CENTER: [number, number] = [6.118, 125.176];

const HospitalsMap = () => {
  // Re-invalidate map size on mount in case the parent layout finished
  // resizing after the map first rendered (common when switching tabs).
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
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '460px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {HOSPITALS.map(h => (
          <Marker key={h.name} position={h.position}>
            <Popup>
              <div className="text-xs">
                <div className="font-semibold text-gray-900">{h.name}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-primary-700">
                  {h.type}
                </div>
                {h.address && (
                  <div className="mt-1 text-gray-600">{h.address}</div>
                )}
                {h.phones && h.phones.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {h.phones.map(p => (
                      <a
                        key={p}
                        href={`tel:${p.replace(/\D/g, '')}`}
                        className="font-bold text-primary-700 hover:text-primary-800"
                      >
                        {p}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default HospitalsMap;
