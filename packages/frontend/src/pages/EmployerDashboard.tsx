import { User } from '@/types';
import { AccrualChart } from '@/components/AccrualChart';
import { InsightCard, DashboardCard } from '@/components/DashboardWidgets';

interface EmployerDashboardProps {
  user: User;
}

export default function EmployerDashboard({ user }: EmployerDashboardProps) {
  console.log('User:', user.name); // Using user to avoid unused var error
  
  // Mock data for demonstration - in real app, this would come from API
  const mockData = {
    totalEmployees: 25,
    activeRequests: 3,
    complianceScore: 98,
    totalAccrued: 1250,
    totalUsed: 320,
    totalRemaining: 930,
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employer Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage employees and track ESTA compliance
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
        {/* Insights Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <InsightCard
            title="Total Employees"
            value={mockData.totalEmployees}
            subtitle="Active workforce"
            color="primary"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            }
          />
          
          <InsightCard
            title="Pending Requests"
            value={mockData.activeRequests}
            subtitle="Awaiting approval"
            color="warning"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            }
          />
          
          <InsightCard
            title="Compliance Score"
            value={`${mockData.complianceScore}%`}
            subtitle="Excellent standing"
            trend="up"
            trendValue="+2%"
            color="success"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            }
          />
          
          <InsightCard
            title="Hours Available"
            value={mockData.totalRemaining}
            subtitle={`${mockData.totalAccrued} total accrued`}
            color="info"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Accrual Overview Chart */}
          <DashboardCard
            title="Company-Wide Accrual"
            subtitle="Total sick time across all employees"
          >
            <div className="flex justify-center py-4">
              <AccrualChart
                data={{
                  accrued: mockData.totalAccrued,
                  used: mockData.totalUsed,
                  remaining: mockData.totalRemaining,
                }}
                size={240}
              />
            </div>
          </DashboardCard>

          {/* Quick Actions */}
          <DashboardCard title="Quick Actions" subtitle="Common tasks">
            <div className="space-y-3">
              <button className="w-full btn btn-primary flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                <span>Add Employee</span>
              </button>
              
              <button className="w-full btn btn-secondary flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                <span>Import Employees (CSV)</span>
              </button>
              
              <button className="w-full btn btn-secondary flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Export Compliance Report</span>
              </button>
            </div>
          </DashboardCard>
        </div>

        {/* Recent Activity */}
        <DashboardCard 
          title="Recent Activity" 
          subtitle="Latest updates from your team"
          fullWidth
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  New time-off request from John Doe
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Requesting 8 hours on Dec 25, 2024
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">2 hours ago</p>
              </div>
              <button className="btn btn-primary text-sm">Review</button>
            </div>
            
            <div className="text-center py-4">
              <a href="/employer/activity" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
                View all activity →
              </a>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
