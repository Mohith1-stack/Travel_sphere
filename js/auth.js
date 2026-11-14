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
            Your saved destinations and preferences are kept separately in this browser for this demo.
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
          <p>Sign in to access saved destinations and preferences stored in this browser.</p>
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
      document.getElementById('btn-sign-out')?.addEventListener('click', () => {
        // Terminate active session
        localStorage.removeItem('ts-session');
        // Wipe temporary guest state and legacy global keys
        localStorage.removeItem('ts_guest_saved_places');
        localStorage.removeItem('ts-saved-places');
        localStorage.removeItem('ts-profile');

        // Immediately return to home as guest
        window.location.href = 'index.html';
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
  const isLoginPage = window.location.pathname.endsWith('login.html');
  const isSignupPage = window.location.pathname.endsWith('signup.html');
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
        <div style="background: rgba(130, 184, 159, 0.15); border: 1px solid rgba(130, 184, 159, 0.4); padding: 18px; border-radius: var(--radius-md); margin-bottom: 24px; text-align: center;">
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

// Front-end signup and login with account isolation
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
  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const first = document.getElementById('signup-fname').value.trim();
    const last = document.getElementById('signup-lname').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();

    const userRaw = encodeURIComponent(email).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const userKey = `ts_user_${userRaw}`;
    const newProfile = { first, last, email, phone: '' };
    writeData(`${userKey}_profile`, newProfile);

    // Initialize an empty private saved places array for this new user
    if (!readData(`${userKey}_saved_places`, null)) {
      writeData(`${userKey}_saved_places`, []);
    }

    // Set active session strictly to this user
    writeData('ts-session', {
      signedIn: true,
      name: first,
      email: email,
      userKey: userKey
    });

    finishSignIn(signupForm, first);
  });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    if (!username) return;

    const unameLow = username.toLowerCase();
    const userEmail = username.includes('@') ? username : `${unameLow}@example.com`;
    const capName = username.charAt(0).toUpperCase() + username.slice(1);

    const userRaw = encodeURIComponent(userEmail).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const userKey = `ts_user_${userRaw}`;
    let userProfile = readData(`${userKey}_profile`, null);

    if (!userProfile) {
      userProfile = {
        first: capName,
        last: '',
        email: userEmail,
        phone: ''
      };
      writeData(`${userKey}_profile`, userProfile);
    }

    // Initialize user's private saved places array if not present
    if (!readData(`${userKey}_saved_places`, null)) {
      writeData(`${userKey}_saved_places`, []);
    }

    // Set active session strictly to this user
    writeData('ts-session', {
      signedIn: true,
      name: userProfile.first || capName,
      email: userProfile.email || userEmail,
      userKey: userKey
    });

    finishSignIn(loginForm, userProfile.first || capName);
  });
}

// Restore and save basic profile/preferences locally on this device.
const profileForm = document.getElementById('profile-form');
if (profileForm) {
  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const session = getSession();
    if (!session) {
      alert('Please sign in to update profile settings.');
      window.location.href = 'login.html';
      return;
    }

    const updatedFirst = document.getElementById('fname').value.trim() || session.name || 'Explorer';
    const updatedLast = document.getElementById('lname').value.trim();
    const updatedEmail = document.getElementById('email').value.trim().toLowerCase() || session.email;
    const updatedPhone = document.getElementById('phone').value.trim();

    writeActiveUserProfile({
      first: updatedFirst,
      last: updatedLast,
      email: updatedEmail,
      phone: updatedPhone
    });

    writeData('ts-session', {
      ...session,
      name: updatedFirst,
      email: updatedEmail
    });

    showMessage(profileForm, 'Profile details saved on this device.');
    updateAuthUI();
  });
}

const prefsForm = document.getElementById('prefs-form');
if (prefsForm) {
  const prefs = getActiveUserPreferences();
  ['currency', 'language'].forEach((id) => { if (prefs[id]) document.getElementById(id).value = prefs[id]; });
  prefsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    writeActiveUserPreferences({
      currency: document.getElementById('currency').value,
      language: document.getElementById('language').value
    });
    showMessage(prefsForm, 'Preferences saved on this device.');
  });
}

document.querySelectorAll('#notif-form, .settings-form:not(#profile-form):not(#prefs-form)').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    showMessage(form, 'Settings updated for this demo.');
  });
});

const clearForm = document.getElementById('danger-form');
if (clearForm) {
  clearForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (confirm('Clear saved places and TravelSphere demo preferences from this browser?')) {
      const userKey = getActiveUserKey();
      localStorage.removeItem(`${userKey}_saved_places`);
      localStorage.removeItem(`${userKey}_profile`);
      localStorage.removeItem(`${userKey}_preferences`);
      localStorage.removeItem('ts-session');
      localStorage.removeItem('ts_guest_saved_places');
      localStorage.removeItem('ts-saved-places');
      localStorage.removeItem('ts-profile');
      window.location.reload();
    }
  });
}

// Initialize Auth UI immediately on load
updateAuthUI();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateAuthUI);
}
