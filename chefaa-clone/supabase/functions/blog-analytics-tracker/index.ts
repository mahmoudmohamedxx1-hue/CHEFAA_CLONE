// Blog Analytics Tracking Edge Function
// Purpose: Track blog analytics and generate performance reports

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { action, post_id, event_type, session_id, user_agent, referrer, event_data } = await req.json();
        
        // Access Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        switch (action) {
            case 'track':
                await trackEvent({
                    post_id,
                    event_type,
                    session_id,
                    user_agent,
                    referrer,
                    event_data
                }, supabaseUrl, supabaseKey);
                break;

            case 'get_analytics':
                const analytics = await getAnalytics(post_id, supabaseUrl, supabaseKey);
                return new Response(JSON.stringify({ success: true, data: analytics }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'get_dashboard':
                const dashboard = await getDashboard(supabaseUrl, supabaseKey);
                return new Response(JSON.stringify({ success: true, data: dashboard }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'get_performance':
                const performance = await getPerformanceMetrics(supabaseUrl, supabaseKey);
                return new Response(JSON.stringify({ success: true, data: performance }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            default:
                throw new Error('Invalid action specified');
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Event tracked successfully' 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Analytics tracking error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'ANALYTICS_TRACKING_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function trackEvent(eventData, supabaseUrl, supabaseKey) {
    const {
        post_id,
        event_type,
        session_id,
        user_agent,
        referrer,
        event_data
    } = eventData;

    // Validate event type
    const validEventTypes = ['view', 'like', 'share', 'comment', 'read_time', 'scroll'];
    if (!validEventTypes.includes(event_type)) {
        throw new Error(`Invalid event type: ${event_type}`);
    }

    // Prepare analytics record
    const analyticsRecord = {
        post_id,
        event_type,
        session_id,
        user_agent,
        referrer,
        event_data: event_data || {},
        created_at: new Date().toISOString()
    };

    // Insert analytics record
    const response = await fetch(`${supabaseUrl}/rest/v1/blog_analytics`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyticsRecord)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to insert analytics record: ${error}`);
    }

    // Update post counters for specific event types
    if (['view', 'like', 'share'].includes(event_type)) {
        await updatePostCounters(post_id, event_type, supabaseUrl, supabaseKey);
    }
}

async function updatePostCounters(postId, eventType, supabaseUrl, supabaseKey) {
    let updateField = '';
    switch (eventType) {
        case 'view':
            updateField = 'views_count';
            break;
        case 'like':
            updateField = 'likes_count';
            break;
        case 'share':
            updateField = 'shares_count';
            break;
        default:
            return; // No counter updates needed for other events
    }

    // Get current count
    const currentResponse = await fetch(`${supabaseUrl}/rest/v1/blog_posts?id=eq.${postId}&select=${updateField}`, {
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        }
    });

    if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        if (currentData && currentData.length > 0) {
            const currentCount = currentData[0][updateField] || 0;
            
            // Update with increment
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/blog_posts?id=eq.${postId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    [updateField]: currentCount + 1,
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                console.error('Failed to update post counters');
            }
        }
    }
}

async function getAnalytics(postId, supabaseUrl, supabaseKey) {
    // Get post data with counters
    const postResponse = await fetch(`${supabaseUrl}/rest/v1/blog_posts?id=eq.${postId}&select=*,category:blog_categories(*)`, {
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        }
    });

    if (!postResponse.ok) {
        throw new Error('Failed to fetch post data');
    }

    const posts = await postResponse.json();
    if (!posts || posts.length === 0) {
        throw new Error('Post not found');
    }

    const post = posts[0];

    // Get analytics data
    const analyticsResponse = await fetch(`${supabaseUrl}/rest/v1/blog_analytics?post_id=eq.${postId}&select=*&order=created_at.desc`, {
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        }
    });

    const analytics = analyticsResponse.ok ? await analyticsResponse.json() : [];

    // Calculate metrics
    const metrics = {
        basic_stats: {
            views: post.views_count,
            likes: post.likes_count,
            shares: post.shares_count,
            total_events: analytics.length
        },
        event_breakdown: calculateEventBreakdown(analytics),
        time_analysis: calculateTimeAnalysis(analytics),
        engagement_rate: calculateEngagementRate(analytics),
        traffic_sources: calculateTrafficSources(analytics),
        device_analysis: calculateDeviceAnalysis(analytics),
        top_performing_content: await getTopPerformingContent(postId, supabaseUrl, supabaseKey)
    };

    return metrics;
}

async function getDashboard(supabaseUrl, supabaseKey) {
    // Get overall blog statistics
    const postsResponse = await fetch(`${supabaseUrl}/rest/v1/blog_posts?select=*,category:blog_categories(*)`, {
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        }
    });

    const posts = postsResponse.ok ? await postsResponse.json() : [];

    // Get analytics data
    const analyticsResponse = await fetch(`${supabaseUrl}/rest/v1/blog_analytics?select=*&order=created_at.desc&limit=1000`, {
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        }
    });

    const analytics = analyticsResponse.ok ? await analyticsResponse.json() : [];

    // Calculate dashboard metrics
    const dashboard = {
        overview: {
            total_posts: posts.length,
            total_views: posts.reduce((sum, post) => sum + (post.views_count || 0), 0),
            total_likes: posts.reduce((sum, post) => sum + (post.likes_count || 0), 0),
            total_shares: posts.reduce((sum, post) => sum + (post.shares_count || 0), 0),
            published_posts: posts.filter(post => post.status === 'published').length,
            draft_posts: posts.filter(post => post.status === 'draft').length
        },
        content_performance: calculateContentPerformance(posts),
        category_performance: calculateCategoryPerformance(posts),
        trending_posts: await getTrendingPosts(supabaseUrl, supabaseKey),
        recent_activity: analytics.slice(0, 10).map(event => ({
            post_id: event.post_id,
            event_type: event.event_type,
            timestamp: event.created_at,
            session_id: event.session_id
        }))
    };

    return dashboard;
}

async function getPerformanceMetrics(supabaseUrl, supabaseKey) {
    // Get time-series data for performance analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analyticsResponse = await fetch(`${supabaseUrl}/rest/v1/blog_analytics?created_at=gte.${thirtyDaysAgo.toISOString()}&select=*&order=created_at.desc`, {
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        }
    });

    const analytics = analyticsResponse.ok ? await analyticsResponse.json() : [];

    const performance = {
        daily_stats: calculateDailyStats(analytics),
        engagement_trends: calculateEngagementTrends(analytics),
        traffic_patterns: calculateTrafficPatterns(analytics),
        conversion_metrics: calculateConversionMetrics(analytics),
        top_traffic_sources: calculateTopTrafficSources(analytics)
    };

    return performance;
}

function calculateEventBreakdown(analytics) {
    const breakdown = {};
    analytics.forEach(event => {
        breakdown[event.event_type] = (breakdown[event.event_type] || 0) + 1;
    });
    return breakdown;
}

function calculateTimeAnalysis(analytics) {
    const now = new Date();
    const last24Hours = analytics.filter(event => 
        new Date(event.created_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );
    const last7Days = analytics.filter(event => 
        new Date(event.created_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    const last30Days = analytics.filter(event => 
        new Date(event.created_at) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    );

    return {
        last_24h: last24Hours.length,
        last_7d: last7Days.length,
        last_30d: last30Days.length
    };
}

function calculateEngagementRate(analytics) {
    if (analytics.length === 0) return 0;
    
    const engagedEvents = analytics.filter(event => 
        ['like', 'share', 'comment'].includes(event.event_type)
    ).length;
    
    return (engagedEvents / analytics.length) * 100;
}

function calculateTrafficSources(analytics) {
    const sources = {};
    analytics.forEach(event => {
        const source = event.referrer || 'direct';
        sources[source] = (sources[source] || 0) + 1;
    });
    return sources;
}

function calculateDeviceAnalysis(analytics) {
    const devices = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
    analytics.forEach(event => {
        const userAgent = (event.user_agent || '').toLowerCase();
        if (userAgent.includes('mobile')) {
            devices.mobile++;
        } else if (userAgent.includes('tablet')) {
            devices.tablet++;
        } else if (userAgent.includes('desktop') || userAgent.includes('computer')) {
            devices.desktop++;
        } else {
            devices.unknown++;
        }
    });
    return devices;
}

function calculateContentPerformance(posts) {
    return posts.map(post => ({
        id: post.id,
        title: post.title,
        category: post.category?.name,
        views: post.views_count || 0,
        likes: post.likes_count || 0,
        shares: post.shares_count || 0,
        engagement_rate: calculatePostEngagementRate(post),
        published_at: post.published_at
    })).sort((a, b) => b.views - a.views);
}

function calculateCategoryPerformance(posts) {
    const categories = {};
    posts.forEach(post => {
        const categoryName = post.category?.name || 'Uncategorized';
        if (!categories[categoryName]) {
            categories[categoryName] = {
                name: categoryName,
                posts: 0,
                total_views: 0,
                total_likes: 0
            };
        }
        categories[categoryName].posts++;
        categories[categoryName].total_views += post.views_count || 0;
        categories[categoryName].total_likes += post.likes_count || 0;
    });
    return Object.values(categories).sort((a, b) => b.total_views - a.total_views);
}

async function getTrendingPosts(supabaseUrl, supabaseKey) {
    const postsResponse = await fetch(`${supabaseUrl}/rest/v1/blog_posts?status=eq.published&order=views_count.desc&limit=5&select=*,category:blog_categories(*)`, {
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        }
    });

    return postsResponse.ok ? await postsResponse.json() : [];
}

async function getTopPerformingContent(postId, supabaseUrl, supabaseKey) {
    // This would typically involve more complex logic
    // For now, returning similar posts based on engagement
    const postsResponse = await fetch(`${supabaseUrl}/rest/v1/blog_posts?status=eq.published&id=neq.${postId}&order=views_count.desc&limit=5&select=*,category:blog_categories(*)`, {
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        }
    });

    return postsResponse.ok ? await postsResponse.json() : [];
}

function calculatePostEngagementRate(post) {
    const totalEngagement = (post.likes_count || 0) + (post.shares_count || 0);
    const views = post.views_count || 1; // Avoid division by zero
    return (totalEngagement / views) * 100;
}

function calculateDailyStats(analytics) {
    const dailyStats = {};
    analytics.forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        if (!dailyStats[date]) {
            dailyStats[date] = { views: 0, likes: 0, shares: 0, comments: 0 };
        }
        dailyStats[date][event.event_type] = (dailyStats[date][event.event_type] || 0) + 1;
    });
    return Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats
    })).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateEngagementTrends(analytics) {
    // Calculate weekly engagement trends
    const weeklyTrends = {};
    analytics.forEach(event => {
        const weekStart = new Date(event.created_at);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyTrends[weekKey]) {
            weeklyTrends[weekKey] = { total: 0, engaged: 0 };
        }
        
        weeklyTrends[weekKey].total++;
        if (['like', 'share', 'comment'].includes(event.event_type)) {
            weeklyTrends[weekKey].engaged++;
        }
    });
    
    return Object.entries(weeklyTrends).map(([week, stats]) => ({
        week,
        engagement_rate: (stats.engaged / stats.total) * 100,
        total_events: stats.total
    })).sort((a, b) => a.week.localeCompare(b.week));
}

function calculateTrafficPatterns(analytics) {
    const hourlyPattern = new Array(24).fill(0);
    const dailyPattern = new Array(7).fill(0);
    
    analytics.forEach(event => {
        const date = new Date(event.created_at);
        hourlyPattern[date.getHours()]++;
        dailyPattern[date.getDay()]++;
    });
    
    return {
        hourly: hourlyPattern.map((count, hour) => ({ hour, count })),
        daily: dailyPattern.map((count, day) => ({ 
            day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
            count 
        }))
    };
}

function calculateConversionMetrics(analytics) {
    const views = analytics.filter(e => e.event_type === 'view').length;
    const likes = analytics.filter(e => e.event_type === 'like').length;
    const shares = analytics.filter(e => e.event_type === 'share').length;
    const comments = analytics.filter(e => e.event_type === 'comment').length;
    
    return {
        view_to_like_rate: views > 0 ? (likes / views) * 100 : 0,
        view_to_share_rate: views > 0 ? (shares / views) * 100 : 0,
        view_to_comment_rate: views > 0 ? (comments / views) * 100 : 0,
        overall_engagement_rate: views > 0 ? ((likes + shares + comments) / views) * 100 : 0
    };
}

function calculateTopTrafficSources(analytics) {
    const sources = {};
    analytics.forEach(event => {
        const referrer = event.referrer || 'Direct';
        if (!sources[referrer]) {
            sources[referrer] = { visits: 0, engaged: 0 };
        }
        sources[referrer].visits++;
        if (['like', 'share', 'comment'].includes(event.event_type)) {
            sources[referrer].engaged++;
        }
    });
    
    return Object.entries(sources)
        .map(([source, stats]) => ({
            source,
            visits: stats.visits,
            engagement_rate: (stats.engaged / stats.visits) * 100
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);
}