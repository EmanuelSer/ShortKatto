/**
 * Utility functions for YouTube video preview parameter parsing and sanitization.
 * Supports standard 11-character YouTube video IDs as well as full/short YouTube URLs
 * if passed directly into the 'v=' parameter.
 */

// YouTube video IDs are 11 characters containing letters, numbers, hyphens, and underscores.
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts and sanitizes a YouTube video ID from a raw string or URL.
 * Returns the 11-character video ID if valid, or null if invalid/not found.
 */
export function extractYouTubeVideoId(input: string | null | undefined): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct 11-character ID check
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  // If the user accidentally provided a full YouTube URL in the v= parameter
  // e.g. "https://www.youtube.com/watch?v=dQw4w9WgXcQ" or "https://youtu.be/dQw4w9WgXcQ"
  try {
    // If it looks like a URL, parse it
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      const urlString = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const url = new URL(urlString);

      if (url.hostname.includes('youtu.be')) {
        const id = url.pathname.replace(/^\//, '').split(/[?#&]/)[0];
        if (YOUTUBE_ID_REGEX.test(id)) return id;
      }

      if (url.hostname.includes('youtube.com')) {
        const id = url.searchParams.get('v');
        if (id && YOUTUBE_ID_REGEX.test(id)) return id;

        // Path formats like /embed/VIDEO_ID or /v/VIDEO_ID
        const match = url.pathname.match(/\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/);
        if (match && match[1]) return match[1];
      }
    }
  } catch {
    // Non-URL string that failed parsing
  }

  // Regex search fallback for an 11-character ID within safe bounds (URL query parameter or path segment)
  const generalMatch = trimmed.match(/(?:[?&]v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?#]|$)/);
  if (generalMatch && generalMatch[1] && YOUTUBE_ID_REGEX.test(generalMatch[1])) {
    return generalMatch[1];
  }

  return null;
}

/**
 * Builds a secure, privacy-enhanced YouTube embed URL with autoplay enabled.
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options: {
    autoplay?: boolean;
    rel?: boolean;
    controls?: boolean;
    enableJsApi?: boolean;
  } = {}
): string {
  const cleanId = extractYouTubeVideoId(videoId);
  if (!cleanId) return '';

  const autoplay = options.autoplay !== false ? '1' : '0';
  const rel = options.rel ? '1' : '0';
  const controls = options.controls !== false ? '1' : '0';

  // Use youtube-nocookie.com for privacy and seamless playback
  return `https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=${autoplay}&rel=${rel}&controls=${controls}&modestbranding=1&playsinline=1`;
}

/**
 * Parses a window.location.search query string and returns preview status and metadata.
 */
export function checkPreviewParams(searchQuery: string): {
  shouldOpen: boolean;
  videoId: string | null;
  customTitle: string | null;
} {
  if (!searchQuery) {
    return { shouldOpen: false, videoId: null, customTitle: null };
  }

  try {
    const params = new URLSearchParams(searchQuery);
    const rawV = params.get('v');
    const videoId = extractYouTubeVideoId(rawV);

    const titleParam = params.get('title');
    const customTitle = titleParam ? titleParam.trim().slice(0, 80) : null;

    return {
      shouldOpen: videoId !== null,
      videoId,
      customTitle,
    };
  } catch {
    return { shouldOpen: false, videoId: null, customTitle: null };
  }
}

/**
 * Helper to remove 'v' and optional 'title' from the current URL without a page reload.
 */
export function getCleanUrlWithoutPreview(currentSearch: string, currentPath: string): string {
  try {
    const params = new URLSearchParams(currentSearch);
    params.delete('v');
    params.delete('title');
    const newQuery = params.toString();
    return newQuery ? `${currentPath}?${newQuery}` : currentPath;
  } catch {
    return currentPath;
  }
}
