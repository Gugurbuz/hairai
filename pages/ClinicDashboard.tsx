import React, { useState, useEffect } from 'react';
import { Brain, CreditCard, LogOut, Users, TrendingUp, Lock, Mail, Phone, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../router';

interface ClinicUser {
  id: string;
  name: string;
  email: string;
  credit_balance: number;
}

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  age: number | null;
  temperature_score: number;
  status: string;
  locked_by_clinic_id: string | null;
  created_at: string;
  analysis_results?: {
    norwood_scale: string | null;
    estimated_grafts_min: number | null;
    estimated_grafts_max: number | null;
  }[];
  lead_images?: {
    angle: string;
    image_url: string;
  }[];
}

export const ClinicDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const [user, setUser] = useState<ClinicUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-leads'>('available');

  useEffect(() => {
    const storedUser = localStorage.getItem('clinic_user');
    if (!storedUser) {
      navigate('clinic-login');
      return;
    }
    setUser(JSON.parse(storedUser));
    loadLeads(JSON.parse(storedUser).id);
  }, []);

  const loadLeads = async (clinicId: string) => {
    setLoading(true);

    const { data: availableLeads } = await supabase
      .from('leads')
      .select(`
        *,
        analysis_results(*),
        lead_images(angle, image_url)
      `)
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: lockedLeads } = await supabase
      .from('leads')
      .select(`
        *,
        analysis_results(*),
        lead_images(angle, image_url)
      `)
      .eq('locked_by_clinic_id', clinicId)
      .order('locked_at', { ascending: false });

    setLeads(availableLeads || []);
    setMyLeads(lockedLeads || []);
    setLoading(false);
  };

  const unlockLead = async (leadId: string) => {
    if (!user) return;

    if (user.credit_balance < 50) {
      alert('Insufficient credits. Please purchase more credits.');
      return;
    }

    const { error } = await supabase
      .from('leads')
      .update({
        status: 'locked',
        locked_by_clinic_id: user.id,
        locked_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (!error) {
      await supabase.from('transactions').insert({
        clinic_id: user.id,
        type: 'lead_unlock',
        amount: -50,
        balance_after: user.credit_balance - 50,
        lead_id: leadId,
        stripe_payment_id: null,
        status: 'completed',
        metadata: {},
      });

      await supabase
        .from('clinics')
        .update({ credit_balance: user.credit_balance - 50 })
        .eq('id', user.id);

      const updatedUser = { ...user, credit_balance: user.credit_balance - 50 };
      setUser(updatedUser);
      localStorage.setItem('clinic_user', JSON.stringify(updatedUser));

      loadLeads(user.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clinic_user');
    navigate('clinic-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="text-blue-600" size={32} />
            <div>
              <h1 className="font-bold text-xl text-slate-900">{user?.name}</h1>
              <p className="text-sm text-slate-500">Clinic Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
              <CreditCard className="text-blue-600" size={18} />
              <span className="font-bold text-blue-900">{user?.credit_balance} Credits</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <LogOut className="text-slate-600" size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-blue-600" size={24} />
              <h3 className="font-semibold text-slate-700">Available Leads</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{leads.length}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="text-emerald-600" size={24} />
              <h3 className="font-semibold text-slate-700">My Leads</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{myLeads.length}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-orange-600" size={24} />
              <h3 className="font-semibold text-slate-700">Credits</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{user?.credit_balance}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b flex">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'available'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Available Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('my-leads')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'my-leads'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              My Leads ({myLeads.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'available' && (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            Score: {lead.temperature_score}
                          </span>
                          <span className="text-sm text-slate-500">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-500">Gender</p>
                            <p className="font-medium">{lead.gender || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Age</p>
                            <p className="font-medium">{lead.age || 'N/A'}</p>
                          </div>
                          {lead.analysis_results?.[0] && (
                            <>
                              <div>
                                <p className="text-sm text-slate-500">Norwood Scale</p>
                                <p className="font-medium">{lead.analysis_results[0].norwood_scale || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500">Est. Grafts</p>
                                <p className="font-medium">
                                  {lead.analysis_results[0].estimated_grafts_min || 0} - {lead.analysis_results[0].estimated_grafts_max || 0}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        {lead.lead_images && lead.lead_images.length > 0 && (
                          <div className="flex gap-2">
                            {lead.lead_images.slice(0, 3).map((img, idx) => (
                              <img
                                key={idx}
                                src={img.image_url}
                                alt={img.angle}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => unlockLead(lead.id)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Lock size={18} />
                        Unlock (50 credits)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'my-leads' && (
              <div className="space-y-4">
                {myLeads.map((lead) => (
                  <div key={lead.id} className="border border-emerald-200 bg-emerald-50 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Unlocked
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail size={14} /> Name
                            </p>
                            <p className="font-medium">{lead.full_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail size={14} /> Email
                            </p>
                            <p className="font-medium">{lead.email}</p>
                          </div>
                          {lead.phone && (
                            <div>
                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <Phone size={14} /> Phone
                              </p>
                              <p className="font-medium">{lead.phone}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-slate-500">Age / Gender</p>
                            <p className="font-medium">
                              {lead.age || 'N/A'} / {lead.gender || 'N/A'}
                            </p>
                          </div>
                        </div>
                        {lead.lead_images && lead.lead_images.length > 0 && (
                          <div className="flex gap-2">
                            {lead.lead_images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img.image_url}
                                alt={img.angle}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
