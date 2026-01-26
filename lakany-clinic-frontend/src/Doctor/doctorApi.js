import axios from 'axios';

// --- CONFIGURATION ---
const API_URL = 'http://localhost:5000/api';

// Helper for Protected Requests (Gets the token automatically)
const getAuthHeaders = () => {
  const token = localStorage.getItem('doctor_token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
};

// ==========================================
// 1. AUTHENTICATION
// ==========================================
export const loginEnterprise = async (data) => {
  return axios.post(`${API_URL}/enterprise/login`, data);
};

export const registerEnterprise = async (data) => {
  return axios.post(`${API_URL}/enterprise/register`, data);
};

// ==========================================
// 2. DASHBOARD
// ==========================================
export const getDoctorDailySchedule = async () => {
  try {
    const res = await axios.get(`${API_URL}/appointments/doctor-daily`, getAuthHeaders());
    // Robust return: handle array or { data: [] }
    return Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch (e) {
    console.error("Error fetching daily schedule:", e);
    return [];
  }
};

// ==========================================
// 3. PATIENTS (The Core Functions)
// ==========================================

// ✅ GET ALL PATIENTS (Direct DB Fetch)
// Used for: "My Patients" Page
export const getAllPatients = async () => {
  try {
    const res = await axios.get(`${API_URL}/enterprise/patients/all`, getAuthHeaders());
    if (Array.isArray(res.data)) return res.data;
    if (res.data.data) return res.data.data;
    return [];
  } catch (e) {
    console.error("Error fetching all patients:", e);
    return [];
  }
};

// ✅ SEARCH PATIENTS
// Used for: Searching inside the Patients Page
export const searchPatients = async (query) => {
  if (!query) return [];
  try {
    const res = await axios.get(`${API_URL}/enterprise/patients/search?query=${query}`, getAuthHeaders());
    return Array.isArray(res.data) ? res.data : (res.data.users || res.data.data || []);
  } catch (e) {
    console.error("Error searching patients:", e);
    return [];
  }
};

// ✅ CREATE PATIENT
export const createPatient = async (data) => {
  return axios.post(`${API_URL}/enterprise/patients`, data, getAuthHeaders());
};

// ✅ GET SINGLE PATIENT RECORD
export const getPatientDetails = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/enterprise/patients/${id}`, getAuthHeaders());
    return res.data.data || res.data;
  } catch (e) {
    console.error("Error fetching patient details:", e);
    throw e;
  }
};

// ==========================================
// 4. APPOINTMENTS
// ==========================================

// ✅ GET DOCTOR'S FULL SCHEDULE
// Used for: "Appointments" Page (List view)
export const getDoctorAppointments = async () => {
  try {
    const res = await axios.get(`${API_URL}/appointments/doctor-schedule`, getAuthHeaders());
    return Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch (e) {
    console.error("Error fetching doctor appointments:", e);
    return [];
  }
};

// ✅ UPDATE APPOINTMENT (Cancel/Complete)
export const updateAppointment = async (id, data) => {
  return axios.patch(`${API_URL}/appointments/${id}`, data, getAuthHeaders());
};

// ✅ GET ALL SYSTEM APPOINTMENTS (Optional/Legacy)
// Kept just in case you need a raw list of everything, but getAllPatients is preferred for the patient list.
export const getAllAppointments = async () => {
  try {
    const res = await axios.get(`${API_URL}/appointments/all`, getAuthHeaders());
    return Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch (e) {
    console.error("Error fetching all appointments:", e);
    return [];
  }
};

// ✅ NEW: Add Medical Record (Consultation)
export const addMedicalRecord = async (patientId, data) => {
  const token = localStorage.getItem('doctor_token');
  const response = await axios.post(
    `http://localhost:5000/api/enterprise/patients/${patientId}/history`, 
    data,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data;
};