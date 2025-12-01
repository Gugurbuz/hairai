
import React, { useState, useEffect } from 'react';
import { Brain, ChevronRight, ScanFace, CheckCircle, Download, Home, User, Mail, Phone, Calendar, Lock, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { SmartCamera } from './components/SmartCamera';
import { LeadData, ViewState } from './types';

const Header: React.FC<{ currentView: ViewState; setView: (v: ViewState) => void }> = ({ currentView, setView }) => (
  <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50 h-16 flex items-center">
    <div className="container mx-auto flex justify-between items-center">
      <div 
        className="flex items-center gap-2 font-bold text-xl cursor-pointer select-none" 
        onClick={() => setView('landing')}
      >
        <Brain className="text-emerald-400" />
        <span>Hair<span className="text-emerald-400">AI</span></span>
      </div>
      {currentView !== 'landing' && (
        <button 
            onClick={() => setView('landing')}
            className="p-2 text-slate-400 hover:text-white transition-colors"
        >
            <Home size={20} />
        </button>
      )}
    </div>
  </header>
);

const LandingView: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 text-center bg-white">
        <div className="bg-emerald-100 p-8 rounded-full mb-8 animate-bounce-slight shadow-xl">
            <ScanFace size={64} className="text-emerald-600" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Smart Hair Analysis</h1>
        <p className="text-slate-500 mb-10 max-w-sm text-lg leading-relaxed">
            Clinical-grade hair assessment powered by Artificial Intelligence. 
        </p>
        
        <button 
            onClick={onStart} 
            className="group bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-300/50 flex items-center gap-3 hover:bg-blue-700 transition-all active:scale-95 w-full max-w-xs justify-center"
        >
            Start Scan <ChevronRight className="group-hover:translate-x-1 transition-transform" />
        </button>
    </div>
);

const GenderSelectView: React.FC<{ onSelect: (gender: 'male' | 'female') => void }> = ({ onSelect }) => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-white animate-fade-in">
     <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">What <span className="text-blue-600">gender</span> do you identify with?</h2>
     <p className="text-slate-500 mb-10 text-center max-w-md">Hormones have a big impact on how your hair looks and feels at every age.</p>

     <div className="w-full max-w-md space-y-4">
        <button 
          onClick={() => onSelect('male')}
          className="w-full p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 group text-left"
        >
           <span className="text-4xl">👨</span>
           <div>
             <div className="font-bold text-slate-900 group-hover:text-blue-700 text-lg">I am a male</div>
           </div>
        </button>

        <button 
          onClick={() => onSelect('female')}
          className="w-full p-6 rounded-2xl border-2 border-slate-100 hover:border-pink-500 hover:bg-pink-50 transition-all flex items-center gap-4 group text-left"
        >
           <span className="text-4xl">👩</span>
           <div>
             <div className="font-bold text-slate-900 group-hover:text-pink-700 text-lg">I am a female</div>
           </div>
        </button>
     </div>
  </div>
);

const InstructionsView: React.FC<{ onReady: () => void }> = ({ onReady }) => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-white animate-fade-in">
      <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-6 relative">
         <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
         <ScanFace size={48} className="text-blue-600 relative z-10" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-8">Before we start...</h2>

      <div className="space-y-4 w-full max-w-md mb-10">
         <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 border border-slate-100">
            <div className="bg-white p-2 rounded-lg shadow-sm"><ScanFace size={24} className="text-slate-700"/></div>
            <div className="text-sm font-medium text-slate-700">No need to tap, it's an automatic scan</div>
         </div>
         <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 border border-slate-100">
            <div className="bg-white p-2 rounded-lg shadow-sm"><Zap size={24} className="text-slate-700"/></div>
            <div className="text-sm font-medium text-slate-700">Make sure you are in a well-lit area</div>
         </div>
         <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 border border-slate-100">
            <div className="bg-white p-2 rounded-lg shadow-sm"><User size={24} className="text-slate-700"/></div>
            <div className="text-sm font-medium text-slate-700">Pull your hair back to fully reveal your hairline</div>
         </div>
      </div>

      <button 
        onClick={onReady}
        className="bg-blue-600 text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-transform active:scale-95"
      >
        I'm ready
      </button>
  </div>
);

