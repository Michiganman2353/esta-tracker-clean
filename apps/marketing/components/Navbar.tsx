import React from 'react';
import Link from 'next/link';

export interface NavbarProps {
  logoText?: string;
  pricingLink?: string;
  employerLoginLink?: string;
  employeeLoginLink?: string;
}

export function Navbar({
  logoText = 'ESTATracker',
  pricingLink = '/pricing',
  employerLoginLink = 'https://app.estatracker.com',
  employeeLoginLink = 'https://employee.estatracker.com',
}: NavbarProps) {
  return (
    <nav className="bg-midnight-950/90 border-gold-anchored fixed left-0 right-0 top-0 z-50 border-b backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="cinzel text-gold-400 text-2xl tracking-wider">
          {logoText}
        </Link>
        <div className="flex items-center space-x-4 md:space-x-8">
          <Link
            href={pricingLink}
            className="text-gold-300 hover:text-gold-100 hidden font-medium transition sm:inline"
          >
            Pricing & Plans
          </Link>

          {/* Employer / Manager Login */}
          <a
            href={employerLoginLink}
            target="_blank"
            rel="noopener noreferrer"
            className="border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-midnight-950 border px-4 py-2 text-sm font-medium transition md:px-6 md:py-3 md:text-base"
          >
            Employer Login
          </a>

          {/* Employee Login */}
          <a
            href={employeeLoginLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold-400 text-midnight-950 hover:bg-gold-300 px-4 py-2 text-sm font-semibold transition md:px-6 md:py-3 md:text-base"
          >
            Employee Login
          </a>
        </div>
      </div>
    </nav>
  );
}
