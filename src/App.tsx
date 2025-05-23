import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useReportStore } from './store/reportStore';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Homepage from './pages/Homepage';
import ReportForm from './pages/ReportForm';
import MapView from './pages/MapView';
import GalleryView from './pages/GalleryView';
import StatusTracker from './pages/StatusTracker';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/Login';
import NotFound from './pages/NotFound';

function App() {
  const { fetchReports } = useReportStore();

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/report" element={<ReportForm />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/gallery" element={<GalleryView />} />
            <Route path="/track" element={<StatusTracker />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
