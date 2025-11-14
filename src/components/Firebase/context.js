// components/firebase/context.js
import React from 'react';

const firebaseContext = React.createContext(null);

// Hook for components
export const usefirebase = () => {
  const context = React.useContext(firebaseContext);
  if (!context) {
    throw new Error('usefirebase must be used within FirebaseProvider');
  }
  return context;
};

// Provider remains in App or Session
export const firebaseProvider = firebaseContext.Provider;

// Legacy HOC (keep for old components – remove later)
export const withfirebase = (Component) => (props) => {
  const firebase = usefirebase();
  return <Component {...props} firebase={firebase} />;
};

export default firebaseContext;