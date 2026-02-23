/**
 * Application configuration
 */
export const config = {
  // API Base URL - defaults to local if not set
  // In production on Vercel, set VITE_API_BASE_URL to your backend URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  
  // WebSocket URL
  wsUrl: import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`,
  
  // Stripe Publishable Key
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
  
  // Google Maps API Key
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
};
