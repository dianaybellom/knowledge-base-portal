// Mismos orígenes de video que valida el backend (Backend/src/utils/embeds.js).
export function isAllowedEmbedUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();
  if (host === 'www.youtube.com' || host === 'www.youtube-nocookie.com') {
    return url.pathname.startsWith('/embed/');
  }
  if (host.endsWith('.sharepoint.com')) {
    return url.pathname.toLowerCase().includes('/_layouts/15/embed.aspx');
  }
  return false;
}
