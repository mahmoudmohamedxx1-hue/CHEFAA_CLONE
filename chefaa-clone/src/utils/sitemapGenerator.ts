/**
 * XML Sitemap Generator and Robots.txt Management
 * Automated generation and management of SEO-critical files
 */

export interface SitemapUrl {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: {
    loc: string;
    caption?: string;
    title?: string;
  }[];
  videos?: {
    loc: string;
    title: string;
    description: string;
    thumbnail_loc?: string;
    publication_date?: string;
    duration?: number;
  }[];
}

export interface RobotsRule {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
  sitemap?: string;
}

export class SitemapGenerator {
  private baseUrl: string;
  private urls: SitemapUrl[] = [];

  constructor(baseUrl: string = 'https://chefaa.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * Add URL to sitemap
   */
  addUrl(url: SitemapUrl): void {
    // Ensure URL is absolute
    const absoluteUrl = url.url.startsWith('http') ? url.url : `${this.baseUrl}${url.url}`;
    
    this.urls.push({
      ...url,
      url: absoluteUrl,
      lastmod: url.lastmod || new Date().toISOString().split('T')[0],
      changefreq: url.changefreq || 'weekly',
      priority: url.priority || 0.5
    });
  }

  /**
   * Add multiple URLs to sitemap
   */
  addUrls(urls: SitemapUrl[]): void {
    urls.forEach(url => this.addUrl(url));
  }

  /**
   * Generate sitemap XML
   */
  generateXml(): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const urlsetOpening = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';
    const urlsetClosing = '</urlset>';

    let urlsXml = '';

    this.urls.forEach(urlData => {
      urlsXml += '  <url>\n';
      urlsXml += `    <loc>${this.escapeXml(urlData.url)}</loc>\n`;
      urlsXml += `    <lastmod>${urlData.lastmod}</lastmod>\n`;
      urlsXml += `    <changefreq>${urlData.changefreq}</changefreq>\n`;
      urlsXml += `    <priority>${urlData.priority}</priority>\n`;

      // Add image data if present
      if (urlData.images && urlData.images.length > 0) {
        urlData.images.forEach(image => {
          urlsXml += '    <image:image>\n';
          urlsXml += `      <image:loc>${this.escapeXml(image.loc)}</image:loc>\n`;
          if (image.caption) {
            urlsXml += `      <image:caption>${this.escapeXml(image.caption)}</image:caption>\n`;
          }
          if (image.title) {
            urlsXml += `      <image:title>${this.escapeXml(image.title)}</image:title>\n`;
          }
          urlsXml += '    </image:image>\n';
        });
      }

      // Add video data if present
      if (urlData.videos && urlData.videos.length > 0) {
        urlData.videos.forEach(video => {
          urlsXml += '    <video:video>\n';
          urlsXml += `      <video:thumbnail_loc>${this.escapeXml(video.thumbnail_loc || '')}</video:thumbnail_loc>\n`;
          urlsXml += `      <video:title>${this.escapeXml(video.title)}</video:title>\n`;
          urlsXml += `      <video:description>${this.escapeXml(video.description)}</video:description>\n`;
          urlsXml += `      <video:content_loc>${this.escapeXml(video.loc)}</video:content_loc>\n`;
          if (video.publication_date) {
            urlsXml += `      <video:publication_date>${video.publication_date}</video:publication_date>\n`;
          }
          if (video.duration) {
            urlsXml += `      <video:duration>${video.duration}</video:duration>\n`;
          }
          urlsXml += '    </video:video>\n';
        });
      }

      urlsXml += '  </url>\n';
    });

    return xmlHeader + urlsetOpening + urlsXml + urlsetClosing;
  }

