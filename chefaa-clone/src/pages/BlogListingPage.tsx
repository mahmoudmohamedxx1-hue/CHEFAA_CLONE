import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, Clock, Eye, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import type { BlogPost, BlogCategory, BlogTag, BlogSearchParams } from '../types/blog';

interface BlogListingPageProps {
  language: 'ar' | 'en';
}

export default function BlogListingPage({ language }: BlogListingPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'trending'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  
  const postsPerPage = 12;

  const isRTL = language === 'ar';

  // Search and filter parameters
  const blogSearchParams: BlogSearchParams = useMemo(() => ({
    query: searchQuery || searchParams.get('q') || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    language,
    status: 'published',
    limit: postsPerPage,
    offset: (currentPage - 1) * postsPerPage,
    sort: sortBy
  }), [searchQuery, selectedCategory, selectedTags, language, sortBy, currentPage, searchParams]);

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadTags();
    loadPosts();
  }, [language]);

  // Load posts when search params change
  useEffect(() => {
    loadPosts();
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      // Build search query
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*),
          tags:blog_post_tags(tag:blog_tags(*))
        `)
        .eq('status', 'published');

      // Apply filters
      if (blogSearchParams.query) {
        if (language === 'ar') {
          query = query.or(`title_ar.ilike.%${blogSearchParams.query}%,content_ar.ilike.%${blogSearchParams.query}%`);
        } else {
          query = query.or(`title.ilike.%${blogSearchParams.query}%,content.ilike.%${blogSearchParams.query}%`);
        }
      }

      if (blogSearchParams.category) {
        query = query.eq('category_id', blogSearchParams.category);
      }

      if (blogSearchParams.tags && blogSearchParams.tags.length > 0) {
        // This would need a more complex join in a real implementation
        query = query.contains('tags', blogSearchParams.tags);
      }

      // Apply sorting
      switch (blogSearchParams.sort) {
        case 'oldest':
          query = query.order('published_at', { ascending: true });
          break;
        case 'popular':
          query = query.order('views_count', { ascending: false });
          break;
        case 'trending':
          query = query.order('likes_count', { ascending: false });
          break;
        default:
          query = query.order('published_at', { ascending: false });
      }

      const { data, error, count } = await query
        .range(blogSearchParams.offset!, blogSearchParams.offset! + blogSearchParams.limit! - 1);

      if (error) throw error;
      
      setPosts(data || []);
      setTotalPosts(count || 0);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tagSlug: string) => {
    setSelectedTags(prev => 
      prev.includes(tagSlug) 
        ? prev.filter(t => t !== tagSlug)
        : [...prev, tagSlug]
    );
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPosts();
  };

  const getLocalizedText = (post: BlogPost) => {
    return {
      title: language === 'ar' ? post.title_ar || post.title : post.title,
      excerpt: language === 'ar' ? post.excerpt_ar || post.excerpt : post.excerpt,
      categoryName: language === 'ar' ? post.category?.name_ar || post.category?.name : post.category?.name
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  return (
    <div className={`container mx-auto px-4 py-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className={`text-4xl font-bold mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          {language === 'ar' ? 'مدونة شفاء الطبية' : 'Chefaa Medical Blog'}
        </h1>
        <p className={`text-gray-600 max-w-2xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
          {language === 'ar' 
            ? 'مقالات طبية موثوقة ونصائح صحية من خبراء الصحة والأطباء المتخصصين'
            : 'Trusted medical articles and health tips from healthcare professionals and specialists'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'التصفية والبحث' : 'Search & Filters'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={language === 'ar' ? 'البحث في المقالات...' : 'Search articles...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isRTL ? 'pr-10' : 'pl-10'}
                />
              </form>

              {/* Categories */}
              <div>
                <h3 className={`font-semibold mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'الفئات' : 'Categories'}
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left p-2 rounded hover:bg-gray-100 ${
                      selectedCategory === 'all' ? 'bg-blue-100 text-blue-700' : ''
                    } ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {language === 'ar' ? 'جميع الفئات' : 'All Categories'}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.slug);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left p-2 rounded hover:bg-gray-100 ${
                        selectedCategory === category.slug ? 'bg-blue-100 text-blue-700' : ''
                      } ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                      {getLocalizedText({ category } as any).categoryName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className={`font-semibold mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'العلامات' : 'Tags'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.slug) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag.slug)}
                    >
                      {language === 'ar' ? tag.name_ar : tag.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className={`font-semibold mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'ترتيب حسب' : 'Sort By'}
                </h3>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">
                      {language === 'ar' ? 'الأحدث' : 'Newest'}
                    </SelectItem>
                    <SelectItem value="oldest">
                      {language === 'ar' ? 'الأقدم' : 'Oldest'}
                    </SelectItem>
                    <SelectItem value="popular">
                      {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                    </SelectItem>
                    <SelectItem value="trending">
                      {language === 'ar' ? 'الأكثر رواجاً' : 'Trending'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {language === 'ar' ? 'لم يتم العثور على مقالات' : 'No articles found'}
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedTags([]);
                  setCurrentPage(1);
                }}>
                  {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results count */}
              <div className={`mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-gray-600">
                  {language === 'ar' 
                    ? `عرض ${posts.length} من ${totalPosts} مقال`
                    : `Showing ${posts.length} of ${totalPosts} articles`
                  }
                </p>
              </div>

              {/* Blog Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {posts.map((post) => {
                  const localized = getLocalizedText(post);
                  return (
                    <Card key={post.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                      <Link to={`/blog/${post.slug}`}>
                        {post.featured_image_url && (
                          <div className="aspect-video overflow-hidden rounded-t-lg">
                            <img
                              src={post.featured_image_url}
                              alt={localized.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardContent className="p-6">
                          <div className={`flex items-center gap-4 mb-3 text-sm text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Badge variant="secondary" className={isRTL ? 'ml-0' : 'mr-0'}>
                              {localized.categoryName}
                            </Badge>
                            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(post.published_at!)}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Clock className="h-4 w-4" />
                              <span>{post.reading_time_minutes} min</span>
                            </div>
                          </div>
                          
                          <h3 className={`text-xl font-semibold mb-3 line-clamp-2 group-hover:text-blue-600 ${
                            isRTL ? 'text-right' : 'text-left'
                          }`}>
                            {localized.title}
                          </h3>
                          
                          {localized.excerpt && (
                            <p className={`text-gray-600 mb-4 line-clamp-3 ${
                              isRTL ? 'text-right' : 'text-left'
                            }`}>
                              {localized.excerpt}
                            </p>
                          )}
                          
                          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-4 text-sm text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Eye className="h-4 w-4" />
                                <span>{post.views_count}</span>
                              </div>
                              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Heart className="h-4 w-4" />
                                <span>{post.likes_count}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {post.is_featured && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                  {language === 'ar' ? 'مميز' : 'Featured'}
                                </Badge>
                              )}
                              {post.is_medical_verified && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  {language === 'ar' ? 'معتمد طبياً' : 'Medical Verified'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </Button>
                  
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10 h-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    {language === 'ar' ? 'التالي' : 'Next'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}