import { useEffect } from 'react';

interface StructuredDataProps {
  type: 'WebApplication' | 'WebPage' | 'Organization';
  data: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Create new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    });
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
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
    sameAs: []
  }
};
