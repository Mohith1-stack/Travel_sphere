/* TravelSphere: small, beginner-friendly JavaScript for the website. */

// Read and write simple demo data in this browser.
function readData(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function writeData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function showMessage(form, message) {
  let note = form.querySelector('.js-message');
  if (!note) {
    note = document.createElement('p');
    note.className = 'js-message muted';
    note.setAttribute('role', 'status');
    form.appendChild(note);
  }
  note.textContent = message;
}

// Make the header search work on every page.
document.querySelectorAll('.search-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = form.querySelector('input[type="search"]')?.value.trim();
    if (query) window.location.href = `destination.html?destination=${encodeURIComponent(query)}`;
    else form.querySelector('input[type="search"]')?.focus();
  });
});

// Session and User-Scoped Data Isolation
function getSession() {
  const session = readData('ts-session', null);
  return (session && session.signedIn) ? session : null;
}

// Compute an isolated user storage key (or ts_guest for unauthenticated visitors)
function getActiveUserKey() {
  const session = getSession();
  if (session && (session.email || session.name)) {
    const raw = (session.email || session.name).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    return `ts_user_${raw}`;
  }
  return 'ts_guest';
}

// User-scoped saved places: each user account has their own isolated array
function getSavedPlaces() {
  const key = `${getActiveUserKey()}_saved_places`;
  return readData(key, []);
}

function writeSavedPlaces(places) {
  const key = `${getActiveUserKey()}_saved_places`;
  writeData(key, places);
}

function getActiveUserProfile() {
  const session = getSession();
  if (!session) return null;
  const key = `${getActiveUserKey()}_profile`;
  return readData(key, {
    first: session.name || '',
    last: '',
    email: session.email || '',
    phone: ''
  });
}

function writeActiveUserProfile(profile) {
  const key = `${getActiveUserKey()}_profile`;
  writeData(key, profile);
}

function getActiveUserPreferences() {
  const key = `${getActiveUserKey()}_preferences`;
  return readData(key, { currency: 'INR', language: 'English' });
}

function writeActiveUserPreferences(prefs) {
  const key = `${getActiveUserKey()}_preferences`;
  writeData(key, prefs);
}

function updateSavedCount() {
  const count = getSavedPlaces().length;
  document.querySelectorAll('[data-favorite-count]').forEach((el) => {
    el.textContent = count;
  });
}

function refreshSaveButtons() {
  const savedList = getSavedPlaces();
  document.querySelectorAll('[data-save-destination]').forEach((button) => {
    const place = button.dataset.saveDestination.trim();
    const saved = savedList.some((item) => item.name === place);
    button.textContent = saved ? '♥ Saved' : '♡ Save to saved places';
    button.setAttribute('aria-pressed', String(saved));
  });
}

// Handle saving destinations
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-save-destination]');
  if (!button) return;
  const place = button.dataset.saveDestination.trim();
  if (!place) return;

  let places = getSavedPlaces();
  if (places.some((item) => item.name === place)) {
    places = places.filter((item) => item.name !== place);
  } else {
    places.push({ name: place, savedAt: new Date().toISOString() });
  }
  writeSavedPlaces(places);
  refreshSaveButtons();
  updateSavedCount();
  renderSavedPlaces();
});

// Render saved destinations on saved.html
function renderSavedPlaces() {
  const savedGrid = document.getElementById('saved-grid');
  if (!savedGrid) return;
  savedGrid.innerHTML = '';
  const session = getSession();
  const places = getSavedPlaces();
  const empty = document.getElementById('saved-empty');

  if (empty) {
    if (!session && places.length === 0) {
      empty.innerHTML = `
        <div style="padding: 24px 12px; text-align: center;">
          <p style="font-size: 1.1rem; color: var(--text); font-weight: 600; margin-bottom: 8px;">No Private Destinations Found</p>
          <p style="color: var(--muted); font-size: 0.92rem; max-width: 480px; margin: 0 auto 20px;">
            You are browsing as a Guest. To protect user privacy, saved collections are only accessible when signed in to that account.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <a href="login.html" class="btn" style="padding: 10px 24px;">Sign In to Your Account</a>
            <a href="explore.html" class="btn secondary" style="padding: 10px 24px;">Explore Destinations</a>
          </div>
        </div>
      `;
      empty.style.display = 'block';
    } else {
      empty.innerHTML = `You haven't saved any destinations yet.<br><br><a href="explore.html" class="btn">Explore the world</a>`;
      empty.style.display = places.length ? 'none' : 'block';
    }
  }

  places.forEach((place) => {
    const card = document.createElement('article');
    card.className = 'card';
    const title = document.createElement('h3');
    title.textContent = place.name;
    const description = document.createElement('p');
    description.textContent = session ? `Saved to ${session.name}'s private travel collection.` : 'Saved in local guest list.';
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const link = document.createElement('a');
    link.className = 'btn secondary';
    link.href = `destination.html?destination=${encodeURIComponent(place.name)}`;
    link.textContent = 'View destination →';
    const remove = document.createElement('button');
    remove.className = 'btn';
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      writeSavedPlaces(getSavedPlaces().filter((item) => item.name !== place.name));
      renderSavedPlaces();
      updateSavedCount();
      refreshSaveButtons();
    });
    actions.append(link, remove);
    card.append(title, description, actions);
    savedGrid.appendChild(card);
  });
}

updateSavedCount();
refreshSaveButtons();
renderSavedPlaces();
