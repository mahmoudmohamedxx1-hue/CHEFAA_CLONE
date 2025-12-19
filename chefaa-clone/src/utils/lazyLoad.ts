import { ComponentType, lazy } from 'react';

/**
 * Simple lazy load component helper
 */
export function lazyLoadComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(componentImport);
}
