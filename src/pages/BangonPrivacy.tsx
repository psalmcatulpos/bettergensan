// /bangon-gensan/privacy — BangonGensan privacy & disclosure page.
//
// Standalone full-page (no PublicLayout) so it matches the BangonGensan
// dark aesthetic. Linked from the privacy-accept modal and the BangonGensan
// header.

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ShieldAlert, Heart, Users } from 'lucide-react';

export default function BangonPrivacy() {
  return (
    <>
      <Helmet>
        <title>Privacy & Disclosure — BangonGensan</title>
        <meta
          name="description"
          content="BangonGensan is a temporary community-led emergency response effort organised by 1Tahanan. Read about how your data is handled."
        />
      </Helmet>

      <main className="min-h-screen bg-[#0a0e14] text-gray-100">
        <header className="border-b border-[#1e2a3a] bg-[#0d1117]">
          <div className="mx-auto max-w-3xl px-5 py-4 flex items-center gap-3">
            <Link
              to="/bangon-gensan"
              className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              Back to BangonGensan
            </Link>
            <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/15 border border-red-500/40 text-red-200 text-[10px] font-bold uppercase tracking-widest">
              <Heart size={10} />
              1Tahanan-led
            </div>
          </div>
        </header>

        <article className="mx-auto max-w-3xl px-5 py-8 prose prose-invert prose-sm prose-headings:tracking-tight prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-red-300">
          <div className="not-prose mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-600/10 border border-red-500/30">
            <ShieldAlert className="text-red-300 shrink-0 mt-0.5" size={18} />
            <div>
              <div className="text-white font-bold uppercase tracking-widest text-xs">
                Read this before submitting anything
              </div>
              <p className="text-[13px] text-gray-300 leading-relaxed mt-1 mb-0">
                BangonGensan is a temporary, community-built emergency-response
                surface. It is <strong>not</strong> an official government
                channel. Your submissions are public unless explicitly stated
                otherwise.
              </p>
            </div>
          </div>

          <h1>BangonGensan Privacy &amp; Disclosure</h1>

          <h2>What BangonGensan is</h2>
          <p>
            BangonGensan is a temporary community-led movement organised by
            <strong> 1Tahanan</strong>, a volunteer civic-tech group, in
            response to a specific emergency affecting General Santos City and
            nearby barangays. It runs inside the BetterGensan platform but is
            distinct from any local-government service. There is no contract,
            paid relationship, or formal endorsement between BangonGensan and
            the City of General Santos or any other LGU.
          </p>
          <p>
            The surface is expected to be wound down once the active emergency
            it was built for has passed. Active submissions may be exported,
            archived, or deleted at that time.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Form submissions</strong> — relief requests, incident
              reports, fundraisers, offers — include the name, phone number,
              barangay, and any optional landmark or photo you provide.
            </li>
            <li>
              <strong>Fundraiser submissions</strong> additionally include the
              GCash / bank payment details you publish, and a link to the
              Facebook profile or post you nominate as your public identity.
            </li>
            <li>
              <strong>Chat messages</strong> on the left-side community board
              are stored with an auto-generated anonymous handle and a session
              identifier. We do not collect your name or email for chat.
            </li>
            <li>
              <strong>Photos</strong> attached to incident reports are stored
              in a public storage bucket. Don't attach anything you wouldn't
              post publicly.
            </li>
          </ul>

          <h2>What's public vs. private</h2>
          <p>
            Everything you submit through BangonGensan is <strong>public by
            default</strong>:
          </p>
          <ul>
            <li>
              Relief requests, incident reports, and offers appear on the
              public map and triage board for any visitor to see and act on.
            </li>
            <li>
              Approved fundraisers display the title, description, goal
              amount, payment details, contact name, contact number, and
              Facebook link to anyone viewing the page.
            </li>
            <li>
              Pending fundraisers are visible only to BangonGensan admins
              while under review.
            </li>
            <li>
              Anonymous community chat messages are visible to anyone with the
              page open.
            </li>
          </ul>
          <p>
            <strong>Do not submit information you don't want strangers,
            donors, or scrapers to see.</strong> If you need to reach
            BangonGensan privately, message 1Tahanan directly through their
            public channels.
          </p>

          <h2>How we use it</h2>
          <p>
            Submissions are used solely to coordinate emergency response —
            triaging relief, verifying incidents, vetting fundraisers, and
            connecting offers with needs. We do not sell or share submissions
            with marketers, political campaigns, or any commercial third
            party.
          </p>

          <h2>Verification &amp; admin review</h2>
          <p>
            Fundraisers require admin review before they're publicly listed.
            Approval requires that the contact name, the GCash / bank account
            name, and the Facebook identity all match. We reserve the right
            to reject any fundraiser without explanation.
          </p>
          <p>
            All admin actions (approve, reject, status change) are written to
            an immutable audit log retained for the lifetime of the
            BangonGensan surface.
          </p>

          <h2>Data retention</h2>
          <p>
            Submissions persist while BangonGensan is live. When the surface
            is wound down, 1Tahanan may export anonymised summaries (without
            personal contact details) for post-incident reporting, and will
            delete the raw submissions thereafter. Audit logs are retained as
            evidence of admin actions.
          </p>
          <p>
            To request deletion of a specific submission before then, reach
            out to 1Tahanan through their public channels.
          </p>

          <h2>What we can't promise</h2>
          <ul>
            <li>
              We can't guarantee that a relief request will be fulfilled —
              BangonGensan is a coordination surface, not a resource pool.
            </li>
            <li>
              We can't independently verify every photo, location, or
              donation account beyond the matching checks described above.
              Be skeptical and use the Facebook link as a sanity check before
              donating.
            </li>
            <li>
              We can't guarantee uptime. BangonGensan runs on volunteer
              effort.
            </li>
          </ul>

          <h2>Who's behind this</h2>
          <p className="flex items-center gap-2">
            <Users size={16} className="text-red-300" />
            <span>
              <strong>1Tahanan</strong> — community-led emergency response
              collective, working with the BetterGensan civic-tech project.
            </span>
          </p>

          <p className="not-prose mt-8">
            <Link
              to="/bangon-gensan"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold uppercase tracking-widest"
            >
              Continue to BangonGensan
            </Link>
          </p>
        </article>
      </main>
    </>
  );
}
