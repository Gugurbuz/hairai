import React from 'react';
import { RouterProvider, Route, useRouter } from './router';
import App from './App';
import { ClinicLogin, ClinicRegister } from './pages/ClinicAuth';
import { ClinicDashboard } from './pages/ClinicDashboard';
import { Brain } from 'lucide-react';

const AppNavigator: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-12 text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="text-blue-600" size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            Hair<span className="text-blue-600">AI</span>
          </h1>
          <p className="text-slate-500 mb-10">
            Advanced Hair Analysis Platform
          </p>

          <div className="space-y-4">
            <button
              onClick={() => navigate('patient')}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              Patient Analysis
            </button>

            <button
              onClick={() => navigate('clinic-login')}
              className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition-all"
            >
              Clinic Portal
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-8">
            AI-Powered Hair Transplant Lead Platform
          </p>
        </div>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  return (
    <RouterProvider>
      <Route path="patient" component={App} />
      <Route path="clinic-login" component={ClinicLogin} />
      <Route path="clinic-register" component={ClinicRegister} />
      <Route path="clinic-dashboard" component={ClinicDashboard} />
      <AppNavigator />
    </RouterProvider>
  );
};

export default MainApp;
