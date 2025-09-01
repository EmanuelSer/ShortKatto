import {
  auth, googleProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut
} from '../../firebase-config/firebase-init.js';

const ready = (fn) =>
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn();

ready(async () => {
  const $ = (id) => document.getElementById(id);

  // Elements
  const authSection = $('authSection');
  const dashSection = $('dashSection');
  const displayNameEl = $('displayName');
  const errEl = $('authError');
  const emailEl = $('email');
  const passEl = $('password');

  const googleBtn = $('googleLoginBtn');
  const loginForm = $('loginForm');
  const signupBtn = $('signupBtn');
  const logoutBtn1 = $('logoutBtn');
  const logoutBtn2 = $('logoutBtn2');

  const showErr = (e) => {
    console.error(e);
    if (errEl) errEl.textContent = e?.message || String(e);
  };
  const clearErr = () => { if (errEl) errEl.textContent = ''; };

  // Handle redirect result (for popup blockers)
  try {
    const res = await getRedirectResult(auth);
    if (res?.user) console.log('Signed in via redirect:', res.user.email);
  } catch (e) {
    if (e?.code !== 'auth/no-auth-event') showErr(e);
  }

  // Google sign-in
  googleBtn?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    clearErr();
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (e2) {
          showErr(e2);
        }
      } else if (e?.code === 'auth/unauthorized-domain') {
        showErr('Add this domain to Firebase Auth → Authorized domains.');
      } else {
        showErr(e);
      }
    }
  });

  // Email/password login
  loginForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearErr();
    const email = emailEl?.value?.trim().toLowerCase();
    const pass = passEl?.value;
    if (!email || !pass) return showErr('Enter email and password.');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      showErr(e);
    }
  });

  // Create account
  signupBtn?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    clearErr();
    const email = emailEl?.value?.trim().toLowerCase();
    const pass = passEl?.value;
    if (!email || !pass) return showErr('Enter email and password.');
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      showErr(e);
    }
  });

  // Logout
  const doLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      showErr(e);
    }
  };
  logoutBtn1?.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });
  logoutBtn2?.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });

  // Toggle UI on auth state
  onAuthStateChanged(auth, (user) => {
    console.log('Auth state:', user ? user.email : 'signed out');
    clearErr();
    if (user) {
      if (displayNameEl) displayNameEl.textContent = user.displayName || user.email || '';
      if (authSection) authSection.style.display = 'none';
      if (dashSection) dashSection.style.display = '';
      if (logoutBtn1) logoutBtn1.style.display = '';
    } else {
      if (authSection) authSection.style.display = '';
      if (dashSection) dashSection.style.display = 'none';
      if (logoutBtn1) logoutBtn1.style.display = 'none';
      if (emailEl) emailEl.value = '';
      if (passEl) passEl.value = '';
    }
  });
});
