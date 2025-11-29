import React from 'react';

interface FeatureCard {
  title: string;
  description: string;
  learnMoreLink?: string;
  learnMoreText?: string;
}

export interface PremiumFeatureGridProps {
  features: FeatureCard[];
  columns?: 2 | 3 | 4;
}

export function PremiumFeatureGrid({
  features,
  columns = 4,
}: PremiumFeatureGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <section className="bg-midnight-950 py-24">
      <div
        className={`mx-auto grid max-w-7xl grid-cols-1 px-6 sm:grid-cols-2 ${gridCols[columns]} gap-10`}
      >
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-midnight-800/50 border-gold-700/20 hover:bg-midnight-700/70 group rounded-lg border p-10 transition"
          >
            <h3 className="cinzel text-gold-400 mb-4 text-xl md:text-2xl">
              {feature.title}
            </h3>
            <p className="mb-6 text-gray-300">{feature.description}</p>
            {feature.learnMoreLink && (
              <a
                href={feature.learnMoreLink}
                className="text-gold-400 hover:text-gold-200 font-medium"
              >
                {feature.learnMoreText || 'Learn more →'}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
