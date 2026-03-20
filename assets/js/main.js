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
      btn.href = `dashboard.html?checkout=${plan}`;
    } else {
      btn.setAttribute('aria-disabled', 'true');
      btn.textContent = 'Link not set';
      btn.title = 'Add your Stripe Payment Link in assets/js/config.js';
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
