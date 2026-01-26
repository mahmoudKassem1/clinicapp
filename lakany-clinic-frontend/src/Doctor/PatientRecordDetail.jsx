import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { LanguageContext } from '../patient/LanguageContext';
import { FileText, History, Printer, ArrowLeft, Save, Stethoscope, Pill, FilePlus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { getPatientDetails, addMedicalRecord, updateAppointment } from './doctorApi'; 

const PatientRecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  const { language } = useContext(LanguageContext);
  const isArabic = language === 'ar';

  const isViewOnly = location.state?.viewOnly === true;
  const appointmentId = location.state?.appointmentId;

  // State
  const [patient, setPatient] = useState(null); // Store patient info
  const [history, setHistory] = useState([]);   // Store history separately
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Inputs
  const [advice, setAdvice] = useState('');
  const [prescription, setPrescription] = useState('');
  const [documents, setDocuments] = useState('');

  // Translations (Kept same as before)
  const translations = {
    en: {
      patientDetails: "Patient Record Details",
      patientInfo: "Patient Information",
      medicalRecordHistory: "Medical Record History",
      noPreviousRecords: "No medical records found.",
      saveRecord: "Save & Complete Appointment",
      saving: "Saving...",
      successMsg: "Record saved successfully!"
    },
    ar: {
      patientDetails: "تفاصيل سجل المريض",
      patientInfo: "معلومات المريض",
      medicalRecordHistory: "تاريخ السجل الطبي",
      noPreviousRecords: "لا يوجد سجلات سابقة.",
      saveRecord: "حفظ وإنهاء الموعد",
      saving: "جاري الحفظ...",
      successMsg: "تم حفظ السجل بنجاح!"
    }
  };
  const t = translations[language];

  // --- 1. OPTIMIZED FETCH ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getPatientDetails(id);
      
      // Robust Data Extraction
      // Handle if response is { data: { patient... } } or just { patient... }
      const data = response.patient || response; 
      
      setPatient(data);
      // Ensure history is always an array
      setHistory(Array.isArray(data.history) ? data.history : []);
      
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Could not load patient data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // --- 2. HANDLE SAVE ---
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!advice && !prescription && !documents) {
        return toast.error("Please fill in at least one field.");
    }

    setSaving(true);
    try {
        const recordData = {
            medicalAdvice: advice,
            prescription: prescription,
            requiredDocuments: documents
        };

        // Save to DB
        const updatedHistory = await addMedicalRecord(id, recordData);
        
        // Update Local State immediately (Fast UI)
        if (Array.isArray(updatedHistory)) {
            setHistory(updatedHistory); 
        } else {
            // Fallback: Re-fetch if backend didn't return list
            fetchData();
        }

        // Complete Appointment
        if (appointmentId) {
            await updateAppointment(appointmentId, { status: 'completed' });
        }

        toast.success(t.successMsg);
        
        // Clear Form
        setAdvice('');
        setPrescription('');
        setDocuments('');

        // Redirect if it was an appointment
        if (appointmentId) {
            setTimeout(() => navigate('/doctor/dashboard'), 1500);
        }
        
    } catch (error) {
        console.error("Save failed:", error);
        toast.error("Failed to save record.");
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;

  if (!patient) return <div className="min-h-screen flex items-center justify-center text-red-600">Patient not found</div>;

  return (
    <div className={`relative min-h-screen bg-slate-50 p-4 sm:p-6 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
            <ArrowLeft size={20} /> Back
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm print:hidden">
            <Printer size={18} /> Print
        </button>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- LEFT COLUMN: HISTORY --- */}
            <div className={`${isViewOnly ? 'lg:col-span-3' : 'lg:col-span-1'} space-y-8`}>
                
                {/* Patient Info */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <FileText size={20} className="text-blue-500" /> {patient.username || patient.name}
                    </h2>
                    <p className="text-slate-600 text-sm">Phone: {patient.phone}</p>
                    <p className="text-slate-600 text-sm">Gender: {patient.gender || 'N/A'}</p>
                </div>

                {/* History List */}
                <div>
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <History size={20} className="text-slate-400" /> {t.medicalRecordHistory}
                    </h3>
                    <div className={`space-y-4 ${isViewOnly ? '' : 'max-h-[500px] overflow-y-auto pr-1'}`}>
                        {history.length > 0 ? (
                            history.map((record, index) => (
                                <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                                    <div className="flex justify-between items-start mb-2 border-b border-slate-50 pb-2">
                                        <p className="font-bold text-blue-600">
                                            {record.date ? new Date(record.date).toLocaleDateString() : 'Just now'}
                                        </p>
                                        {/* ✅ FIX: Display Doctor Name or Default */}
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                            Dr. {record.doctorName || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        {record.medicalAdvice && <div><strong className="block text-slate-800 text-xs uppercase">Diagnosis:</strong> {record.medicalAdvice}</div>}
                                        {record.prescription && <div><strong className="block text-slate-800 text-xs uppercase">Rx:</strong> {record.prescription}</div>}
                                        {record.requiredDocuments && <div><strong className="block text-slate-800 text-xs uppercase">Docs:</strong> {record.requiredDocuments}</div>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                {t.noPreviousRecords}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- RIGHT COLUMN: FORM (Hidden in ViewOnly) --- */}
            {!isViewOnly && (
                <div className="lg:col-span-2">
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sticky top-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Stethoscope size={24} className="text-blue-600" /> New Consultation
                        </h2>
                        
                        <form onSubmit={handleSaveRecord} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Medical Advice</label>
                                <textarea value={advice} onChange={(e) => setAdvice(e.target.value)} className="w-full p-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none min-h-[120px] bg-white" placeholder="Enter diagnosis..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Prescription</label>
                                    <textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} className="w-full p-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none min-h-[100px] bg-white" placeholder="Rx..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Documents</label>
                                    <textarea value={documents} onChange={(e) => setDocuments(e.target.value)} className="w-full p-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none min-h-[100px] bg-white" placeholder="Required tests..." />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="submit" disabled={saving} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2">
                                    <Save size={20} /> {saving ? t.saving : t.saveRecord}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default PatientRecordDetail;