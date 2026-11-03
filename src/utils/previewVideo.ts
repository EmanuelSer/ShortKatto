/**
 * Utility functions for YouTube video preview parameter parsing and sanitization.
 * Supports standard 11-character YouTube video IDs as well as full/short YouTube URLs
 * if passed directly into the 'v=' parameter.
 */

// YouTube video IDs are 11 characters containing letters, numbers, hyphens, and underscores.
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

// Default test video ID requested for evaluation
export const DEFAULT_TEST_VIDEO_ID = 'SjgMmo6_DH0';

/**
 * Checks if the given input represents a YouTube Short (e.g. contains /shorts/ or shorts/).
 */
export function isYouTubeShort(input: string | null | undefined): boolean {
  if (!input) return false;
  const trimmed = input.trim().toLowerCase();
  return trimmed.includes('/shorts/') || trimmed.includes('shorts/') || trimmed.includes('type=short');
}

/**
 * Extracts and sanitizes a YouTube video ID from a raw string, URL, or YouTube Shorts path.
 * Returns the 11-character video ID if valid, or null if invalid/not found.
 */
export function extractYouTubeVideoId(input: string | null | undefined): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct 11-character ID check (e.g. "SjgMmo6_DH0" or "GkrGBnipZzE")
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  // Handle relative shorts paths like "/shorts/GkrGBnipZzE" or "shorts/GkrGBnipZzE"
  const relativeShortsMatch = trimmed.match(/(?:^|\/)shorts\/([a-zA-Z0-9_-]{11})(?:[&?#\/]|$)/i);
  if (relativeShortsMatch && relativeShortsMatch[1] && YOUTUBE_ID_REGEX.test(relativeShortsMatch[1])) {
    return relativeShortsMatch[1];
  }

  // If the user provided a full YouTube URL in the v= parameter
  // e.g. "https://www.youtube.com/shorts/GkrGBnipZzE" or "https://www.youtube.com/watch?v=..."
  try {
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      const urlString = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const url = new URL(urlString);

      // Handle YouTube Shorts URL: /shorts/VIDEO_ID
      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/i);
      if (shortsMatch && shortsMatch[1] && YOUTUBE_ID_REGEX.test(shortsMatch[1])) {
        return shortsMatch[1];
      }

      if (url.hostname.includes('youtu.be')) {
        const id = url.pathname.replace(/^\//, '').split(/[?#&]/)[0];
        if (YOUTUBE_ID_REGEX.test(id)) return id;
      }

      if (url.hostname.includes('youtube.com')) {
        const id = url.searchParams.get('v');
        if (id && YOUTUBE_ID_REGEX.test(id)) return id;

        // Path formats like /embed/VIDEO_ID or /v/VIDEO_ID
        const match = url.pathname.match(/\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/i);
        if (match && match[1]) return match[1];
      }
    }
  } catch {
    // Non-URL string that failed parsing
  }

  // Regex search fallback for an 11-character ID within safe bounds (query parameter, shorts path, or embed path)
  const generalMatch = trimmed.match(/(?:[?&]v=|\/embed\/|\/watch\?v=|\/shorts\/|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?#\/]|$)/i);
  if (generalMatch && generalMatch[1] && YOUTUBE_ID_REGEX.test(generalMatch[1])) {
    return generalMatch[1];
  }

  return null;
}

/**
 * Builds a secure YouTube embed URL with origin, playsinline, and autoplay options.
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options: {
    autoplay?: boolean;
    rel?: boolean;
    controls?: boolean;
    origin?: string;
  } = {}
): string {
  const cleanId = extractYouTubeVideoId(videoId);
  if (!cleanId) return '';

  const autoplay = options.autoplay !== false ? '1' : '0';
  const rel = options.rel ? '1' : '0';
  const controls = options.controls !== false ? '1' : '0';
  const originParam = options.origin ? `&origin=${encodeURIComponent(options.origin)}` : '';

  return `https://www.youtube.com/embed/${cleanId}?autoplay=${autoplay}&rel=${rel}&controls=${controls}&modestbranding=1&playsinline=1&enablejsapi=1${originParam}`;
}

/**
 * Parses query strings (search and hash) and returns preview status.
 * Can fallback to DEFAULT_TEST_VIDEO_ID if no v parameter is provided and fallback is enabled.
 */
export function checkPreviewParams(
  searchQuery: string,
  hashString = '',
  allowDefaultFallback = false,
  pathname = ''
): {
  shouldOpen: boolean;
  videoId: string | null;
  customTitle: string | null;
  isDefaultFallback: boolean;
  isShort: boolean;
} {
  // 1. Check pathname (e.g. /shorts/GkrGBnipZzE)
  if (pathname) {
    const pathnameMatch = pathname.match(/(?:^|\/)shorts\/([a-zA-Z0-9_-]{11})(?:[\/?#]|$)/i);
    if (pathnameMatch && pathnameMatch[1] && YOUTUBE_ID_REGEX.test(pathnameMatch[1])) {
      return {
        shouldOpen: true,
        videoId: pathnameMatch[1],
        customTitle: null,
        isDefaultFallback: false,
        isShort: true,
      };
    }
  }

  // 2. Check search query (?v=... or ?shorts=...)
  try {
    const searchParams = new URLSearchParams(searchQuery);
    const searchV = searchParams.get('v') || searchParams.get('shorts');
    const validSearchId = extractYouTubeVideoId(searchV);

    if (validSearchId) {
      const titleParam = searchParams.get('title');
      const isShort = isYouTubeShort(searchV) || searchParams.get('type') === 'short' || searchParams.get('format') === 'short';
      return {
        shouldOpen: true,
        videoId: validSearchId,
        customTitle: titleParam ? titleParam.trim().slice(0, 80) : null,
        isDefaultFallback: false,
        isShort,
      };
    }
  } catch {
    // ignore
  }

  // 3. Check hash string (#v=... or #/shorts/...)
  if (hashString) {
    try {
      const cleanHash = hashString.replace(/^#\/?/, '').replace(/^\?/, '');
      const hashParams = new URLSearchParams(cleanHash.includes('?') ? cleanHash.split('?')[1] : cleanHash);
      const hashV = hashParams.get('v') || hashParams.get('shorts') || (cleanHash.startsWith('v=') ? cleanHash.split('v=')[1]?.split('&')[0] : null) || (cleanHash.includes('shorts/') ? cleanHash : null);
      const validHashId = extractYouTubeVideoId(hashV);

      if (validHashId) {
        const titleParam = hashParams.get('title');
        const isShort = isYouTubeShort(hashV) || isYouTubeShort(cleanHash);
        return {
          shouldOpen: true,
          videoId: validHashId,
          customTitle: titleParam ? titleParam.trim().slice(0, 80) : null,
          isDefaultFallback: false,
          isShort,
        };
      }
    } catch {
      // ignore
    }
  }

  // 4. Default fallback if requested (for live preview testing when URL params cannot be passed by host)
  if (allowDefaultFallback) {
    return {
      shouldOpen: true,
      videoId: DEFAULT_TEST_VIDEO_ID,
      customTitle: 'Client Video Preview (SjgMmo6_DH0)',
      isDefaultFallback: true,
      isShort: false,
    };
  }

  return {
    shouldOpen: false,
    videoId: null,
    customTitle: null,
    isDefaultFallback: false,
    isShort: false,
  };
}

/**
 * Helper to remove 'v' and optional 'title' from current search query.
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
