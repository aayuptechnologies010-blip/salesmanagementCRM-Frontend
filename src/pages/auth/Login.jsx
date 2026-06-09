import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Download, Smartphone } from 'lucide-react';
import { Input, PrimaryButton } from '../../components/shared/FormElements';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/shared/Modal';
import socket from '../../utils/socket';

const OLD_KEYS = ['crm_leads', 'crm_followups', 'crm_activities', 'crm_seeded', 'crm_migrated_v2', 'crm_migrated_v3'];
if (!localStorage.getItem('crm_cleaned_v1')) {
  OLD_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.setItem('crm_cleaned_v1', '1');
}

export default function Login() {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [pendingCreds, setPendingCreds] = useState(null);
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const showInstallBtn = isInstallable || (isMobile && !isStandalone);

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'session_expired') {
      setError('Aapka session kisi aur device pe login hone ke karan band ho gaya.');
    }
  }, [currentUser, navigate]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setIsInstallable(true); };
    window.addEventListener('beforeinstallprompt', handler);
    if (isStandalone) setIsInstallable(false);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Socket: Device B listens for approve/reject
  useEffect(() => {
    const onApproved = async () => {
      setWaitingApproval(false);
      if (!pendingCreds) return;
      const result = await login(pendingCreds.email, pendingCreds.password);
      setPendingCreds(null);
      if (result.success) navigate('/dashboard');
      else setError(result.message || 'Login failed.');
    };

    const onRejected = () => {
      setWaitingApproval(false);
      setPendingCreds(null);
      setError('Login request doosre device se reject kar diya gaya.');
    };

    socket.on('login_approved', onApproved);
    socket.on('login_rejected', onRejected);

    return () => {
      socket.off('login_approved', onApproved);
      socket.off('login_rejected', onRejected);
    };
  }, [pendingCreds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // First verify credentials with backend
    const result = await login(form.email, form.password, true); // dryRun
    if (!result.credValid) {
      setError(result.message || 'Invalid email or password.');
      return;
    }
    // Credentials valid — connect socket first, then emit after connection
    const emitRequest = () => {
      socket.emit('request_login', { email: form.email, requestSocketId: socket.id });
    };
    if (socket.connected) {
      emitRequest();
    } else {
      socket.once('connect', emitRequest);
      socket.connect();
    }
    setPendingCreds({ email: form.email, password: form.password });
    setWaitingApproval(true);
  };

  const cancelWaiting = () => {
    setWaitingApproval(false);
    setPendingCreds(null);
    setError('');
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      setShowIosGuide(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes cube-rotate {
          0%, 20% { transform: rotateX(0deg); }
          25%, 45% { transform: rotateX(90deg); }
          50%, 70% { transform: rotateX(180deg); }
          75%, 95% { transform: rotateX(270deg); }
          100% { transform: rotateX(360deg); }
        }
        .login-cube-container { perspective: 1000px; width: 180px; height: 60px; }
        .login-cube { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; animation: cube-rotate 8s infinite cubic-bezier(0.645, 0.045, 0.355, 1); }
        .login-cube-face { position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; backface-visibility: hidden; }
        .login-cube-front  { transform: rotateX(0deg) translateZ(30px); }
        .login-cube-bottom { transform: rotateX(-90deg) translateZ(30px); }
        .login-cube-back   { transform: rotateX(-180deg) translateZ(30px); }
        .login-cube-top    { transform: rotateX(-270deg) translateZ(30px); }
      `}</style>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="login-cube-container">
            <div className="login-cube">
              <div className="login-cube-face login-cube-front">
                <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
              </div>
              <div className="login-cube-face login-cube-bottom">
                <span className="font-extrabold text-2xl tracking-widest uppercase bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">SALES CRM</span>
              </div>
              <div className="login-cube-face login-cube-back">
                <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
              </div>
              <div className="login-cube-face login-cube-top">
                <span className="font-extrabold text-2xl tracking-widest uppercase bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">SALES CRM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
          </div>

          {/* Waiting for approval UI */}
          {waitingApproval ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-14 h-14 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <p className="text-sm font-semibold text-gray-800">Login approval ka wait kar rahe hain...</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  <strong>{pendingCreds?.email}</strong> pehle se kisi aur device pe logged in hai.<br />
                  Us device pe ek notification bheja gaya hai — wahan se confirm karo.
                </p>
              </div>
              <button onClick={cancelWaiting}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email Address" type="email" placeholder="Enter your email address"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }}
                required />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} placeholder="Enter your password"
                    value={form.password}
                    onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
                    className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all pr-10"
                    required />
                  <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-500 focus:ring-blue-200" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">{error}</p>
              )}

              <PrimaryButton type="submit" className="w-full justify-center">Sign In</PrimaryButton>
            </form>
          )}

          {showInstallBtn && !waitingApproval && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <button type="button" onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 py-3 text-sm font-semibold shadow-md transition-all">
                <Download size={16} /> Download CRM App
              </button>
              <p className="text-center text-[11px] text-gray-400 mt-2">
                Install as a mobile app for offline access and faster loading.
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showIosGuide} onClose={() => setShowIosGuide(false)} title="Install CRM Web App" size="sm">
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-blue-700">
            <Smartphone className="flex-shrink-0" size={20} />
            <p className="text-sm font-medium text-left">Follow these simple steps to install the app on your iPhone/Safari:</p>
          </div>
          <ol className="space-y-3.5 text-sm text-gray-600 pl-2 text-left">
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center bg-blue-100 text-blue-600 font-bold rounded-full w-5 h-5 text-xs mt-0.5 flex-shrink-0">1</span>
              <span>Safari browser में नीचे की तरफ <strong>Share 📤</strong> बटन पर टैप करें।</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center bg-blue-100 text-blue-600 font-bold rounded-full w-5 h-5 text-xs mt-0.5 flex-shrink-0">2</span>
              <span><strong>"Add to Home Screen"</strong> पर क्लिक करें।</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center bg-blue-100 text-blue-600 font-bold rounded-full w-5 h-5 text-xs mt-0.5 flex-shrink-0">3</span>
              <span>ऊपर दाईं ओर <strong>"Add"</strong> पर टैप करें।</span>
            </li>
          </ol>
          <button onClick={() => setShowIosGuide(false)}
            className="w-full justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl text-sm transition-colors">
            Okay, Got it!
          </button>
        </div>
      </Modal>
    </div>
  );
}
