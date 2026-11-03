/**
 * ShortKatto Isolated Preview Modal Controller
 *
 * Checks for the presence of ?v= (or #v=) in the URL.
 * When present, or when running in the live preview without URL parameters,
 * it displays an isolated custom modal with the unlisted YouTube video
 * playing over the blurred ShortKatto homepage.
 *
 * No database or file lookups are performed; the URL is self-contained.
 */

export const DEFAULT_TEST_VIDEO_ID = 'SjgMmo6_DH0';
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function isShortVideo(input) {
  if (!input) return false;
  const str = String(input).trim().toLowerCase();
  return str.includes('/shorts/') || str.includes('shorts/') || str.includes('type=short');
}

export function extractVideoId(input) {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  // Handle relative shorts paths like "/shorts/GkrGBnipZzE" or "shorts/GkrGBnipZzE"
  const relativeShortsMatch = trimmed.match(/(?:^|\/)shorts\/([a-zA-Z0-9_-]{11})(?:[&?#\/]|$)/i);
  if (relativeShortsMatch && relativeShortsMatch[1] && YOUTUBE_ID_REGEX.test(relativeShortsMatch[1])) {
    return relativeShortsMatch[1];
  }

  // Gracefully handle full YouTube URLs (including /shorts/...) if passed as parameter
  try {
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      const urlStr = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const parsed = new URL(urlStr);

      // Shorts URL format: /shorts/VIDEO_ID
      const shortsMatch = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/i);
      if (shortsMatch && shortsMatch[1] && YOUTUBE_ID_REGEX.test(shortsMatch[1])) {
        return shortsMatch[1];
      }

      if (parsed.hostname.includes('youtu.be')) {
        const id = parsed.pathname.replace(/^\//, '').split(/[?#&]/)[0];
        if (YOUTUBE_ID_REGEX.test(id)) return id;
      }

      if (parsed.hostname.includes('youtube.com')) {
        const id = parsed.searchParams.get('v');
        if (id && YOUTUBE_ID_REGEX.test(id)) return id;

        const pathMatch = parsed.pathname.match(/\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/i);
        if (pathMatch && pathMatch[1]) return pathMatch[1];
      }
    }
  } catch {
    // ignore URL parse errors
  }

  const match = trimmed.match(/(?:[?&]v=|\/embed\/|\/watch\?v=|\/shorts\/|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?#\/]|$)/i);
  if (match && match[1] && YOUTUBE_ID_REGEX.test(match[1])) {
    return match[1];
  }

  return null;
}

export function buildEmbedUrl(videoId) {
  const cleanId = extractVideoId(videoId);
  if (!cleanId) return '';
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : '';
  return `https://www.youtube.com/embed/${cleanId}?autoplay=1&rel=0&controls=1&modestbranding=1&playsinline=1&enablejsapi=1${originParam}`;
}

export function initPreviewModal() {
  const modalEl = document.getElementById('videoPreviewModal');
  const dialogCard = modalEl ? modalEl.querySelector('.preview-modal-dialog') : null;
  const iframeEl = document.getElementById('previewVideoIframe');
  const closeBtn = document.getElementById('previewCloseBtn');
  const exitBtn = document.getElementById('previewExitBtn');
  const plansCtaBtn = document.getElementById('previewPlansCtaBtn');
  const modalTitleEl = document.getElementById('previewModalTitle');
  const badgeTextEl = modalEl ? modalEl.querySelector('.preview-pill-badge') : null;
  const directLinkEl = document.getElementById('previewDirectLink');
  const floatingTrigger = document.getElementById('previewFloatingTrigger');

  if (!modalEl || !iframeEl) {
    return;
  }

  function openPreview(videoId, customTitle, isShort = false) {
    const cleanId = extractVideoId(videoId) || DEFAULT_TEST_VIDEO_ID;
    const embedUrl = buildEmbedUrl(cleanId);
    if (!embedUrl) return;

    if (modalTitleEl) {
      modalTitleEl.textContent = customTitle || (isShort ? `Client YouTube Short Preview (${cleanId})` : `Client Video Preview (${cleanId})`);
    }

    if (badgeTextEl) {
      badgeTextEl.innerHTML = isShort
        ? '<span class="preview-pulse-dot" aria-hidden="true"></span> YouTube Short Draft'
        : '<span class="preview-pulse-dot" aria-hidden="true"></span> Client Draft Preview';
    }

    if (dialogCard) {
      if (isShort) {
        dialogCard.classList.add('preview-mode-short');
      } else {
        dialogCard.classList.remove('preview-mode-short');
      }
    }

    if (directLinkEl) {
      directLinkEl.href = isShort
        ? `https://www.youtube.com/shorts/${cleanId}`
        : `https://www.youtube.com/watch?v=${cleanId}`;
    }

    // Set autoplay embed with origin
    iframeEl.src = embedUrl;

    // Show modal and activate background blur on ShortKatto homepage
    modalEl.setAttribute('aria-hidden', 'false');
    modalEl.style.display = 'flex';
    document.body.classList.add('preview-modal-open');

    // Accessibility focus
    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 80);
    }
  }

  function closePreview(cleanUrl = true) {
    // Stop playback by clearing iframe src
    iframeEl.src = '';

    // Mark dismissed in this browser session so normal homepage browsing isn't blocked
    try {
      sessionStorage.setItem('sk_preview_dismissed', 'true');
    } catch {
      // ignore
    }

    // Hide modal and remove blur from homepage
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.style.display = 'none';
    document.body.classList.remove('preview-modal-open');

    if (dialogCard) {
      dialogCard.classList.remove('preview-mode-short');
    }

    // Clean URL without triggering page reload
    if (cleanUrl) {
      try {
        const currentUrl = new URL(window.location.href);
        let changed = false;

        if (currentUrl.searchParams.has('v') || currentUrl.searchParams.has('shorts') || currentUrl.searchParams.has('title')) {
          currentUrl.searchParams.delete('v');
          currentUrl.searchParams.delete('shorts');
          currentUrl.searchParams.delete('title');
          changed = true;
        }

        // If path was /shorts/ID, reset to /
        if (currentUrl.pathname.includes('/shorts/')) {
          currentUrl.pathname = '/';
          changed = true;
        }

        if (changed) {
          const newPath = currentUrl.pathname + (currentUrl.search ? currentUrl.search : '') + (currentUrl.hash ? currentUrl.hash : '');
          window.history.replaceState({}, document.title, newPath);
        }
      } catch (err) {
        console.warn('Could not update history state:', err);
      }
    }
  }

  function checkUrlAndToggle() {
    // 1. Check Pathname for direct shorts access (e.g. /shorts/GkrGBnipZzE)
    const pathnameMatch = window.location.pathname.match(/(?:^|\/)shorts\/([a-zA-Z0-9_-]{11})(?:[\/?#]|$)/i);
    if (pathnameMatch && pathnameMatch[1] && YOUTUBE_ID_REGEX.test(pathnameMatch[1])) {
      openPreview(pathnameMatch[1], null, true);
      return;
    }

    // 2. Check Search Query (?v=... or ?shorts=...)
    const searchParams = new URLSearchParams(window.location.search);
    const searchV = searchParams.get('v') || searchParams.get('shorts');
    const validSearchId = extractVideoId(searchV);

    if (validSearchId) {
      const titleParam = searchParams.get('title');
      const isShort = isShortVideo(searchV) || searchParams.get('type') === 'short' || searchParams.get('format') === 'short';
      openPreview(validSearchId, titleParam ? titleParam.trim() : null, isShort);
      return;
    }

    // 3. Check Hash Query (e.g. #v=SjgMmo6_DH0, #shorts/GkrGBnipZzE, or #?v=...)
    const hash = window.location.hash || '';
    if (hash.includes('v=') || hash.includes('shorts/')) {
      const cleanHash = hash.replace(/^#\/?/, '').replace(/^\?/, '');
      const hashParams = new URLSearchParams(cleanHash.includes('?') ? cleanHash.split('?')[1] : cleanHash);
      const hashV = hashParams.get('v') || hashParams.get('shorts') || (cleanHash.startsWith('v=') ? cleanHash.split('v=')[1]?.split('&')[0] : null) || cleanHash;
      const validHashId = extractVideoId(hashV);
      if (validHashId) {
        const titleParam = hashParams.get('title');
        const isShort = isShortVideo(hashV) || cleanHash.includes('shorts/');
        openPreview(validHashId, titleParam ? titleParam.trim() : null, isShort);
        return;
      }
    }

    // 4. Fallback for AI Studio preview:
    // If the visitor lands on the preview as it is, display the test video ID so it can be previewed immediately.
    // If user previously closed it in this session, keep it closed so they can browse the homepage.
    const isDismissed = sessionStorage.getItem('sk_preview_dismissed') === 'true';
    if (!isDismissed) {
      openPreview(DEFAULT_TEST_VIDEO_ID, 'Client Video Preview (SjgMmo6_DH0)', false);
    } else {
      closePreview(false);
    }
  }

  // Floating trigger button on homepage to re-open the preview with SjgMmo6_DH0 anytime
  floatingTrigger?.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      sessionStorage.removeItem('sk_preview_dismissed');
    } catch {
      // ignore
    }
    openPreview(DEFAULT_TEST_VIDEO_ID, 'Client Video Preview (SjgMmo6_DH0)');
  });

  // Event Listeners for closing modal
  closeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closePreview(true);
  });

  exitBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closePreview(true);
  });

  // CTA linking to plans section
  plansCtaBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closePreview(true);
    const plansSection = document.getElementById('plans');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#plans';
    }
  });

  // Click on background backdrop (outside the dialog card)
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) {
      closePreview(true);
    }
  });

  // Escape key to exit
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl.getAttribute('aria-hidden') === 'false') {
      closePreview(true);
    }
  });

  // Browser back/forward navigation support
  window.addEventListener('popstate', checkUrlAndToggle);

  // Initial check on page load
  checkUrlAndToggle();

  return { openPreview, closePreview, checkUrlAndToggle };
}
