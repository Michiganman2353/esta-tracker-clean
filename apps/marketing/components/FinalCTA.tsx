import React from 'react';

export interface FinalCTAProps {
  headline: string;
  subheadline?: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  footnote?: string;
}

export function FinalCTA({
  headline,
  subheadline,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  footnote,
}: FinalCTAProps) {
  return (
    <section className="to-midnight-950 bg-gradient-to-t from-black py-24 text-center md:py-32">
      <h2 className="cinzel mb-8 px-6 text-3xl text-white md:text-5xl lg:text-6xl">
        {headline}
      </h2>
      {subheadline && (
        <p className="mx-auto mb-12 max-w-3xl px-6 text-lg text-gray-400 md:text-xl">
          {subheadline}
        </p>
      )}
      <div className="flex flex-col justify-center gap-6 px-6 sm:flex-row">
        <a
          href={ctaLink}
          target={ctaLink.startsWith('http') ? '_blank' : undefined}
          rel={ctaLink.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="bg-gold-400 text-midnight-950 hover:bg-gold-300 px-10 py-5 text-lg font-bold transition md:px-14 md:py-6 md:text-xl"
        >
          {ctaText}
        </a>
        {secondaryCtaText && secondaryCtaLink && (
          <a
            href={secondaryCtaLink}
            className="border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-midnight-950 border-2 px-10 py-5 text-lg font-medium transition md:px-14 md:py-6 md:text-xl"
          >
            {secondaryCtaText}
          </a>
        )}
      </div>
      {footnote && (
        <p className="mt-10 px-6 text-sm text-gray-500">{footnote}</p>
      )}
    </section>
  );
}
