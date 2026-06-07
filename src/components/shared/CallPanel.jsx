import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Phone } from 'lucide-react';

const BASE_URL = (() => {
  if (typeof window === 'undefined') return 'http://localhost:5009/api';
  if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const h = window.location.hostname;
  if (h.includes('salesmanagementcrm-frontend.onrender.com')) return 'https://salesmanagementcrm-backend.onrender.com/api';
  if (h.includes('-frontend.')) return `https://${h.replace('-frontend.', '-backend.')}/api`;
  return 'http://localhost:5009/api';
})();

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function CallPanel({ lead, onClose, onSaved }) {
  // phase: idle | calling_agent | active | done
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
  }, []);

  const startCall = async () => {
    setError('');
    setPhase('calling_agent');
    try {
      const token = localStorage.getItem('crm_token');
      const res = await fetch(`${BASE_URL}/calls/make-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leadId: lead._id || lead.id,
          phone: lead.phone || ''
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to initiate call');
      }

      setPhase('active');
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (err) {
      setError(err.message || 'Failed to connect to Twilio.');
      setPhase('idle');
    }
  };

  const endCall = () => {
    clearInterval(timerRef.current);
    setPhase('done');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-80 overflow-hidden">

        {/* Top gradient header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
            {lead.name?.charAt(0)?.toUpperCase()}
          </div>
          <p className="text-white font-bold text-base">{lead.name}</p>
          <p className="text-slate-400 text-sm mt-0.5">{lead.phone || 'No number'}</p>

          {phase === 'calling_agent' && <p className="text-yellow-400 text-xs mt-3 animate-pulse">Dialing your phone...</p>}
          {phase === 'active' && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-semibold tabular-nums">{fmt(seconds)}</span>
            </div>
          )}
          {phase === 'done' && <p className="text-green-400 text-xs mt-3 font-semibold">✓ Call finished (Recording processing...)</p>}
        </div>

        {/* Helper Banner */}
        {phase === 'calling_agent' && (
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-center gap-1.5">
            <span className="text-blue-600 text-xs font-semibold text-center">
              Your phone will ring shortly. Answer it to call the lead!
            </span>
          </div>
        )}
        {phase === 'active' && (
          <div className="bg-green-50 border-b border-green-100 px-4 py-2 flex items-center justify-center gap-1.5">
            <span className="text-green-600 text-xs font-semibold text-center">
              Call is automatically recorded on the server.
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 px-4 py-2 text-center">
            <p className="text-red-500 text-xs">{error}</p>
          </div>
        )}

        {/* Action area */}
        <div className="px-6 py-6 flex flex-col items-center gap-3">
          {phase === 'idle' && (
            <>
              <p className="text-gray-400 text-xs text-center leading-relaxed">
                Call will connect through Twilio and be recorded on the server automatically.
              </p>
              <button onClick={startCall}
                className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95">
                <Phone size={22} className="text-white" />
              </button>
              <button onClick={onClose} className="text-gray-400 text-xs hover:text-gray-600 transition-colors">Cancel</button>
            </>
          )}

          {phase === 'active' && (
            <>
              <p className="text-gray-400 text-xs">Hang up phone or click below when done</p>
              <button onClick={endCall}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95">
                <PhoneOff size={22} className="text-white" />
              </button>
            </>
          )}

          {phase === 'calling_agent' && (
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin my-2" />
          )}

          {phase === 'done' && (
            <button onClick={() => { onSaved?.(); onClose(); }}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all">
              Close Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
