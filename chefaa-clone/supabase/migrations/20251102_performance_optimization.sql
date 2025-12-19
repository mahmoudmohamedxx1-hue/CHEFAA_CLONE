-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- Create optimized RPC function for fetching products
CREATE OR REPLACE FUNCTION get_products_optimized(
  category_slug TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0,
  sort_by TEXT DEFAULT 'created_at',
  sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_ar TEXT,
  slug TEXT,
  description TEXT,
  description_ar TEXT,
  price NUMERIC,
  stock_quantity INTEGER,
  rating NUMERIC,
  review_count BIGINT,
  images TEXT[],
  brand TEXT,
  category_id UUID,
  category_name TEXT,
  category_name_ar TEXT,
  formulation TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.name_ar,
    p.slug,
    p.description,
    p.description_ar,
    p.price,
    p.stock_quantity,
    COALESCE(AVG(r.rating), 0)::NUMERIC as rating,
    COUNT(r.id) as review_count,
    p.images,
    p.brand,
    p.category_id,
    c.name as category_name,
    c.name_ar as category_name_ar,
    p.formulation,
    p.created_at
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN reviews r ON p.id = r.product_id
  WHERE (category_slug IS NULL OR c.slug = category_slug)
  GROUP BY p.id, c.name, c.name_ar
  ORDER BY 
    CASE 
      WHEN sort_by = 'price' AND sort_order = 'asc' THEN p.price
      ELSE NULL
    END ASC NULLS LAST,
    CASE 
      WHEN sort_by = 'price' AND sort_order = 'desc' THEN p.price
      ELSE NULL
    END DESC NULLS LAST,
    CASE 
      WHEN sort_by = 'rating' AND sort_order = 'desc' THEN COALESCE(AVG(r.rating), 0)
      ELSE NULL
    END DESC NULLS LAST,
    CASE 
      WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN p.created_at
      ELSE NULL
    END DESC NULLS LAST,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function for search optimization
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_ar TEXT,
  slug TEXT,
  description TEXT,
  description_ar TEXT,
  price NUMERIC,
  stock_quantity INTEGER,
  rating NUMERIC,
  images TEXT[],
  brand TEXT,
  category_name TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.name_ar,
    p.slug,
    p.description,
    p.description_ar,
    p.price,
    p.stock_quantity,
    p.rating,
    p.images,
    p.brand,
    c.name as category_name,
    ts_rank(
      to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.brand, '')),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE 
    to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.brand, '')) 
    @@ plainto_tsquery('english', search_query)
    OR p.name ILIKE '%' || search_query || '%'
    OR p.name_ar ILIKE '%' || search_query || '%'
    OR p.brand ILIKE '%' || search_query || '%'
  ORDER BY relevance DESC, p.rating DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add text search index
CREATE INDEX IF NOT EXISTS idx_products_search ON products 
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(brand, '')));

-- Enable Realtime for products table (for inventory updates)
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_products_optimized TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_products TO anon, authenticated;
