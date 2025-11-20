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
      <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-2xl w-full relative z-10 animate-scale-in">
          <div className="glass-card p-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce-soft">
                  <svg className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-bold gradient-header mb-2 animate-fade-in-down">
                  Registration Complete!
                </h3>
                <div className="text-base text-gray-700 dark:text-gray-300 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <p>Welcome to ESTA Tracker, <strong className="text-primary-600 dark:text-primary-400">{data.name}</strong>! 🎉</p>
                  <p>
                    Your manager account for <strong className="text-primary-600 dark:text-primary-400">{data.companyName}</strong> has been created successfully.
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">Next steps:</p>
                    <ul className="list-none space-y-2">
                      <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                        <span className="text-primary-600 dark:text-primary-400 mr-2">→</span>
                        <span>Log in to your dashboard</span>
                      </li>
                      <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                        <span className="text-primary-600 dark:text-primary-400 mr-2">→</span>
                        <span>Add and invite employees</span>
                      </li>
                      <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                        <span className="text-primary-600 dark:text-primary-400 mr-2">→</span>
                        <span>Configure your sick time policies</span>
                      </li>
                      <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                        <span className="text-primary-600 dark:text-primary-400 mr-2">→</span>
                        <span>Start tracking compliance</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn btn-primary text-base relative overflow-hidden group"
                  >
                    <span className="relative z-10">Go to Login</span>
                    <span className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></span>
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
      <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-2xl w-full space-y-8 relative z-10 animate-fade-in-up">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold gradient-header animate-fade-in-down">
              Manager Registration
            </h2>
            <p className="mt-3 text-base text-gray-700 dark:text-gray-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Get started with ESTA Tracker in just a few steps
            </p>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Stepper steps={STEPS} currentStep={currentStep} />
          </div>

          <div className="glass-card p-6 sm:p-8 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            {error && (
              <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4 border-l-4 border-red-500 animate-shake">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {currentStep === 0 && <AccountInfoStep />}
              {currentStep === 1 && <CompanyInfoStep />}
              {currentStep === 2 && <PolicySetupStep />}
              {currentStep === 3 && <CompleteStep onSubmit={handleSubmit} loading={loading} />}
            </div>

            <div className="mt-6 flex justify-between animate-fade-in" style={{ animationDelay: '0.5s' }}>
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
                  className="btn btn-primary relative overflow-hidden group"
                >
                  <span className="relative z-10">Next</span>
                  <span className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn btn-primary relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </span>
                  {!loading && <span className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></span>}
                </button>
              )}
            </div>
          </div>

          <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <button
              type="button"
              onClick={() => navigate('/register/employee')}
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 hover:underline transition-all"
            >
              Register as Employee instead?
            </button>
            <div>
              <a
                href="/login"
                className="font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400 hover:underline transition-all"
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 animate-fade-in-down">
        Account Information
      </h3>
      
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full Name
          <TooltipIcon content="Enter your full legal name as it should appear on compliance documents" />
        </label>
        <div className="relative">
          <input
            id="name"
            type="text"
            required
            className="input block w-full pl-10 focus:ring-2 focus:ring-primary-500"
            placeholder="John Doe"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Address
          <TooltipIcon content="This will be your login email and where you'll receive notifications" />
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            required
            className="input block w-full pl-10 focus:ring-2 focus:ring-primary-500"
            placeholder="john@company.com"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
          <TooltipIcon content="Must be at least 8 characters long. Use a strong, unique password" />
        </label>
        <div className="relative">
          <input
            id="password"
            type="password"
            required
            className="input block w-full pl-10 focus:ring-2 focus:ring-primary-500"
            placeholder="Minimum 8 characters"
            value={data.password}
            onChange={(e) => updateData({ password: e.target.value })}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type="password"
            required
            className="input block w-full pl-10 focus:ring-2 focus:ring-primary-500"
            placeholder="Re-enter password"
            value={data.confirmPassword}
            onChange={(e) => updateData({ confirmPassword: e.target.value })}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 animate-fade-in-down">
        Company Information
      </h3>
      
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <label htmlFor="companyName" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company Name
          <TooltipIcon content="Legal business name for compliance tracking" />
        </label>
        <div className="relative">
          <input
            id="companyName"
            type="text"
            required
            className="input block w-full pl-10 focus:ring-2 focus:ring-primary-500"
            placeholder="Your Company LLC"
            value={data.companyName}
            onChange={(e) => updateData({ companyName: e.target.value })}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <label htmlFor="employeeCount" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Number of Employees
          <TooltipIcon content="Under Michigan ESTA: Small employers (<10) provide 40 hrs/year. Large employers (10+) provide 1 hr per 30 worked, up to 72 hrs/year." />
        </label>
        <div className="relative">
          <input
            id="employeeCount"
            type="number"
            min="1"
            required
            className="input block w-full pl-10 focus:ring-2 focus:ring-primary-500"
            placeholder="10"
            value={data.employeeCount}
            onChange={(e) => updateData({ employeeCount: e.target.value })}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        
        {isSmallEmployer && (
          <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-primary-50 dark:from-blue-900/20 dark:to-primary-900/20 rounded-lg border-l-4 border-blue-500 animate-fade-in-up">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Small Employer:</strong> You'll provide 40 hours of paid sick time per year
            </p>
          </div>
        )}
        
        {isLargeEmployer && (
          <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-primary-50 dark:from-blue-900/20 dark:to-primary-900/20 rounded-lg border-l-4 border-blue-500 animate-fade-in-up">
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 animate-fade-in-down">
        Policy Setup
      </h3>
      
      <div className="glass-card p-5 bg-gradient-to-br from-primary-50/80 to-purple-50/80 dark:from-primary-900/30 dark:to-purple-900/30 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Michigan ESTA Compliance
        </h4>
        <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-2">
          <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
            <span className="mr-2">✓</span>
            <span>Automatic accrual tracking</span>
          </li>
          <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
            <span className="mr-2">✓</span>
            <span>Year-to-year carryover (required)</span>
          </li>
          <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
            <span className="mr-2">✓</span>
            <span>Usage limits enforced automatically</span>
          </li>
          <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
            <span className="mr-2">✓</span>
            <span>3-year audit trail maintained</span>
          </li>
          <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
            <span className="mr-2">✓</span>
            <span>Anti-retaliation protections</span>
          </li>
        </ul>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <label htmlFor="policyNotes" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Policy Notes (Optional)
          <TooltipIcon content="Add any company-specific notes about your sick time policy" />
        </label>
        <textarea
          id="policyNotes"
          rows={4}
          className="input block w-full focus:ring-2 focus:ring-primary-500"
          placeholder="Any additional notes about your company's sick time policy..."
          value={data.policyNotes}
          onChange={(e) => updateData({ policyNotes: e.target.value })}
        />
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 animate-fade-in-down">
        Review & Complete
      </h3>
      
      <div className="space-y-4">
        <div className="p-5 glass-card bg-gradient-to-br from-gray-50/80 to-primary-50/80 dark:from-gray-700/50 dark:to-primary-900/30 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center mb-3">
            <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Account</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 ml-12"><strong>Name:</strong> {data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 ml-12"><strong>Email:</strong> {data.email}</p>
        </div>

        <div className="p-5 glass-card bg-gradient-to-br from-gray-50/80 to-primary-50/80 dark:from-gray-700/50 dark:to-primary-900/30 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center mb-3">
            <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Company</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 ml-12"><strong>Name:</strong> {data.companyName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 ml-12"><strong>Employees:</strong> {data.employeeCount}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 ml-12">
            <strong>Type:</strong> {parseInt(data.employeeCount) < 10 ? 'Small Employer' : 'Large Employer'}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-primary-50 dark:from-green-900/20 dark:to-primary-900/20 p-5 rounded-lg border-l-4 border-green-500 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-start">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>You're all set!</strong> Click "Complete Registration" to create your account and start tracking ESTA compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
