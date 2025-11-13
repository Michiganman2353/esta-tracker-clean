// components/firebase/index.js
import Firebase from './firebase';
import FirebaseContext, { useFirebase, withFirebase } from './context';

// Default: Firebase instance (for legacy)
export default Firebase;

// Named exports
export { FirebaseContext, useFirebase, withFirebase };