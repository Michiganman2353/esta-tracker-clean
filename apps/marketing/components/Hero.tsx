import React from 'react';

interface HeroProps {
  headline: string;
  highlightedText?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  backgroundImage?: string;
  variant?: 'default' | 'compact' | 'premium';
}

export function Hero({
  headline,
  highlightedText,
  subheadline,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  variant = 'default',
}: HeroProps) {
  // Premium variant with dark luxury styling
  if (variant === 'premium') {
    return (
      <section className="from-midnight-950 to-midnight-900 relative flex min-h-screen items-center justify-center bg-gradient-to-b">
        <div className="mx-auto max-w-7xl px-6 pt-32 text-center">
          <h1 className="cinzel mb-6 text-4xl leading-tight text-white sm:text-5xl md:text-6xl lg:text-8xl">
            {headline}{' '}
            {highlightedText && (
              <span className="text-gold-400">{highlightedText}</span>
            )}
          </h1>
          {subheadline && (
            <p className="mx-auto mb-12 max-w-4xl text-xl text-gray-300 md:text-2xl lg:text-3xl">
              {subheadline}
            </p>
          )}

          {/* Main CTAs */}
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            {ctaText && ctaLink && (
              <a
                href={ctaLink}
                target={ctaLink.startsWith('http') ? '_blank' : undefined}
                rel={
                  ctaLink.startsWith('http') ? 'noopener noreferrer' : undefined
                }
                className="bg-gold-400 text-midnight-950 hover:bg-gold-300 transform px-8 py-4 text-lg font-semibold transition hover:scale-105 md:px-12 md:py-5 md:text-xl"
              >
                {ctaText}
              </a>
            )}
            {secondaryCtaText && secondaryCtaLink && (
              <a
                href={secondaryCtaLink}
                className="border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-midnight-950 border-2 px-8 py-4 text-lg font-medium transition md:px-12 md:py-5 md:text-xl"
              >
                {secondaryCtaText}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Compact variant for inner pages
  if (variant === 'compact') {
    return (
      <section className="from-midnight-950 to-midnight-900 bg-gradient-to-b py-24 pt-32 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="cinzel mb-4 text-3xl text-white md:text-5xl">
            {headline}
          </h1>
          {subheadline && (
            <p className="mb-8 text-lg text-gray-300 md:text-xl">
              {subheadline}
            </p>
          )}
          {ctaText && ctaLink && (
            <a
              href={ctaLink}
              className="bg-gold-400 text-midnight-950 hover:bg-gold-300 inline-block px-8 py-4 font-semibold transition"
            >
              {ctaText}
            </a>
          )}
        </div>
      </section>
    );
  }

  // Default variant (original inline styles)
  return (
    <section
      className={`hero ${variant}`}
      style={{
        padding: '6rem 2rem',
        textAlign: 'center',
        backgroundColor: '#1a365d',
        color: 'white',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '3rem',
            marginBottom: '1rem',
          }}
        >
          {headline}
        </h1>
        {subheadline && (
          <p
            style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2rem' }}
          >
            {subheadline}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {ctaText && ctaLink && (
            <a
              href={ctaLink}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#48bb78',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
              }}
            >
              {ctaText}
            </a>
          )}
          {secondaryCtaText && secondaryCtaLink && (
            <a
              href={secondaryCtaLink}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'transparent',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                border: '2px solid white',
              }}
            >
              {secondaryCtaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
