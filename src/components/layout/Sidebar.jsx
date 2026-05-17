import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, CalendarClock, BarChart3, Settings, X, UsersRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/assign', icon: UserCheck, label: 'Assign Leads' },
  { to: '/followups', icon: CalendarClock, label: 'Follow-ups' },
  { to: '/team', icon: UsersRound, label: 'Team Members' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function AnimatedSubtitle() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const initial = setTimeout(() => setShow(true), 2000);
    const interval = setInterval(() => setShow(s => !s), 2000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);

  return (
    <div className="h-5 overflow-hidden">
      <span
        className={`block text-xs font-bold tracking-[0.2em] uppercase transition-all duration-500
          ${show ? 'text-blue-500 translate-y-0 opacity-100' : 'text-transparent translate-y-2 opacity-0'}`}
      >
        SALES CRM
      </span>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const { currentUser } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="ml-4 w-[150px] rounded-xl object-contain"
            />
            <AnimatedSubtitle />
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-blue-500' : 'text-gray-400'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser?.avatar || 'SA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{currentUser?.name || 'Super Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser?.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
