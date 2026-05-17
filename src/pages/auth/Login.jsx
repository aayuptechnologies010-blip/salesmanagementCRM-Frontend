import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Input, PrimaryButton } from '../../components/shared/FormElements';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(form.email, form.password);
    if (result.success) {
      setError('');
      navigate('/dashboard');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-800">LeadFlow</span>
          <span className="text-sm bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg font-medium">CRM</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              value={form.email}
              onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }}
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
                  className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all pr-10"
                  required
                />
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
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                {error}
              </p>
            )}

            <PrimaryButton type="submit" className="w-full justify-center">Sign In</PrimaryButton>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-2">Super Admin credentials</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs text-gray-500">📧 <span className="font-medium text-gray-700">aayup@gmail.com</span></p>
              <p className="text-xs text-gray-500">🔒 <span className="font-medium text-gray-700">aayup2025</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
