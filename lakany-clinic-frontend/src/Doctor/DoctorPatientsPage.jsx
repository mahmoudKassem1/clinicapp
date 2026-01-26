import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../patient/LanguageContext';
import { Search, User, Phone, PlusCircle, RefreshCw } from 'lucide-react';
import DoctorNavbar from './DoctorNavbar';
import AddPatientModal from './AddPatientModal';
import { Toaster, toast } from 'react-hot-toast';

// ✅ MODIFIED: Import the new Direct DB function
import { getAllPatients } from './doctorApi'; 

const DoctorPatientsPage = () => {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [allPatients, setAllPatients] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isArabic = language === 'ar';

  const translations = {
    en: {
      title: "My Patients",
      searchPlaceholder: "Search by Patient Name or Phone...",
      noPatientsFound: "No patients match your search.",
      initialMessage: "Loading patient list...",
      viewRecord: "View Record",
      addPatient: "Add Patient",
      loading: "Loading Patients...",
      refresh: "Refresh List"
    },
    ar: {
      title: "مرضاي",
      searchPlaceholder: "البحث بالاسم أو الهاتف...",
      noPatientsFound: "لا يوجد مرضى يطابقون بحثك.",
      initialMessage: "جاري تحميل قائمة المرضى...",
      viewRecord: "عرض السجل",
      addPatient: "إضافة مريض",
      loading: "جاري تحميل المرضى...",
      refresh: "تحديث القائمة"
    }
  };
  const t = translations[language];

  // --- 1. Fetch Logic (Direct from DB) ---
  const fetchAndProcessPatients = async () => {
    setLoading(true);
    try {
      // ✅ MODIFIED: Call the new endpoint that returns ALL users with role='patient'
      // This includes patients with 0 appointments.
      const patients = await getAllPatients();
      
      // No need to deduplicate manually anymore because the DB returns unique users.
      setAllPatients(patients);

    } catch (err) {
      console.error("Failed to fetch patients:", err);
      toast.error("Failed to load patient list.");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchAndProcessPatients();
  }, []);

  // --- 2. Client-Side Search Logic ---
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return allPatients;

    const query = searchQuery.toLowerCase();
    return allPatients.filter(patient => {
      // Handle potential missing fields safely
      const name = (patient.username || patient.name || '').toLowerCase();
      const phone = (patient.phone || '');
      return name.includes(query) || phone.includes(query);
    });
  }, [searchQuery, allPatients]);


  // --- 3. Handlers ---
  const handlePatientAdded = (newPatient) => {
    setAllPatients(prev => [newPatient, ...prev]);
  };

  const renderPatientCard = (patient) => (
    <div 
      key={patient._id} 
      className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/doctor/patient-record-details/${patient._id}`)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
            <User size={20} className="text-blue-500" /> 
            {patient.username || patient.name || 'Unknown'}
          </h3>
          <p className="text-slate-500 text-sm mt-1 ml-7">ID: #{patient._id.slice(-6).toUpperCase()}</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-50">
        <p className="text-slate-600 flex items-center gap-2 mb-4">
          <Phone size={16} className="text-slate-400" /> 
          <span className="font-mono">{patient.phone || 'N/A'}</span>
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            // ✅ PASS STATE: viewOnly = true
            navigate(`/doctor/patient-record-details/${patient._id}`, { 
                state: { viewOnly: true } 
            });
          }}
          className="w-full bg-blue-50 text-blue-600 font-medium py-2 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {t.viewRecord}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Toaster position="top-center" />
      
      <AddPatientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPatientAdded={handlePatientAdded}
      />

      <div className={`min-h-screen bg-slate-50 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
        <DoctorNavbar />
        
        <div className="container mx-auto p-4 sm:p-6">
          
          {/* Header */}
          <header className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t.title} <span className="text-slate-400 text-lg font-medium">({allPatients.length})</span></h1>
            
            <div className="flex gap-2">
              <button
                onClick={fetchAndProcessPatients}
                className="p-2 text-slate-500 hover:text-blue-600 bg-white rounded-lg border border-slate-200 hover:border-blue-200 transition-all"
                title={t.refresh}
              >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </button>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
              >
                <PlusCircle size={20} />
                {t.addPatient}
              </button>
            </div>
          </header>

          {/* Search Bar */}
          <div className="relative mb-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full p-4 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm ${isArabic ? 'pr-12' : 'pl-12'}`}
            />
            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-full ${isArabic ? 'right-0' : 'left-0'}`}>
              <Search size={22} className="text-slate-400" />
            </div>
          </div>

          {/* List Content */}
          <div>
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">{t.loading}</p>
              </div>
            ) : filteredPatients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPatients.map(renderPatientCard)}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <User size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">{searchQuery ? t.noPatientsFound : t.initialMessage}</p>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
};

export default DoctorPatientsPage;