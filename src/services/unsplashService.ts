/**
 * Fetches a relevant stock food photo from the Unsplash API.
 *
 * Returns a photo URL string on success, or null if:
 *  - The API key hasn't been added yet (pending approval)
 *  - The API rate limit has been hit (50 req/hour on free tier)
 *  - The search returns no results
 *  - Any network error occurs
 *
 * The caller is responsible for handling the null case (show a placeholder).
 */
export async function fetchStockPhoto(query: string): Promise<string | null> {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  // Key not set yet — fail silently, placeholder will be shown instead
  if (!accessKey) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      query,
      orientation: 'landscape',
      per_page: '1',
      content_filter: 'high',
    });

    const response = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    // Use the 'regular' size — good quality without being too large
    return data.results[0].urls.regular as string;
  } catch {
    return null;
  }
}
