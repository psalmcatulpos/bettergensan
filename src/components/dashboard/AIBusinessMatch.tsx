import { Sparkles } from 'lucide-react';
import { useState } from 'react';

const presets = ['1,000', '5,000', '10,000', '25,000', '50,000'];

const suggestionsByBudget: Record<
  string,
  { name: string; capital: string; roi: string }[]
> = {
  '1000': [
    {
      name: 'Street Food Cart',
      capital: 'Capital: ₱800–₱1,500',
      roi: 'ROI: 1–2 weeks',
    },
    {
      name: 'E-Load Retailing',
      capital: 'Capital: ₱500–₱1,000',
      roi: 'ROI: 1–2 weeks',
    },
    {
      name: 'Buy & Sell Snacks',
      capital: 'Capital: ₱500–₱1,200',
      roi: 'ROI: 1–3 weeks',
    },
  ],
  '5000': [
    {
      name: 'Fishball Stand',
      capital: 'Capital: ₱3,000–₱5,000',
      roi: 'ROI: 2–4 weeks',
    },
    {
      name: 'Load Retailing',
      capital: 'Capital: ₱5,000–₱10,000',
      roi: 'ROI: 2–4 weeks',
    },
    {
      name: 'Banana Cue Cart',
      capital: 'Capital: ₱2,000–₱5,000',
      roi: 'ROI: 1–3 weeks',
    },
  ],
  '10000': [
    {
      name: 'Milk Tea Stall',
      capital: 'Capital: ₱8,000–₱12,000',
      roi: 'ROI: 2–3 months',
    },
    {
      name: 'Ukay-Ukay Shop',
      capital: 'Capital: ₱8,000–₱15,000',
      roi: 'ROI: 1–2 months',
    },
    {
      name: 'Load Retailing',
      capital: 'Capital: ₱5,000–₱10,000',
      roi: 'ROI: 2–4 weeks',
    },
  ],
  '25000': [
    {
      name: 'Fried Chicken Stall',
      capital: 'Capital: ₱20,000–₱30,000',
      roi: 'ROI: 2–3 months',
    },
    {
      name: 'Sari-Sari Store',
      capital: 'Capital: ₱15,000–₱25,000',
      roi: 'ROI: 3–4 months',
    },
    {
      name: 'Water Refilling Delivery',
      capital: 'Capital: ₱20,000–₱30,000',
      roi: 'ROI: 2–4 months',
    },
  ],
  '50000': [
    {
      name: 'Laundry Shop',
      capital: 'Capital: ₱40,000–₱60,000',
      roi: 'ROI: 4–6 months',
    },
    {
      name: 'Rice Retailing',
      capital: 'Capital: ₱30,000–₱50,000',
      roi: 'ROI: 2–3 months',
    },
    {
      name: 'Printing & Photocopy',
      capital: 'Capital: ₱40,000–₱55,000',
      roi: 'ROI: 3–5 months',
    },
  ],
};

const defaultSuggestions = suggestionsByBudget['10000'];

const AIBusinessMatch = () => {
  const [amount, setAmount] = useState('10,000');
  const [suggestions, setSuggestions] = useState(defaultSuggestions);

  const handlePreset = (value: string) => {
    setAmount(value);
    const key = value.replace(/,/g, '');
    setSuggestions(
      suggestionsByBudget[key] || defaultSuggestions,
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const formatted = Number(raw).toLocaleString('en-PH');
    setAmount(formatted === '0' ? '' : formatted);

    const closest = Object.keys(suggestionsByBudget)
      .map(Number)
      .sort(
        (a, b) =>
          Math.abs(a - Number(raw)) -
          Math.abs(b - Number(raw)),
      )[0];
    setSuggestions(
      suggestionsByBudget[String(closest)] ||
        defaultSuggestions,
    );
  };

  return (
    <section className="bg-gradient-to-r from-primary-50 to-primary-100 py-10">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            AI Business Match
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Tell us your budget, we&apos;ll find the right
          business for you
        </p>

        <div className="mx-auto mt-6 max-w-2xl">
          <div className="flex items-center justify-center gap-3">
            <span className="text-lg font-medium text-gray-700">
              I have
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                ₱
              </span>
              <input
                type="text"
                value={amount}
                onChange={handleInputChange}
                className="w-48 rounded-xl border-2 border-primary-300 px-6 py-4 pl-10 text-center text-2xl font-bold text-gray-900 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <span className="text-lg font-medium text-gray-700">
              to invest
            </span>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {presets.map(value => (
              <button
                key={value}
                onClick={() => handlePreset(value)}
                className={`rounded-full border px-4 py-2 text-sm transition hover:bg-primary-600 hover:text-white ${
                  amount === value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                ₱{value}
              </button>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {suggestions.map(item => (
              <div
                key={item.name}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <Sparkles className="mb-2 h-5 w-5 text-primary-600" />
                <p className="font-semibold text-gray-900">
                  {item.name}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {item.capital}
                </p>
                <p className="text-sm text-success-600">
                  {item.roi}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIBusinessMatch;
