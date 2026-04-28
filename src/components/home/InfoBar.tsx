// InfoBar — thin navy strip below the navbar with location + live date/time.

import { Calendar, Clock, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

const InfoBar = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="border-t border-white/10 bg-[#00184d] text-[11px] text-white/80">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-1.5">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <MapPin className="h-3 w-3" />
          General Santos City · South Cotabato
        </span>
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1.5 whitespace-nowrap sm:flex">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            <span className="motion-safe:transition-opacity motion-safe:duration-[200ms]">
              {formattedTime}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default InfoBar;
