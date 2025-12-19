// Related Content Suggestion Edge Function
// Purpose: Generate related blog posts and product recommendations

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
        const { post_id, limit = 5, include_products = true } = await req.json();
        
        if (!post_id) {
            throw new Error('Post ID is required');
        }

        // Access Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Fetch the current post
        const currentPostResponse = await fetch(`${supabaseUrl}/rest/v1/blog_posts?id=eq.${post_id}&select=*,category:blog_categories(*),tags:blog_post_tags(tag:blog_tags(*))`, {
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        if (!currentPostResponse.ok) {
            throw new Error('Failed to fetch current blog post');
        }

        const currentPosts = await currentPostResponse.json();
        if (!currentPosts || currentPosts.length === 0) {
            throw new Error('Blog post not found');
        }

        const currentPost = currentPosts[0];

        // Generate related posts using AI similarity scoring
        const relatedPosts = await generateRelatedPosts(currentPost, supabaseUrl, supabaseKey, limit);
        
        // Generate related products if requested
        let relatedProducts = [];
        if (include_products) {
            relatedProducts = await generateRelatedProducts(currentPost, supabaseUrl, supabaseKey);
        }

        // Calculate similarity scores
        const postsWithScores = relatedPosts.map(post => ({
            ...post,
            similarity_score: calculateSimilarityScore(currentPost, post)
        })).sort((a, b) => b.similarity_score - a.similarity_score);

        // Generate content suggestions
        const suggestions = generateContentSuggestions(currentPost, postsWithScores);

        return new Response(JSON.stringify({
            success: true,
            data: {
                related_posts: postsWithScores.slice(0, limit),
                related_products: relatedProducts,
                content_suggestions: suggestions,
                analytics: {
                    total_related_found: relatedPosts.length,
                    average_similarity: postsWithScores.reduce((sum, post) => sum + post.similarity_score, 0) / postsWithScores.length,
                    category_match: postsWithScores.filter(post => post.category_id === currentPost.category_id).length,
                    tag_matches: postsWithScores.filter(post => hasCommonTags(currentPost, post)).length
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Related content suggestion error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'RELATED_CONTENT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function generateRelatedPosts(currentPost, supabaseUrl, supabaseKey, limit) {
    // Get posts from the same category
    const categoryResponse = await fetch(`${supabaseUrl}/rest/v1/blog_posts?category_id=eq.${currentPost.category_id}&status=eq.published&id=neq.${currentPost.id}&select=*,category:blog_categories(*)&limit=20`, {
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    let relatedPosts = [];
    
    if (categoryResponse.ok) {
        const categoryPosts = await categoryResponse.json();
        relatedPosts.push(...categoryPosts);
    }

    // If we don't have enough posts from the same category, get posts from other categories
    if (relatedPosts.length < limit) {
        const otherPostsResponse = await fetch(`${supabaseUrl}/rest/v1/blog_posts?category_id=neq.${currentPost.category_id}&status=eq.published&id=neq.${currentPost.id}&select=*,category:blog_categories(*)&order=published_at.desc&limit=20`, {
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        if (otherPostsResponse.ok) {
            const otherPosts = await otherPostsResponse.json();
            relatedPosts.push(...otherPosts);
        }
    }

    return relatedPosts.slice(0, limit * 2); // Get more than needed for better scoring
}

async function generateRelatedProducts(currentPost, supabaseUrl, supabaseKey) {
    const categoryName = currentPost.category?.name?.toLowerCase() || '';
    const title = currentPost.title?.toLowerCase() || '';
    const content = currentPost.content?.toLowerCase() || '';

    // Extract medical terms from the post content
    const medicalTerms = extractMedicalTerms(title + ' ' + content);
    
    // Search products that might be related
    const productTerms = medicalTerms.slice(0, 5).join(' OR ');
    
    let productsQuery = `${supabaseUrl}/rest/v1/products?or=(name.ilike.%${productTerms}%,name_ar.ilike.%${productTerms}%,category.ilike.%${categoryName}%)&limit=6`;
    
    const productsResponse = await fetch(productsQuery, {
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        }
    });

    if (productsResponse.ok) {
        const products = await productsResponse.json();
        return products.map(product => ({
            product_id: product.id,
            product_name: product.name,
            product_name_ar: product.name_ar,
            product_price: product.price,
            product_image_url: product.images?.[0] || '',
            link_url: `/product/${product.slug || product.id}`,
            relevance_score: calculateProductRelevance(product, medicalTerms, categoryName)
        })).sort((a, b) => b.relevance_score - a.relevance_score);
    }

    return [];
}

function calculateSimilarityScore(post1, post2) {
    let score = 0;
    
    // Category match (high weight)
    if (post1.category_id === post2.category_id) {
        score += 40;
    }
    
    // Tag overlap (medium weight)
    const tagOverlap = calculateTagOverlap(post1, post2);
    score += tagOverlap * 30;
    
    // Content similarity (medium weight)
    const contentSimilarity = calculateContentSimilarity(
        post1.title + ' ' + post1.content,
        post2.title + ' ' + post2.content
    );
    score += contentSimilarity * 20;
    
    // Recency bonus (low weight)
    const daysDiff = Math.abs(new Date(post1.published_at) - new Date(post2.published_at)) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 10 - (daysDiff / 30));
    score += recencyScore;
    
    // Popularity bonus (low weight)
    const popularityScore = Math.min(10, (post2.views_count + post2.likes_count) / 100);
    score += popularityScore;
    
    return Math.min(100, score);
}

function calculateTagOverlap(post1, post2) {
    if (!post1.tags || !post2.tags) return 0;
    
    const tags1 = new Set(post1.tags.map(t => t.tag?.slug));
    const tags2 = new Set(post2.tags.map(t => t.tag?.slug));
    
    const intersection = new Set([...tags1].filter(x => tags2.has(x)));
    const union = new Set([...tags1, ...tags2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateContentSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateProductRelevance(product, medicalTerms, categoryName) {
    let relevance = 0;
    
    // Category relevance
    if (product.category?.toLowerCase().includes(categoryName)) {
        relevance += 30;
    }
    
    // Name/title relevance
    const productName = (product.name + ' ' + (product.name_ar || '')).toLowerCase();
    medicalTerms.forEach(term => {
        if (productName.includes(term.toLowerCase())) {
            relevance += 10;
        }
    });
    
    // Description relevance
    const description = (product.description + ' ' + (product.description_ar || '')).toLowerCase();
    medicalTerms.forEach(term => {
        if (description.includes(term.toLowerCase())) {
            relevance += 5;
        }
    });
    
    return Math.min(100, relevance);
}

function extractMedicalTerms(text) {
    // Common medical and health-related terms
    const medicalTerms = [
        'diabetes', 'insulin', 'blood sugar', 'glucose', 'cholesterol', 'blood pressure',
        'heart', 'cardiac', 'lung', 'respiratory', 'digestive', 'gastrointestinal',
        'brain', 'neural', 'mental', 'psychological', 'stress', 'anxiety', 'depression',
        'skin', 'dermatology', 'allergy', 'immune', 'infection', 'virus', 'bacteria',
        'pain', 'inflammation', 'fever', 'headache', 'migraine', 'back pain',
        'vitamin', 'mineral', 'supplement', 'nutrition', 'diet', 'exercise',
        'weight', 'obesity', 'smoking', 'alcohol', 'sleep', 'fatigue',
        'cancer', 'tumor', 'chemotherapy', 'radiation', 'surgery', 'therapy',
        'pregnancy', 'baby', 'child', 'pediatric', 'elderly', 'senior',
        'medication', 'drug', 'pharmaceutical', 'prescription', 'treatment',
        'symptoms', 'diagnosis', 'prognosis', 'prevention', 'vaccination',
        // Arabic medical terms
        'سكر', 'ضغط', 'قلب', 'رئة', 'دماغ', 'جلد', 'حساسية', 'عدوى',
        'فيتامين', 'تغذية', 'رياضة', 'وزن', 'أرق', 'ألم', 'حمى'
    ];
    
    return medicalTerms.filter(term => 
        text.toLowerCase().includes(term.toLowerCase())
    );
}

function hasCommonTags(post1, post2) {
    if (!post1.tags || !post2.tags) return false;
    
    const tags1 = new Set(post1.tags.map(t => t.tag?.slug));
    const tags2 = new Set(post2.tags.map(t => t.tag?.slug));
    
    return [...tags1].some(tag => tags2.has(tag));
}

function generateContentSuggestions(currentPost, relatedPosts) {
    const suggestions = {
        similar_topics: [],
        content_gaps: [],
        improved_readability: [],
        cross_reference_opportunities: []
    };
    
    // Suggest similar topics based on related posts
    const categories = [...new Set(relatedPosts.map(post => post.category?.name).filter(Boolean))];
    if (categories.length > 0) {
        suggestions.similar_topics = categories.map(category => ({
            topic: category,
            related_posts: relatedPosts.filter(post => post.category?.name === category).length,
            recommendation: `Consider exploring more content about ${category.toLowerCase()}`
        }));
    }
    
    // Identify content gaps
    if (relatedPosts.length < 3) {
        suggestions.content_gaps.push({
            type: 'limited_related_content',
            message: 'Limited related content available. Consider creating more articles in this category.',
            priority: 'medium'
        });
    }
    
    // Readability improvements
    const avgWordCount = relatedPosts.reduce((sum, post) => sum + (post.content?.length || 0), 0) / relatedPosts.length;
    const currentWordCount = currentPost.content?.length || 0;
    
    if (currentWordCount < avgWordCount * 0.7) {
        suggestions.improved_readability.push({
            type: 'content_length',
            message: 'Your content is shorter than similar articles. Consider expanding with more detailed information.',
            current: `${currentWordCount} words`,
            recommended: `${Math.round(avgWordCount)} words (average of related articles)`
        });
    }
    
    // Cross-reference opportunities
    const highSimilarityPosts = relatedPosts.filter(post => post.similarity_score > 70);
    if (highSimilarityPosts.length > 0) {
        suggestions.cross_reference_opportunities = highSimilarityPosts.map(post => ({
            post_id: post.id,
            title: post.title,
            similarity: post.similarity_score,
            recommendation: 'Strong thematic similarity - consider cross-referencing in content'
        }));
    }
    
    return suggestions;
}