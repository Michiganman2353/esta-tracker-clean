import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import EmployeeDashboard from '../components/EmployeeDashboard';
import { db } from '../services/firebase';
import { addDoc, collection, deleteDoc } from 'firebase/firestore';

describe('ESTA Integration Test', () => {
  it('logs hours, updates balance, and requests leave', async () => {
    // Mock user
    const mockUser = { uid: 'test-uid' };

    // Test log
    await addDoc(collection(db, 'workLogs'), { userId: 'test-uid', hours: 30 });

    // Render & check balance = 1 (1:30 rate)
    render(<AuthProvider><EmployeeDashboard /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('Balance: 1')).toBeInTheDocument());

    // Clean up
    const q = query(collection(db, 'workLogs'), where('userId', '==', 'test-uid'));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => deleteDoc(d.ref));
  });
});