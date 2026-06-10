// BangonGensan input sanitization.
//
// React already escapes user content on render, so this library is about:
//   (1) normalizing data before insert (trim, control-char strip, canonical phone),
//   (2) length capping so a 10 MB blob can't make it to Supabase,
//   (3) defense-in-depth for content that's read back as text (chat),
//   (4) cheap client-side throttling so naive abuse doesn't reach the DB.
//
// Server-side CHECK constraints in the migrations enforce the same rules a
// second time so a malicious client can't bypass these helpers.

/** Trim, collapse internal whitespace, drop ASCII control chars, slice to max. */
export function cleanText(input: string, max: number): string {
  if (typeof input !== 'string') return '';
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    // Drop ASCII control chars (0x00–0x1F and 0x7F DEL); keep \t / \n which
    // we'll fold into a space below.
    if ((c < 32 && c !== 9 && c !== 10) || c === 127) continue;
    out += input[i];
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Normalize a PH mobile number to canonical `+639xxxxxxxxx`.
 * Returns null if it can't be coerced into a valid PH mobile.
 *
 * Accepts: `09xxxxxxxxx`, `+639xxxxxxxxx`, `639xxxxxxxxx`,
 *          with optional spaces / dashes / parens.
 */
export function normalizePhonePH(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/[^\d+]/g, '');

  if (/^\+639\d{9}$/.test(digits)) return digits;
  if (/^639\d{9}$/.test(digits)) return '+' + digits;
  if (/^09\d{9}$/.test(digits)) return '+63' + digits.slice(1);
  return null;
}

/** True when the URL is https + hostname matches the Facebook family. */
export function isValidFacebookUrl(raw: string): boolean {
  if (typeof raw !== 'string') return false;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  const allowed = ['facebook.com', 'fb.com', 'm.facebook.com', 'web.facebook.com'];
  return allowed.some(h => host === h || host.endsWith('.' + h));
}

/** Replace `<` and `>` with their named entities. Useful for content read back as text. */
export function stripAngle(s: string): string {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ALLOWED_PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export type PhotoCheck = { ok: true } | { ok: false; reason: string };

/** Validate a user-supplied image file: mime allowlist + 5 MB cap. */
export function validatePhoto(f: File): PhotoCheck {
  if (!ALLOWED_PHOTO_MIME.has(f.type)) {
    return { ok: false, reason: 'Photo must be JPG, PNG, or WebP.' };
  }
  if (f.size > MAX_PHOTO_BYTES) {
    return { ok: false, reason: 'Photo is larger than 5 MB.' };
  }
  return { ok: true };
}

// ── Client-side throttle ─────────────────────────────────────────────
//
// A per-session record in localStorage tracks recent submit timestamps.
// Not a security boundary — DB CHECK constraints + Supabase rate-limits
// remain the actual defense — but blocks the common case of a fat-finger
// or stuck retry loop.

interface ThrottleStore {
  submits: number[];
  chats: number[];
}

const KEY = 'bg_throttle_v1';
const SUBMIT_WINDOW_MS = 60_000;
const SUBMIT_LIMIT = 3;
const CHAT_WINDOW_MS = 60_000;
const CHAT_LIMIT = 10;

function readStore(): ThrottleStore {
  if (typeof window === 'undefined') return { submits: [], chats: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { submits: [], chats: [] };
    const parsed = JSON.parse(raw) as Partial<ThrottleStore>;
    return {
      submits: Array.isArray(parsed.submits) ? parsed.submits.filter((n: unknown): n is number => typeof n === 'number') : [],
      chats: Array.isArray(parsed.chats) ? parsed.chats.filter((n: unknown): n is number => typeof n === 'number') : [],
    };
  } catch {
    return { submits: [], chats: [] };
  }
}

function writeStore(s: ThrottleStore) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // localStorage may be full or unavailable; ignore.
  }
}

/**
 * Check whether the user is allowed to submit a form right now.
 * If allowed, the action is recorded.
 * Returns `{ ok: true }` or `{ ok: false; retryAfter: number }` (seconds).
 */
export function tryConsumeSubmit(): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const s = readStore();
  s.submits = s.submits.filter(t => now - t < SUBMIT_WINDOW_MS);
  if (s.submits.length >= SUBMIT_LIMIT) {
    const oldest = s.submits[0];
    const retryAfter = Math.ceil((SUBMIT_WINDOW_MS - (now - oldest)) / 1000);
    writeStore(s);
    return { ok: false, retryAfter };
  }
  s.submits.push(now);
  writeStore(s);
  return { ok: true };
}

/** Same as tryConsumeSubmit, scoped to chat (10/min). */
export function tryConsumeChat(): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const s = readStore();
  s.chats = s.chats.filter(t => now - t < CHAT_WINDOW_MS);
  if (s.chats.length >= CHAT_LIMIT) {
    const oldest = s.chats[0];
    const retryAfter = Math.ceil((CHAT_WINDOW_MS - (now - oldest)) / 1000);
    writeStore(s);
    return { ok: false, retryAfter };
  }
  s.chats.push(now);
  writeStore(s);
  return { ok: true };
}

/** Letter-count check used for name/title fields ("Juan 1" is fine; "1 2" is not). */
export function hasLetter(s: string): boolean {
  return /[A-Za-zÀ-ɏ]/.test(s);
}
