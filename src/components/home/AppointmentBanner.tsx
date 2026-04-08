import { Link } from 'react-router-dom';

const AppointmentBanner = () => {
  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          {/* Left — illustration */}
          <div className="flex-shrink-0">
            <img
              src="/hero-illustration.svg"
              alt="Appointment services illustration"
              className="mx-auto max-w-xs"
            />
          </div>

          {/* Right — content */}
          <div>
            <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl">
              Enhancing Appointment Services of General Santos City
              Mayor&apos;s Office
            </h2>
            <p className="mb-6 text-gray-600">
              No lines. No back-and-forth. Just efficient appointments.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/appointments"
                className="rounded-full bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700"
              >
                Schedule Appointment
              </Link>
              <Link
                to="/register"
                className="text-gray-600 transition hover:text-gray-900"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppointmentBanner;
