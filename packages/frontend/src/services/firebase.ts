/**
 * Firebase Service
 * 
 * Re-exports Firebase instances from the centralized @esta/firebase package.
 * This maintains backward compatibility while using the new centralized package.
 */

export { app, auth, db, storage } from '@esta/firebase';
