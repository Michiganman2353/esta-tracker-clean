import React from 'react';

export interface FooterProps {
  copyrightText?: string;
  poweredByText?: string;
}

export function Footer({
  copyrightText = '© 2025 ESTATracker.com',
  poweredByText = 'ESTA-Logic™',
}: FooterProps) {
  return (
    <footer className="border-gold-900/30 border-t bg-black py-12">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-gray-400">
          {copyrightText} — Powered by{' '}
          <span className="text-gold-400 font-semibold">{poweredByText}</span>
        </p>
      </div>
    </footer>
  );
}
