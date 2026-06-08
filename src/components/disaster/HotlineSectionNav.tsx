import { Phone, Siren, Shield, Stethoscope, Flame, Radio } from 'lucide-react';

interface NavButton {
  href: string;
  label: string;
  icon: typeof Phone;
  tone: 'urgent' | 'primary' | 'neutral';
}

const BUTTONS: NavButton[] = [
  { href: '#first-call-dispatch', label: 'Call First', icon: Phone, tone: 'urgent' },
  { href: '#gensan-operational-responders', label: 'CDRRMO · BFP · JTF', icon: Siren, tone: 'primary' },
  { href: '#philippine-national-police-gensan', label: 'Police Stations', icon: Shield, tone: 'primary' },
  { href: '#hospitals-emergency-rooms', label: 'Hospitals', icon: Stethoscope, tone: 'primary' },
  { href: '#early-warning-systems', label: 'Early Warnings', icon: Radio, tone: 'neutral' },
  { href: '#before-a-disaster-quick-prep-checklist', label: 'Prep Checklist', icon: Flame, tone: 'neutral' },
];

const TONE_CLASSES: Record<NavButton['tone'], string> = {
  urgent:
    'bg-red-600 text-white hover:bg-red-700 border-red-700 shadow-red-200',
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 border-primary-700 shadow-primary-200',
  neutral:
    'bg-white text-gray-800 hover:bg-gray-50 border-gray-300 shadow-gray-200',
};

export default function HotlineSectionNav() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    }
  };

  return (
    <div className="mb-6 -mx-4 sm:mx-0">
      <div className="px-4 sm:px-0 mb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">
          Jump to section
        </p>
      </div>
      <div className="overflow-x-auto px-4 sm:px-0 [scrollbar-width:thin]">
        <div className="flex gap-2 pb-2 min-w-max">
          {BUTTONS.map(({ href, label, icon: Icon, tone }) => (
            <a
              key={href}
              href={href}
              onClick={e => handleClick(e, href)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold whitespace-nowrap transition-colors shadow-sm ${TONE_CLASSES[tone]}`}
            >
              <Icon size={14} className="flex-shrink-0" />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
