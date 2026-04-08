import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import InfoBar from '../home/InfoBar';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <InfoBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
