// components/firebase/context.js
import React from 'react';

const FirebaseContext = React.createContext(null);

// Hook for components
export const useFirebase = () => {
  const context = React.useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return context;
};

// Provider remains in App or Session
export const FirebaseProvider = FirebaseContext.Provider;

// Legacy HOC (keep for old components – remove later)
export const withFirebase = (Component) => (props) => {
  const firebase = useFirebase();
  return <Component {...props} firebase={firebase} />;
};

export default FirebaseContext;