// ControlsForm — the multi-concern submission form shared between
// /bangon-gensan (right-of-feed bottom panel) and /bangongensan/form
// (standalone full-screen page).
//
// Owns its own state + submit handlers; consumers can pass `fullScreen` to
// remove the panel header chrome and let it fill the viewport.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  HandHelping,
  BadgeAlert,
  Shield,
  Utensils,
  Droplet,
  Pill,
  Home as HomeIcon,
  LifeBuoy,
} from 'lucide-react';
import { GENSAN_BARANGAYS } from '../../data/gensanBarangays';
import { supabase } from '../../lib/supabase';
import {
  cleanText,
  normalizePhonePH,
  isValidFacebookUrl,
  validatePhoto,
  tryConsumeSubmit,
  hasLetter,
} from '../../lib/bangonSanitize';

type BangonNeedType = 'food' | 'water' | 'medicine' | 'shelter' | 'rescue';
type IncidentType = 'natural_disaster' | 'fire' | 'medical' | 'security' | 'infrastructure' | 'other';
type ControlsConcern = 'help' | 'incident' | 'fundraiser' | 'offer';
const OFFER_TAGS = ['Food', 'Water', 'Medicine', 'Shelter', 'Transport', 'Skills'] as const;
type OfferTag = (typeof OFFER_TAGS)[number];

const NEED_META: Record<BangonNeedType, { label: string }> = {
  food:     { label: 'Food' },
  water:    { label: 'Water' },
  medicine: { label: 'Medicine' },
  shelter:  { label: 'Shelter' },
  rescue:   { label: 'Rescue' },
};

const NEED_TYPES: { key: BangonNeedType; label: string; tone: string; icon: React.ReactNode }[] = [
  { key: 'food',     label: 'Food',     tone: 'bg-amber-600/15 border-amber-500/40 text-amber-200 hover:bg-amber-600/25',         icon: <Utensils size={18} /> },
  { key: 'water',    label: 'Water',    tone: 'bg-sky-600/15 border-sky-500/40 text-sky-200 hover:bg-sky-600/25',                 icon: <Droplet size={18} /> },
  { key: 'medicine', label: 'Medicine', tone: 'bg-emerald-600/15 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/25', icon: <Pill size={18} /> },
  { key: 'shelter',  label: 'Shelter',  tone: 'bg-violet-600/15 border-violet-500/40 text-violet-200 hover:bg-violet-600/25',     icon: <HomeIcon size={18} /> },
  { key: 'rescue',   label: 'Rescue',   tone: 'bg-red-600/15 border-red-500/40 text-red-200 hover:bg-red-600/25',                 icon: <LifeBuoy size={18} /> },
];

const INCIDENT_TYPES: { key: IncidentType; label: string; tone: string }[] = [
  { key: 'natural_disaster', label: 'Disaster', tone: 'bg-orange-600/15 border-orange-500/40 text-orange-200 hover:bg-orange-600/25' },
  { key: 'fire',             label: 'Fire',     tone: 'bg-red-600/15 border-red-500/40 text-red-200 hover:bg-red-600/25' },
  { key: 'medical',          label: 'Medical',  tone: 'bg-emerald-600/15 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/25' },
  { key: 'security',         label: 'Security', tone: 'bg-violet-600/15 border-violet-500/40 text-violet-200 hover:bg-violet-600/25' },
  { key: 'infrastructure',   label: 'Infra',    tone: 'bg-amber-600/15 border-amber-500/40 text-amber-200 hover:bg-amber-600/25' },
  { key: 'other',            label: 'Other',    tone: 'bg-gray-700/30 border-gray-600/50 text-gray-200 hover:bg-gray-700/50' },
];

const BARANGAY_NAMES: string[] = (GENSAN_BARANGAYS.features as Array<{ properties: { name: string } }>)
  .map(f => f.properties.name)
  .filter((n, i, arr) => arr.indexOf(n) === i)
  .sort((a, b) => a.localeCompare(b));

interface Props {
  /** When true, the component renders without the panel header — meant for /bangongensan/form. */
  fullScreen?: boolean;
}

