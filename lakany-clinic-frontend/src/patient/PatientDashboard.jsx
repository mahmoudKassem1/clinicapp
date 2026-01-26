import React, { useContext, useState } from 'react';
import { CalendarDays, History, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from './LanguageContext';

const getInitialName = () => {
  const userData = localStorage.getItem('user') || localStorage.getItem('userData');
  if (userData) {
    const user = JSON.parse(userData);
    return user.username || 'Patient';
  }
  return 'Patient';
};

const PatientDashboard = () => {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [patientName] = useState(getInitialName);

  const text = {
    en: {
      overview: 'Overview',
      bookAppointment: 'Book Appointment',
      medicalRecords: 'Medical Records',
      about: 'About',
      aboutDesc: 'Learn more about Dr. Lakany',
      welcome: `Welcome, ${patientName}`,
    },
    ar: {
      overview: 'نظرة عامة',
      bookAppointment: 'حجز موعد',
      medicalRecords: 'السجلات الطبية',
      about: 'عن العيادة',
      aboutDesc: 'تعرف أكثر على د. الأكاني',
      welcome: `مرحبًا بك، ${patientName}`,
    },
  };

  const t = text[language];
  const isArabic = language === 'ar';

  return (
    <div className={`space-y-6 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white shadow-md">
        <h1 className="text-2xl font-bold mb-1">{t.welcome}</h1>
        <p className="opacity-90 text-sm">Manage your health journey with ease.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => navigate('/dashboard/book')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-start group"
        >
          <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100">
            <CalendarDays size={20} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-base text-gray-900">{t.bookAppointment}</h3>
        </button>

        <button 
          onClick={() => navigate('/dashboard/records')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all text-start group"
        >
          <div className="bg-purple-50 w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100">
            <History size={20} className="text-purple-600" />
          </div>
          <h3 className="font-semibold text-base text-gray-900">{t.medicalRecords}</h3>
        </button>

        <button 
          onClick={() => navigate('/dashboard/about')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-cyan-200 hover:shadow-md transition-all text-start group"
        >
          <div className="bg-cyan-50 w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:bg-cyan-100">
            <Info size={20} className="text-cyan-600" />
          </div>
          <h3 className="font-semibold text-base text-gray-900">{t.about}</h3>
          <p className="text-gray-500 text-xs mt-1">{t.aboutDesc}</p>
        </button>
      </div>
    </div>
  );
};

export default PatientDashboard;