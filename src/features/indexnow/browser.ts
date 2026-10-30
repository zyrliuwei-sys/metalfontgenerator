import { ApiError, apiGetText } from '@/lib/api-client';

// Read from the browser so Workers never need to fetch their own domain.
export async function checkKeyFile(key: string) {
  try {
    const body = await apiGetText(`/${encodeURIComponent(key)}.txt`);
    return { ok: body === key, status: 200 };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, status: error.code };
    throw error;
  }
}

export async function readSitemap(): Promise<string[]> {
  const visited = new Set<string>();
  const urls = new Set<string>();

  async function read(location: string): Promise<void> {
    const url = new URL(location, window.location.origin);
    if (url.origin !== window.location.origin) {
      throw new Error('Sitemaps must be hosted on this site');
    }
    url.hash = '';
    if (visited.has(url.href)) return;
    if (visited.size >= 100) throw new Error('Too many nested sitemaps');
    visited.add(url.href);
    const xml = await apiGetText(url.href);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) {
      throw new Error('Invalid sitemap XML');
    }
    const locations = [...doc.getElementsByTagNameNS('*', 'loc')]
      .map((element) => element.textContent?.trim() ?? '')
      .filter(Boolean);
    if (doc.documentElement.localName === 'sitemapindex') {
      for (const nested of locations) await read(new URL(nested, url).href);
    } else if (doc.documentElement.localName === 'urlset') {
      for (const location of locations) urls.add(location);
    } else {
      throw new Error('Expected a sitemap urlset or sitemapindex');
    }
  }

  await read('/sitemap.xml');
  return [...urls];
}
