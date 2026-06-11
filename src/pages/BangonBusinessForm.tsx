// /bangon-gensan/business-form — multi-step "Add Your Business" submission.
// Mirrors the /bangon-gensan/form pattern: dark themed full-screen container,
// step header, animated transitions, success / error states. Writes to
// bangon_business_submissions with status='pending' until an admin approves.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Store,
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  MapPin,
  Utensils,
  Pill,
  ShoppingBag,
  Scissors,
  Wrench,
  Coffee,
  Cookie,
  Shirt,
  Car,
  Flower,
  Stethoscope,
  Activity,
  Sparkles,
  Briefcase,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  cleanText,
  normalizePhonePH,
  tryConsumeSubmit,
  hasLetter,
} from '../lib/bangonSanitize';

type Step = 1 | 2 | 3 | 4;

// Essentials first — Grocery, Pharmacy, Medical, Food — so quake-recovery
// users see the categories they most likely need before scrolling.
const CATEGORIES = [
  { key: 'Grocery', icon: <ShoppingBag size={16} /> },
  { key: 'Pharmacy', icon: <Pill size={16} /> },
  { key: 'Medical', icon: <Stethoscope size={16} /> },
  { key: 'Food', icon: <Utensils size={16} /> },
  { key: 'Bakery', icon: <Cookie size={16} /> },
  { key: 'Coffee', icon: <Coffee size={16} /> },
  { key: 'Hardware', icon: <Wrench size={16} /> },
  { key: 'Electrical', icon: <Activity size={16} /> },
  { key: 'Laundry', icon: <Sparkles size={16} /> },
  { key: 'Services', icon: <Briefcase size={16} /> },
  { key: 'Auto / Rental', icon: <Car size={16} /> },
  { key: 'Pet', icon: <Stethoscope size={16} /> },
  { key: 'Beauty / Cosmetic', icon: <Scissors size={16} /> },
  { key: 'Clothing', icon: <Shirt size={16} /> },
  { key: 'Florist', icon: <Flower size={16} /> },
  { key: 'Other', icon: <Store size={16} /> },
];

