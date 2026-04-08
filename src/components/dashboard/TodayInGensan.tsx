const items = [
  '🔥 12 new businesses opened today',
  '💼 47 people hired today',
  '📉 Rice price dropped to ₱52/kg',
  '⚠️ Flood risk in Lagao later 4PM',
  '🚧 Road closure near KCC',
  '🧋 Milk tea demand rising',
];

const TodayInGensan = () => {
  return (
    <div className="bg-gray-900 text-white py-3">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-6">
        <span className="text-xs font-bold uppercase tracking-wider text-accent-400 flex items-center shrink-0">
          <span className="animate-pulse bg-accent-400 w-2 h-2 rounded-full inline-block mr-2" />
          Today in GenSan
        </span>
        <div className="flex gap-6 overflow-x-auto whitespace-nowrap text-sm scrollbar-hide">
          {items.map((item, i) => (
            <span
              key={i}
              className={`shrink-0 ${i < items.length - 1 ? 'border-r border-gray-700 pr-6' : ''}`}
            >
              {item}
            </span>
          ))}
        </div>
        <a
          href="/city-intelligence"
          className="shrink-0 text-xs text-accent-400 hover:text-accent-300 font-medium hidden md:block"
        >
          View Full City Intelligence →
        </a>
      </div>
    </div>
  );
};

export default TodayInGensan;
