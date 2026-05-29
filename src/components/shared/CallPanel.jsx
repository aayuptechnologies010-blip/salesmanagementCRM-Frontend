import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Clock } from 'lucide-react';
import { api } from '../../utils/api';

export default function CallPanel({ lead, onClose, onRecordingSaved }) {
  const [phase, setPhase] = useState('idle'); // idle | calling | connected | saving | done
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startCall = async () => {
    setError('');
    setPhase('calling');

    try {
      // Request mic — user cannot deny if they want to call
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start recording immediately — cannot be stopped by user
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000); // collect chunks every 1s
      setPhase('connected');

      // Start timer
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow mic permission.');
      setPhase('idle');
    }
  };

  const endCall = async () => {
    clearInterval(timerRef.current);
    setPhase('saving');

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      streamRef.current?.getTracks().forEach(t => t.stop());
      setPhase('done');
      return;
    }

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach(t => t.stop());

      const mimeType = recorder.mimeType || 'audio/webm';
      const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });

      const formData = new FormData();
      formData.append('recording', blob, `call-${Date.now()}.${ext}`);
      formData.append('leadId', lead._id || lead.id);
      formData.append('phone', lead.phone || '');
      formData.append('duration', String(duration));

      try {
        // Use fetch directly since api util sets Content-Type to json
        const token = localStorage.getItem('crm_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5009/api';
        const res = await fetch(`${baseUrl}/recordings`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const saved = await res.json();
        onRecordingSaved?.(saved);
        setPhase('done');
      } catch (err) {
        setError('Recording save failed. Please try again.');
        setPhase('connected');
      }
    };

    recorder.stop();
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-80 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">{lead.name?.charAt(0)}</span>
          </div>
          <h2 className="text-white font-bold text-lg">{lead.name}</h2>
          <p className="text-gray-400 text-sm mt-0.5">{lead.phone || 'No number'}</p>

          {phase === 'connected' && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-semibold">{formatTime(duration)}</span>
            </div>
          )}
          {phase === 'calling' && (
            <p className="text-yellow-400 text-sm mt-3 animate-pulse">Connecting...</p>
          )}
          {phase === 'saving' && (
            <p className="text-blue-400 text-sm mt-3 animate-pulse">Saving recording...</p>
          )}
          {phase === 'done' && (
            <p className="text-green-400 text-sm mt-3">✓ Recording saved</p>
          )}
        </div>

        {/* Recording indicator — always visible when connected */}
        {phase === 'connected' && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-600 text-xs font-semibold">Recording in progress — cannot be stopped</span>
            <Mic size={12} className="text-red-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 px-4 py-2 text-center">
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          {phase === 'idle' && (
            <>
              <p className="text-gray-500 text-sm text-center">
                Call will be recorded automatically.<br />Recording cannot be stopped mid-call.
              </p>
              <button
                onClick={startCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
              >
                <Phone size={26} className="text-white" />
              </button>
              <button onClick={onClose} className="text-gray-400 text-sm hover:text-gray-600">Cancel</button>
            </>
          )}

          {phase === 'connected' && (
            <>
              <p className="text-gray-500 text-xs text-center">End the call to save the recording</p>
              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
              >
                <PhoneOff size={26} className="text-white" />
              </button>
            </>
          )}

          {phase === 'done' && (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all"
            >
              Close
            </button>
          )}

          {(phase === 'calling' || phase === 'saving') && (
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}
