
/**
 * API Configuration — Live Database Mode
 * 
 * All data operations go through the Express REST API server
 * which connects to Aiven PostgreSQL via SSL.
 * 
 * In development, Vite proxies /api/* to http://localhost:5000
 * In production, the API server handles both static files and API routes.
 */

export const API_BASE = '/api';

/**
 * Always true — the app is now connected to a live database.
 * Kept for backward compatibility with any code that checks this flag.
 */
export const isSupabaseConfigured = true;

/**
 * Null — no longer using the Supabase JS client.
 * Kept as export to avoid breaking import statements across the app.
 */
export const supabase = null;
