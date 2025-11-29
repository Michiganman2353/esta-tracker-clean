import React from 'react';

export interface TrustSectionProps {
  text?: string;
}

export function TrustSection({
  text = "Trusted by Michigan's top construction, healthcare, hospitality, and professional service firms",
}: TrustSectionProps) {
  return (
    <section className="bg-midnight-900 border-gold-800/30 border-y py-16">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-gold-300 text-lg">{text}</p>
      </div>
    </section>
  );
}
