/**
 * Force reload the page with cache clearing
 */
export function forceReloadWithCacheClear() {
  // Clear all session storage
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear session storage:', e);
    }
  }
  
  // Force reload with cache bypass
  if (typeof window !== 'undefined') {
    // Add timestamp to force fresh load
    const timestamp = new Date().getTime();
    const url = new URL(window.location.href);
    url.searchParams.set('_t', timestamp.toString());
    
    // Use location.replace to prevent back button issues
    window.location.replace(url.toString());
  }
}

/**
 * Clear Next.js router cache
 */
export function clearNextJsCache() {
  if (typeof window !== 'undefined') {
    // Clear router cache by navigating away and back
    const currentPath = window.location.pathname;
    
    // First navigate to a different route
    window.history.pushState(null, '', '/');
    
    // Then immediately navigate back
    setTimeout(() => {
      window.location.href = currentPath;
    }, 0);
  }
}

/**
 * Add cache control meta tags
 */
export function addCacheControlMetaTags() {
  if (typeof document !== 'undefined') {
    // Remove existing cache control meta tags
    const existingTags = document.querySelectorAll('meta[http-equiv="cache-control"], meta[http-equiv="pragma"], meta[http-equiv="expires"]');
    existingTags.forEach(tag => tag.remove());
    
    // Add new cache control meta tags
    const cacheControl = document.createElement('meta');
    cacheControl.setAttribute('http-equiv', 'cache-control');
    cacheControl.setAttribute('content', 'no-cache, no-store, must-revalidate');
    
    const pragma = document.createElement('meta');
    pragma.setAttribute('http-equiv', 'pragma');
    pragma.setAttribute('content', 'no-cache');
    
    const expires = document.createElement('meta');
    expires.setAttribute('http-equiv', 'expires');
    expires.setAttribute('content', '0');
    
    document.head.appendChild(cacheControl);
    document.head.appendChild(pragma);
    document.head.appendChild(expires);
  }
}
