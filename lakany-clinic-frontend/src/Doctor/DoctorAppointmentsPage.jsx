import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../patient/LanguageContext';
import { Search, Calendar, Phone, Clock, XCircle, Filter } from 'lucide-react';
import DoctorNavbar from './DoctorNavbar'; 
import { Toaster, toast } from 'react-hot-toast';

// ✅ FIXED: Using Named Imports to prevent crashes
import { getDoctorAppointments, updateAppointment } from './doctorApi';

const DoctorAppointmentsPage = () => {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const isArabic = language === 'ar';

  const translations = {
    en: {
      title: "All Appointments",
      searchPlaceholder: 'Search by Name, Phone, or Date...',
      noAppointmentsFound: 'No matching appointments found.',
      all: 'All',
      upcoming: 'Upcoming',
      completed: 'Completed',
      cancelled: 'Cancelled',
      viewDetails: 'View Patient Record', // Updated label for clarity
      cancelAppointment: 'Cancel Appointment',
      appointmentCancelled: 'Appointment Cancelled',
      loading: 'Loading appointments...',
    },
    ar: {
      title: 'جميع المواعيد',
      searchPlaceholder: 'البحث بالاسم، الهاتف، أو التاريخ...',
      noAppointmentsFound: 'لم يتم العثور على مواعيد مطابقة.',
      all: 'الكل',
      upcoming: 'قادم',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      viewDetails: 'عرض سجل المريض', // Updated label for clarity
      cancelAppointment: 'إلغاء الموعد',
      appointmentCancelled: 'تم إلغاء الموعد',
      loading: 'جاري تحميل المواعيد...',
    }
  };
  const t = translations[language];

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getDoctorAppointments();
        setAppointments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        toast.error("Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // --- 2. Cancel Action ---
  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await updateAppointment(id, { status: 'cancelled' });
        toast.success(t.appointmentCancelled);
        
        // Optimistic Update
        setAppointments(prev =>
          prev.map(apt => apt._id === id ? { ...apt, status: 'cancelled' } : apt)
        );
      } catch (error) {
        console.error("Failed to cancel appointment:", error);
        toast.error("Failed to cancel appointment.");
      }
    }
  };

  // --- 3. Filtering Logic ---
  const filteredAppointments = useMemo(() => {
    let result = appointments;

    // A. Filter by Status Tab
    if (statusFilter !== 'all') {
      result = result.filter(apt => (apt.status || 'upcoming').toLowerCase() === statusFilter);
    }

    // B. Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(apt => {
        // Robust checks in case patientId is missing or unpopulated
        const name = apt.patientId?.username || apt.patientId?.name || 'Unknown';
        const phone = apt.patientId?.phone || '';
        const date = apt.date || '';
        
        return (
          name.toLowerCase().includes(query) ||
          phone.includes(query) ||
          date.includes(query)
        );
      });
    }

    // C. Sort (Newest First)
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [searchQuery, statusFilter, appointments]);

  // --- Helper: Status Badge Classes ---
  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case 'upcoming': return 'text-green-600 bg-green-50 border-green-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <Toaster position="top-center" reverseOrder={false} />
      <DoctorNavbar />
      
      <div className="container mx-auto p-4 sm:p-6">
        <header className="my-6">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t.title}</h1>
        </header>

        {/* --- Controls Section --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full p-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none shadow-sm ${isArabic ? 'pr-10' : 'pl-10'}`}
            />
            <Search size={20} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isArabic ? 'right-3' : 'left-3'}`} />
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            {['all', 'upcoming', 'completed', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${
                  statusFilter === tab 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* --- Appointments List --- */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500">{t.loading}</p>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map(apt => {
              const dateObj = new Date(apt.date);
              const status = apt.status || 'upcoming';
              const patientName = apt.patientId?.username || apt.patientId?.name || 'Unknown';

              return (
                <div key={apt._id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {patientName}
                      </h3>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase mt-1 border ${getStatusClasses(status)}`}>
                        {t[status] || status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-slate-600 font-mono font-medium bg-slate-50 px-2 py-1 rounded">
                        <Clock size={14} />
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="space-y-2 text-sm text-slate-500 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} />
                      <span>{dateObj.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={15} />
                      <span>{apt.patientId?.phone || 'No Phone'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-slate-50">
                    <button
                      onClick={() => {
                      const patientId = apt.patientId?._id;
                      if (patientId) {
                          // ✅ PASS APPOINTMENT ID IN STATE
                          navigate(`/doctor/patient-record-details/${patientId}`, { 
                              state: { appointmentId: apt._id } 
                          });
                      } else {
                          toast.error("Patient details missing.");
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    {t.viewDetails}
                  </button>
                    
                    {status === 'upcoming' && (
                      <button
                        onClick={() => handleCancel(apt._id)}
                        className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        title={t.cancelAppointment}
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-100 border-dashed">
            <Filter size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">{t.noAppointmentsFound}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointmentsPage;