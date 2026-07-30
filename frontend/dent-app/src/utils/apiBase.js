// Backend adresi. Vercel'de VITE_API_URL ortam değişkeni ayarlanır,
// yerelde ayarlanmazsa localhost:5000'e düşer.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
