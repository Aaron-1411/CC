
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
}

const SEO = ({ 
  title = 'EZ Tuition - Professional Tutoring Services',
  description = 'EZ Tuition offers personalized tutoring services to help students excel academically. Book your free consultation today!',
  canonicalUrl = 'https://eztuition.com',
  ogImage = '/lovable-uploads/b6375f57-52ca-438f-a39a-cb2510859f5f.png',
  ogType = 'website' 
}: SEOProps) => {
  const siteUrl = 'https://eztuition.com';
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      
      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
    </Helmet>
  );
};

export default SEO;