export default function ControlsForm({ fullScreen = false }: Props) {
  const [controlsTab, setControlsTab] = useState<ControlsConcern | null>(null);

  // ── Request Help ──────────────────────────────────────
  const [requestStep, setRequestStep] = useState<1 | 2 | 3>(1);
  const [formNeedType, setFormNeedType] = useState<BangonNeedType | null>(null);
  const [formBarangay, setFormBarangay] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const resetRequestForm = () => {
    setRequestStep(1); setFormNeedType(null); setFormBarangay(''); setFormLandmark('');
    setFormFullName(''); setFormContact(''); setSubmitError(null); setSubmitSuccess(false);
  };

  const submitBangonRequest = async () => {
    const fullName = cleanText(formFullName, 80);
    const landmark = cleanText(formLandmark, 120);
    const phone = normalizePhonePH(formContact);
    if (!formNeedType) { setSubmitError('Please pick a need type.'); return; }
    if (!formBarangay) { setSubmitError('Please select your barangay.'); return; }
    if (!fullName || !hasLetter(fullName)) { setSubmitError('Please enter your full name.'); return; }
    if (!phone) { setSubmitError('Please enter a valid PH mobile number.'); return; }
    const throttle = tryConsumeSubmit();
    if (!throttle.ok) { setSubmitError(`Slow down — try again in ${throttle.retryAfter}s.`); return; }
    setSubmitting(true); setSubmitError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('bangon_requests').insert({
      need_type: formNeedType, barangay: formBarangay, landmark: landmark || null,
      full_name: fullName, contact_number: phone,
    });
    setSubmitting(false);
    if (error) { setSubmitError(error.message || 'Could not submit request.'); return; }
    setSubmitSuccess(true);
  };

  // ── Report Incident ──────────────────────────────────
  const [incidentStep, setIncidentStep] = useState<1 | 2 | 3>(1);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [incidentBarangay, setIncidentBarangay] = useState('');
  const [incidentLandmark, setIncidentLandmark] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentPhoto, setIncidentPhoto] = useState<File | null>(null);
  const [incidentContact, setIncidentContact] = useState('');
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [incidentSuccess, setIncidentSuccess] = useState(false);

  const resetIncidentForm = () => {
    setIncidentStep(1); setIncidentType(null); setIncidentBarangay(''); setIncidentLandmark('');
    setIncidentDescription(''); setIncidentPhoto(null); setIncidentContact('');
    setIncidentError(null); setIncidentSuccess(false);
  };

  const submitIncident = async () => {
    const description = cleanText(incidentDescription, 1000);
    const landmark = cleanText(incidentLandmark, 120);
    const phone = normalizePhonePH(incidentContact);
    if (!incidentType) { setIncidentError('Please pick an incident type.'); return; }
    if (!incidentBarangay) { setIncidentError('Please select the barangay.'); return; }
    if (description.length < 10) { setIncidentError('Please describe what happened (at least 10 characters).'); return; }
    if (!phone) { setIncidentError('Please enter a valid PH mobile number.'); return; }
    if (incidentPhoto) {
      const check = validatePhoto(incidentPhoto);
      if (!check.ok) { setIncidentError(check.reason); return; }
    }
    const throttle = tryConsumeSubmit();
    if (!throttle.ok) { setIncidentError(`Slow down — try again in ${throttle.retryAfter}s.`); return; }
    setIncidentSubmitting(true); setIncidentError(null);

    let photoUrl: string | null = null;
    if (incidentPhoto) {
      try {
        const mime = incidentPhoto.type;
        const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
        const rand = window.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
        const path = `${Date.now()}-${rand}.${ext}`;
        const { error: upErr } = await supabase.storage.from('bangon-incidents')
          .upload(path, incidentPhoto, { contentType: mime });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('bangon-incidents').getPublicUrl(path);
        photoUrl = data.publicUrl;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'photo upload failed';
        setIncidentSubmitting(false);
        setIncidentError(`Could not upload photo (${msg}). Try submitting without it.`);
        return;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('bangon_incidents').insert({
      incident_type: incidentType, barangay: incidentBarangay, landmark: landmark || null,
      description, photo_url: photoUrl, contact_number: phone,
    });
    setIncidentSubmitting(false);
    if (error) { setIncidentError(error.message || 'Could not submit incident report.'); return; }
    setIncidentSuccess(true);
  };

  // ── Add Fundraiser ────────────────────────────────────
  const [fundStep, setFundStep] = useState<1 | 2 | 3>(1);
  const [fundTitle, setFundTitle] = useState('');
  const [fundDescription, setFundDescription] = useState('');
  const [fundGoal, setFundGoal] = useState('');
  const [fundPayment, setFundPayment] = useState('');
  const [fundContactName, setFundContactName] = useState('');
  const [fundContact, setFundContact] = useState('');
  const [fundFacebook, setFundFacebook] = useState('');
  const [fundSubmitting, setFundSubmitting] = useState(false);
  const [fundError, setFundError] = useState<string | null>(null);
  const [fundSuccess, setFundSuccess] = useState(false);

  const resetFundForm = () => {
    setFundStep(1); setFundTitle(''); setFundDescription(''); setFundGoal(''); setFundPayment('');
    setFundContactName(''); setFundContact(''); setFundFacebook(''); setFundError(null); setFundSuccess(false);
  };

  const submitFundraiser = async () => {
    const title = cleanText(fundTitle, 120);
    const description = cleanText(fundDescription, 2000);
    const payment = cleanText(fundPayment, 200);
    const contactName = cleanText(fundContactName, 80);
    const facebook = cleanText(fundFacebook, 300);
    const phone = normalizePhonePH(fundContact);
    const goalNum = parseFloat(fundGoal);
    if (title.length < 8) { setFundError('Title must be at least 8 characters.'); return; }
    if (description.length < 30) { setFundError('Description must be at least 30 characters.'); return; }
    if (!Number.isFinite(goalNum) || goalNum <= 0 || goalNum >= 50_000_000) {
      setFundError('Goal must be between ₱1 and ₱49,999,999.');
      return;
    }
    if (!payment) { setFundError('Please add payment details.'); return; }
    if (!contactName || !hasLetter(contactName)) { setFundError('Please enter the GCash / bank account name.'); return; }
    if (!phone) { setFundError('Please enter a valid PH mobile number.'); return; }
    if (!isValidFacebookUrl(facebook)) { setFundError('Facebook link must be an https:// URL on facebook.com.'); return; }
    const throttle = tryConsumeSubmit();
    if (!throttle.ok) { setFundError(`Slow down — try again in ${throttle.retryAfter}s.`); return; }
    setFundSubmitting(true); setFundError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('bangon_fundraisers').insert({
      title, description, goal_amount: goalNum, payment_details: payment,
      contact_name: contactName, contact_number: phone, facebook_url: facebook,
    });
    setFundSubmitting(false);
    if (error) { setFundError(error.message || 'Could not submit fundraiser.'); return; }
    setFundSuccess(true);
  };

  // ── Offer Help ────────────────────────────────────────
  const [offerStep, setOfferStep] = useState<1 | 2 | 3>(1);
  const [offerTags, setOfferTags] = useState<OfferTag[]>([]);
  const [offerDescription, setOfferDescription] = useState('');
  const [offerBarangay, setOfferBarangay] = useState('');
  const [offerContactName, setOfferContactName] = useState('');
  const [offerContact, setOfferContact] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSuccess, setOfferSuccess] = useState(false);

  const toggleOfferTag = (tag: OfferTag) =>
    setOfferTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));

  const resetOfferForm = () => {
    setOfferStep(1); setOfferTags([]); setOfferDescription(''); setOfferBarangay('');
    setOfferContactName(''); setOfferContact(''); setOfferError(null); setOfferSuccess(false);
  };

  const submitOffer = async () => {
    const description = cleanText(offerDescription, 500);
    const contactName = cleanText(offerContactName, 80);
    const phone = normalizePhonePH(offerContact);
    if (offerTags.length === 0 && !description) { setOfferError('Pick at least one tag or describe your offer.'); return; }
    if (!offerBarangay) { setOfferError('Please select a barangay.'); return; }
    if (!contactName || !hasLetter(contactName)) { setOfferError('Please enter your name.'); return; }
    if (!phone) { setOfferError('Please enter a valid PH mobile number.'); return; }
    const throttle = tryConsumeSubmit();
    if (!throttle.ok) { setOfferError(`Slow down — try again in ${throttle.retryAfter}s.`); return; }
    setOfferSubmitting(true); setOfferError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('bangon_offers').insert({
      offer_description: description || offerTags.join(', '), offer_tags: offerTags,
      barangay: offerBarangay, contact_name: contactName, contact_number: phone,
    });
    setOfferSubmitting(false);
    if (error) { setOfferError(error.message || 'Could not submit offer.'); return; }
    setOfferSuccess(true);
  };

  const backToConcerns = () => {
    resetRequestForm(); resetIncidentForm(); resetFundForm(); resetOfferForm();
    setControlsTab(null);
  };

  const headerTitle = controlsTab === 'help' ? 'Request Help'
    : controlsTab === 'incident' ? 'Report Incident'
    : controlsTab === 'fundraiser' ? 'Add Fundraiser'
    : controlsTab === 'offer' ? 'Offer Help'
    : 'Submit';

  return (
    <div className={`${fullScreen ? 'min-h-screen' : 'h-full'} flex flex-col bg-[#0a0e14] text-gray-100`}>
      {fullScreen && (
        <div className="px-4 sm:px-6 py-3 border-b border-[#1e2a3a] bg-[#0d1117] flex items-center gap-2 flex-shrink-0">
          {controlsTab ? (
            <button type="button" onClick={backToConcerns}
              className="flex items-center gap-1 text-gray-400 hover:text-white text-[12px] font-bold uppercase tracking-widest transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <Link to="/bangon-gensan"
              className="flex items-center gap-1 text-gray-400 hover:text-white text-[12px] font-bold uppercase tracking-widest transition-colors">
              <ArrowLeft size={14} /> BangonGensan
            </Link>
          )}
          <span className="ml-3 text-white font-bold uppercase tracking-widest text-sm">
            Controls — {headerTitle}
          </span>
        </div>
      )}

      <div className={`${fullScreen ? 'flex-1 overflow-y-auto' : 'flex-1 overflow-y-auto'}`}>
        <div className={`${fullScreen ? 'max-w-2xl mx-auto px-4 sm:px-6 py-5' : 'px-3 py-1.5'}`}>
          {/* Step 0 picker */}
          {controlsTab === null && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                {fullScreen ? 'Choose Action' : 'Step 1 · Choose Action'}
              </div>
              <div className={`grid ${fullScreen ? 'grid-cols-1 sm:grid-cols-2 gap-3' : 'grid-cols-2 gap-1.5'}`}>
                {([
                  { key: 'help',       label: 'Request Help', desc: 'Food, water, medicine, shelter, rescue.',          tone: 'bg-red-600/15 border-red-500/40 text-red-200 hover:bg-red-600/25',         icon: <HandHelping size={fullScreen ? 26 : 18} /> },
                  { key: 'incident',   label: 'Report',       desc: 'Disaster, fire, medical, security, or other.',     tone: 'bg-orange-600/15 border-orange-500/40 text-orange-200 hover:bg-orange-600/25', icon: <AlertTriangle size={fullScreen ? 26 : 18} /> },
                  { key: 'fundraiser', label: 'Fundraiser',   desc: 'Launch a community fundraiser (needs approval).',  tone: 'bg-amber-600/15 border-amber-500/40 text-amber-200 hover:bg-amber-600/25',     icon: <BadgeAlert size={fullScreen ? 26 : 18} /> },
                  { key: 'offer',      label: 'Offer Help',   desc: 'Donate goods, transport, skills, or time.',        tone: 'bg-emerald-600/15 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/25', icon: <Shield size={fullScreen ? 26 : 18} /> },
                ] as const).map((c, i) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setControlsTab(c.key)}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className={`${fullScreen ? 'p-5' : 'px-2 py-1.5'} rounded-xl border flex ${fullScreen ? 'flex-col items-start gap-2 text-left' : 'items-center justify-center gap-1.5'} transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98] bg-anim-fade-up ${c.tone}`}
                  >
                    <span className="opacity-90">{c.icon}</span>
                    <span className={`font-bold uppercase tracking-widest ${fullScreen ? 'text-sm' : 'text-[10px]'}`}>{c.label}</span>
                    {fullScreen && <span className="text-[12px] opacity-80 leading-snug">{c.desc}</span>}
                  </button>
                ))}
              </div>
              {fullScreen && (
                <p className="mt-4 text-[11px] text-gray-500 leading-relaxed">
                  BangonGensan is a community emergency portal. Anyone can submit. Volunteer responders triage and act. By submitting you agree to the{' '}
                  <Link to="/bangon-gensan/privacy" className="text-red-300 underline underline-offset-2">privacy &amp; disclosure policy</Link>.
                </p>
              )}
            </div>
          )}

          {/* Request Help */}
          {controlsTab === 'help' && (submitSuccess ? (
            <SuccessState title="Request submitted" body="Your relief request is now in the BangonGensan triage queue." onAgain={resetRequestForm} />
          ) : (
            <StepShell stepKey={requestStep} totalSteps={3}>
              {requestStep === 1 && (
                <div className="space-y-2">
                  <StepHeading text="Step 1 / 3 · Need Type" />
                  <div className="grid grid-cols-5 gap-1.5">
                    {NEED_TYPES.map(t => (
                      <button key={t.key} type="button"
                        onClick={() => { setFormNeedType(t.key); setRequestStep(2); }}
                        className={`px-1 py-2 rounded-md border flex flex-col items-center justify-center gap-1 transition-transform hover:-translate-y-0.5 active:scale-[0.98] ${formNeedType === t.key ? 'ring-1 ring-red-400 ' : ''}${t.tone}`}>
                        {t.icon}<span className="font-bold uppercase tracking-wider text-[9px]">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {requestStep === 2 && (
                <div className="space-y-2">
                  <StepHeading text="Step 2 / 3 · Location" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <LabelSelect label="Barangay" value={formBarangay} onChange={setFormBarangay} options={BARANGAY_NAMES} />
                    <LabelInput label="Landmark" optional value={formLandmark} onChange={setFormLandmark} placeholder="e.g. beside Gaisano Mall" maxLength={120} />
                  </div>
                </div>
              )}
              {requestStep === 3 && (
                <div className="space-y-2">
                  <StepHeading text="Step 3 / 3 · Contact" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <LabelInput label="Full name" value={formFullName} onChange={setFormFullName} placeholder="Juan Dela Cruz" maxLength={80} />
                    <LabelInput label="Contact number" type="tel" value={formContact} onChange={setFormContact} placeholder="09XX XXX XXXX" maxLength={16} />
                  </div>
                  {formNeedType && formBarangay && (
                    <div className="mt-2 p-2 rounded-md bg-[#0d1117] border border-gray-700 text-[10px] text-gray-300 flex items-center gap-3 flex-wrap">
                      <span><span className="text-gray-500 uppercase tracking-wider text-[9px] mr-1">Need</span>{NEED_META[formNeedType].label}</span>
                      <span className="text-gray-700">·</span>
                      <span><span className="text-gray-500 uppercase tracking-wider text-[9px] mr-1">Where</span>{formBarangay}{formLandmark ? ` — ${formLandmark}` : ''}</span>
                    </div>
                  )}
                </div>
              )}
              <ErrorBanner msg={submitError} />
              <StepNav
                step={requestStep}
                onBack={() => { setSubmitError(null); setRequestStep((requestStep - 1) as 1 | 2 | 3); }}
                onContinue={() => {
                  if (requestStep === 2 && !formBarangay) { setSubmitError('Please select your barangay.'); return; }
                  setSubmitError(null); setRequestStep((requestStep + 1) as 1 | 2 | 3);
                }}
                onSubmit={() => void submitBangonRequest()}
                submitting={submitting}
                submitLabel="Submit Request"
              />
            </StepShell>
          ))}

          {/* Report Incident */}
          {controlsTab === 'incident' && (incidentSuccess ? (
            <SuccessState title="Incident reported" body="Thank you. The BangonGensan team will review and verify before adding to the public map." onAgain={resetIncidentForm} />
          ) : (
            <StepShell stepKey={incidentStep} totalSteps={3}>
              {incidentStep === 1 && (
                <div className="space-y-2">
                  <StepHeading text="Step 1 / 3 · Incident Type" />
                  <div className="grid grid-cols-3 gap-1.5">
                    {INCIDENT_TYPES.map(t => (
                      <button key={t.key} type="button"
                        onClick={() => { setIncidentType(t.key); setIncidentStep(2); }}
                        className={`px-1 py-2 rounded-md border flex items-center justify-center gap-1 transition-transform hover:-translate-y-0.5 active:scale-[0.98] ${incidentType === t.key ? 'ring-1 ring-red-400 ' : ''}${t.tone}`}>
                        <span className="font-bold uppercase tracking-wider text-[10px]">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {incidentStep === 2 && (
                <div className="space-y-2">
                  <StepHeading text="Step 2 / 3 · Where + What" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <LabelSelect label="Barangay" value={incidentBarangay} onChange={setIncidentBarangay} options={BARANGAY_NAMES} />
                    <LabelInput label="Landmark" optional value={incidentLandmark} onChange={setIncidentLandmark} placeholder="e.g. near Robinsons" maxLength={120} />
                  </div>
                  <LabelTextarea label="Description" value={incidentDescription} onChange={setIncidentDescription} rows={3} placeholder="What happened? Who is affected?" maxLength={1000} />
                </div>
              )}
              {incidentStep === 3 && (
                <div className="space-y-2">
                  <StepHeading text="Step 3 / 3 · Photo + Contact" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="block">
                      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Photo <span className="text-gray-500 font-normal normal-case">(optional, ≤ 5 MB)</span></span>
                      <input type="file" accept="image/jpeg,image/png,image/webp"
                        onChange={e => setIncidentPhoto(e.target.files?.[0] ?? null)}
                        className="w-full text-[11px] text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
                      {incidentPhoto && <span className="block text-[10px] text-gray-500 mt-0.5 truncate">{incidentPhoto.name}</span>}
                    </label>
                    <LabelInput label="Contact number" type="tel" value={incidentContact} onChange={setIncidentContact} placeholder="09XX XXX XXXX" maxLength={16} />
                  </div>
                </div>
              )}
              <ErrorBanner msg={incidentError} />
              <StepNav
                step={incidentStep}
                onBack={() => { setIncidentError(null); setIncidentStep((incidentStep - 1) as 1 | 2 | 3); }}
                onContinue={() => {
                  if (incidentStep === 2 && (!incidentBarangay || !incidentDescription.trim())) {
                    setIncidentError(!incidentBarangay ? 'Please select a barangay.' : 'Please describe what happened.');
                    return;
                  }
                  setIncidentError(null); setIncidentStep((incidentStep + 1) as 1 | 2 | 3);
                }}
                onSubmit={() => void submitIncident()}
                submitting={incidentSubmitting}
                submitLabel="Submit Report"
              />
            </StepShell>
          ))}

          {/* Fundraiser */}
          {controlsTab === 'fundraiser' && (fundSuccess ? (
            <SuccessState title="Pending Review" body="Your fundraiser has been submitted for admin review. It will appear publicly once approved." onAgain={resetFundForm} />
          ) : (
            <StepShell stepKey={fundStep} totalSteps={3}>
              {fundStep === 1 && (
                <div className="space-y-2">
                  <StepHeading text="Step 1 / 3 · About" />
                  <LabelInput label="Title" value={fundTitle} onChange={setFundTitle} placeholder="e.g. Help families in Brgy Calumpang" maxLength={120} />
                  <LabelTextarea label="Description" value={fundDescription} onChange={setFundDescription} rows={3} placeholder="What is the money for? Who benefits?" maxLength={2000} />
                </div>
              )}
              {fundStep === 2 && (
                <div className="space-y-2">
                  <StepHeading text="Step 2 / 3 · Goal & Payment" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <LabelInput label="Goal amount (₱)" type="number" value={fundGoal} onChange={setFundGoal} placeholder="50000" maxLength={10} />
                    <LabelInput label="GCash / Bank" value={fundPayment} onChange={setFundPayment} placeholder="GCash 09XX XXX XXXX / BPI 1234..." maxLength={200} />
                  </div>
                  <div className="text-[9px] text-amber-300/80 leading-snug">
                    The account name on the GCash / bank account <strong>must match the contact name</strong> you'll provide in the next step. Mismatched accounts will be rejected.
                  </div>
                </div>
              )}
              {fundStep === 3 && (
                <div className="space-y-2">
                  <StepHeading text="Step 3 / 3 · Verify" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <LabelInput label="Full name · must match GCash / bank" value={fundContactName} onChange={setFundContactName} placeholder="Juan Dela Cruz" maxLength={80} />
                    <LabelInput label="Contact number" type="tel" value={fundContact} onChange={setFundContact} placeholder="09XX XXX XXXX" maxLength={16} />
                  </div>
                  <LabelInput label="Facebook profile or post link" type="url" value={fundFacebook} onChange={setFundFacebook}
                    placeholder="https://facebook.com/juan.delacruz" maxLength={300} />
                  <div className="text-[9px] text-amber-300/80 leading-snug">
                    Fundraiser will be queued for admin review. Approval requires the contact name, GCash / bank account name, and Facebook identity to match.
                  </div>
                </div>
              )}
              <ErrorBanner msg={fundError} />
              <StepNav
                step={fundStep}
                onBack={() => { setFundError(null); setFundStep((fundStep - 1) as 1 | 2 | 3); }}
                onContinue={() => {
                  if (fundStep === 1) {
                    if (!fundTitle.trim()) { setFundError('Please enter a title.'); return; }
                    if (!fundDescription.trim()) { setFundError('Please describe the fundraiser.'); return; }
                  }
                  if (fundStep === 2) {
                    const g = Number(fundGoal);
                    if (!Number.isFinite(g) || g <= 0) { setFundError('Please enter a goal amount > 0.'); return; }
                    if (!fundPayment.trim()) { setFundError('Please add payment details.'); return; }
                  }
                  setFundError(null); setFundStep((fundStep + 1) as 1 | 2 | 3);
                }}
                onSubmit={() => void submitFundraiser()}
                submitting={fundSubmitting}
                submitLabel="Submit for Review"
              />
            </StepShell>
          ))}

          {/* Offer Help */}
          {controlsTab === 'offer' && (offerSuccess ? (
            <SuccessState title="Salamat!" body="Your offer is now on the BangonGensan board. Volunteers will reach out to coordinate." onAgain={resetOfferForm} />
          ) : (
            <StepShell stepKey={offerStep} totalSteps={3}>
              {offerStep === 1 && (
                <div className="space-y-2">
                  <StepHeading text="Step 1 / 3 · What can you offer?" />
                  <div className="flex flex-wrap gap-1.5">
                    {OFFER_TAGS.map(tag => {
                      const active = offerTags.includes(tag);
                      return (
                        <button key={tag} type="button" onClick={() => toggleOfferTag(tag)}
                          className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors ${active ? 'bg-red-600 text-white border-red-500' : 'bg-[#111720] text-gray-300 border-gray-700 hover:border-gray-500'}`}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  <LabelTextarea label="Or describe in your own words" value={offerDescription} onChange={setOfferDescription} rows={2}
                    placeholder="e.g. Free hot meals at Brgy Lagao covered court 12–2 PM daily" maxLength={500} />
                </div>
              )}
              {offerStep === 2 && (
                <div className="space-y-2">
                  <StepHeading text="Step 2 / 3 · Where" />
                  <LabelSelect label="Barangay" value={offerBarangay} onChange={setOfferBarangay} options={BARANGAY_NAMES} />
                </div>
              )}
              {offerStep === 3 && (
                <div className="space-y-2">
                  <StepHeading text="Step 3 / 3 · Contact" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <LabelInput label="Contact name" value={offerContactName} onChange={setOfferContactName} placeholder="Maria Santos" maxLength={80} />
                    <LabelInput label="Contact number" type="tel" value={offerContact} onChange={setOfferContact} placeholder="09XX XXX XXXX" maxLength={16} />
                  </div>
                </div>
              )}
              <ErrorBanner msg={offerError} />
              <StepNav
                step={offerStep}
                onBack={() => { setOfferError(null); setOfferStep((offerStep - 1) as 1 | 2 | 3); }}
                onContinue={() => {
                  if (offerStep === 1 && offerTags.length === 0 && !offerDescription.trim()) {
                    setOfferError('Pick at least one tag or describe your offer.');
                    return;
                  }
                  if (offerStep === 2 && !offerBarangay) { setOfferError('Please select a barangay.'); return; }
                  setOfferError(null); setOfferStep((offerStep + 1) as 1 | 2 | 3);
                }}
                onSubmit={() => void submitOffer()}
                submitting={offerSubmitting}
                submitLabel="Post Offer"
              />
            </StepShell>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Small subcomponents ───────────────────────────────────────────────

function StepShell({ stepKey, totalSteps, children }: { stepKey: number; totalSteps: number; children: React.ReactNode }) {
  return (
    <div className="space-y-2 bg-anim-step" key={stepKey}>
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`flex-1 h-0.5 rounded-full transition-colors ${i + 1 <= stepKey ? 'bg-red-500' : 'bg-gray-700'}`} />
        ))}
      </div>
      {children}
    </div>
  );
}

function StepHeading({ text }: { text: string }) {
  return <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{text}</div>;
}

function ErrorBanner({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="p-2 rounded-md bg-red-900/40 border border-red-700/60 text-[11px] text-red-200 flex items-start gap-1.5">
      <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" /><span>{msg}</span>
    </div>
  );
}

function StepNav({ step, onBack, onContinue, onSubmit, submitting, submitLabel }: {
  step: 1 | 2 | 3; onBack: () => void; onContinue: () => void; onSubmit: () => void; submitting: boolean; submitLabel: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mt-2">
      {step > 1 && (
        <button type="button" onClick={onBack}
          className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-bold uppercase tracking-widest min-h-[40px]">
          Back
        </button>
      )}
      {step < 3 && (
        <button type="button" onClick={onContinue}
          className="ml-auto px-3 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 min-h-[40px]">
          Continue <ArrowRight size={12} />
        </button>
      )}
      {step === 3 && (
        <button type="button" disabled={submitting} onClick={onSubmit}
          className="ml-auto px-3 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 min-h-[40px]">
          {submitting ? 'Submitting…' : submitLabel} {!submitting && <Send size={12} />}
        </button>
      )}
    </div>
  );
}

function SuccessState({ title, body, onAgain }: { title: string; body: string; onAgain: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10 gap-3 bg-anim-pop">
      <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
        <CheckCircle2 size={28} className="text-emerald-400" />
      </div>
      <div className="text-emerald-200 font-bold uppercase tracking-widest text-sm">{title}</div>
      <p className="text-[12px] text-gray-300 leading-relaxed max-w-sm">{body}</p>
      <button type="button" onClick={onAgain}
        className="mt-3 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold uppercase tracking-widest">
        Submit another
      </button>
    </div>
  );
}

function LabelInput({ label, value, onChange, placeholder, type = 'text', maxLength, optional }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLength?: number; optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
        {label}{optional && <span className="text-gray-500 font-normal normal-case ml-1">(optional)</span>}
      </span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
        className="w-full px-2 py-2 rounded-md bg-[#111720] border border-gray-700 text-white text-[13px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
    </label>
  );
}

function LabelSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-2 rounded-md bg-[#111720] border border-gray-700 text-white text-[13px] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500">
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function LabelTextarea({ label, value, onChange, rows = 3, placeholder, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</span>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} maxLength={maxLength}
        className="w-full px-2 py-2 rounded-md bg-[#111720] border border-gray-700 text-white text-[13px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none" />
    </label>
  );
}
