import { useState, type FormEvent } from 'react';
import { CheckCircle, ExternalLink, KeyRound, AlertCircle } from 'lucide-react';
import { Card, PageHeader } from '../../components/admin/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const ChangePasswordCard = () => {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<
    { tone: 'success' | 'error'; text: string } | null
  >(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({
        tone: 'error',
        text: 'Password must be at least 8 characters.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ tone: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setMessage({ tone: 'success', text: 'Password updated.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({
        tone: 'error',
        text:
          err instanceof Error ? err.message : 'Failed to update password.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="Change password">
      <form onSubmit={onSubmit} className="space-y-3 p-4 text-sm">
        <p className="text-xs text-gray-500">
          Updates the password for your signed-in account
          {user?.email ? (
            <>
              {' '}
              (<span className="font-medium text-gray-700">{user.email}</span>)
            </>
          ) : null}
          . You stay signed in.
        </p>

        <div>
          <label
            htmlFor="new-password"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {message && (
          <div
            className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
              message.tone === 'success'
                ? 'border-success-200 bg-success-50 text-success-800'
                : 'border-error-200 bg-error-50 text-error-800'
            }`}
          >
            {message.tone === 'success' ? (
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </Card>
  );
};

const Settings = () => {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Project-level configuration and useful links"
      />

      <div className="mb-4">
        <ChangePasswordCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Project">
          <dl className="text-sm divide-y divide-gray-100">
            <div className="flex gap-3 px-4 py-2">
              <dt className="text-xs text-gray-500 w-32 shrink-0">Name</dt>
              <dd className="text-gray-800">BetterGensan</dd>
            </div>
            <div className="flex gap-3 px-4 py-2">
              <dt className="text-xs text-gray-500 w-32 shrink-0">Target</dt>
              <dd className="text-gray-800">General Santos City, Philippines</dd>
            </div>
            <div className="flex gap-3 px-4 py-2">
              <dt className="text-xs text-gray-500 w-32 shrink-0">
                Admin contact
              </dt>
              <dd className="text-gray-800">info@gensantos.gov.ph</dd>
            </div>
          </dl>
        </Card>

        <Card title="Links">
          <ul className="text-sm divide-y divide-gray-100">
            {[
              {
                label: 'Supabase project',
                href: 'https://supabase.com/dashboard/project/oxqwjbvxkbvbrxhjnjfd',
              },
              {
                label: 'Edge function logs — jobs-refresh',
                href: 'https://supabase.com/dashboard/project/oxqwjbvxkbvbrxhjnjfd/functions/jobs-refresh/logs',
              },
              {
                label: 'Public site',
                href: '/',
              },
            ].map(l => (
              <li key={l.label} className="px-4 py-2">
                <a
                  href={l.href}
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                  {l.label}
                  {l.href.startsWith('http') && (
                    <ExternalLink className="w-3 h-3" />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="How to promote an admin">
        <div className="p-4 text-sm text-gray-700 space-y-2">
          <p>
            New users sign up at{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">/admin/login</code>
            . By default they are non-admin. A site admin must flip the flag:
          </p>
          <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto">
{`update profiles
  set is_admin = true
  where email = 'someone@example.com';`}
          </pre>
          <p className="text-xs text-gray-500">
            Every admin table is protected by RLS that calls{' '}
            <code>public.is_admin()</code>. Flipping the flag is all that's
            needed.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
