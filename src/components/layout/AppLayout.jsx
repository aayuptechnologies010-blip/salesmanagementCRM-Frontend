import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/leads': 'Lead Management',
  '/leads/': 'Lead Details',
  '/assign': 'Assign Leads',
  '/followups': 'Follow-up Management',
  '/team': 'Team Members',
  '/pipeline': 'Lead Pipeline',
  '/calendar': 'Calendar & Meetings',
  '/invoices': 'Invoices & Quotations',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { pathname } = useLocation();
  const title = Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1] || 'LeadFlow CRM';

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 450); // 450ms smooth transition loader
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} pageTitle={title} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto relative min-h-[calc(100vh-4rem)]">
          {loading && (
            <div className="fixed inset-0 lg:left-64 bg-[#f4fafc]/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent shadow-inner"></div>
              <p className="mt-4 text-sm text-gray-500 font-medium tracking-wide">Initializing...</p>
            </div>
          )}
          <div className={loading ? 'invisible opacity-0' : 'opacity-100 transition-opacity duration-300'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
