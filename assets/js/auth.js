// Authentication and account settings
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function updateAuthUI() {
  if (!window.tsBackend.configured) {
    [document.getElementById('login-form'), document.getElementById('signup-form')].filter(Boolean).forEach((form) => {
      const button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;
      showMessage(form, 'The secure account service is not connected yet. Follow docs/supabase-setup.md to finish setup.');
    });
  }

  const session = getSession();
  const profile = getActiveUserProfile() || {};
  const displayName = session?.name || profile?.first || 'Explorer';
  const displayEmail = session?.email || profile?.email || '';

  // 1. Update Profile Dropdown in Header across all pages
  document.querySelectorAll('.tool-nav details').forEach((details) => {
    const summary = details.querySelector('summary.tool-chip');
    if (!summary) return;

    const isProfile = summary.textContent.includes('Profile') || summary.dataset.isProfileChip === "true";
    if (!isProfile) return;
    summary.dataset.isProfileChip = "true";

    const panel = details.querySelector('.tool-panel');
    if (!panel) return;

    if (session) {
      // User is already signed in! NEVER show "Sign In" button here.
      summary.innerHTML = `👤 ${escapeHtml(displayName)}`;
      panel.innerHTML = `
        <fieldset class="fieldset">
          <legend style="color: var(--gold); font-weight: 700;">✦ Account Active</legend>
          <div style="padding: 4px 0 10px;">
            <p style="margin: 0; font-weight: 700; color: var(--text); font-size: 0.98rem;">${escapeHtml(displayName)}</p>
            <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--muted);">${escapeHtml(displayEmail)}</p>
          </div>
          <p style="font-size: 0.84rem; color: var(--text-soft); line-height: 1.4; margin: 0 0 14px;">
            Your account, saved places and preferences are synced securely to your TravelSphere account.
          </p>
          <a class="btn full" href="settings.html" style="margin-bottom: 8px;">⚙️ Settings & Sign Out</a>
          <a class="btn secondary full" href="saved.html">♥ Saved Places (<span data-favorite-count>${getSavedPlaces().length}</span>)</a>
        </fieldset>
      `;
    } else {
      // Guest state: Clean, default, no personal information exposed
      summary.innerHTML = `👤 Profile`;
      panel.innerHTML = `
        <fieldset class="fieldset">
          <legend>Guest Explorer</legend>
        <p>Sign in to sync your saved destinations and preferences across devices.</p>
          <a class="btn full" href="login.html">Sign In</a>
          <div class="spacer-xs"></div>
          <a class="btn secondary full" href="settings.html">Settings</a>
        </fieldset>
      `;
    }
  });

  // 2. Footer links: when logged in, replace "Sign In" with "Settings"
  document.querySelectorAll('.footer-column a[href="login.html"], .footer-column a[href="signup.html"]').forEach((link) => {
    if (session) {
      if (link.getAttribute('href') === 'login.html') {
        link.textContent = 'Account Settings';
        link.href = 'settings.html';
      } else if (link.getAttribute('href') === 'signup.html') {
        link.textContent = 'Saved Places ♥';
        link.href = 'saved.html';
      }
    } else {
      if (link.textContent === 'Account Settings') {
        link.textContent = 'Sign In';
        link.href = 'login.html';
      } else if (link.textContent === 'Saved Places ♥') {
        link.textContent = 'Create Account';
        link.href = 'signup.html';
      }
    }
  });

  // 3. Settings page behavior (settings.html) - strictly isolated
  const statStatus = document.getElementById('stat-status');
  if (statStatus) {
    statStatus.textContent = session ? `Verified (${displayName})` : 'Guest Explorer';
  }

  // Populate or wipe profile form fields
  const fnameInput = document.getElementById('fname');
  const lnameInput = document.getElementById('lname');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');

  if (fnameInput) fnameInput.value = session ? (profile.first || '') : '';
  if (lnameInput) lnameInput.value = session ? (profile.last || '') : '';
  if (emailInput) emailInput.value = session ? (profile.email || '') : '';
  if (phoneInput) phoneInput.value = session ? (profile.phone || '') : '';

  const endActions = document.querySelector('.end-actions');
  if (endActions) {
    if (session) {
      endActions.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 10px;">
          <p style="color: var(--muted); font-size: 0.9rem; margin: 0;">Currently signed in as <strong>${escapeHtml(displayName)}</strong> (${escapeHtml(displayEmail)})</p>
          <button type="button" class="btn danger" id="btn-sign-out" style="padding: 10px 30px; font-weight: 700;">Sign Out of Account</button>
        </div>
      `;
      document.getElementById('btn-sign-out')?.addEventListener('click', async () => {
        try {
          await window.tsBackend.signOut();
          window.location.href = 'login.html';
        } catch (error) {
          alert(`Could not sign out: ${error.message}`);
        }
      });
    } else {
      endActions.innerHTML = `
        <div style="width: 100%; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a class="btn" href="login.html" style="padding: 10px 24px;">Sign In to Account</a>
          <a class="btn secondary" href="signup.html" style="padding: 10px 24px;">Create New Account</a>
        </div>
      `;
    }
  }

  // 4. On login.html or signup.html: If ALREADY signed in, don't ask again!
  const isLoginPage = /\/login(?:\.html)?\/?$/i.test(window.location.pathname);
  const isSignupPage = /\/signup(?:\.html)?\/?$/i.test(window.location.pathname);
  if (session && (isLoginPage || isSignupPage)) {
    const authCard = document.querySelector('.auth-card .page-panel');
    if (authCard) {
      authCard.innerHTML = `
        <div class="auth-mark">✦</div>
        <div class="page-head">
          <p class="eyebrow">Active Session</p>
          <h1 class="page-title">Already Signed In</h1>
          <p class="page-subtitle">You are currently signed in as <strong>${escapeHtml(displayName)}</strong> (${escapeHtml(displayEmail)}).</p>
        </div>
        <div style="background: var(--sage-soft); border: 1px solid var(--sage); padding: 18px; border-radius: var(--radius-md); margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; font-size: 0.95rem; color: var(--text);">
            Your personal travel collection and settings are active. To sign in with a different account, visit Settings to sign out.
          </p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <a href="settings.html" class="btn full">Go to Settings (Manage / Sign Out)</a>
          <a href="index.html" class="btn secondary full">Continue to Home</a>
          <a href="explore.html" class="btn secondary full">Explore Destinations</a>
        </div>
      `;
    }
  }
}

// Account creation and sign-in are handled by Supabase Auth.
function finishSignIn(form, name) {
  const explorerName = name || 'Explorer';
  showMessage(form, `Welcome, ${explorerName}! Thanks for choosing TravelSphere. We hope you enjoy planning your next journey.`);
  try {
    sessionStorage.setItem('ts-welcome-message', JSON.stringify({ name: explorerName }));
  } catch {
    // The sign-in flow still works when session storage is unavailable.
  }
  window.setTimeout(() => {
    window.location.replace(getPostAuthDestination());
  }, 900);
}

const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = signupForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    const first = document.getElementById('signup-fname').value.trim();
    const last = document.getElementById('signup-lname').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    try {
      const { session } = await window.tsBackend.signUp({ email, password, firstName: first, lastName: last });
      if (session) finishSignIn(signupForm, first);
      else showMessage(signupForm, 'Your account is ready. Check your email to confirm it, then sign in.');
    } catch (error) {
      showMessage(signupForm, error.message || 'Could not create your account. Please try again.');
    } finally {
      submitButton.disabled = false;
    }
  });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = loginForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    const email = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    try {
      await window.tsBackend.signIn(email, password);
      const { data: { user } } = await window.tsBackend.client.auth.getUser();
      const name = user?.user_metadata?.first_name || email.split('@')[0];
      try { sessionStorage.setItem('ts-welcome-message', JSON.stringify({ name })); } catch { /* Optional welcome only. */ }
      window.location.replace(getPostAuthDestination());
    } catch (error) {
      showMessage(loginForm, error.message || 'Could not sign in. Check your email and password.');
    } finally {
      submitButton.disabled = false;
    }
  });
}

// Restore and save basic profile/preferences locally on this device.
const profileForm = document.getElementById('profile-form');
if (profileForm) {
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const session = getSession();
    if (!session) {
      alert('Please sign in to update profile settings.');
      window.location.href = 'login.html';
      return;
    }

    const updatedFirst = document.getElementById('fname').value.trim() || session.name || 'Explorer';
    const updatedLast = document.getElementById('lname').value.trim();
    const updatedEmail = session.email;
    const updatedPhone = document.getElementById('phone').value.trim();

    const updatedProfile = {
      first: updatedFirst,
      last: updatedLast,
      email: updatedEmail,
      phone: updatedPhone
    };

    try {
      await window.tsBackend.saveProfile(updatedProfile);
      writeActiveUserProfile(updatedProfile);
      writeData('ts-session', { ...session, name: updatedFirst });
      showMessage(profileForm, 'Profile saved to your TravelSphere account.');
      updateAuthUI();
    } catch (error) {
      showMessage(profileForm, `Could not save profile: ${error.message}`);
    }
  });
}

const prefsForm = document.getElementById('prefs-form');
if (prefsForm) {
  const prefs = getActiveUserPreferences();
  ['currency', 'language'].forEach((id) => { if (prefs[id]) document.getElementById(id).value = prefs[id]; });
  prefsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const preferences = {
      currency: document.getElementById('currency').value,
      language: document.getElementById('language').value
    };
    window.tsBackend.savePreferences(preferences).then(() => {
      writeActiveUserPreferences(preferences);
      showMessage(prefsForm, 'Preferences synced to your TravelSphere account.');
    }).catch((error) => showMessage(prefsForm, `Could not save preferences: ${error.message}`));
  });
}

document.querySelectorAll('#notif-form, .settings-form:not(#profile-form):not(#prefs-form)').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
      showMessage(form, 'This setting is not connected yet.');
  });
});

const clearForm = document.getElementById('danger-form');
if (clearForm) {
  clearForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (confirm('Clear saved places and TravelSphere preferences from this browser?')) {
      const userKey = getActiveUserKey();
      localStorage.removeItem(`${userKey}_saved_places`);
      localStorage.removeItem(`${userKey}_profile`);
      localStorage.removeItem(`${userKey}_preferences`);
      localStorage.removeItem('ts_guest_saved_places');
      localStorage.removeItem('ts-saved-places');
      localStorage.removeItem('ts-profile');
      window.tsBackend.signOut().finally(() => window.location.reload());
    }
  });
}

// Render account UI after Supabase restores the session and after auth changes.
window.addEventListener('travel-sphere-backend-ready', updateAuthUI);
window.addEventListener('travel-sphere-auth-change', updateAuthUI);
