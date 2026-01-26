import React, { useState, useMemo } from 'react';

const AvailabilityContext = React.createContext(null);

export const AvailabilityProvider = ({ children }) => {
  const [isDoctorAvailable, setIsDoctorAvailable] = useState(true); // Global availability state
  const [broadcastMessage, setBroadcastMessage] = useState(null); // For a simple banner

  const toggleAvailability = (available) => {
    setIsDoctorAvailable(available);
    // Clear any previous broadcast message when availability changes
    setBroadcastMessage(null);
  };

  // Simulate a global toast/banner for patients
  const broadcast = (message, type = 'info') => {
    // In a real app, this would use a toast library or WebSocket to notify clients
    console.log(`BROADCAST (${type.toUpperCase()}): ${message}`);
    setBroadcastMessage({ message, type }); // For display as a simple banner on this page
    // A more robust solution would involve a global state or event emitter
    // that patient-side components listen to.
    alert(`Broadcast to patients: ${message}`); // Simple alert for demonstration
  };

  const contextValue = useMemo(() => ({
    isDoctorAvailable, 
    toggleAvailability, 
    broadcast, 
    broadcastMessage
  }), [isDoctorAvailable, broadcastMessage]);

  return (
    <AvailabilityContext.Provider value={contextValue}>
      {children}
    </AvailabilityContext.Provider>
  );
};

export default AvailabilityContext;
