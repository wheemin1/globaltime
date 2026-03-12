import { useEffect } from 'react';
import { useLocation } from 'wouter';

const DOMAIN = 'https://globalmeetingtime.netlify.app';
const SUPPORTED_LANGS = ['en', 'es', 'ja', 'ko', 'fr', 'de', 'pt'];

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

    // Hreflang tags for multilingual support
    const canonicalPath = canonical || `${DOMAIN}${location}`;
    // Remove old hreflang links
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    // Add x-default + each language (all pointing to the same canonical since we use URL-agnostic i18n)
    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.setAttribute('hreflang', 'x-default');
    xDefault.href = canonicalPath;
    document.head.appendChild(xDefault);
    SUPPORTED_LANGS.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.setAttribute('hreflang', lang);
      link.href = canonicalPath;
      document.head.appendChild(link);
    });

  }, [title, description, keywords, ogImage, noIndex, canonical, location]);

  return null; // This component doesn't render anything
}

// Predefined SEO configurations for different pages
export const seoConfigs = {
  home: {
    title: "TimeSync – Free Global Meeting Scheduler for Different Time Zones",
    description: "Free meeting scheduler for different time zones. Share availability, see the overlap heatmap, and find the perfect meeting time across time zones — no sign-up required.",
    keywords: "global meeting scheduler, time zone meeting scheduler, meeting scheduler for different time zones, find meeting time across time zones, international meeting scheduler, meeting timezone planner, time zone meeting planner, free meeting scheduler, cross timezone meeting, schedule meeting across time zones, global time scheduler, timezone meeting tool"
  },
  
  features: {
    title: "Features – TimeSync Global Meeting Scheduler | Timezone Tools & Team Coordination",
    description: "Discover TimeSync's powerful features: drag-and-drop availability selection, automatic timezone detection, real-time collaboration, visual heatmaps, and instant meeting optimization for global teams.",
    keywords: "meeting scheduler features, availability calendar, timezone tools, team scheduling features, collaboration tools, drag and drop interface, timezone converter, meeting heatmap, global team coordination"
  },

  howItWorks: {
    title: "How It Works – TimeSync Meeting Scheduler | 3-Step Global Meeting Coordination",
    description: "Learn how to use TimeSync in 3 simple steps: create a meeting room, share your availability with drag & drop, and find the perfect meeting time with visual overlap analysis across time zones.",
    keywords: "how to schedule meetings, meeting tutorial, timezone scheduling guide, team coordination steps, global meeting planning, meeting room setup, availability sharing"
  },

  helpShare: {
    title: "Sharing Guide – TimeSync Help | Invite Team Members & Collaborate",
    description: "Learn how to share meeting rooms, invite participants across different time zones, and collaborate effectively with TimeSync's sharing features for global teams.",
    keywords: "sharing meetings, invite participants, collaboration guide, meeting room sharing, team invitation, global team coordination"
  },

  room: {
    title: "Meeting Room – TimeSync Global Scheduler",
    description: "Private meeting coordination space for scheduling across time zones",
    noIndex: true
  },

  createRoom: {
    title: "Create Meeting Room – TimeSync | Free Global Meeting Scheduler",
    description: "Set up a free cross-timezone meeting room in 3 simple steps. No registration required. Share the link and collect availability from your global team.",
    keywords: "create meeting room, schedule meeting, meeting room setup, timezone meeting planner, free meeting scheduler, no signup meeting"
  }
};
