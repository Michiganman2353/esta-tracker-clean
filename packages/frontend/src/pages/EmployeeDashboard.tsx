import { User } from '../types';
import { AccrualChart, AccrualProgressBar } from '../components/AccrualChart';
import { InsightCard, DashboardCard } from '../components/DashboardWidgets';

interface EmployeeDashboardProps {
  user: User;
}

export default function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  console.log('User:', user.name); // Using user to avoid unused var error
  
  // Mock data for demonstration - in real app, this would come from API
  const mockData = {
    accrued: 48,
    used: 8,
    remaining: 40,
    maxAccrual: 72,
    pendingRequests: 1,
    approvedRequests: 2,
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Sick Time</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Track your balance and request time off
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <a href="/" className="text-primary-600 hover:text-primary-700 text-sm">
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <InsightCard
            title="Available Hours"
            value={mockData.remaining}
            subtitle="Ready to use"
            color="success"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            }
          />
          
          <InsightCard
            title="Hours Used"
            value={mockData.used}
            subtitle="This year"
            color="info"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            }
          />
          
          <InsightCard
            title="Total Accrued"
            value={mockData.accrued}
            subtitle={`Max: ${mockData.maxAccrual} hours`}
            color="primary"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        {/* Main Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Accrual Chart - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <DashboardCard
              title="Your Sick Time Balance"
              subtitle="Current year accrual status"
            >
              {/* Show chart on desktop, progress bar on mobile */}
              <div className="block lg:hidden">
                <AccrualProgressBar
                  data={{
                    accrued: mockData.accrued,
                    used: mockData.used,
                    remaining: mockData.remaining,
                  }}
                />
              </div>
              <div className="hidden lg:flex justify-center py-4">
                <AccrualChart
                  data={{
                    accrued: mockData.accrued,
                    used: mockData.used,
                    remaining: mockData.remaining,
                  }}
                  size={280}
                />
              </div>
              
              {/* Additional Info */}
              <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
                  Michigan ESTA Info
                </h4>
                <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
                  <li>✓ Accrual: 1 hour per 30 hours worked</li>
                  <li>✓ Maximum: 72 hours per year</li>
                  <li>✓ Carryover: Up to 72 hours to next year</li>
                  <li>✓ Protected: Anti-retaliation guaranteed</li>
                </ul>
              </div>
            </DashboardCard>
          </div>

          {/* Quick Actions - 1 column */}
          <DashboardCard title="Quick Actions" subtitle="Request time off">
            <div className="space-y-3">
              <button className="w-full btn btn-primary flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Request Time Off</span>
              </button>
              
              <button className="w-full btn btn-secondary flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>View Calendar</span>
              </button>
              
              <button className="w-full btn btn-secondary flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span>View History</span>
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Tip:</strong> Request time off at least 7 days in advance when possible.
              </p>
            </div>
          </DashboardCard>
        </div>

        {/* Request Status */}
        <DashboardCard 
          title="Recent Requests" 
          subtitle="Your time-off request history"
          fullWidth
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  8 hours on December 25, 2024
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status: Pending approval
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Submitted 2 days ago</p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Pending
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  8 hours on November 28, 2024
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status: Approved
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Used 1 week ago</p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Approved
                </span>
              </div>
            </div>
            
            <div className="text-center py-4">
              <a href="/employee/history" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
                View full history →
              </a>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
