/**
 * ShortKatto Isolated Preview Modal Controller
 *
 * Checks for the presence of ?v= (or &v=) in the URL.
 * If present, immediately displays an isolated custom modal with the unlisted
 * YouTube video playing over the blurred ShortKatto homepage.
 *
 * No database or file lookups are performed; the URL is self-contained.
 */

// 11-character YouTube video ID regex
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function extractVideoId(input) {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  // Gracefully handle full URLs if passed as the parameter value
  try {
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      const urlStr = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const parsed = new URL(urlStr);

      if (parsed.hostname.includes('youtu.be')) {
        const id = parsed.pathname.replace(/^\//, '').split(/[?#&]/)[0];
        if (YOUTUBE_ID_REGEX.test(id)) return id;
      }

      if (parsed.hostname.includes('youtube.com')) {
        const id = parsed.searchParams.get('v');
        if (id && YOUTUBE_ID_REGEX.test(id)) return id;

        const pathMatch = parsed.pathname.match(/\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/);
        if (pathMatch && pathMatch[1]) return pathMatch[1];
      }
    }
  } catch {
    // ignore URL parse errors
  }

  const match = trimmed.match(/(?:[?&]v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?#]|$)/);
  if (match && match[1] && YOUTUBE_ID_REGEX.test(match[1])) {
    return match[1];
  }

  return null;
}

export function buildEmbedUrl(videoId) {
  const cleanId = extractVideoId(videoId);
  if (!cleanId) return '';
  return `https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=1&rel=0&controls=1&modestbranding=1&playsinline=1`;
}

export function initPreviewModal() {
  const modalEl = document.getElementById('videoPreviewModal');
  const iframeEl = document.getElementById('previewVideoIframe');
  const closeBtn = document.getElementById('previewCloseBtn');
  const exitBtn = document.getElementById('previewExitBtn');
  const plansCtaBtn = document.getElementById('previewPlansCtaBtn');
  const modalTitleEl = document.getElementById('previewModalTitle');

  if (!modalEl || !iframeEl) {
    return;
  }

  function openPreview(videoId, customTitle) {
    const embedUrl = buildEmbedUrl(videoId);
    if (!embedUrl) return;

    if (modalTitleEl) {
      modalTitleEl.textContent = customTitle || 'Client Video Preview';
    }

    // Set autoplay embed
    iframeEl.src = embedUrl;

    // Show modal and activate background blur on ShortKatto homepage
    modalEl.setAttribute('aria-hidden', 'false');
    modalEl.style.display = 'flex';
    document.body.classList.add('preview-modal-open');

    // Accessibility focus
    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 100);
    }
  }

  function closePreview(cleanUrl = true) {
    // Stop playback by clearing iframe src
    iframeEl.src = '';

    // Hide modal and remove blur from homepage
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.style.display = 'none';
    document.body.classList.remove('preview-modal-open');

    // Clean URL without triggering page reload
    if (cleanUrl) {
      try {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has('v')) {
          currentUrl.searchParams.delete('v');
          currentUrl.searchParams.delete('title');
          const newPath = currentUrl.pathname + (currentUrl.search ? currentUrl.search : '') + (currentUrl.hash ? currentUrl.hash : '');
          window.history.replaceState({}, document.title, newPath);
        }
      } catch (err) {
        console.warn('Could not update history state:', err);
      }
    }
  }

  function checkUrlAndToggle() {
    const params = new URLSearchParams(window.location.search);
    const rawV = params.get('v');
    const validId = extractVideoId(rawV);

    if (validId) {
      const titleParam = params.get('title');
      openPreview(validId, titleParam ? titleParam.trim() : null);
    } else {
      closePreview(false);
    }
  }

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
