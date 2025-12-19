import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Eye,
  Search,
  Package,
  DollarSign,
  Activity,
  FileText,
  Heart,
  Share2,
  BarChart3,
} from 'lucide-react';

interface AdminAnalyticsDashboardProps {
  language: 'ar' | 'en';
}

interface DashboardStats {
  totalSessions: number;
  totalUsers: number;
  totalProductViews: number;
  totalCartAdds: number;
  totalPurchases: number;
  totalSearches: number;
  totalRevenue: number;
  avgSessionDuration: number;
  conversionRate: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  view_count: number;
  cart_add_count: number;
  purchase_count: number;
}

interface RecentSearch {
  query: string;
  search_count: number;
  result_count: number;
}

interface BlogAnalytics {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
  total_likes: number;
  total_shares: number;
}

interface TopBlogPost {
  id: string;
  title: string;
  slug: string;
  views: number;
  likes: number;
  shares: number;
}

export default function AdminAnalyticsDashboard({ language }: AdminAnalyticsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalUsers: 0,
    totalProductViews: 0,
    totalCartAdds: 0,
    totalPurchases: 0,
    totalSearches: 0,
    totalRevenue: 0,
    avgSessionDuration: 0,
    conversionRate: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [blogAnalytics, setBlogAnalytics] = useState<BlogAnalytics>({
    total_posts: 0,
    published_posts: 0,
    draft_posts: 0,
    total_views: 0,
    total_likes: 0,
    total_shares: 0,
  });
  const [topBlogPosts, setTopBlogPosts] = useState<TopBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getTimeRangeFilter = () => {
    const now = new Date();
    const ranges = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
    return ranges[timeRange].toISOString();
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const timeFilter = getTimeRangeFilter();

      // Fetch sessions
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .gte('created_at', timeFilter);

      // Fetch product interactions
      const { data: interactions } = await supabase
        .from('product_interactions')
        .select('*')
        .gte('created_at', timeFilter);

      // Fetch searches
      const { data: searches } = await supabase
        .from('search_history')
        .select('*')
        .gte('created_at', timeFilter);

      // Fetch orders for revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', timeFilter)
        .eq('status', 'completed');

      // Calculate stats
      const uniqueUsers = new Set(sessions?.map(s => s.user_id) || []).size;
      const totalSessions = sessions?.length || 0;
      const avgDuration =
        sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) /
        (totalSessions || 1);

      const views = interactions?.filter(i => i.interaction_type === 'view').length || 0;
      const cartAdds = interactions?.filter(i => i.interaction_type === 'cart_add').length || 0;
      const purchases = interactions?.filter(i => i.interaction_type === 'purchase').length || 0;

      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const conversionRate = views > 0 ? (purchases / views) * 100 : 0;

      setStats({
        totalSessions,
        totalUsers: uniqueUsers,
        totalProductViews: views,
        totalCartAdds: cartAdds,
        totalPurchases: purchases,
        totalSearches: searches?.length || 0,
        totalRevenue,
        avgSessionDuration: avgDuration,
        conversionRate,
      });

      // Calculate top products
      const productStats = new Map<string, TopProduct>();
      interactions?.forEach(interaction => {
        const key = interaction.product_id;
        if (!productStats.has(key)) {
          productStats.set(key, {
            product_id: key,
            product_name: '', // Will be fetched separately
            view_count: 0,
            cart_add_count: 0,
            purchase_count: 0,
          });
        }
        const stat = productStats.get(key)!;
        if (interaction.interaction_type === 'view') stat.view_count++;
        if (interaction.interaction_type === 'cart_add') stat.cart_add_count++;
        if (interaction.interaction_type === 'purchase') stat.purchase_count++;
      });

      // Sort by engagement score (views + cart_adds * 2 + purchases * 3)
      const topProductsList = Array.from(productStats.values())
        .sort((a, b) => {
          const scoreA = a.view_count + a.cart_add_count * 2 + a.purchase_count * 3;
          const scoreB = b.view_count + b.cart_add_count * 2 + b.purchase_count * 3;
          return scoreB - scoreA;
        })
        .slice(0, 10);

      // Fetch product names
      const productIds = topProductsList.map(p => p.product_id);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        const productMap = new Map(products?.map(p => [p.id, p.name]) || []);
        topProductsList.forEach(p => {
          p.product_name = productMap.get(p.product_id) || 'Unknown Product';
        });
      }

      setTopProducts(topProductsList);

      // Calculate top searches
      const searchStats = new Map<string, RecentSearch>();
      searches?.forEach(search => {
        const key = search.query.toLowerCase();
        if (!searchStats.has(key)) {
          searchStats.set(key, {
            query: search.query,
            search_count: 0,
            result_count: search.result_count || 0,
          });
        }
        const stat = searchStats.get(key)!;
        stat.search_count++;
      });

      const topSearches = Array.from(searchStats.values())
        .sort((a, b) => b.search_count - a.search_count)
        .slice(0, 10);

      setRecentSearches(topSearches);

      // Fetch blog analytics
      try {
        const { data: blogData } = await supabase.functions.invoke('blog-analytics-tracker', {
          body: { action: 'get_overview' },
        });

        if (blogData) {
          setBlogAnalytics(blogData);

          // Fetch top blog posts
          const { data: postsData } = await supabase
            .from('blog_posts')
            .select('id, title, slug, view_count, like_count, share_count')
            .eq('status', 'published')
            .order('view_count', { ascending: false })
            .limit(10);

          if (postsData) {
            const formattedPosts: TopBlogPost[] = postsData.map(post => ({
              id: post.id,
              title: post.title,
              slug: post.slug,
              views: post.view_count || 0,
              likes: post.like_count || 0,
              shares: post.share_count || 0,
            }));
            setTopBlogPosts(formattedPosts);
          }
        }
      } catch (error) {
        console.error('Error fetching blog analytics:', error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {t('لوحة التحليلات', 'Analytics Dashboard')}
          </h1>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  timeRange === range
                    ? 'bg-brand-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {range === '24h' && t('24 ساعة', '24 Hours')}
                {range === '7d' && t('7 أيام', '7 Days')}
                {range === '30d' && t('30 يوم', '30 Days')}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Stats Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">{t('إحصائيات المنصة', 'Platform Analytics')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('الجلسات', 'Sessions')}
            value={stats.totalSessions.toLocaleString()}
            icon={Activity}
            color="bg-blue-500"
            subtitle={t(`${stats.totalUsers} مستخدم فريد`, `${stats.totalUsers} unique users`)}
          />
          <StatCard
            title={t('مشاهدات المنتجات', 'Product Views')}
            value={stats.totalProductViews.toLocaleString()}
            icon={Eye}
            color="bg-purple-500"
          />
          <StatCard
            title={t('إضافات للسلة', 'Cart Adds')}
            value={stats.totalCartAdds.toLocaleString()}
            icon={ShoppingCart}
            color="bg-green-500"
          />
          <StatCard
            title={t('المشتريات', 'Purchases')}
            value={stats.totalPurchases.toLocaleString()}
            icon={Package}
            color="bg-red-500"
          />
          <StatCard
            title={t('الإيرادات', 'Revenue')}
            value={`${stats.totalRevenue.toFixed(0)} ${t('ج.م', 'EGP')}`}
            icon={DollarSign}
            color="bg-yellow-500"
          />
          <StatCard
            title={t('معدل التحويل', 'Conversion Rate')}
            value={`${stats.conversionRate.toFixed(1)}%`}
            icon={TrendingUp}
            color="bg-indigo-500"
          />
          <StatCard
            title={t('عمليات البحث', 'Searches')}
            value={stats.totalSearches.toLocaleString()}
            icon={Search}
            color="bg-pink-500"
          />
          <StatCard
            title={t('متوسط مدة الجلسة', 'Avg Session')}
            value={`${Math.floor(stats.avgSessionDuration / 60)}m`}
            icon={Users}
            color="bg-teal-500"
            subtitle={`${stats.avgSessionDuration.toFixed(0)}s`}
          />
          </div>
        </div>

        {/* Blog Stats Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">{t('إحصائيات المدونة', 'Blog Analytics')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={t('إجمالي المقالات', 'Total Posts')}
              value={blogAnalytics.total_posts.toLocaleString()}
              icon={FileText}
              color="bg-purple-500"
              subtitle={`${blogAnalytics.published_posts} ${t('منشورة', 'published')} • ${blogAnalytics.draft_posts} ${t('مسودة', 'drafts')}`}
            />
            <StatCard
              title={t('مشاهدات المدونة', 'Blog Views')}
              value={blogAnalytics.total_views.toLocaleString()}
              icon={Eye}
              color="bg-blue-500"
            />
            <StatCard
              title={t('إعجابات المدونة', 'Blog Likes')}
              value={blogAnalytics.total_likes.toLocaleString()}
              icon={Heart}
              color="bg-pink-500"
            />
            <StatCard
              title={t('مشاركات المدونة', 'Blog Shares')}
              value={blogAnalytics.total_shares.toLocaleString()}
              icon={Share2}
              color="bg-green-500"
            />
          </div>
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">
              {t('أفضل المنتجات', 'Top Products')}
            </h2>
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {t('لا توجد بيانات', 'No data available')}
                </p>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.product_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center font-bold text-brand-blue-500">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product.product_name}</p>
                      <p className="text-xs text-gray-600">
                        {product.view_count} {t('مشاهدة', 'views')} • {product.cart_add_count} {t('إضافة', 'adds')} • {product.purchase_count} {t('شراء', 'sales')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Searches */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">
              {t('أكثر عمليات البحث', 'Top Searches')}
            </h2>
            <div className="space-y-3">
              {recentSearches.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {t('لا توجد بيانات', 'No data available')}
                </p>
              ) : (
                recentSearches.map((search, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-900">{search.query}</p>
                        <p className="text-xs text-gray-600">
                          {search.result_count} {t('نتيجة', 'results')}
                        </p>
                      </div>
                    </div>
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-semibold text-gray-700">
                      {search.search_count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Blog Posts */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">
              {t('أفضل المقالات', 'Top Blog Posts')}
            </h2>
            <div className="space-y-3">
              {topBlogPosts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {t('لا توجد بيانات', 'No data available')}
                </p>
              ) : (
                topBlogPosts.map((post, index) => (
                  <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-500">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-gray-600">
                        {post.views} {t('مشاهدة', 'views')} • {post.likes} {t('إعجاب', 'likes')} • {post.shares} {t('مشاركة', 'shares')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
