import React, { useState, useContext, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { LanguageContext } from './LanguageContext';
import toast from 'react-hot-toast';
import api from '../axios';
import BookingModal from './BookingModal';
import ConfirmationModal from './ConfirmationModal';

const BookAppointment = () => {
    const { language } = useContext(LanguageContext);
    const isArabic = language === 'ar';
    
    // State for data and loading
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // State for modals
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);

    const text = {
        en: {
          bookAppointment: 'Book Appointment',
          bookNewAppointment: 'Book a New Appointment',
          upcomingAppointments: 'Upcoming Appointments',
          noAppointments: 'No upcoming appointments.',
          cancel: 'Cancel',
          appointmentCancelled: 'Appointment cancelled successfully.',
          loading: 'Loading...',
          confirmCancelTitle: 'Cancel Appointment?',
          confirmCancelMessage: 'Are you sure you want to cancel this appointment? This action cannot be undone.',
          confirmCancelButton: 'Yes, Cancel',
          keepAppointmentButton: 'No, Keep it',
        },
        ar: {
          bookAppointment: 'حجز موعد',
          bookNewAppointment: 'حجز موعد جديد',
          upcomingAppointments: 'المواعيد القادمة',
          noAppointments: 'لا توجد مواعيد قادمة.',
          cancel: 'إلغاء',
          appointmentCancelled: 'تم إلغاء الموعد بنجاح.',
          loading: 'تحميل...',
          confirmCancelTitle: 'إلغاء الموعد؟',
          confirmCancelMessage: 'هل أنت متأكد من رغبتك في إلغاء هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء.',
          confirmCancelButton: 'نعم، إلغاء',
          keepAppointmentButton: 'لا، احتفظ به',
        },
    };
    const t = text[language];

    useEffect(() => {
        const fetchAppointments = async () => {
          setIsLoading(true);
          setError(null);
          try {
            const response = await api.get('/api/appointments/my-appointments');
            setAppointments(response.data?.data || []);
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

    const handleBookingSuccess = (newAppointment) => {
        setAppointments(prev => [newAppointment, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
    };

    // Step 1: User clicks the cancel button
    const handleCancelClick = (id) => {
        setAppointmentToCancel(id);
        setIsConfirmModalOpen(true);
    };
    
    // Step 2: User confirms the cancellation in the modal
    const handleConfirmCancel = async () => {
        if (!appointmentToCancel) return;

        const originalAppointments = [...appointments];
        // Optimistically update the UI
        setAppointments(appointments.filter(apt => apt._id !== appointmentToCancel));
        
        setIsConfirmModalOpen(false); // Close modal right away
        const toastId = toast.loading('Cancelling appointment...');
        
        try {
          await api.patch(`/api/patient/appointments/${appointmentToCancel}/cancel`);
          toast.success(t.appointmentCancelled, { id: toastId });
          // The UI is already updated, so we just need to nullify the cancel target
          setAppointmentToCancel(null);
        } catch (err) {
          // Revert UI on error
          setAppointments(originalAppointments);
          toast.error(err.response?.data?.message || 'Failed to cancel appointment.', { id: toastId });
          setAppointmentToCancel(null);
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 sm:gap-0">
                <h2 className="text-xl font-bold text-gray-800">{t.bookAppointment}</h2>
                <button 
                  onClick={() => setIsBookingModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  <Plus size={18} />
                  {t.bookNewAppointment}
                </button>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.upcomingAppointments}</h3>
                {isLoading ? (
                  <p className="text-gray-500">{t.loading}</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : appointments.filter(a => a.status === 'upcoming').length > 0 ? (
                  <ul className="space-y-3">
                    {appointments.filter(a => a.status === 'upcoming').map(apt => (
                      <li key={apt._id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 border border-gray-200 rounded-lg gap-3">
                        <div>
                            <p className="font-semibold text-gray-800">{new Date(apt.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            <p className="text-sm text-gray-600">{new Date(apt.date).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <button 
                            onClick={() => handleCancelClick(apt._id)} 
                            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors self-end sm:self-center"
                        >
                          {t.cancel}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">{t.noAppointments}</p>
                )}
              </div>
            </div>

            <BookingModal 
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                onBookingSuccess={handleBookingSuccess}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmCancel}
                title={t.confirmCancelTitle}
                message={t.confirmCancelMessage}
                confirmText={t.confirmCancelButton}
                cancelText={t.keepAppointmentButton}
                isArabic={isArabic}
            />
        </>
    );
};

export default BookAppointment;

