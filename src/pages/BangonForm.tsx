// /bangongensan/form (also /bangon-gensan/form) — standalone full-screen
// version of the multi-concern submission form. Same logic as the in-page
// Controls panel via the shared <ControlsForm /> component.

import { Helmet } from 'react-helmet-async';
import PrivacyGate from '../components/bangon/PrivacyGate';
import ControlsForm from '../components/bangon/ControlsForm';

export default function BangonForm() {
  return (
    <>
      <PrivacyGate />
      <Helmet>
        <title>Submit — BangonGensan</title>
        <meta name="description" content="Request help, report an incident, launch a fundraiser, or offer help. BangonGensan emergency response." />
      </Helmet>
      <ControlsForm fullScreen />
    </>
  );
}
