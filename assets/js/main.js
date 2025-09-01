// ShortKatto site config (edit these values for your project)
window.SK_CONFIG = {
  calendlyUrl: "https://calendly.com/emanuel-ser-hdz/30min",
  stripe: {
    basic: "https://buy.stripe.com/7sY14nefD0C86Ia9SF3ks00",
    pro: "https://buy.stripe.com/9B600jdbz2Kgc2u7Kx3ks01"
  },
  // Manual, faux availability flags used only for UI
  availability: {
    basic: "available", // "available" | "unavailable"
    pro: "available"    // "available" | "unavailable"
  }
};

(function(){
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Hook up buttons
  const bookCallBtn = document.getElementById('bookCallBtn');
  if (bookCallBtn) bookCallBtn.href = window.SK_CONFIG.calendlyUrl;

  document.querySelectorAll('.subscribe-btn').forEach(btn => {
    const plan = btn.getAttribute('data-checkout');
    const url = window.SK_CONFIG.stripe[plan];
    if (url && /^https?:\/\//.test(url)) {
      btn.href = url;
    } else {
      btn.setAttribute('aria-disabled', 'true');
      btn.textContent = 'Link not set';
      btn.title = 'Add your Stripe Payment Link in assets/js/main.js';
    }
  });

  // Availability badges (purely cosmetic)
  const avail = window.SK_CONFIG.availability || {};
  Object.keys(avail).forEach(plan => {
    const state = String(avail[plan]).toLowerCase();
    document.querySelectorAll(`[data-plan="${plan}"]`).forEach(card => {
      const badge = card.querySelector(`[data-slots="${plan}"]`);
      if (state === 'unavailable') {
        card.classList.add('unavailable');
        if (badge) badge.textContent = 'Slots unavailable';
      } else {
        card.classList.remove('unavailable');
        if (badge) badge.textContent = 'Slots available';
      }
    });
  });
})();
