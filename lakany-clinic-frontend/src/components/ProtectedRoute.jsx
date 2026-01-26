import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ allowedRoles }) => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('doctor_token');
    const userRole = localStorage.getItem('doctor_userRole');

    if (!token) {
      toast.error("Authentication required. Please log in.");
      navigate('/doctor-login', { replace: true });
      return;
    }

    if (!allowedRoles || !allowedRoles.includes(userRole)) {
      toast.error("Permission Denied: You do not have access to this page.");
      navigate('/doctor-login', { replace: true });
      return;
    }

    // If all checks pass, allow rendering the child component
    setIsVerified(true);
  }, [allowedRoles, navigate]);

  // Render child routes only after verification is complete
  return isVerified ? <Outlet /> : null; // You can show a loader here instead of null
};

export default ProtectedRoute;

