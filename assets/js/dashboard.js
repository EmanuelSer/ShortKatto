import {
  auth, googleProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut,
  db, doc, onSnapshot, collection, query, where
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
  const authForm = $('authForm');
  const logoutBtn1 = $('logoutBtn');
  const logoutBtn2 = $('logoutBtn2');
  const subStatusEl = $('subStatus');
  
  const portalBtn = $('portalBtn');
  const manageMsg = $('manageMsg');

  // Auth UI Elements
  const authTitle = $('authTitle');
  const authSub = $('authSub');
  const googleBtnText = $('googleBtnText');
  const submitAuthBtn = $('submitAuthBtn');
  const togglePrompt = $('togglePrompt');
  const toggleAuthModeBtn = $('toggleAuthModeBtn');
  const authSepSpan = document.querySelector('.auth-sep span');

  let unsubscribeUser = null;
  let isSignUpMode = false;

  const urlParams = new URLSearchParams(window.location.search);
  const checkoutPlan = urlParams.get('checkout');

  if (checkoutPlan) {
    isSignUpMode = true;
  }

  const showErr = (e) => {
    console.error(e);
    if (errEl) errEl.textContent = e?.message || String(e);
  };
  const clearErr = () => { if (errEl) errEl.textContent = ''; };

  const updateAuthModeUI = () => {
    clearErr();
    if (isSignUpMode) {
      if (authTitle) authTitle.textContent = checkoutPlan ? 'Create an account to subscribe' : 'Create an account';
      if (authSub) authSub.textContent = checkoutPlan ? 'You need an account to manage your subscription and projects.' : 'Sign up to get started.';
      if (googleBtnText) googleBtnText.textContent = 'Sign up with Google';
      if (submitAuthBtn) submitAuthBtn.textContent = 'Sign up';
      if (togglePrompt) togglePrompt.textContent = 'Already have an account?';
      if (toggleAuthModeBtn) toggleAuthModeBtn.textContent = 'Log in';
      if (authSepSpan) authSepSpan.textContent = 'or sign up with email';
    } else {
      if (authTitle) authTitle.textContent = 'Log in to your account';
      if (authSub) authSub.textContent = 'Welcome back! Please enter your details.';
      if (googleBtnText) googleBtnText.textContent = 'Log in with Google';
      if (submitAuthBtn) submitAuthBtn.textContent = 'Log in';
      if (togglePrompt) togglePrompt.textContent = "Don't have an account?";
      if (toggleAuthModeBtn) toggleAuthModeBtn.textContent = 'Sign up';
      if (authSepSpan) authSepSpan.textContent = 'or continue with email';
    }
  };

  toggleAuthModeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    updateAuthModeUI();
  });

  // Initialize UI
  updateAuthModeUI();

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

  // Email/password auth (handles both login and signup)
  authForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearErr();
    const email = emailEl?.value?.trim().toLowerCase();
    const pass = passEl?.value;
    if (!email || !pass) return showErr('Enter email and password.');
    
    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, email, pass);
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (e) {
      showErr(e);
    }
  });

  // Logout
  const doLogout = async () => {
    if (unsubscribeUser) {
      unsubscribeUser();
      unsubscribeUser = null;
    }
    try {
      await signOut(auth);
    } catch (e) {
      showErr(e);
    }
  };
  logoutBtn1?.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });
  logoutBtn2?.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });

  const handlePortalLink = (e) => {
    e.preventDefault();
    if (window.SK_CONFIG && window.SK_CONFIG.stripePortalUrl) {
      window.open(window.SK_CONFIG.stripePortalUrl, '_blank');
    } else {
      if (manageMsg) manageMsg.textContent = 'Portal link not configured.';
    }
  };

  portalBtn?.addEventListener('click', handlePortalLink);

  // Toggle UI on auth state
  onAuthStateChanged(auth, (user) => {
    console.log('Auth state:', user ? user.email : 'signed out');
    clearErr();
    if (user) {
      if (checkoutPlan && window.SK_CONFIG && window.SK_CONFIG.stripe[checkoutPlan]) {
        document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;font-family:sans-serif;font-size:1.2rem;">Redirecting to secure checkout...</div>';
        const stripeUrl = new URL(window.SK_CONFIG.stripe[checkoutPlan]);
        stripeUrl.searchParams.set('prefilled_email', user.email);
        stripeUrl.searchParams.set('client_reference_id', user.uid);
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.href = stripeUrl.toString();
        return;
      }

      if (displayNameEl) displayNameEl.textContent = user.displayName || user.email || '';
      if (authSection) authSection.style.display = 'none';
      if (dashSection) dashSection.style.display = '';
      if (logoutBtn1) logoutBtn1.style.display = '';

      // Listen to Firestore for user data (populated by Zapier)
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      unsubscribeUser = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          if (displayNameEl && data.name) displayNameEl.textContent = data.name;
          if (subStatusEl) {
            const plan = data.plan ? data.plan.toUpperCase() : 'NO PLAN';
            const status = data.status ? data.status.toUpperCase() : 'INACTIVE';
            subStatusEl.textContent = `Plan: ${plan} | Status: ${status}`;
            if (status === 'ACTIVE') {
              subStatusEl.style.backgroundColor = '#e6f4ea';
              subStatusEl.style.color = '#137333';
            } else {
              subStatusEl.style.backgroundColor = '#f1f5f9';
              subStatusEl.style.color = '#475569';
            }
          }
          
          // Update resource links if they exist
          const trelloLink = $('trelloLink');
          if (trelloLink && data.trelloUrl) {
            trelloLink.href = data.trelloUrl;
            trelloLink.textContent = 'Open Trello Board';
            trelloLink.removeAttribute('aria-disabled');
          }
          const dropboxRequestLink = $('dropboxRequestLink');
          if (dropboxRequestLink && data.dropboxRequestUrl) {
            dropboxRequestLink.href = data.dropboxRequestUrl;
            dropboxRequestLink.textContent = 'Upload Files';
            dropboxRequestLink.removeAttribute('aria-disabled');
          }

        } else {
          if (subStatusEl) subStatusEl.textContent = 'Status: Pending Setup';
        }
      }, (error) => {
        console.error("Error fetching user data:", error);
      });

    } else {
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }
      if (authSection) authSection.style.display = '';
      if (dashSection) dashSection.style.display = 'none';
      if (logoutBtn1) logoutBtn1.style.display = 'none';
      if (emailEl) emailEl.value = '';
      if (passEl) passEl.value = '';
    }
  });
});
