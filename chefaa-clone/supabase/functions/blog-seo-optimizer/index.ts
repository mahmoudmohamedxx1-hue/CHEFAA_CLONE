// Medical Blog SEO Optimization Edge Function
// Purpose: Optimize blog posts for search engines and generate structured data

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
        const { post_id, language = 'en', category } = await req.json();
        
        if (!post_id) {
            throw new Error('Post ID is required');
        }

        // Access Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Fetch blog post data
        const postResponse = await fetch(`${supabaseUrl}/rest/v1/blog_posts?id=eq.${post_id}&select=*,category:blog_categories(*)`, {
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        if (!postResponse.ok) {
            throw new Error('Failed to fetch blog post');
        }

        const posts = await postResponse.json();
        if (!posts || posts.length === 0) {
            throw new Error('Blog post not found');
        }

        const post = posts[0];
        
        // Generate SEO data
        const seoData = generateSEOData(post, language, category);
        
        // Generate structured data for medical content
        const structuredData = generateStructuredData(post, language);
        
        // Generate meta tags
        const metaTags = generateMetaTags(post, language);
        
        // Generate Open Graph tags
        const ogTags = generateOpenGraphTags(post, language);
        
        // Generate Twitter Card tags
        const twitterTags = generateTwitterTags(post, language);
        
        // Calculate keyword density
        const keywordAnalysis = analyzeKeywordDensity(post, language);
        
        // Generate related keyword suggestions
        const keywordSuggestions = generateKeywordSuggestions(post, category, language);

        return new Response(JSON.stringify({
            success: true,
            data: {
                seo: seoData,
                structured_data: structuredData,
                meta_tags: metaTags,
                og_tags: ogTags,
                twitter_tags: twitterTags,
                keyword_analysis: keywordAnalysis,
                keyword_suggestions: keywordSuggestions,
                recommendations: generateSEORecommendations(post, keywordAnalysis, language)
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('SEO optimization error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'SEO_OPTIMIZATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function generateSEOData(post, language, category) {
    const isArabic = language === 'ar';
    
    const title = isArabic ? post.meta_title_ar || post.meta_title || post.title_ar || post.title : 
                 post.meta_title || post.title;
    
    const description = isArabic ? post.meta_description_ar || post.meta_description || post.excerpt_ar || post.excerpt : 
                      post.meta_description || post.excerpt;
    
    const keywords = isArabic ? post.meta_keywords_ar || post.meta_keywords : 
                   post.meta_keywords;
    
    return {
        title: title?.substring(0, 60) + (title?.length > 60 ? '...' : ''),
        description: description?.substring(0, 160) + (description?.length > 160 ? '...' : ''),
        keywords: keywords?.split(',').map(k => k.trim()) || [],
        canonical_url: post.canonical_url || `https://chefaa.com/blog/${post.slug}`,
        og_title: title,
        og_description: description,
        og_type: 'article',
        article_published_time: post.published_at,
        article_modified_time: post.updated_at,
        article_author: 'Chefaa Medical Team',
        article_section: category?.name || 'Health',
        article_tag: keywords?.split(',').map(k => k.trim()) || []
    };
}

function generateStructuredData(post, language) {
    const isArabic = language === 'ar';
    const title = isArabic ? post.title_ar || post.title : post.title;
    const description = isArabic ? post.excerpt_ar || post.excerpt : post.excerpt;
    const categoryName = isArabic ? post.category?.name_ar || post.category?.name : post.category?.name;
    
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": description,
        "image": post.featured_image_url,
        "author": {
            "@type": "Organization",
            "name": "Chefaa",
            "url": "https://chefaa.com"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Chefaa",
            "logo": {
                "@type": "ImageObject",
                "url": "https://chefaa.com/logo.png"
            }
        },
        "datePublished": post.published_at,
        "dateModified": post.updated_at,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://chefaa.com/blog/${post.slug}`
        },
        "articleSection": categoryName,
        "keywords": post.meta_keywords?.split(',')?.map(k => k.trim()) || [],
        "wordCount": post.content?.length || 0,
        "timeRequired": `PT${post.reading_time_minutes}M`,
        "isAccessibleForFree": true,
        "inLanguage": language === 'ar' ? 'ar' : 'en',
        "audience": {
            "@type": "MedicalAudience",
            "audienceType": "Patients"
        },
        "about": [
            {
                "@type": "Thing",
                "name": categoryName
            }
        ]
    };
}

function generateMetaTags(post, language) {
    const isArabic = language === 'ar';
    const title = isArabic ? post.meta_title_ar || post.meta_title || post.title_ar || post.title : 
                 post.meta_title || post.title;
    const description = isArabic ? post.meta_description_ar || post.meta_description || post.excerpt_ar || post.excerpt : 
                      post.meta_description || post.excerpt;
    
    return [
        { name: 'title', content: title },
        { name: 'description', content: description },
        { name: 'keywords', content: post.meta_keywords || '' },
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: 'Chefaa Medical Team' },
        { name: 'language', content: language },
        { name: 'revisit-after', content: '7 days' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'format-detection', content: 'telephone=no' }
    ];
}

function generateOpenGraphTags(post, language) {
    const isArabic = language === 'ar';
    const title = isArabic ? post.meta_title_ar || post.meta_title || post.title_ar || post.title : 
                 post.meta_title || post.title;
    const description = isArabic ? post.meta_description_ar || post.meta_description || post.excerpt_ar || post.excerpt : 
                      post.meta_description || post.excerpt;
    
    return [
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: post.featured_image_url },
        { property: 'og:url', content: `https://chefaa.com/blog/${post.slug}` },
        { property: 'og:type', content: 'article' },
        { property: 'og:site_name', content: 'Chefaa Medical Blog' },
        { property: 'og:locale', content: language === 'ar' ? 'ar_AR' : 'en_US' },
        { property: 'article:published_time', content: post.published_at },
        { property: 'article:modified_time', content: post.updated_at },
        { property: 'article:author', content: 'Chefaa Medical Team' },
        { property: 'article:section', content: post.category?.name || 'Health' },
        { property: 'article:tag', content: post.meta_keywords || '' }
    ];
}

function generateTwitterTags(post, language) {
    const isArabic = language === 'ar';
    const title = isArabic ? post.meta_title_ar || post.meta_title || post.title_ar || post.title : 
                 post.meta_title || post.title;
    const description = isArabic ? post.meta_description_ar || post.meta_description || post.excerpt_ar || post.excerpt : 
                      post.meta_description || post.excerpt;
    
    return [
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: post.featured_image_url },
        { name: 'twitter:site', content: '@chefaa' },
        { name: 'twitter:creator', content: '@chefaa' }
    ];
}

function analyzeKeywordDensity(post, language) {
    const content = language === 'ar' ? (post.content_ar || post.content) : post.content;
    if (!content) return { totalWords: 0, keywordDensity: {}, recommendations: [] };
    
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const totalWords = words.length;
    
    // Medical keywords for analysis
    const medicalKeywords = [
        'health', 'medical', 'doctor', 'treatment', 'symptoms', 'disease', 'medicine',
        'patient', 'diagnosis', 'therapy', 'medication', 'prescription',
        'صحة', 'طبيب', 'علاج', 'أعراض', 'مرض', 'دواء', 'مريض', 'تشخيص'
    ];
    
    const keywordDensity = {};
    
    medicalKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.toLowerCase().match(regex) || [];
        keywordDensity[keyword] = {
            count: matches.length,
            density: totalWords > 0 ? (matches.length / totalWords) * 100 : 0
        };
    });
    
    return {
        totalWords,
        keywordDensity,
        recommendations: generateKeywordRecommendations(keywordDensity)
    };
}

