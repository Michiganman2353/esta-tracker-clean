import { User } from '../types';

interface EmployeeDashboardProps {
  user: User;
}

export default function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  console.log('User:', user.name); // Using user to avoid unused var error
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Employee Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Employee view - balance, request sick time, view history
        </p>
        <div className="mt-4">
          <a href="/" className="text-primary-600 hover:text-primary-700">← Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
}
