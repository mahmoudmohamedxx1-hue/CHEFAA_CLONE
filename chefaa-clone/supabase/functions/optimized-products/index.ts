Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const order = url.searchParams.get('order') || 'desc';

    // Build optimized query
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use direct SQL for better performance
    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.name_ar as category_name_ar,
        COUNT(r.id) as review_count,
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
    `;

    const params: any[] = [];
    
    if (category) {
      query += ` WHERE c.slug = $1`;
      params.push(category);
    }

    query += `
      GROUP BY p.id, c.name, c.name_ar
      ORDER BY p.${sortBy} ${order}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_products_optimized`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          category_slug: category,
          limit_count: limit,
          offset_count: offset,
          sort_by: sortBy,
          sort_order: order,
        }),
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
