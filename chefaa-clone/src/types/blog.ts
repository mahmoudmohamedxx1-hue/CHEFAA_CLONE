// Medical Blog System Type Definitions
// Created: 2025-11-02

export interface BlogCategory {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  description_ar?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  description_ar?: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  title_ar: string;
  slug: string;
  excerpt?: string;
  excerpt_ar?: string;
  content: string;
  content_ar?: string;
  author_id: string;
  category_id: string;
  category?: BlogCategory;
  
  // SEO Fields
  meta_title?: string;
  meta_title_ar?: string;
  meta_description?: string;
  meta_description_ar?: string;
  meta_keywords?: string;
  meta_keywords_ar?: string;
  canonical_url?: string;
  
  // Content Management
  featured_image_url?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  is_featured: boolean;
  is_medical_verified: boolean;
  reading_time_minutes: number;
  
  // Publication
  published_at?: string;
  scheduled_for?: string;
  
  // Analytics
  views_count: number;
  likes_count: number;
  shares_count: number;
  likes?: boolean; // User interaction
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  tags?: BlogTag[];
  related_products?: RelatedProduct[];
  related_posts?: RelatedPost[];
  comments?: BlogComment[];
}

export interface RelatedProduct {
  id: string;
  post_id: string;
  product_id: string;
  product_name: string;
  product_name_ar?: string;
  product_price?: number;
  product_image_url?: string;
  link_url: string;
  relevance_score: number;
  created_at: string;
}

export interface RelatedPost {
  id: string;
  title: string;
  title_ar: string;
  slug: string;
  excerpt?: string;
  excerpt_ar?: string;
  featured_image_url?: string;
  published_at: string;
  similarity_score: number;
}

export interface BlogComment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  author_website?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  parent_id?: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  replies?: BlogComment[];
}

export interface MedicalVerification {
  id: string;
  post_id: string;
  medical_professional_id?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  medical_notes?: string;
  verified_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogAnalytics {
  id: string;
  post_id: string;
  user_id?: string;
  session_id?: string;
  event_type: 'view' | 'like' | 'share' | 'comment' | 'read_time';
  event_data?: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  created_at: string;
}

export interface BlogPostMedia {
  id: string;
  post_id: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  alt_text?: string;
  alt_text_ar?: string;
  caption?: string;
  caption_ar?: string;
  created_at: string;
}

// Search and Filter Types
export interface BlogSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  language?: 'ar' | 'en';
  status?: string;
  featured?: boolean;
  medical_verified?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'oldest' | 'popular' | 'trending';
}

export interface BlogSearchResult {
  posts: BlogPost[];
  total: number;
  hasMore: boolean;
  categories: BlogCategory[];
  tags: BlogTag[];
}

// SEO Types
export interface BlogSEOData {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  schema: Record<string, any>;
}

// Admin/Content Management Types
export interface BlogPostFormData {
  title: string;
  title_ar?: string;
  excerpt?: string;
  excerpt_ar?: string;
  content: string;
  content_ar?: string;
  category_id: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  is_featured: boolean;
  featured_image_url?: string;
  meta_title?: string;
  meta_title_ar?: string;
  meta_description?: string;
  meta_description_ar?: string;
  meta_keywords?: string;
  meta_keywords_ar?: string;
  scheduled_for?: string;
}

export interface BlogAnalyticsData {
  total_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  posts_by_category: Record<string, number>;
  popular_posts: BlogPost[];
  recent_comments: BlogComment[];
  monthly_stats: {
    month: string;
    views: number;
    posts: number;
  }[];
}

export default {};