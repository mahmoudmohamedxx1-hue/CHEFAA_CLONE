import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Eye, Heart, Share2, MessageCircle, Tag, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { supabase } from '../lib/supabase';
import type { BlogPost, BlogComment, RelatedProduct } from '../types/blog';

interface BlogDetailPageProps {
  language: 'ar' | 'en';
}

export default function BlogDetailPage({ language }: BlogDetailPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  // Comment form state
  const [commentForm, setCommentForm] = useState({
    author_name: '',
    author_email: '',
    content: ''
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    if (slug) {
      loadBlogPost();
      trackPostView();
    }
  }, [slug, language]);

  const loadBlogPost = async () => {
    if (!slug) return;
    
    setLoading(true);
    try {
      // Load blog post
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*),
          tags:blog_post_tags(tag:blog_tags(*))
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (postError) throw postError;
      setPost(postData);

      // Load related posts
      const { data: relatedData, error: relatedError } = await supabase
        .rpc('get_related_posts', { post_uuid: postData.id, limit_count: 5 });

      if (!relatedError && relatedData) {
        setRelatedPosts(relatedData);
      }

      // Load related products
      const { data: productsData, error: productsError } = await supabase
        .from('blog_related_products')
        .select('*')
        .eq('post_id', postData.id)
        .order('relevance_score', { ascending: false });

      if (!productsError && productsData) {
        setRelatedProducts(productsData);
      }

      // Load approved comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postData.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!commentsError && commentsData) {
        setComments(commentsData);
      }

    } catch (error) {
      console.error('Error loading blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackPostView = async () => {
    if (!slug) return;

    try {
      await supabase
        .from('blog_analytics')
        .insert({
          post_id: post?.id,
          event_type: 'view',
          session_id: `session_${Date.now()}`,
          user_agent: navigator.userAgent,
          referrer: document.referrer
        });

      // Increment view count
      if (post?.id) {
        await supabase.rpc('increment_post_views', { post_uuid: post.id });
      }
    } catch (error) {
      console.error('Error tracking post view:', error);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      const action = liked ? 'decrement' : 'increment';
      await supabase
        .from('blog_posts')
        .update({ 
          likes_count: liked ? post.likes_count - 1 : post.likes_count + 1 
        })
        .eq('id', post.id);

      // Track analytics
      await supabase
        .from('blog_analytics')
        .insert({
          post_id: post.id,
          event_type: 'like',
          session_id: `session_${Date.now()}`
        });

      setLiked(!liked);
      setPost(prev => prev ? {
        ...prev,
        likes_count: liked ? prev.likes_count - 1 : prev.likes_count + 1
      } : null);

    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleShare = async (platform: string) => {
    if (!post) return;

    const url = window.location.href;
    const title = getLocalizedText(post).title;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        alert(language === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }

    // Track share analytics
    await supabase
      .from('blog_analytics')
      .insert({
        post_id: post.id,
        event_type: 'share',
        session_id: `session_${Date.now()}`,
        event_data: { platform }
      });

    setPost(prev => prev ? {
      ...prev,
      shares_count: prev.shares_count + 1
    } : null);

    setShareMenuOpen(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: post.id,
          author_name: commentForm.author_name,
          author_email: commentForm.author_email,
          content: commentForm.content,
          status: 'pending' // Requires moderation
        });

      if (error) throw error;

      // Reset form
      setCommentForm({ author_name: '', author_email: '', content: '' });
      
      // Show success message
      alert(language === 'ar' 
        ? 'تم إرسال تعليقك بنجاح! سيتم مراجعته ونشره قريباً.' 
        : 'Comment submitted successfully! It will be reviewed and published soon.'
      );

    } catch (error) {
      console.error('Error submitting comment:', error);
      alert(language === 'ar' 
        ? 'حدث خطأ في إرسال التعليق. يرجى المحاولة مرة أخرى.' 
        : 'Error submitting comment. Please try again.'
      );
    }
  };

  const getLocalizedText = (post: BlogPost) => {
    return {
      title: language === 'ar' ? post.title_ar || post.title : post.title,
      excerpt: language === 'ar' ? post.excerpt_ar || post.excerpt : post.excerpt,
      content: language === 'ar' ? post.content_ar || post.content : post.content,
      categoryName: language === 'ar' ? post.category?.name_ar || post.category?.name : post.category?.name,
      metaTitle: language === 'ar' ? post.meta_title_ar || post.meta_title : post.meta_title,
      metaDescription: language === 'ar' ? post.meta_description_ar || post.meta_description : post.meta_description
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: language === 'ar' ? 'SAR' : 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {language === 'ar' ? 'المقال غير موجود' : 'Article Not Found'}
        </h1>
        <p className="text-gray-600 mb-6">
          {language === 'ar' ? 'عذراً، المقال الذي تبحث عنه غير موجود.' : 'Sorry, the article you are looking for could not be found.'}
        </p>
        <Link to="/blog">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'ar' ? 'العودة للمدونة' : 'Back to Blog'}
          </Button>
        </Link>
      </div>
    );
  }

  const localized = getLocalizedText(post);

  return (
    <div className={`container mx-auto px-4 py-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Breadcrumb */}
      <nav className={`flex items-center gap-2 text-sm text-gray-600 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Link to="/" className="hover:text-blue-600">
          {language === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <span>/</span>
        <Link to="/blog" className="hover:text-blue-600">
          {language === 'ar' ? 'المدونة' : 'Blog'}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{localized.title}</span>
      </nav>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
          {/* Category and Status Badges */}
          <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Badge variant="secondary">
              {localized.categoryName}
            </Badge>
            {post.is_featured && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                {language === 'ar' ? 'مميز' : 'Featured'}
              </Badge>
            )}
            {post.is_medical_verified && (
              <Badge variant="outline" className="text-green-600 border-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {language === 'ar' ? 'معتمد طبياً' : 'Medical Verified'}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className={`text-3xl md:text-4xl font-bold mb-6 ${
            isRTL ? 'text-right' : 'text-left'
          }`}>
            {localized.title}
          </h1>

          {/* Excerpt */}
          {localized.excerpt && (
            <p className={`text-xl text-gray-600 mb-6 leading-relaxed ${
              isRTL ? 'text-right' : 'text-left'
            }`}>
              {localized.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className={`flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6 ${
            isRTL ? 'flex-row-reverse' : 'flex-row'
          }`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.published_at!)}</span>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock className="h-4 w-4" />
              <span>{post.reading_time_minutes} {language === 'ar' ? 'دقيقة قراءة' : 'min read'}</span>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Eye className="h-4 w-4" />
              <span>{post.views_count} {language === 'ar' ? 'مشاهدة' : 'views'}</span>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Heart className="h-4 w-4" />
              <span>{post.likes_count} {language === 'ar' ? 'إعجاب' : 'likes'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="outline"
              onClick={handleLike}
              className={`${liked ? 'text-red-600 border-red-600' : ''}`}
            >
              <Heart className={`mr-2 h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              {liked ? (language === 'ar' ? 'تم الإعجاب' : 'Liked') : (language === 'ar' ? 'إعجاب' : 'Like')}
            </Button>

            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShareMenuOpen(!shareMenuOpen)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'مشاركة' : 'Share'}
              </Button>

              {shareMenuOpen && (
                <div className={`absolute top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-10 ${
                  isRTL ? 'right-0' : 'left-0'
                }`}>
                  <button
                    onClick={() => handleShare('facebook')}
                    className={`block w-full text-left px-3 py-2 hover:bg-gray-100 rounded ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {language === 'ar' ? 'فيسبوك' : 'Facebook'}
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className={`block w-full text-left px-3 py-2 hover:bg-gray-100 rounded ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {language === 'ar' ? 'تويتر' : 'Twitter'}
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className={`block w-full text-left px-3 py-2 hover:bg-gray-100 rounded ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className={`block w-full text-left px-3 py-2 hover:bg-gray-100 rounded ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="my-8">
              <img
                src={post.featured_image_url}
                alt={localized.title}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className={`${isRTL ? 'text-right' : 'text-left'}`}
               dangerouslySetInnerHTML={{ 
                 __html: localized.content.replace(/\n/g, '<br>') 
               }} />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Tag className="h-4 w-4" />
              <span className="font-medium">
                {language === 'ar' ? 'العلامات:' : 'Tags:'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tagRelation: any) => (
                <Badge key={tagRelation.tag.id} variant="outline">
                  {language === 'ar' ? tagRelation.tag.name_ar : tagRelation.tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-8" />

        {/* Comments Section */}
        <section>
          <h2 className={`text-2xl font-bold mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'التعليقات' : 'Comments'} ({comments.length})
          </h2>

          {/* Comment Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className={isRTL ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'اترك تعليقاً' : 'Leave a Comment'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder={language === 'ar' ? 'اسمك' : 'Your Name'}
                    value={commentForm.author_name}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, author_name: e.target.value }))}
                    required
                  />
                  <Input
                    type="email"
                    placeholder={language === 'ar' ? 'بريدك الإلكتروني' : 'Your Email'}
                    value={commentForm.author_email}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, author_email: e.target.value }))}
                    required
                  />
                </div>
                <Textarea
                  placeholder={language === 'ar' ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
                  value={commentForm.content}
                  onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                  required
                  rows={4}
                />
                <Button type="submit">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'إرسال التعليق' : 'Submit Comment'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-6">
                  <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center ${
                      isRTL ? 'ml-0' : 'mr-0'
                    }`}>
                      <span className="text-blue-600 font-medium">
                        {comment.author_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <h4 className="font-medium">{comment.author_name}</h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className={`text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </article>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className={`text-2xl font-bold mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'منتجات ذات صلة' : 'Related Products'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProducts.slice(0, 3).map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className={`font-semibold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' ? product.product_name_ar || product.product_name : product.product_name}
                  </h3>
                  {product.product_price && (
                    <p className="text-blue-600 font-bold mb-3">
                      {formatPrice(product.product_price)}
                    </p>
                  )}
                  <Link to={product.link_url}>
                    <Button className="w-full">
                      {language === 'ar' ? 'عرض المنتج' : 'View Product'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-16">
          <h2 className={`text-2xl font-bold mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'مقالات ذات صلة' : 'Related Articles'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Card key={relatedPost.id} className="hover:shadow-lg transition-shadow">
                <Link to={`/blog/${relatedPost.slug}`}>
                  <CardContent className="p-6">
                    <h3 className={`font-semibold mb-2 line-clamp-2 ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}>
                      {language === 'ar' ? relatedPost.title_ar || relatedPost.title : relatedPost.title}
                    </h3>
                    {relatedPost.excerpt && (
                      <p className={`text-gray-600 mb-3 line-clamp-3 ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}>
                        {language === 'ar' ? relatedPost.excerpt_ar || relatedPost.excerpt : relatedPost.excerpt}
                      </p>
                    )}
                    <div className={`flex items-center gap-2 text-sm text-gray-500 ${
                      isRTL ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(relatedPost.published_at)}</span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Back to Blog */}
      <div className="mt-16 text-center">
        <Link to="/blog">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'ar' ? 'العودة للمدونة' : 'Back to Blog'}
          </Button>
        </Link>
      </div>
    </div>
  );
}