function generateKeywordRecommendations(keywordDensity) {
    const recommendations = [];
    
    Object.entries(keywordDensity).forEach(([keyword, data]) => {
        if (data.density < 0.5) {
            recommendations.push({
                type: 'increase',
                keyword,
                current: data.density,
                recommended: '1-2%',
                message: `Consider increasing usage of "${keyword}" keyword (current: ${data.density.toFixed(2)}%)`
            });
        } else if (data.density > 3) {
            recommendations.push({
                type: 'decrease',
                keyword,
                current: data.density,
                recommended: '1-2%',
                message: `Reduce usage of "${keyword}" keyword to avoid keyword stuffing (current: ${data.density.toFixed(2)}%)`
            });
        }
    });
    
    return recommendations;
}

function generateKeywordSuggestions(post, category, language) {
    const isArabic = language === 'ar';
    const baseKeywords = isArabic ? 
        ['صحة', 'علاج', 'أعراض', 'مرض', 'دواء', 'وقاية', 'عناية'] :
        ['health', 'treatment', 'symptoms', 'disease', 'medicine', 'prevention', 'care'];
    
    const categoryKeywords = category ? [category.name, category.name_ar].filter(Boolean) : [];
    
    return {
        primary: baseKeywords.slice(0, 3),
        secondary: baseKeywords.slice(3),
        category: categoryKeywords,
        long_tail: generateLongTailKeywords(post, language)
    };
}

function generateLongTailKeywords(post, language) {
    const isArabic = language === 'ar';
    const title = isArabic ? post.title_ar || post.title : post.title;
    const categoryName = isArabic ? post.category?.name_ar || post.category?.name : post.category?.name;
    
    const variations = [
        `${title} symptoms`,
        `${title} treatment`,
        `${title} prevention`,
        `${title} diagnosis`,
        `${categoryName} ${title}`,
        `best ${title} medicine`,
        `${title} side effects`
    ];
    
    return isArabic ? variations.map(v => v.replace(/\b\w/g, l => l)) : variations;
}

function generateSEORecommendations(post, keywordAnalysis, language) {
    const recommendations = [];
    
    // Title recommendations
    const title = language === 'ar' ? (post.title_ar || post.title) : post.title;
    if (title.length > 60) {
        recommendations.push({
            type: 'title',
            priority: 'high',
            message: 'Title is too long. Keep it under 60 characters for better SEO.',
            current: `${title.length} characters`,
            recommended: '50-60 characters'
        });
    }
    
    // Description recommendations
    const description = language === 'ar' ? (post.excerpt_ar || post.excerpt) : post.excerpt;
    if (description && description.length > 160) {
        recommendations.push({
            type: 'description',
            priority: 'high',
            message: 'Meta description is too long. Keep it under 160 characters.',
            current: `${description.length} characters`,
            recommended: '150-160 characters'
        });
    }
    
    // Content length recommendations
    const content = language === 'ar' ? (post.content_ar || post.content) : post.content;
    if (content && content.length < 300) {
        recommendations.push({
            type: 'content',
            priority: 'medium',
            message: 'Content is too short. Aim for at least 300 words for better SEO.',
            current: `${content.length} characters`,
            recommended: '300+ characters'
        });
    }
    
    // Keyword density recommendations
    if (keywordAnalysis.recommendations.length > 0) {
        recommendations.push({
            type: 'keywords',
            priority: 'medium',
            message: 'Some keywords need optimization for better density.',
            details: keywordAnalysis.recommendations
        });
    }
    
    return recommendations;
}