const stripTrailingSlash = (url: string): string => (url.endsWith('/') ? url.slice(0, -1) : url);

export const getApiUrl = (): string => {
  const url: unknown = import.meta.env.VITE_API_URL;
  return typeof url === 'string' ? stripTrailingSlash(url) : '';
};

export const getWsUrl = (path: string): string => {
  const apiUrl = getApiUrl();

  if (apiUrl) {
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = apiUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${wsHost}${path}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
};