const AnalysisView: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); 
          return 100;
        }
        return prev + 1;
      });
    }, 40); // 4 seconds total
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 bg-white text-center animate-fade-in">
       <div className="relative w-48 h-48 flex items-center justify-center mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" r="88" stroke="#f1f5f9" strokeWidth="12" fill="none" />
            <circle 
              cx="96" cy="96" r="88" 
              stroke="#2563eb" 
              strokeWidth="12" 
              fill="none" 
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-5xl font-bold text-blue-600">{progress}%</span>
          </div>
       </div>

       <h2 className="text-2xl font-bold text-slate-900 mb-8">Analyzing your scans</h2>

       <div className="space-y-3 w-full max-w-xs text-left">
          <div className={`flex items-center gap-3 transition-opacity duration-500 ${progress > 20 ? 'opacity-100' : 'opacity-30'}`}>
             <div className="bg-blue-100 p-1 rounded-full"><CheckCircle size={16} className="text-blue-600"/></div>
             <span className="font-medium text-slate-700">Counting your hair</span>
          </div>
          <div className={`flex items-center gap-3 transition-opacity duration-500 ${progress > 50 ? 'opacity-100' : 'opacity-30'}`}>
             <div className="bg-blue-100 p-1 rounded-full"><CheckCircle size={16} className="text-blue-600"/></div>
             <span className="font-medium text-slate-700">Identifying hair type</span>
          </div>
          <div className={`flex items-center gap-3 transition-opacity duration-500 ${progress > 80 ? 'opacity-100' : 'opacity-30'}`}>
             <div className="bg-blue-100 p-1 rounded-full"><CheckCircle size={16} className="text-blue-600"/></div>
             <span className="font-medium text-slate-700">Calculating hair score</span>
          </div>
       </div>
    </div>
  );
};

const LeadForm: React.FC<{ onSubmit: (data: LeadData) => void, initialGender: string, images: Record<string, string> }> = ({ onSubmit, initialGender, images }) => {
  const [formData, setFormData] = useState<LeadData>({
    fullName: '',
    email: '',
    phone: '',
    gender: initialGender as any || 'male',
    age: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { createLead } = await import('./lib/leadService');
      const result = await createLead({
        leadData: formData,
        images: images,
        analysisData: {
          temperature_score: 75,
          norwood_scale: '3',
          estimated_grafts_min: 2000,
          estimated_grafts_max: 3000,
        }
      });

      if (result.success) {
        onSubmit(formData);
      } else {
        setError('Failed to submit. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-6 text-white text-center relative overflow-hidden">
           <div className="relative z-10">
             <h2 className="text-2xl font-bold">Analysis Complete</h2>
             <p className="text-slate-400 text-sm mt-1">Get your personalized hair report.</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
           <div className="space-y-1">
             <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
             <input required type="text" placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-sm font-semibold text-slate-700 ml-1">Age</label>
               <input required type="number" placeholder="30"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                  value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
             </div>
             <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Gender</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                  value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
             </div>
           </div>
           <div className="space-y-1">
             <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
             <input required type="email" placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
           </div>

           {error && (
             <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center">
               {error}
             </div>
           )}

           <button type="submit" disabled={isSubmitting}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg mt-4 hover:bg-blue-700 flex justify-center items-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin"/> : <>View Report <ArrowRight size={18}/></>}
           </button>
        </form>
      </div>
    </div>
  );
}

const ReportView: React.FC<{ images: Record<string, string>, leadData: LeadData | null }> = ({ images, leadData }) => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-slate-50">
    <div className="bg-white p-8 rounded-3xl shadow-xl text-center w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 p-4 rounded-full"><CheckCircle size={48} className="text-emerald-500" /></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Thank you, {leadData?.fullName.split(' ')[0]}</h2>
        <p className="text-slate-500 mb-8">Your clinical profile and {Object.keys(images).length} photos have been received.</p>
        <button className="w-full bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg mb-2 flex items-center justify-center gap-2">
            <Download size={18} /> Download Summary
        </button>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<Record<string, string>>({});
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  const handleGenderSelect = (g: 'male' | 'female') => {
    setGender(g);
    setView('instructions');
  };

  const handleInstructionsReady = () => {
    setStep(0);
    setImages({});
    setView('camera');
  };

  return (
    <div className="font-sans text-slate-800 bg-white min-h-screen">
      <Header currentView={view} setView={setView} />
      <main>
        {view === 'landing' && <LandingView onStart={() => setView('gender-select')} />}
        {view === 'gender-select' && <GenderSelectView onSelect={handleGenderSelect} />}
        {view === 'instructions' && <InstructionsView onReady={handleInstructionsReady} />}
        {view === 'camera' && (
          <SmartCamera 
            step={step} 
            setStep={setStep} 
            images={images} 
            setImages={setImages} 
            onAnalyze={() => setView('analysis')} 
          />
        )}
        {view === 'analysis' && <AnalysisView onComplete={() => setView('lead-form')} />}
        {view === 'lead-form' && <LeadForm onSubmit={(data) => { setLeadData(data); setView('report'); }} initialGender={gender} images={images} />}
        {view === 'report' && <ReportView images={images} leadData={leadData} />}
      </main>
    </div>
  );
}
