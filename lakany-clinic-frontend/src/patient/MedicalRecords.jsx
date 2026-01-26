import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from './LanguageContext';
import toast from 'react-hot-toast';
import api from '../axios';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, X } from 'lucide-react';

const LocationModal = ({ isOpen, onClose, isArabic, t }) => {
    if (!isOpen) return null;

    const locations = {
        janaklees: 'https://www.google.com/maps/search/?api=1&query=5+Dr+Mohamed+Sabry+St,+Janaklees,+Alexandria,+Egypt',
        raml: 'https://www.google.com/maps/search/?api=1&query=31.201669,29.900786',
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                dir={isArabic ? 'rtl' : 'ltr'}
            >
                <motion.div
                    className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-auto"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 relative">
                        <button onClick={onClose} className={`absolute top-4 ${isArabic ? 'left-4' : 'right-4'} text-gray-400 hover:text-gray-600`}>
                            <X size={24} />
                        </button>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">{t.modalTitle}</h3>
                        <div className="space-y-4">
                            <a
                                href={locations.janaklees}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md text-lg"
                            >
                                {t.janakleesButton}
                            </a>
                            <a
                                href={locations.raml}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md text-lg"
                            >
                                {t.ramlButton}
                            </a>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};


const MedicalRecords = () => {
    const { language } = useContext(LanguageContext);
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);

    const text = {
        en: {
          medicalRecords: 'Medical Records',
          loading: 'Loading...',
          modalTitle: "Clinic Locations",
          janakleesButton: "Janaklees Clinic",
          ramlButton: "Mahatet al Raml Clinic",
        },
        ar: {
          medicalRecords: 'السجلات الطبية',
          loading: 'تحميل...',
          modalTitle: "مواقع العيادات",
          janakleesButton: "عيادة جناكليس",
          ramlButton: "عيادة محطة الرمل",
        },
    };

    const t = text[language];

    useEffect(() => {
        const fetchAppointments = async () => {
          setIsLoading(true);
          setError(null);
          try {
            const response = await api.get('/api/appointments/my-appointments');
            if (response.data && response.data.success) {
              setAppointments(response.data.data);
            } else {
              setAppointments([]);
            }
          } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch appointments.';
            setError(errorMessage);
            toast.error(errorMessage);
          } finally {
            setIsLoading(false);
          }
        };
        fetchAppointments();
    }, []);

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{t.medicalRecords}</h2>
                    <button 
                        onClick={() => setShowLocationModal(true)}
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        aria-label="Clinic Locations"
                    >
                        <MapPin size={24} />
                    </button>
                </div>
                {isLoading ? (
                    <p className="text-gray-500">{t.loading}</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : appointments.length > 0 ? (
                    <ul className="space-y-3">
                    {appointments.map(apt => (
                        <li key={apt._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800">{new Date(apt.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    <p className={`text-sm font-semibold capitalize ${apt.status === 'completed' ? 'text-green-600' : apt.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'}`}>{apt.status}</p>
                                </div>
                                <button onClick={() => navigate(`/dashboard/records/${apt._id}`)} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">View Details</button>
                            </div>
                            {apt.medicalRecord && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                                <p className="font-semibold">Doctor's Note:</p>
                                <p className="text-gray-600 whitespace-pre-wrap">{apt.medicalRecord.medicalAdvice || 'No advice provided.'}</p>
                            </div>
                            )}
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">Your medical history will appear here.</p>
                )}
            </div>
            <LocationModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                isArabic={language === 'ar'}
                t={t}
            />
        </>
    );
};

export default MedicalRecords;

