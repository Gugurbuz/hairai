import React, { useState } from 'react';
import { Mail, Lock, Building2, Globe, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../router';

export const ClinicLogin: React.FC = () => {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: dbError } = await supabase
      .from('clinics')
      .select('id, name, email, status, credit_balance')
      .eq('email', email)
      .maybeSingle();

    setLoading(false);

    if (dbError || !data) {
      setError('Invalid credentials');
      return;
    }

    if (data.status !== 'verified') {
      setError('Your account is pending verification');
      return;
    }

    localStorage.setItem('clinic_user', JSON.stringify(data));
    navigate('clinic-dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Clinic Login</h1>
          <p className="text-slate-500 mt-2">Access your lead dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                placeholder="clinic@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Login <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('clinic-register')}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Don't have an account? Register here
          </button>
        </div>
      </div>
    </div>
  );
};

export const ClinicRegister: React.FC = () => {
  const { navigate } = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    country: '',
    phone: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: dbError } = await supabase.from('clinics').insert({
      name: formData.name,
      email: formData.email,
      password_hash: formData.password,
      country: formData.country,
      phone: formData.phone,
      website: formData.website,
      status: 'pending',
      credit_balance: 0,
      total_leads_purchased: 0,
      profile_image_url: null,
      description: null,
      specializations: [],
      verification_documents: {},
    });

    setLoading(false);

    if (dbError) {
      setError('Registration failed. Email might already exist.');
      return;
    }

    alert('Registration successful! Your account is pending verification.');
    navigate('clinic-login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Register Clinic</h1>
          <p className="text-slate-500 mt-2">Join our platform to receive leads</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 ml-1">Clinic Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none mt-1"
              placeholder="Hair Clinic Istanbul"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none mt-1"
              placeholder="contact@clinic.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none mt-1"
              placeholder="Create password"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 ml-1">Country</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none mt-1"
                placeholder="Turkey"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 ml-1">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none mt-1"
                placeholder="+90 555..."
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 ml-1">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none mt-1"
              placeholder="https://clinic.com"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Register <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('clinic-login')}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Already have an account? Login here
          </button>
        </div>
      </div>
    </div>
  );
};
