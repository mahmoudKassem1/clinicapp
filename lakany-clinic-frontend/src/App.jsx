import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// --- CONTEXT PROVIDERS ---
import { LanguageProvider } from './patient/LanguageContext';
import { AvailabilityProvider } from './context/AvailabilityContext';

// --- LAYOUTS ---
import MainLayout from './patient/MainLayout';
import DashboardLayout from './patient/DashboardLayout';

// --- AUTH & PROTECTION ---
// Your existing Patient protection
import PatientAuth from './patient/PatientAuth';
import ProtectedRoute from './patient/ProtectedRoute'; 

// Doctor protection (Renamed to avoid conflict)
import RoleProtectedRoute from './components/ProtectedRoute'; 
import DoctorAuth from './Doctor/DoctorAuth';

// --- PUBLIC PAGES ---
import ForgotPassword from './patient/ForgotPassword';
import ResetPassword from './patient/ResetPassword';
import WelcomePage from './patient/WelcomePage';
import About from './patient/About';

// --- PATIENT PAGES ---
import PatientDashboard from './patient/PatientDashboard';
import BookAppointment from './patient/BookAppointment';
import MedicalRecords from './patient/MedicalRecords';
import RecordDetail from './patient/RecordDetail';

// --- DOCTOR PAGES ---
import DoctorDashboard from './Doctor/DoctorDashboard';
import PatientAccount from './Doctor/PatientAccount';
import FinancePage from './Doctor/FinancePage';
import DoctorPatientsPage from './Doctor/DoctorPatientsPage';
import DoctorAppointmentsPage from './Doctor/DoctorAppointmentsPage';
import PatientRecordDetail from './Doctor/PatientRecordDetail';
import DoctorProfile from './Doctor/DoctorProfile';

function App() {
  return (
    <LanguageProvider>
      <AvailabilityProvider>
        <Router>
          <Routes>
            {/* =========================================
                1. PUBLIC ROUTES & AUTH
               ========================================= */}
            <Route path="/" element={<WelcomePage />} />
            
            {/* Patient Auth */}
            <Route path="/login" element={<PatientAuth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Doctor Auth */}
            <Route path="/doctor-login" element={<DoctorAuth />} />
            {/* Redirect old path if necessary */}
            <Route path="/doctor-dashboard" element={<Navigate to="/doctor/dashboard" replace />} />

            {/* Public Pages with Main Layout */}
            <Route element={<MainLayout />}>
              <Route path="/about" element={<About />} />
            </Route>


            {/* =========================================
                2. PATIENT DASHBOARD (Your Structure)
               ========================================= */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Redirect /dashboard to /dashboard/overview */}
              <Route index element={<Navigate to="/dashboard/overview" replace />} />
              
              <Route path="overview" element={<PatientDashboard />} />
              <Route path="book" element={<BookAppointment />} />
              <Route path="records" element={<MedicalRecords />} />
              <Route path="records/:id" element={<RecordDetail />} />
              {/* About page inside dashboard if needed */}
              <Route path="about" element={<About />} /> 
            </Route>


            {/* =========================================
                3. DOCTOR DASHBOARD (Friend's Structure)
               ========================================= */}
            {/* Uses RoleProtectedRoute to ensure only 'doctor' role can access */}
            <Route element={<RoleProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/record/:id" element={<PatientAccount />} />
              <Route path="/doctor/finance" element={<FinancePage />} />
              <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
              <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
              <Route path="/doctor/patient-record-details/:id" element={<PatientRecordDetail />} />
              <Route path="/doctor/profile" element={<DoctorProfile />} />
            </Route>

            {/* Catch-all for 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Router>
        
        {/* Global Notification Toaster */}
        <Toaster position="top-center" reverseOrder={false} />
        
      </AvailabilityProvider>
    </LanguageProvider>
  );
}

export default App;