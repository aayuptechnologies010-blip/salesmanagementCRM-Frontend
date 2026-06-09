import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import socket from './utils/socket';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetails from './pages/LeadDetails';
import AssignLeads from './pages/AssignLeads';
import FollowUps from './pages/FollowUps';
import Team from './pages/Team';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Pipeline from './pages/Pipeline';
import Calendar from './pages/Calendar';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';

function LoginApprovalNotification() {
  const { currentUser } = useAuth();
  const [request, setRequest] = useState(null); // { email, requestSocketId }

  useEffect(() => {
    if (!currentUser) return;

    const registerSocket = () => socket.emit('register', currentUser.email);

    socket.connect();
    registerSocket();
    socket.on('connect', registerSocket); // re-register on reconnect

    const onLoginRequest = ({ email, requestSocketId }) => {
      setRequest({ email, requestSocketId });
    };
    socket.on('login_request', onLoginRequest);

    return () => {
      socket.off('connect', registerSocket);
      socket.off('login_request', onLoginRequest);
    };
  }, [currentUser]);

  if (!request) return null;

  const approve = () => {
    socket.emit('login_approve', { email: request.email, requestSocketId: request.requestSocketId });
    setRequest(null);
  };
  const reject = () => {
    socket.emit('login_reject', { email: request.email, requestSocketId: request.requestSocketId });
    setRequest(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-lg">🔐</div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Naya Login Request</p>
            <p className="text-xs text-gray-400">Kisi ne login karne ki koshish ki</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-semibold text-gray-800">{request.email}</span> account pe
          ek naye device se login request aayi hai.
        </p>
        <p className="text-xs text-gray-400 mb-5">Kya aap is login ko allow karna chahte hain?</p>
        <div className="flex gap-3">
          <button onClick={reject}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">
            Reject ✗
          </button>
          <button onClick={approve}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
            Allow ✓
          </button>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected App */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/assign" element={<AssignLeads />} />
          <Route path="/followups" element={<FollowUps />} />
          <Route path="/team" element={<Team />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <LoginApprovalNotification />
    </BrowserRouter>
  );
}