  /**
   * Generate sitemap index for multiple sitemaps
   */
  generateSitemapIndex(sitemaps: { location: string; lastmod: string }[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const sitemapIndexOpening = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    const sitemapIndexClosing = '</sitemapindex>';

    let sitemapsXml = '';

    sitemaps.forEach(sitemap => {
      sitemapsXml += '  <sitemap>\n';
      sitemapsXml += `    <loc>${this.escapeXml(sitemap.location)}</loc>\n`;
      sitemapsXml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
      sitemapsXml += '  </sitemap>\n';
    });

    return xmlHeader + sitemapIndexOpening + sitemapsXml + sitemapIndexClosing;
  }

  /**
   * Auto-discover URLs from product database
   */
  async autoDiscoverProductUrls(): Promise<void> {
    try {
      // This would typically fetch from your product database
      // For now, we'll add common pharmacy product page patterns
      
      const productCategories = [
        'medications', 'daily-essentials', 'baby-care', 'beauty', 
        'medical-supplies', 'prescription', 'over-the-counter'
      ];

      const mockProducts = [
        // This would be replaced with actual database queries
        { id: '1', slug: 'doliprane-500mg', category: 'medications' },
        { id: '2', slug: 'bepanthen-cream', category: 'daily-essentials' },
        { id: '3', slug: 'panadol-extra', category: 'medications' },
        { id: '4', slug: 'cerave-moisturizer', category: 'beauty' },
        { id: '5', slug: 'baby-nasal-spray', category: 'baby-care' }
      ];

      mockProducts.forEach(product => {
        this.addUrl({
          url: `/products/${product.slug}`,
          changefreq: 'weekly',
          priority: 0.8,
          images: [
            {
              loc: `${this.baseUrl}/images/products/${product.slug}.jpg`,
              title: `${product.slug} - Chefaa Pharmacy`,
              caption: `High quality ${product.slug} available at Chefaa`
            }
          ]
        });
      });

      // Add category pages
      productCategories.forEach(category => {
        this.addUrl({
          url: `/category/${category}`,
          changefreq: 'daily',
          priority: 0.7
        });
      });

    } catch (error) {
      console.error('Error auto-discovering URLs:', error);
    }
  }

  /**
   * Generate static sitemap files
   */
  generateStaticSitemaps(): void {
    // Homepage
    this.addUrl({
      url: '/',
      changefreq: 'daily',
      priority: 1.0,
      images: [
        {
          loc: `${this.baseUrl}/images/homepage-hero.jpg`,
          title: 'Chefaa - Leading Online Pharmacy in Egypt',
          caption: 'Your trusted online pharmacy delivering medications and health products'
        }
      ]
    });

    // Important pages
    const importantPages = [
      { url: '/about', priority: 0.8 },
      { url: '/contact', priority: 0.7 },
      { url: '/delivery-areas', priority: 0.6 },
      { url: '/insurance-coverage', priority: 0.6 },
      { url: '/prescription-upload', priority: 0.7 },
      { url: '/pharmacy-network', priority: 0.6 },
      { url: '/telehealth', priority: 0.7 }
    ];

    importantPages.forEach(page => {
      this.addUrl({
        ...page,
        changefreq: 'weekly'
      });
    });

    // Health information pages
    const healthPages = [
      { url: '/health/wellness-tips', priority: 0.6 },
      { url: '/health/medication-guide', priority: 0.6 },
      { url: '/health/drug-interactions', priority: 0.5 },
      { url: '/health/side-effects', priority: 0.5 }
    ];

    healthPages.forEach(page => {
      this.addUrl({
        ...page,
        changefreq: 'monthly'
      });
    });
  }

  /**
   * Generate video sitemap for educational content
   */
  generateVideoSitemap(): SitemapUrl[] {
    const videoUrls: SitemapUrl[] = [
      {
        url: '/videos/medication-safety',
        videos: [{
          loc: `${this.baseUrl}/videos/medication-safety-guide.mp4`,
          title: 'Medication Safety Guidelines',
          description: 'Essential guidelines for safe medication use and storage',
          thumbnail_loc: `${this.baseUrl}/images/video-thumbs/medication-safety.jpg`,
          publication_date: '2024-01-01',
          duration: 300
        }]
      },
      {
        url: '/videos/prescription-upload',
        videos: [{
          loc: `${this.baseUrl}/videos/prescription-upload-guide.mp4`,
          title: 'How to Upload Your Prescription',
          description: 'Step-by-step guide to uploading your prescription for online ordering',
          thumbnail_loc: `${this.baseUrl}/images/video-thumbs/prescription-upload.jpg`,
          publication_date: '2024-01-01',
          duration: 180
        }]
      },
      {
        url: '/videos/delivery-tracking',
        videos: [{
          loc: `${this.baseUrl}/videos/delivery-tracking.mp4`,
          title: 'Track Your Delivery',
          description: 'Learn how to track your pharmacy delivery in real-time',
          thumbnail_loc: `${this.baseUrl}/images/video-thumbs/delivery-tracking.jpg`,
          publication_date: '2024-01-01',
          duration: 120
        }]
      }
    ];

    return videoUrls;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Save sitemap to file
   */
  async saveSitemap(filename: string = 'sitemap.xml'): Promise<void> {
    const xml = this.generateXml();
    
    try {
      // In a real implementation, this would save to your server
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      console.log(`Sitemap generated: ${url}`);
      // You might want to upload this to your server or serve it as a static file
    } catch (error) {
      console.error('Error saving sitemap:', error);
    }
  }
}

export class RobotsManager {
  private rules: RobotsRule[] = [];

  /**
   * Add robots rule
   */
  addRule(rule: RobotsRule): void {
    this.rules.push(rule);
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(): string {
    let robotsTxt = '';

    // Add sitemap reference at the end
    const sitemapRule = this.rules.find(rule => rule.sitemap);
    const sitemap = sitemapRule?.sitemap;

    this.rules.forEach(rule => {
      robotsTxt += `User-agent: ${rule.userAgent}\n`;
      
      if (rule.crawlDelay) {
        robotsTxt += `Crawl-delay: ${rule.crawlDelay}\n`;
      }
      
      if (rule.allow) {
        rule.allow.forEach(path => {
          robotsTxt += `Allow: ${path}\n`;
        });
      }
      
      if (rule.disallow) {
        rule.disallow.forEach(path => {
          robotsTxt += `Disallow: ${path}\n`;
        });
      }
      
      robotsTxt += '\n';
    });
    
    if (sitemap) {
      robotsTxt += `Sitemap: ${sitemap}\n`;
    }
    
    return robotsTxt;
  }

  /**
   * Generate default pharmacy robots rules
   */
  generateDefaultPharmacyRules(): void {
    // Allow all bots to access main content
    this.addRule({
      userAgent: '*',
      allow: [
        '/',
        '/products/*',
        '/category/*',
        '/search',
        '/images/*',
        '/css/*',
        '/js/*'
      ],
      disallow: [
        '/admin/*',
        '/api/*',
        '/user/*',
        '/cart',
        '/checkout',
        '/payment',
        '/*.json$',
        '/?*',
        '/temp/*',
        '/private/*'
      ],
      crawlDelay: 1
    });

    // Specific rules for major search engines
    this.addRule({
      userAgent: 'Googlebot',
      allow: [
        '/',
        '/products/*',
        '/category/*',
        '/health/*',
        '/about',
        '/contact'
      ],
      disallow: [
        '/admin/*',
        '/user/*',
        '/cart',
        '/checkout',
        '/payment'
      ],
      crawlDelay: 1
    });

    this.addRule({
      userAgent: 'bingbot',
      allow: [
        '/',
        '/products/*',
        '/category/*',
        '/health/*',
        '/about',
        '/contact'
      ],
      disallow: [
        '/admin/*',
        '/user/*',
        '/cart',
        '/checkout',
        '/payment'
      ],
      crawlDelay: 2
    });

    // Add sitemap reference
    this.rules[this.rules.length - 1].sitemap = 'https://chefaa.com/sitemap.xml';
  }

  /**
   * Check if URL is allowed for specific bot
   */
  isUrlAllowed(url: string, userAgent: string): boolean {
    const rule = this.rules.find(rule => 
      userAgent.toLowerCase().includes(rule.userAgent.toLowerCase()) || 
      rule.userAgent === '*'
    );

    if (!rule) return true;

    // Check disallow rules first
    if (rule.disallow) {
      for (const disallowed of rule.disallow) {
        if (this.pathMatches(url, disallowed)) {
          return false;
        }
      }
    }

    // Check allow rules
    if (rule.allow) {
      for (const allowed of rule.allow) {
        if (this.pathMatches(url, allowed)) {
          return true;
        }
      }
    }

    return true;
  }

  /**
   * Check if path matches pattern
   */
  private pathMatches(path: string, pattern: string): boolean {
    // Simple pattern matching - in production, use a proper pattern matching library
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(path);
    }
    
    return path === pattern;
  }
}

export default {
  SitemapGenerator,
  RobotsManager
};