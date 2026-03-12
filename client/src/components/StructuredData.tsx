import { useEffect } from 'react';

interface FAQItem { q: string; a: string; }
interface HowToStep { name: string; text: string; }
interface BreadcrumbItem { name: string; url: string; }

type StructuredDataType =
  | 'WebApplication'
  | 'WebPage'
  | 'Organization'
  | 'FAQPage'
  | 'HowTo'
  | 'BreadcrumbList';

interface StructuredDataProps {
  type: StructuredDataType;
  data: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const scriptId = `sd-${type.toLowerCase()}`;

    let jsonLd: object;
    if (type === 'FAQPage') {
      const { questions } = data as { questions: FAQItem[] };
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      };
    } else if (type === 'HowTo') {
      const { name, description, steps } = data as {
        name: string; description: string; steps: HowToStep[];
      };
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name,
        description,
        step: steps.map(({ name: sName, text }) => ({
          '@type': 'HowToStep',
          name: sName,
          text,
        })),
      };
    } else if (type === 'BreadcrumbList') {
      const { items } = data as { items: BreadcrumbItem[] };
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map(({ name, url }, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name,
          item: url,
        })),
      };
    } else {
      jsonLd = { '@context': 'https://schema.org', '@type': type, ...data };
    }

    // Remove only this component's previously injected script (by id)
    document.getElementById(scriptId)?.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = scriptId;
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => { document.getElementById(scriptId)?.remove(); };
  }, [type, data]);

  return null;
}

// Predefined structured data configurations
export const BASE_URL = 'https://globalmeetingtime.netlify.app';

export const structuredDataConfigs = {
  webApplication: {
    name: 'TimeSync',
    description: 'Find the perfect meeting time across time zones with drag & drop availability and visual overlap heatmaps.',
    url: BASE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    featureList: [
      'Timezone conversion',
      'Drag & drop availability selection',
      'Visual overlap heatmaps',
      'Real-time collaboration',
      'Global city support'
    ]
  },

  organization: {
    name: 'TimeSync',
    description: 'Meeting coordination platform for global teams',
    url: BASE_URL,
    logo: `${BASE_URL}/favicon-32x32.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${BASE_URL}/help/share`
    }
  }
};
