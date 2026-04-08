import { CloudSun, MapPin, Droplets, Wind } from 'lucide-react';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';

const forecast = [
  { day: 'Mon', temp: '31°' },
  { day: 'Tue', temp: '30°' },
  { day: 'Wed', temp: '29°' },
  { day: 'Thu', temp: '31°' },
  { day: 'Fri', temp: '30°' },
];

const WeatherMap = () => {
  return (
    <Section>
      <Heading level={2} className="mb-6">
        Weather and Map of General Santos
      </Heading>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Card */}
        <div className="border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <CloudSun className="w-12 h-12 text-secondary-500" />
            <span className="text-4xl font-bold text-gray-900">30°C</span>
          </div>
          <p className="text-gray-500 mb-2">Clear sky</p>
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            <MapPin className="w-4 h-4" />
            General Santos City
          </div>
          <div className="flex items-center gap-6 mb-6">
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <Droplets className="w-4 h-4 text-primary-500" />
              53%
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <Wind className="w-4 h-4 text-primary-500" />
              8 km/h
            </span>
          </div>
          <div className="flex gap-2">
            {forecast.map(({ day, temp }) => (
              <div
                key={day}
                className="flex-1 text-center bg-gray-50 rounded-lg py-2 px-1"
              >
                <p className="text-xs text-gray-500">{day}</p>
                <p className="text-xs font-semibold text-gray-700">{temp}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-gray-200 rounded-xl h-full min-h-64 flex flex-col items-center justify-center p-6">
          <MapPin className="w-10 h-10 text-gray-400 mb-3" />
          <p className="text-gray-400 font-medium">
            Map of General Santos City
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Data from OpenStreetMap
          </p>
        </div>
      </div>
    </Section>
  );
};

export default WeatherMap;
