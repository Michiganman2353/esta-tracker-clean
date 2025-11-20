import { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerManager } from '../lib/authService';
import { isFirebaseConfigured } from '../lib/firebase';
import { apiClient } from '../lib/api';
import { Stepper } from './Stepper';
import { TooltipIcon } from './Tooltip';
import EmailVerification from './EmailVerification';

interface OnboardingData {
  // Step 1: Account Info
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: Company Info
  companyName: string;
  employeeCount: string;
  
  // Step 3: Policy Setup (optional for now)
  policyNotes?: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingWizard');
  return context;
}

const STEPS = ['Account', 'Company', 'Policy', 'Complete'];

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [data, setData] = useState<OnboardingData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    employeeCount: '',
    policyNotes: '',
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    setError('');
    
    switch (step) {
      case 0: // Account Info
        if (!data.name.trim()) {
          setError('Full name is required');
          return false;
        }
        if (!data.email.trim()) {
          setError('Email address is required');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (data.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (data.password !== data.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        return true;
        
      case 1: { // Company Info - wrap in block for variable declarations
        if (!data.companyName.trim()) {
          setError('Company name is required');
          return false;
        }
        const empCount = parseInt(data.employeeCount);
        if (isNaN(empCount) || empCount < 1) {
          setError('Please enter a valid employee count');
          return false;
        }
        return true;
      }
        
      case 2: // Policy Setup (optional for now)
        return true;
        
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    setError('');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    setError('');

    try {
      const empCount = parseInt(data.employeeCount);
      
      if (isFirebaseConfigured) {
        await registerManager({
          name: data.name,
          email: data.email,
          password: data.password,
          companyName: data.companyName,
          employeeCount: empCount,
        });
        setShowVerification(true);
      } else {
        await apiClient.registerManager({
          name: data.name,
          email: data.email,
          password: data.password,
          companyName: data.companyName,
          employeeCount: empCount,
        });
        setSuccess(true);
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        const error = err as { status?: number; message?: string; isNetworkError?: boolean };
        
        if (error.isNetworkError) {
          setError('Unable to connect to server. Please check your internet connection and try again.');
        } else if (error.status === 409) {
          setError('This email is already registered. Please use a different email or try logging in.');
        } else if (error.status && error.status >= 400 && error.status < 500) {
          setError(error.message || 'Registration failed. Please check your information and try again.');
        } else {
          setError('Registration failed. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <EmailVerification
        email={data.email}
        onVerified={() => {
          navigate('/login?verified=true');
        }}
      />
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Registration Complete!
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>Welcome to ESTA Tracker, {data.name}!</p>
                  <p className="mt-2">
                    Your manager account for <strong>{data.companyName}</strong> has been created successfully.
                  </p>
                  <p className="mt-2">Next steps:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Log in to your dashboard</li>
                    <li>Add and invite employees</li>
                    <li>Configure your sick time policies</li>
                    <li>Start tracking compliance</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="btn btn-primary text-sm"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingContext.Provider value={{ data, updateData }}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Manager Registration
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Get started with ESTA Tracker in just a few steps
            </p>
          </div>

          <Stepper steps={STEPS} currentStep={currentStep} />

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
            {error && (
              <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {currentStep === 0 && <AccountInfoStep />}
            {currentStep === 1 && <CompanyInfoStep />}
            {currentStep === 2 && <PolicySetupStep />}
            {currentStep === 3 && <CompleteStep onSubmit={handleSubmit} loading={loading} />}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => navigate('/register/employee')}
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Register as Employee instead?
            </button>
            <div>
              <a
                href="/login"
                className="font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400"
              >
                Already have an account? Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </OnboardingContext.Provider>
  );
}

function AccountInfoStep() {
  const { data, updateData } = useOnboarding();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Account Information
      </h3>
      
      <div>
        <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name
          <TooltipIcon content="Enter your full legal name as it should appear on compliance documents" />
        </label>
        <input
          id="name"
          type="text"
          required
          className="input mt-1 block w-full"
          placeholder="John Doe"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Address
          <TooltipIcon content="This will be your login email and where you'll receive notifications" />
        </label>
        <input
          id="email"
          type="email"
          required
          className="input mt-1 block w-full"
          placeholder="john@company.com"
          value={data.email}
          onChange={(e) => updateData({ email: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
          <TooltipIcon content="Must be at least 8 characters long. Use a strong, unique password" />
        </label>
        <input
          id="password"
          type="password"
          required
          className="input mt-1 block w-full"
          placeholder="Minimum 8 characters"
          value={data.password}
          onChange={(e) => updateData({ password: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          className="input mt-1 block w-full"
          placeholder="Re-enter password"
          value={data.confirmPassword}
          onChange={(e) => updateData({ confirmPassword: e.target.value })}
        />
      </div>
    </div>
  );
}

function CompanyInfoStep() {
  const { data, updateData } = useOnboarding();
  const empCount = parseInt(data.employeeCount) || 0;
  const isSmallEmployer = empCount > 0 && empCount < 10;
  const isLargeEmployer = empCount >= 10;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Company Information
      </h3>
      
      <div>
        <label htmlFor="companyName" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          Company Name
          <TooltipIcon content="Legal business name for compliance tracking" />
        </label>
        <input
          id="companyName"
          type="text"
          required
          className="input mt-1 block w-full"
          placeholder="Your Company LLC"
          value={data.companyName}
          onChange={(e) => updateData({ companyName: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="employeeCount" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          Number of Employees
          <TooltipIcon content="Under Michigan ESTA: Small employers (<10) provide 40 hrs/year. Large employers (10+) provide 1 hr per 30 worked, up to 72 hrs/year." />
        </label>
        <input
          id="employeeCount"
          type="number"
          min="1"
          required
          className="input mt-1 block w-full"
          placeholder="10"
          value={data.employeeCount}
          onChange={(e) => updateData({ employeeCount: e.target.value })}
        />
        
        {isSmallEmployer && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Small Employer:</strong> You'll provide 40 hours of paid sick time per year
            </p>
          </div>
        )}
        
        {isLargeEmployer && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Large Employer:</strong> Employees accrue 1 hour per 30 worked (max 72 hrs/year)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PolicySetupStep() {
  const { data, updateData } = useOnboarding();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Policy Setup
      </h3>
      
      <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-md">
        <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
          Michigan ESTA Compliance
        </h4>
        <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
          <li>✓ Automatic accrual tracking</li>
          <li>✓ Year-to-year carryover (required)</li>
          <li>✓ Usage limits enforced automatically</li>
          <li>✓ 3-year audit trail maintained</li>
          <li>✓ Anti-retaliation protections</li>
        </ul>
      </div>

      <div>
        <label htmlFor="policyNotes" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          Policy Notes (Optional)
          <TooltipIcon content="Add any company-specific notes about your sick time policy" />
        </label>
        <textarea
          id="policyNotes"
          rows={4}
          className="input mt-1 block w-full"
          placeholder="Any additional notes about your company's sick time policy..."
          value={data.policyNotes}
          onChange={(e) => updateData({ policyNotes: e.target.value })}
        />
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> You can further customize your policy settings in the dashboard after registration.
        </p>
      </div>
    </div>
  );
}

interface CompleteStepProps {
  onSubmit: () => void;
  loading: boolean;
}

function CompleteStep({ onSubmit: _onSubmit, loading: _loading }: CompleteStepProps) {
  const { data } = useOnboarding();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Review & Complete
      </h3>
      
      <div className="space-y-3">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Account</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Name: {data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Email: {data.email}</p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Company</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Name: {data.companyName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Employees: {data.employeeCount}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Type: {parseInt(data.employeeCount) < 10 ? 'Small Employer' : 'Large Employer'}
          </p>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md mt-6">
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>You're all set!</strong> Click "Complete Registration" to create your account and start tracking ESTA compliance.
        </p>
      </div>
    </div>
  );
}
