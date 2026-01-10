import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * SEO Component - Dynamically updates document head for each page
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.keywords - Page keywords (comma-separated)
 * @param {string} props.path - Current page path (e.g., '/upscale')
 * @param {string} props.type - Open Graph type (default: 'website')
 * @param {Object} props.structuredData - Additional JSON-LD structured data
 */
const SEO = ({ 
  title, 
  description, 
  keywords, 
  path = '', 
  type = 'website',
  structuredData = null 
}) => {
  const { i18n } = useTranslation();
  const baseUrl = 'https://imagestudio.app';
  const fullUrl = `${baseUrl}${path}`;
  const ogImage = `${baseUrl}/og-image.png`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const updateMeta = (selector, attribute, value) => {
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute(attribute, value);
      } else {
        element = document.createElement('meta');
        const [attr, val] = selector.match(/\[([^\]]+)\]/)[1].split('=');
        element.setAttribute(attr, val.replace(/"/g, ''));
        element.setAttribute(attribute, value);
        document.head.appendChild(element);
      }
    };

    // Primary Meta Tags
    updateMeta('meta[name="title"]', 'content', title);
    updateMeta('meta[name="description"]', 'content', description);
    if (keywords) {
      updateMeta('meta[name="keywords"]', 'content', keywords);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', fullUrl);
    }

    // Open Graph
    updateMeta('meta[property="og:title"]', 'content', title);
    updateMeta('meta[property="og:description"]', 'content', description);
    updateMeta('meta[property="og:url"]', 'content', fullUrl);
    updateMeta('meta[property="og:type"]', 'content', type);
    updateMeta('meta[property="og:image"]', 'content', ogImage);

    // Twitter
    updateMeta('meta[property="twitter:title"]', 'content', title);
    updateMeta('meta[property="twitter:description"]', 'content', description);
    updateMeta('meta[property="twitter:url"]', 'content', fullUrl);
    updateMeta('meta[property="twitter:image"]', 'content', ogImage);

    // Language
    document.documentElement.lang = i18n.language;

    // Add structured data if provided
    if (structuredData) {
      const existingScript = document.querySelector(`script[data-seo-page="${path}"]`);
      if (existingScript) {
        existingScript.textContent = JSON.stringify(structuredData);
      } else {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-page', path);
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
      }
    }

    // Cleanup function
    return () => {
      const pageScript = document.querySelector(`script[data-seo-page="${path}"]`);
      if (pageScript) {
        pageScript.remove();
      }
    };
  }, [title, description, keywords, path, type, fullUrl, ogImage, structuredData, i18n.language]);

  return null; // This component doesn't render anything
};

export default SEO;
