import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

export function SEOHead({ 
  title = 'Smart Docs - Automatische Dokumentenverwaltung mit KI',
  description = 'Hochladen, smarte Metadaten, perfekte Ablage. KI-gestützte Dokumentenverwaltung mit OCR, automatischer Sortierung und sicherer EU-Cloud.',
  keywords = 'Dokumentenverwaltung, OCR, KI, automatische Sortierung, DSGVO, Cloud Storage',
  ogImage = '/og-image.jpg',
  canonical
}: SEOHeadProps) {
  const location = useLocation();
  const baseUrl = 'https://smartdocs.app';
  const fullCanonical = canonical || `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
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

    // Primary Meta Tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Open Graph
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:url', fullCanonical, true);
    updateMetaTag('og:image', `${baseUrl}${ogImage}`, true);
    updateMetaTag('og:type', 'website', true);

    // Twitter
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', `${baseUrl}${ogImage}`, true);
    updateMetaTag('twitter:card', 'summary_large_image', true);

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullCanonical);

    // Language alternate links
    let alternateDe = document.querySelector('link[hreflang="de"]');
    if (!alternateDe) {
      alternateDe = document.createElement('link');
      alternateDe.setAttribute('rel', 'alternate');
      alternateDe.setAttribute('hreflang', 'de');
      document.head.appendChild(alternateDe);
    }
    alternateDe.setAttribute('href', fullCanonical);

    let alternateEn = document.querySelector('link[hreflang="en"]');
    if (!alternateEn) {
      alternateEn = document.createElement('link');
      alternateEn.setAttribute('rel', 'alternate');
      alternateEn.setAttribute('hreflang', 'en');
      document.head.appendChild(alternateEn);
    }
    alternateEn.setAttribute('href', fullCanonical);
  }, [title, description, keywords, ogImage, fullCanonical]);

  return null;
}