export default function BangonBusinessForm() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [sells, setSells] = useState('');
  const [address, setAddress] = useState('');
  const [opens, setOpens] = useState('');
  const [closes, setCloses] = useState('');
  const [contact, setContact] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterContact, setSubmitterContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setStep(1);
    setName('');
    setCategories([]);
    setSells('');
    setAddress('');
    setOpens('');
    setCloses('');
    setContact('');
    setSubmitterName('');
    setSubmitterContact('');
    setError(null);
    setSuccess(false);
  };

  const submit = async () => {
    const cleanName = cleanText(name, 120);
    const cleanSells = cleanText(sells, 200);
    const cleanAddress = cleanText(address, 200);
    const cleanContact = cleanText(contact, 80);
    const cleanSubmitter = cleanText(submitterName, 80);
    const subContact = submitterContact.trim()
      ? normalizePhonePH(submitterContact)
      : '';

    if (!cleanName || !hasLetter(cleanName)) {
      setError('Please enter the business name.');
      setStep(1);
      return;
    }
    if (categories.length === 0) {
      setError('Please pick at least one category.');
      setStep(1);
      return;
    }
    if (!cleanSubmitter || !hasLetter(cleanSubmitter)) {
      setError('Please enter your name (so we can credit the submission).');
      setStep(4);
      return;
    }
    if (submitterContact.trim() && !subContact) {
      setError('Your contact number must be a valid PH mobile.');
      setStep(4);
      return;
    }

    const throttle = tryConsumeSubmit();
    if (!throttle.ok) {
      setError(`Slow down — try again in ${throttle.retryAfter}s.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from('bangon_business_submissions')
      .insert({
        name: cleanName,
        categories,
        category: categories[0] ?? null,
        sells: cleanSells || null,
        address: cleanAddress || null,
        opens: opens.trim() || null,
        closes: closes.trim() || null,
        contact: cleanContact || null,
        submitter_name: cleanSubmitter,
        submitter_contact: subContact || null,
      });
    setSubmitting(false);
    if (err) {
      setError(err.message || 'Could not submit. Please try again.');
      return;
    }
    setSuccess(true);
  };

  const canNext1 = name.trim().length >= 2 && categories.length > 0;
  const canNext4 = submitterName.trim().length >= 2;

  return (
    <>
      <Helmet>
        <title>Add Your Business — BangonGensan</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0202] via-[#1a0606] to-[#0a0202] text-gray-100">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:py-12">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Store size={14} className="text-red-300" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">
              List a business · Community
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            Add Your Business to the Open Today list
          </h1>
          <p className="mt-1 text-[12px] text-red-200/70 leading-relaxed">
            Submissions are reviewed by a BangonGenSan admin before they appear
            on the homepage. Only public business info is needed.
          </p>

          {success ? (
            <div className="mt-6 rounded-lg border border-emerald-500/50 bg-emerald-950/40 p-5 bg-anim-pop">
              <CheckCircle2 className="text-emerald-300" size={22} />
              <h2 className="mt-2 text-lg font-bold text-white">
                Submission received
              </h2>
              <p className="mt-1 text-[12px] text-emerald-100/80 leading-relaxed">
                A BangonGenSan admin will review your business and publish it
                shortly. Thanks for helping the community.
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-[11px] font-bold uppercase tracking-widest"
                >
                  <ArrowLeft size={12} /> Back home
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-[11px] font-bold uppercase tracking-widest"
                >
                  Submit another
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="mt-5 flex items-center gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      n <= step ? 'bg-red-500' : 'bg-red-950'
                    }`}
                  />
                ))}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-red-300/70">
                Step {step} of 4
              </div>

              <div
                key={step}
                className="mt-5 rounded-lg border border-red-900/50 bg-black/30 p-4 sm:p-5 bg-anim-step"
              >
                {step === 1 && (
                  <>
                    <h3 className="text-sm font-bold text-white">
                      What&apos;s the business?
                    </h3>
                    <label className="block mt-3 text-[11px] uppercase tracking-widest text-red-300/70">
                      Business name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Yannie's Kitchen"
                      maxLength={120}
                      className="mt-1 w-full px-3 py-2 rounded-md bg-black/40 border border-red-900/50 text-[13px] text-white placeholder:text-red-300/30 focus:outline-none focus:border-red-500/60"
                    />
                    <label className="block mt-4 text-[11px] uppercase tracking-widest text-red-300/70">
                      Categories <span className="text-red-300/40 normal-case tracking-normal">— pick all that apply</span>
                    </label>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {CATEGORIES.map((c) => {
                        const active = categories.includes(c.key);
                        return (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() =>
                              setCategories((prev) =>
                                prev.includes(c.key)
                                  ? prev.filter((x) => x !== c.key)
                                  : [...prev, c.key],
                              )
                            }
                            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-[11px] font-bold transition-colors ${
                              active
                                ? 'bg-red-600 border-red-500 text-white'
                                : 'bg-black/40 border-red-900/50 text-red-200 hover:border-red-500/60'
                            }`}
                          >
                            {c.icon}
                            <span className="truncate">{c.key}</span>
                          </button>
                        );
                      })}
                    </div>
                    {categories.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-red-200/70">
                        <span>Selected:</span>
                        {categories.map((c) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 rounded-full bg-red-900/40 border border-red-700/40 text-red-100"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 className="text-sm font-bold text-white">
                      What does it sell or do?
                    </h3>
                    <label className="block mt-3 text-[11px] uppercase tracking-widest text-red-300/70">
                      Short description (optional)
                    </label>
                    <textarea
                      value={sells}
                      onChange={(e) => setSells(e.target.value)}
                      placeholder="e.g. Breakfast, coffee, free wifi"
                      rows={3}
                      maxLength={200}
                      className="mt-1 w-full px-3 py-2 rounded-md bg-black/40 border border-red-900/50 text-[13px] text-white placeholder:text-red-300/30 focus:outline-none focus:border-red-500/60 resize-none"
                    />
                  </>
                )}

                {step === 3 && (
                  <>
                    <h3 className="text-sm font-bold text-white">
                      Where & when?
                    </h3>
                    <label className="block mt-3 text-[11px] uppercase tracking-widest text-red-300/70">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={10} /> Address (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Nuñez Street, Brgy. San Isidro"
                      maxLength={200}
                      className="mt-1 w-full px-3 py-2 rounded-md bg-black/40 border border-red-900/50 text-[13px] text-white placeholder:text-red-300/30 focus:outline-none focus:border-red-500/60"
                    />
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] uppercase tracking-widest text-red-300/70">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={10} /> Opens
                          </span>
                        </label>
                        <input
                          type="text"
                          value={opens}
                          onChange={(e) => setOpens(e.target.value)}
                          placeholder="e.g. 8 AM"
                          maxLength={40}
                          className="mt-1 w-full px-3 py-2 rounded-md bg-black/40 border border-red-900/50 text-[13px] text-white placeholder:text-red-300/30 focus:outline-none focus:border-red-500/60"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-widest text-red-300/70">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={10} /> Closes
                          </span>
                        </label>
                        <input
                          type="text"
                          value={closes}
                          onChange={(e) => setCloses(e.target.value)}
                          placeholder="e.g. 5 PM"
                          maxLength={40}
                          className="mt-1 w-full px-3 py-2 rounded-md bg-black/40 border border-red-900/50 text-[13px] text-white placeholder:text-red-300/30 focus:outline-none focus:border-red-500/60"
                        />
                      </div>
                    </div>
                    <label className="block mt-4 text-[11px] uppercase tracking-widest text-red-300/70">
                      <span className="inline-flex items-center gap-1">
                        <Phone size={10} /> Public contact (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="e.g. 0917-123-4567 or @business"
                      maxLength={80}
                      className="mt-1 w-full px-3 py-2 rounded-md bg-black/40 border border-red-900/50 text-[13px] text-white placeholder:text-red-300/30 focus:outline-none focus:border-red-500/60"
                    />
                  </>
                )}

                {step === 4 && (
                  <>
                    <h3 className="text-sm font-bold text-white">
                      Your details (for review)
                    </h3>
                    <p className="mt-1 text-[11px] text-red-200/70">
                      Your name is shown to the admin reviewer only. It is not
                      published on the homepage.
                    </p>
                    <label className="block mt-3 text-[11px] uppercase tracking-widest text-red-300/70">
                      Your full name
                    </label>
                    <input
                      type="text"
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      placeholder="e.g. Maria Santos"
                      maxLength={80}
                      className="mt-1 w-full px-3 py-2 rounded-md bg-black/40 border border-red-900/50 text-[13px] text-white placeholder:text-red-300/30 focus:outline-none focus:border-red-500/60"
                    />
                    <label className="block mt-4 text-[11px] uppercase tracking-widest text-red-300/70">
                      Your contact (optional, in case the admin needs to verify)
                    </label>
                    <input
                      type="text"
                      value={submitterContact}
                      onChange={(e) => setSubmitterContact(e.target.value)}
                      placeholder="0917-123-4567"
                      maxLength={40}
                      className="mt-1 w-full px-3 py-2 rounded-md bg-black/40 border border-red-900/50 text-[13px] text-white placeholder:text-red-300/30 focus:outline-none focus:border-red-500/60"
                    />
                  </>
                )}

                {error && (
                  <div className="mt-3 flex items-start gap-1.5 rounded-md border border-amber-500/40 bg-amber-950/30 px-3 py-2">
                    <AlertTriangle size={12} className="text-amber-300 mt-0.5" />
                    <span className="text-[11px] text-amber-100">{error}</span>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStep((s) => (Math.max(1, s - 1) as Step))}
                    disabled={step === 1}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-bold uppercase tracking-widest"
                  >
                    <ArrowLeft size={12} /> Back
                  </button>
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setStep((s) => (Math.min(4, s + 1) as Step))
                      }
                      disabled={step === 1 && !canNext1}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold uppercase tracking-widest"
                    >
                      Next <ArrowRight size={12} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void submit()}
                      disabled={submitting || !canNext4}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold uppercase tracking-widest"
                    >
                      <Send size={12} />
                      {submitting ? 'Submitting…' : 'Submit'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1 text-[11px] text-red-200/70 hover:text-white"
          >
            <ArrowLeft size={12} /> Back to BetterGensan
          </Link>
        </div>
      </div>
    </>
  );
}
