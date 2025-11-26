import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import React from 'react';

import { Hero, FeatureGrid, PricingTable, CTA } from '../components';
import { validateOrThrow } from '../lib/validateBlueprint';

// Component registry maps block types to React components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentRegistry: Record<string, React.ComponentType<any>> = {
  Hero,
  FeatureGrid,
  PricingTable,
  CTA,
};

// Blueprint types
interface Block {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
}

interface BlueprintMeta {
  description?: string;
  ogImage?: string;
}

interface Blueprint {
  schemaVersion: string;
  slug: string;
  title: string;
  meta?: BlueprintMeta;
  blocks: Block[];
}

interface PageProps {
  blueprint: Blueprint;
}

/**
 * Resolve the path to blueprints directory.
 * When running from apps/marketing (via npm run dev/build),
 * process.cwd() is the app directory, so we need to navigate up.
 * This is configurable via BLUEPRINTS_PATH env var for flexibility.
 */
const BLUEPRINTS_DIR =
  process.env.BLUEPRINTS_PATH ||
  join(process.cwd(), '../../content/marketing/blueprints');

/**
 * Get all available blueprint slugs for static path generation
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const files = readdirSync(BLUEPRINTS_DIR).filter((f) => f.endsWith('.json'));

  const paths = files.map((file) => ({
    params: { slug: file.replace('.json', '') },
  }));

  return {
    paths,
    fallback: false, // 404 for unknown slugs
  };
};

/**
 * Load and validate blueprint at build time
 */
export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const filePath = join(BLUEPRINTS_DIR, `${slug}.json`);

  try {
    const content = readFileSync(filePath, 'utf-8');
    const blueprint: Blueprint = JSON.parse(content);

    // Validate at build time - will throw if invalid
    validateOrThrow(blueprint);

    return {
      props: {
        blueprint,
      },
    };
  } catch (error) {
    console.error(`Failed to load blueprint: ${slug}`, error);
    throw error; // Fail the build on invalid blueprint
  }
};

/**
 * Marketing page component that renders blueprint blocks
 */
export default function MarketingPage({ blueprint }: PageProps) {
  return (
    <>
      <Head>
        <title>{blueprint.title}</title>
        {blueprint.meta?.description && (
          <meta name="description" content={blueprint.meta.description} />
        )}
        {blueprint.meta?.ogImage && (
          <meta property="og:image" content={blueprint.meta.ogImage} />
        )}
        <meta property="og:title" content={blueprint.title} />
        {blueprint.meta?.description && (
          <meta
            property="og:description"
            content={blueprint.meta.description}
          />
        )}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main data-testid="marketing-page" data-slug={blueprint.slug}>
        {blueprint.blocks.map((block, index) => {
          const Component = componentRegistry[block.type];

          if (!Component) {
            console.warn(`Unknown block type: ${block.type}`);
            return (
              <div
                key={index}
                style={{
                  padding: '2rem',
                  backgroundColor: '#fed7d7',
                  color: '#c53030',
                }}
              >
                Unknown block type: {block.type}
              </div>
            );
          }

          return <Component key={index} {...block.props} />;
        })}
      </main>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, sans-serif;
          line-height: 1.5;
          color: #2d3748;
        }

        a {
          transition: opacity 0.2s;
        }

        a:hover {
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .feature-grid > div > div {
            grid-template-columns: 1fr !important;
          }

          .pricing-table > div > div {
            grid-template-columns: 1fr !important;
          }

          .pricing-plan {
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}
