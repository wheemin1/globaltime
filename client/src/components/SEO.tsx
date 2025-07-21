import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
  canonical?: string;
}

export function SEO({
  title = "TimeSync – Find the perfect meeting time across time zones",
  description = "Drag & drop to share your availability and get an instant overlap heatmap. Schedule meetings effortlessly across different time zones with visual availability tracking.",
  keywords = "meeting scheduler, timezone converter, team coordination, availability tracker, global meetings, time zone planner",
  ogImage = "/og-image.png",
  noIndex = false,
  canonical
}: SEOProps) {
  const [location] = useLocation();

  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Update meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', `${window.location.origin}${ogImage}`, true);
    updateMetaTag('og:url', `${window.location.origin}${location}`, true);
    
    // Twitter tags
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', `${window.location.origin}${ogImage}`, true);
    updateMetaTag('twitter:url', `${window.location.origin}${location}`, true);

    // Robots meta tag
    updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Canonical URL
    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.rel = 'canonical';
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.href = canonical || `${window.location.origin}${location}`;

  }, [title, description, keywords, ogImage, noIndex, canonical, location]);

  return null; // This component doesn't render anything
}

// Predefined SEO configurations for different pages
export const seoConfigs = {
  home: {
    title: "TimeSync – Find the perfect meeting time across time zones",
    description: "Drag & drop to share your availability and get an instant overlap heatmap. Schedule meetings effortlessly across different time zones with visual availability tracking.",
    keywords: "meeting scheduler, timezone converter, team coordination, availability tracker, global meetings, time zone planner"
  },
  
  features: {
    title: "Features – TimeSync Meeting Scheduler",
    description: "Discover TimeSync's powerful features: drag-and-drop availability, real-time collaboration, timezone visualization, and instant meeting optimization.",
    keywords: "meeting features, availability calendar, timezone tools, team scheduling, collaboration tools"
  },

  howItWorks: {
    title: "How It Works – TimeSync Meeting Scheduler",
    description: "Learn how to use TimeSync in 3 simple steps: create a room, share your availability, and find the perfect meeting time with visual overlap analysis.",
    keywords: "how to schedule meetings, meeting tutorial, timezone scheduling guide, team coordination steps"
  },

  helpShare: {
    title: "Sharing Guide – TimeSync Help Center",
    description: "Learn how to share meeting rooms, invite participants, and collaborate effectively with TimeSync's sharing features.",
    keywords: "sharing meetings, invite participants, collaboration guide, meeting room sharing"
  },

  room: {
    title: "Meeting Room – TimeSync",
    description: "Private meeting coordination space",
    noIndex: true
  }
};
