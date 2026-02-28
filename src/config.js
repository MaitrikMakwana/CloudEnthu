// Central API base URL config.
// On Vercel: frontend & backend share the same domain, so base is empty string (relative URLs).
// Locally: use VITE_API_URL from .env.local (e.g. http://localhost:3001)
const API_BASE = import.meta.env.VITE_API_URL || '';

export default API_BASE;
