import { User } from '../types';

interface EmployerDashboardProps {
  user: User;
}

export default function EmployerDashboard({ user }: EmployerDashboardProps) {
  console.log('User:', user.name); // Using user to avoid unused var error
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Employer Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Employer view - manage employees, approve requests, export compliance reports
        </p>
        <div className="mt-4">
          <a href="/" className="text-primary-600 hover:text-primary-700">← Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
}
