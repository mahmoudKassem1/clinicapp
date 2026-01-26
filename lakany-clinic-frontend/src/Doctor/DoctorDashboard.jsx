import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Search, Calendar, Phone, Clock, FileText } from 'lucide-react';
import { LanguageContext } from '../patient/LanguageContext';
import BackButton from '../patient/BackButton';
import DoctorNavbar from './DoctorNavbar';
import { getDoctorDailySchedule } from './doctorApi';

// --- UI Enhancement Helpers ---
const getStatusStyles = (status = 'upcoming') => {
    switch (status.toLowerCase()) {
        case 'upcoming':
            return 'bg-green-100 text-green-700 border border-green-200';
        case 'cancelled':
            return 'bg-red-50 text-red-600 border border-red-100';
        case 'completed':
            return 'bg-blue-100 text-blue-700 border border-blue-200';
        default:
            return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
};


const DoctorDashboard = () => {
  const { language } = useContext(LanguageContext);
  
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ totalPatients: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const translations = {
    en: {
        dashboardTitle: "Doctor's Dashboard",
        todaysSchedule: "Today's Schedule",
        noAppointmentsToday: 'No appointments scheduled for today.',
        time: 'Time',
        status: 'Status',
        reason: 'Reason',
        patient: 'Patient',
        loading: 'Loading...',
        totalPatients: 'Appointments Today',
    },
    ar: {
        dashboardTitle: 'لوحة تحكم الطبيب',
        todaysSchedule: 'جدول اليوم',
        noAppointmentsToday: 'لا توجد مواعيد مجدولة لهذا اليوم.',
        time: 'الوقت',
        status: 'الحالة',
        reason: 'السبب',
        patient: 'المريض',
        loading: 'جار التحميل...',
        totalPatients: 'مواعيد اليوم',
    }
  };
  const t = translations[language];
  const isArabic = language === 'ar';

  useEffect(() => {
    const fetchAndFilterData = async () => {
      setLoading(true);
      setError(null);
      const allAppointments = await getDoctorDailySchedule();
      const getLocalDateStr = (date) => new Date(date).toLocaleDateString('en-CA');
      const todayStr = getLocalDateStr(new Date());

      const todaysAppointments = allAppointments.filter(appt => {
        if (!appt.date) return false;
        return getLocalDateStr(appt.date) === todayStr;
      });

      setAppointments(todaysAppointments);
      setStats({ totalPatients: todaysAppointments.length });
      setLoading(false);
    };

    fetchAndFilterData();
  }, []);

  // --- Step 1: Implement Smart Sorting ---
  const sortedAppointments = useMemo(() => {
    const statusOrder = { upcoming: 1, completed: 2, cancelled: 3 };
    
    return [...appointments].sort((a, b) => {
      // Primary sort by status
      const statusA = a.status?.toLowerCase() || 'upcoming';
      const statusB = b.status?.toLowerCase() || 'upcoming';
      const statusDiff = (statusOrder[statusA] || 99) - (statusOrder[statusB] || 99);
      if (statusDiff !== 0) return statusDiff;

      // Secondary sort by time
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return timeA - timeB;
    });
  }, [appointments]);

  
  const renderAppointmentRow = (appt) => {
    const statusStyle = getStatusStyles(appt.status);
    return (
      <tr key={appt._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
        <td className="py-4 px-6">
            {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="py-4 px-6 font-medium text-slate-800">
            {appt.patientId?.username || appt.patient?.name || 'N/A'}
        </td>
        <td className="py-4 px-6 text-slate-600">
            {appt.type || appt.reason || 'Check-up'}
        </td>
        <td className="py-4 px-6">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyle}`}>
                {appt.status || 'Upcoming'}
            </span>
        </td>
      </tr>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-50 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <DoctorNavbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <header className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t.dashboardTitle}</h1>
                <p className="text-slate-500 mt-1">{t.todaysSchedule}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{t.totalPatients}</h3>
                <p className="text-4xl font-bold text-slate-800 mt-1">{loading ? '...' : stats.totalPatients}</p>
            </div>
        </header>
        
        {/* --- Step 2: Enhanced UI Table --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">{t.time}</th>
                  <th className="py-3 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">{t.patient}</th>
                  <th className="py-3 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">{t.reason}</th>
                  <th className="py-3 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-10 text-slate-500">{t.loading}</td></tr>
                ) : error ? (
                  <tr><td colSpan="4" className="text-center p-10 text-red-500">{error}</td></tr>
                ) : sortedAppointments.length > 0 ? (
                  sortedAppointments.map(renderAppointmentRow)
                ) : (
                  <tr><td colSpan="4" className="text-center p-10 text-slate-500">{t.noAppointmentsToday}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;