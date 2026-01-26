import React, { useState, useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Power, Bell, User, ShieldAlert, CheckCircle, XCircle, LogOut } from 'lucide-react'; // Added LogOut
import { LanguageContext } from '../patient/LanguageContext';
import BackButton from '../patient/BackButton';
import DoctorNavbar from './DoctorNavbar';
import { Toaster, toast } from 'react-hot-toast';

import AvailabilityContext from '../context/AvailabilityContext';
import DrLakanyImage from '../assets/DrLakany-removebg-preview (1).png';

const DoctorProfile = () => {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDoctorAvailable, toggleAvailability, broadcast, broadcastMessage } = useContext(AvailabilityContext);
  const [broadcastMessageText, setBroadcastMessageText] = useState(''); // New state for broadcast message input

  // Mock doctor profile data
  const doctorProfile = useMemo(() => ({
    name: "Dr. Mohamed Ellakany",
    specialty: "Pain Management Specialist",
    imageUrl: DrLakanyImage, // Placeholder image URL
  }), []);

  const translations = {
    en: {
      profileTitle: "Doctor's Profile",
      specialty: "Specialty",
      liveStatus: "Live Status",
      clinicOpen: "Clinic Open",
      clinicClosed: "Clinic Closed",
      terminateAppointments: "Terminate Appointments",
      enableAppointments: "Enable Appointments",
      broadcastMessage: "Broadcast Message to Patients",
      messageTitle: "Message Title",
      messageContent: "Message Content",
      sendBroadcast: "Send Broadcast",
      broadcastSuccess: "Message sent to patients!",
      doctorUnavailable: "The doctor is currently unavailable. Please check back later.",
      broadcastPlaceholder: "Type your message here...",
      terminateConfirmation: "Are you sure you want to disable the app?",
      appDisabled: "App Disabled",
      yes: "Yes",
      no: "No",
      broadcastConfirmation: "Are you sure you want to send this broadcast message?",
      logout: "Logout",
      logoutConfirmation: "Are you sure you want to log out?",
      loggingOut: "Logging out...",
    },
    ar: {
      profileTitle: "ملف الطبيب",
      specialty: "التخصص",
      liveStatus: "الحالة المباشرة",
      clinicOpen: "العيادة مفتوحة",
      clinicClosed: "العيادة مغلقة",
      terminateAppointments: "إنهاء المواعيد",
      enableAppointments: "تفعيل المواعيد",
      broadcastMessage: "بث رسالة للمرضى",
      messageTitle: "عنوان الرسالة",
      messageContent: "محتوى الرسالة",
      sendBroadcast: "إرسال البث",
      broadcastSuccess: "تم إرسال الرسالة إلى المرضى!",
      doctorUnavailable: "الطبيب غير متاح حاليًا. يرجى التحقق لاحقًا.",
      broadcastPlaceholder: "اكتب رسالتك هنا...",
      terminateConfirmation: "هل أنت متأكد أنك تريد تعطيل التطبيق؟",
      appDisabled: "تم تعطيل التطبيق",
      yes: "نعم",
      no: "لا",
      broadcastConfirmation: "هل أنت متأكد أنك تريد إرسال هذه الرسالة الإذاعية؟",
      logout: "تسجيل الخروج",
      logoutConfirmation: "هل أنت متأكد أنك تريد تسجيل الخروج؟",
      loggingOut: "يتم تسجيل الخروج...",
    }
  };

  const t = translations[language];
  const isArabic = language === 'ar';

  const handleBroadcast = () => {
    if (broadcastMessageText.trim()) {
      toast((tost) => (
        <div className="flex flex-col gap-4">
          <span>{t.broadcastConfirmation}</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                broadcast(broadcastMessageText, 'info');
                toast.dismiss(tost.id);
                toast.success(t.broadcastSuccess);
                setBroadcastMessageText('');
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.yes}
            </button>
            <button
              onClick={() => toast.dismiss(tost.id)}
              className="w-full bg-slate-200 text-slate-800 py-2 rounded-lg hover:bg-slate-300 transition-colors"
            >
              {t.no}
            </button>
          </div>
        </div>
      ), {
        duration: 6000,
      });
    } else {
      toast.error("Message cannot be empty.");
    }
  };

  const handleTerminateAppointments = () => {
    toast((tost) => (
      <div className="flex flex-col gap-4">
        <span>{t.terminateConfirmation}</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toggleAvailability(false);
              toast.dismiss(tost.id);
              toast.success(t.appDisabled);
            }}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            {t.yes}
          </button>
          <button
            onClick={() => toast.dismiss(tost.id)}
            className="w-full bg-slate-200 text-slate-800 py-2 rounded-lg hover:bg-slate-300 transition-colors"
          >
            {t.no}
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
    });
  };

  const handleLogout = () => {
    toast((tost) => (
      <div className="flex flex-col gap-4">
        <span>{t.logoutConfirmation}</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(tost.id);
              toast.success(t.loggingOut);
              localStorage.removeItem('authToken');
              localStorage.removeItem('userRole');
              navigate('/doctor-login');
            }}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            {t.yes}
          </button>
          <button
            onClick={() => toast.dismiss(tost.id)}
            className="w-full bg-slate-200 text-slate-800 py-2 rounded-lg hover:bg-slate-300 transition-colors"
          >
            {t.no}
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
    });
  };


  return (
    <div className={`min-h-screen bg-slate-50 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <Toaster position="top-center" reverseOrder={false} />
      <DoctorNavbar currentPath={location.pathname} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t.profileTitle}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
          >
            <LogOut size={20} />
            {t.logout}
          </button>
        </header>

        {/* Doctor Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-100 flex items-center gap-6">
          <img 
            src={doctorProfile.imageUrl} 
            alt={doctorProfile.name} 
            className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 p-1" 
          />
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <User size={24} /> {doctorProfile.name}
            </h2>
            <p className="text-blue-600 font-medium">{t.specialty}: {doctorProfile.specialty}</p>
            
            {/* Live Status Badge */}
            <div className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${
              isDoctorAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isDoctorAvailable ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {t.liveStatus}: {isDoctorAvailable ? t.clinicOpen : t.clinicClosed}
            </div>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Power size={20} /> {t.liveStatus}
          </h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleTerminateAppointments}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-md"
              disabled={!isDoctorAvailable} // Disable if already terminated
            >
              <ShieldAlert size={20} /> {t.terminateAppointments}
            </button>
            <button
              onClick={() => toggleAvailability(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-md"
              disabled={isDoctorAvailable} // Disable if already enabled
            >
              <CheckCircle size={20} /> {t.enableAppointments}
            </button>
          </div>
        </div>

        {/* Broadcast Message Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Bell size={20} /> {t.broadcastMessage}
          </h2>
          <textarea
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-700 mb-4"
            rows="3"
            placeholder={t.broadcastPlaceholder}
            value={broadcastMessageText}
            onChange={(e) => setBroadcastMessageText(e.target.value)}
          ></textarea>
          <button
            onClick={handleBroadcast}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            <Bell size={20} /> {t.sendBroadcast}
          </button>
          {/* Simple banner for broadcast message on this page */}
          {broadcastMessage && (
            <div className={`mt-4 p-3 rounded-lg ${
              broadcastMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <p className="font-semibold">{broadcastMessage.message}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DoctorProfile;
