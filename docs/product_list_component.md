# ProductList Component Documentation

## Overview

The `ProductList` component is a reusable React component designed to eliminate code duplication when displaying product listings across different pages and contexts. It provides a unified interface for displaying products with support for pagination, loading states, error handling, and multiple data sources.

## Features

- **Multiple Data Sources**: Support for category-based, search-based, featured products, and custom queries
- **Pagination**: Built-in pagination with configurable page sizes
- **Loading States**: Skeleton loading animations during data fetch
- **Error Handling**: Comprehensive error states with retry functionality
- **Empty States**: User-friendly messages when no products are found
- **Responsive Design**: Mobile-first responsive grid layout
- **Internationalization**: Support for both Arabic and English languages
- **Extensible**: Callback hooks for custom analytics and error handling

## Component Interface

```typescript
interface ProductListProps {
  // Core props
  language: 'ar' | 'en';
  onAddToCart: (product: Product) => void;
  
  // Data source configuration
  dataSource: DataSource;
  
  // Optional configuration
  title?: {
    ar: string;
    en: string;
  };
  subtitle?: {
    ar: string;
    en: string;
  };
  showPagination?: boolean;
  initialPageSize?: number;
  className?: string;
  
  // Optional callbacks
  onDataLoad?: (products: Product[], pagination?: PaginationInfo) => void;
  onError?: (error: Error) => void;
}
```

## Data Source Types

### Category-Based Data Source
```typescript
const dataSource: DataSource = {
  type: 'category',
  params: {
    slug: 'medications' // or categoryId: 'uuid'
  }
};
```

### Search-Based Data Source
```typescript
const dataSource: DataSource = {
  type: 'search',
  query: 'search term'
};
```

### Featured Products Data Source
```typescript
const dataSource: DataSource = {
  type: 'featured'
};
```

### Custom Data Source
```typescript
const dataSource: DataSource = {
  type: 'custom',
  params: {
    filters: {
      brand: 'CeraVe',
      price_range: '50-100',
      in_stock: true
    },
    orderBy: {
      field: 'price',
      ascending: false
    }
  }
};
```

## Usage Examples

### Basic Category Page
```typescript
import ProductList, { DataSource } from '../components/ProductList';

function CategoryPage({ language, onAddToCart }) {
  const { slug } = useParams();
  
  const dataSource: DataSource = {
    type: 'category',
    params: { slug }
  };

  return (
    <ProductList
      language={language}
      onAddToCart={onAddToCart}
      dataSource={dataSource}
      title={{ ar: 'الأدوية', en: 'Medications' }}
      showPagination={true}
      initialPageSize={20}
    />
  );
}
```

### Search Page
```typescript
import ProductList, { DataSource } from '../components/ProductList';

function SearchPage({ language, onAddToCart }) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const dataSource: DataSource = {
    type: 'search',
    query
  };

  return (
    <ProductList
      language={language}
      onAddToCart={onAddToCart}
      dataSource={dataSource}
      title={{
        ar: `نتائج البحث عن: "${query}"`,
        en: `Search Results for: "${query}"`
      }}
      onDataLoad={(products, pagination) => {
        // Analytics tracking
        analytics.track('search_results_loaded', {
          query,
          productCount: products.length,
          pageCount: pagination?.totalPages
        });
      }}
    />
  );
}
```

### Featured Products Section
```typescript
function FeaturedProducts({ language, onAddToCart }) {
  const dataSource: DataSource = {
    type: 'featured'
  };

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">
          {language === 'ar' ? 'المنتجات المميزة' : 'Featured Products'}
        </h2>
        <ProductList
          language={language}
          onAddToCart={onAddToCart}
          dataSource={dataSource}
          showPagination={false}
          initialPageSize={8}
          className="bg-transparent py-0"
        />
      </div>
    </div>
  );
}
```

## Component Behavior

### Loading States
- Shows skeleton animations while fetching data
- Displays page header skeleton if title/subtitle are provided
- Shows product grid skeleton with 8 placeholder items

### Error States
- Displays comprehensive error message with retry button
- Logs error details to console for debugging
- Provides localized error messages

### Empty States
- Shows user-friendly empty state when no products are found
- Suggests trying different search terms or filters
- Provides helpful guidance based on context

### Pagination
- Automatically calculates total pages based on product count
- Provides page size selector (10, 20, 50 items per page)
- Shows current range (e.g., "Showing 1-20 of 100 products")
- Includes previous/next buttons with proper navigation
- Displays numbered page buttons with intelligent truncation

## Benefits

### Code Reduction
- **Before**: 100+ lines of duplicated code per page
- **After**: 20-30 lines of configuration per page

### Consistent User Experience
- Unified loading states across all product listings
- Consistent error handling and retry mechanisms
- Standardized pagination and navigation

### Maintainability
- Centralized product listing logic
- Easy to update loading states or error handling
- Single source of truth for pagination behavior

### Performance
- Efficient pagination with database-level limiting
- Optimized query building for different data sources
- Lazy loading of additional data

## Migration Guide

### From CategoryPage
1. Remove product state management code
2. Remove loading and error state logic
3. Replace product grid with ProductList component
4. Configure data source for category
5. Remove pagination logic

### From SearchPage
1. Remove search-specific API calls
2. Replace search results grid with ProductList
3. Configure data source for search
4. Update header to use component props

### Before (CategoryPage)
```typescript
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

// ... 50+ lines of data fetching logic

{loading ? (
  <LoadingSkeleton />
) : (
  <ProductGrid products={products} />
)}
```

### After (CategoryPage)
```typescript
const dataSource: DataSource = {
  type: 'category',
  params: { slug }
};

<ProductList
  language={language}
  onAddToCart={onAddToCart}
  dataSource={dataSource}
/>
```

## Best Practices

### Performance
- Use appropriate initial page size (20 for main listings, 8 for featured sections)
- Enable pagination for large datasets
- Use custom data sources for complex filtering

### User Experience
- Provide meaningful titles and subtitles
- Use callback functions for analytics tracking
- Handle errors gracefully with user-friendly messages

### Internationalization
- Always provide both Arabic and English text
- Use the translation helper function `t(ar, en)`
- Ensure proper RTL layout support

### Error Handling
- Provide onError callback for custom error logging
- Use retry functionality for network errors
- Log detailed error information for debugging

## Testing

### Unit Tests
- Test different data source configurations
- Verify pagination calculations
- Test loading and error states

### Integration Tests
- Test with real API responses
- Verify user interactions with pagination
- Test error recovery scenarios

### Visual Tests
- Verify loading skeleton animations
- Test responsive behavior on different screen sizes
- Confirm proper RTL layout

## Future Enhancements

### Planned Features
- Virtual scrolling for large datasets
- Advanced filtering sidebar integration
- Sort options dropdown
- View mode toggle (grid/list)
- Product comparison functionality

### Extensibility
- Plugin system for custom data sources
- Theme system for custom styling
- Advanced analytics integration
- A/B testing support for different layouts
