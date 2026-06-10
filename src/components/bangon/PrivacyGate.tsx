// PrivacyGate — first-visit consent screen for /bangon-gensan.
//
// Renders as a full-page modal on top of whatever's already mounted.
// "Accept" persists `bg_privacy_accepted: '1'` in localStorage and dismisses.
// "Don't accept" navigates back to /.

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Heart, Check, X } from 'lucide-react';

const STORAGE_KEY = 'bg_privacy_accepted_v1';

export default function PrivacyGate() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState<boolean | null>(null);

  // Read consent state on mount. We start with `null` so we don't flash
  // either the gate or the page incorrectly while reading localStorage.
  useEffect(() => {
    try {
      setAccepted(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      setAccepted(false);
    }
  }, []);

  if (accepted === null || accepted) return null;

  const onAccept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* noop */
    }
    setAccepted(true);
  };
  const onDecline = () => {
    navigate('/');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bg-privacy-title"
      className="fixed inset-0 z-[100] bg-[#0a0e14]/95 backdrop-blur-sm flex items-center justify-center p-4 bg-anim-fade-up"
    >
      <div className="w-full max-w-lg bg-[#0d1117] border border-[#1e2a3a] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e2a3a] flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <h2
            id="bg-privacy-title"
            className="text-white font-bold uppercase tracking-widest text-sm"
          >
            BangonGensan — Heads up
          </h2>
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/15 border border-red-500/40 text-red-200 text-[10px] font-bold uppercase tracking-widest">
            <Heart size={10} />
            Community-led
          </span>
        </div>

        <div className="px-5 py-4 space-y-3 text-sm text-gray-300 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <ShieldAlert size={18} className="text-red-300 shrink-0 mt-0.5" />
            <p className="m-0">
              BangonGensan is a{' '}
              <strong className="text-white">
                temporary, community-led emergency response
              </strong>{' '}
              run by volunteers. It is not an official government service.
            </p>
          </div>

          <ul className="text-[13px] space-y-1.5 pl-1 list-none">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">·</span>
              <span>
                Everything you submit (relief requests, incident reports,
                fundraisers, offers, chat) is{' '}
                <strong className="text-white">public</strong> unless explicitly
                stated otherwise.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">·</span>
              <span>
                Approved fundraisers display your name, phone, payment details,
                and Facebook link publicly.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">·</span>
              <span>
                We can't guarantee that a request will be fulfilled, or that
                every fundraiser is genuine.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">·</span>
              <span>
                By continuing you agree to the{' '}
                <Link
                  to="/bangon-gensan/privacy"
                  className="text-red-300 underline underline-offset-2 hover:text-red-200"
                >
                  full privacy &amp; disclosure policy
                </Link>
                .
              </span>
            </li>
          </ul>
        </div>

        <div className="px-5 py-4 border-t border-[#1e2a3a] flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 px-4 py-2.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
          >
            <X size={14} />
            Don&apos;t accept
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 px-4 py-2.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
            autoFocus
          >
            <Check size={14} />I accept
          </button>
        </div>
      </div>
    </div>
  );
}
