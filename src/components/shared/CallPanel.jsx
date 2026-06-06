import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Phone, Mic } from 'lucide-react';

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
  // phase: idle | connecting | active | saving | done
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');

  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const streamRef   = useRef(null);
  const timerRef    = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const startCall = async () => {
    setError('');
    setPhase('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(1000);

      setPhase('active');
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      setError('Microphone permission denied. Please allow mic access.');
      setPhase('idle');
    }
  };

  const endCall = () => {
    clearInterval(timerRef.current);
    setPhase('saving');

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      streamRef.current?.getTracks().forEach(t => t.stop());
      setPhase('done');
      return;
    }

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const mime = recorder.mimeType || 'audio/webm';
      const ext  = mime.includes('ogg') ? 'ogg' : 'webm';
      const blob = new Blob(chunksRef.current, { type: mime });

      const form = new FormData();
      form.append('recording', blob, `call-${Date.now()}.${ext}`);
      form.append('leadId',    lead._id || lead.id);
      form.append('phone',     lead.phone || '');
      form.append('duration',  String(seconds));

      try {
        const token = localStorage.getItem('crm_token');
        const res = await fetch(`${BASE_URL}/recordings`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!res.ok) throw new Error();
        const saved = await res.json();
        onSaved?.(saved);
        setPhase('done');
      } catch {
        setError('Recording save failed. Please try again.');
        setPhase('active');
        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        recorderRef.current?.start(1000);
      }
    };

    recorder.stop();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-72 overflow-hidden">

        {/* Top gradient header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
            {lead.name?.charAt(0)?.toUpperCase()}
          </div>
          <p className="text-white font-bold text-base">{lead.name}</p>
          <p className="text-slate-400 text-sm mt-0.5">{lead.phone || 'No number'}</p>

          {phase === 'connecting' && <p className="text-yellow-400 text-xs mt-3 animate-pulse">Connecting mic...</p>}
          {phase === 'active'     && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-semibold tabular-nums">{fmt(seconds)}</span>
            </div>
          )}
          {phase === 'saving' && <p className="text-blue-400 text-xs mt-3 animate-pulse">Saving recording...</p>}
          {phase === 'done'   && <p className="text-green-400 text-xs mt-3 font-semibold">✓ Recording saved</p>}
        </div>

        {/* Recording locked banner */}
        {phase === 'active' && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <Mic size={11} className="text-red-500" />
            <span className="text-red-600 text-xs font-semibold">Recording — cannot be stopped</span>
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
                Call will be recorded automatically.<br />Recording cannot be stopped mid-call.
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
              <p className="text-gray-400 text-xs">End call to save recording</p>
              <button onClick={endCall}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95">
                <PhoneOff size={22} className="text-white" />
              </button>
            </>
          )}

          {(phase === 'connecting' || phase === 'saving') && (
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin my-2" />
          )}

          {phase === 'done' && (
            <button onClick={onClose}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
