const PRIMARY_BACKEND_URL = 'https://kusanyiko-backend-g3je.onrender.com';
const PRODUCTION_FRONTEND_HOSTS = new Set([
  'kusanyiko-frontend.onrender.com',
  'kusanyiko.efathamedia.com',
  'www.kusanyiko.efathamedia.com',
]);

const getBackendBaseUrl = (): string => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }

  const savedURL = localStorage.getItem('REACT_APP_API_URL');
  if (savedURL) {
    return savedURL.replace(/\/$/, '');
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const isDevServer = port === '3000' || port === '5173';

  if (PRODUCTION_FRONTEND_HOSTS.has(hostname)) {
    return PRIMARY_BACKEND_URL;
  }

  if (!isDevServer && (hostname.includes('netlify.app') || hostname.includes('vercel.app'))) {
    const backendHost = hostname.replace(/^[^.]+\./, 'api.');
    return `https://${backendHost}`;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }

  return `http://${hostname}:8000`;
};

export const resolveMediaUrl = (src: string): string | null => {
  const value = src.trim();
  if (!value) {
    return null;
  }

  if (
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value;
  }

  if (value.startsWith('//')) {
    return `${window.location.protocol}${value}`;
  }

  const backendBaseUrl = getBackendBaseUrl();

  if (value.startsWith('/')) {
    return `${backendBaseUrl}${value}`;
  }

  if (value.includes('media/')) {
    return `${backendBaseUrl}/${value.replace(/^\/+/, '')}`;
  }

  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(value)) {
    return `${backendBaseUrl}/media/member_pictures/${value}`;
  }

  return null;
};
