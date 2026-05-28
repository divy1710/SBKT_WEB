import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Factory, Loader2, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (creds) => {
    setEmail(creds.email);
    setPassword(creds.pass);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Factory size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Shree Brahmnikrupa</h1>
            <p className="text-blue-300 text-sm">Textile ERP System</p>
          </div>
        </div>

        {/* Features */}
        <div className="relative">
          <h2 className="text-white text-3xl font-bold leading-tight mb-8">
            Complete Textile<br />
            <span className="text-blue-400">Business Management</span>
          </h2>
          <div className="space-y-4">
            {[
              { icon: '📦', label: 'Purchase & Inventory Management' },
              { icon: '👥', label: 'Employee & HR Management' },
              { icon: '💰', label: 'Salary & Payroll Processing' },
              { icon: '📊', label: 'Advanced Reports & Analytics' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 text-slate-300">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-slate-600 text-xs">
          © 2024 Shree Brahmnikrupa Textile. All rights reserved.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Factory size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">Shree Brahmnikrupa Textile</h1>
              <p className="text-slate-500 text-xs">ERP System</p>
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Sign in</h2>
              <p className="text-slate-500 text-sm mt-1">Enter your credentials to access the ERP</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input pl-10"
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input pl-10 pr-10"
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full justify-center py-3"
                id="login-submit"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Quick access credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-3">Quick Access (Demo Credentials)</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'Admin', email: 'admin@sbkt.com', pass: 'Admin@123' },
                  { role: 'Purchase', email: 'purchase@sbkt.com', pass: 'Password@123' },
                  { role: 'HR', email: 'hr@sbkt.com', pass: 'Password@123' },
                  { role: 'Accounts', email: 'accounts@sbkt.com', pass: 'Password@123' },
                ].map(c => (
                  <button
                    key={c.role}
                    type="button"
                    onClick={() => quickLogin(c)}
                    className="text-xs bg-white border border-blue-200 text-blue-700 rounded-lg px-3 py-1.5 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                  >
                    {c.role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
