import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import socket from './utils/socket';
import { api } from './utils/api';
import { onMessageListener } from './utils/firebase';
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

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Connect socket for real-time events
    if (!socket.connected) socket.connect();
    socket.emit('register', currentUser.email);

    // Sync FCM token with backend
    const savedToken = localStorage.getItem('fcm_token');
    if (savedToken) {
      api.patch('/auth/fcm-token', { token: savedToken }).catch(() => {});
    }

    // Live Lead Assignment Notification Event
    const handleLeadAssigned = (data) => {
      // Check if this notification is for the current logged-in user or an Admin
      const isTargetUser = currentUser.name === data.assignedTo || currentUser.email === data.assignedTo;
      const isAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';

      if (isTargetUser) {
        const title = `🎯 Nayi Lead Assign Huyi! (${data.count} Leads)`;
        const body = `${data.assignedBy} ne aapko ${data.count} naye lead(s) assign kiye hain: ${data.leadNames?.join(', ')}`;

        // Native Browser / Desktop Push Notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: '/logo.png',
              badge: '/logo.png',
              tag: 'lead-assignment',
            });
          } catch (e) {
            console.error('Error displaying notification:', e);
          }
        }
      }
    };

    socket.on('lead_assigned', handleLeadAssigned);

    // FCM foreground push listener
    let unsubscribeFCM = () => {};
    onMessageListener((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'CRM Notification';
      const body = payload.notification?.body || payload.data?.body || 'New CRM update';
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
        });
      }
    }).then(unsub => {
      if (typeof unsub === 'function') unsubscribeFCM = unsub;
    });

    return () => {
      socket.off('lead_assigned', handleLeadAssigned);
      unsubscribeFCM();
    };
  }, [currentUser]);

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
    </BrowserRouter>
  );
}
