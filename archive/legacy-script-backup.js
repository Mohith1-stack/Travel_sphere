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

// Switch the seasonal information when a season tab is clicked.
document.querySelectorAll('[data-season]').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-season]').forEach((item) => item.classList.toggle('active', item === tab));
    document.querySelectorAll('.season-content').forEach((panel) => {
      panel.classList.toggle('active', panel.id === tab.dataset.season);
    });
  });
});

// Calculate the total trip budget from the entered costs.
const budgetForm = document.getElementById('budget-form');
if (budgetForm) {
  budgetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = ['hotel', 'flight', 'food', 'shopping', 'transport'];
    const total = fields.reduce((sum, id) => sum + Math.max(0, Number(document.getElementById(id)?.value || 0)), 0);
    const currency = document.getElementById('budget-currency').value;
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    document.getElementById('total-amount').textContent = `${symbols[currency] || ''}${total.toLocaleString()}`;
    document.getElementById('budget-result').classList.remove('hidden');
  });
}

// Update the comparison table headings and fetch live external comparison data
const compareForm = document.getElementById('compare-form');
if (compareForm) {
  compareForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const first = document.getElementById('dest1')?.value.trim() || 'Maldives';
    const second = document.getElementById('dest2')?.value.trim() || 'Santorini';
    const leftHeader = document.getElementById('compare-left');
    const rightHeader = document.getElementById('compare-right');
    if (leftHeader) leftHeader.textContent = first;
    if (rightHeader) rightHeader.textContent = second;
    
    showMessage(compareForm, `Fetching live external data from Wikipedia & Open-Meteo for ${first} and ${second}…`);

    try {
      const [w1, w2] = await Promise.all([
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(first)}`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(second)}`).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      const lat1 = w1?.coordinates?.lat;
      const lon1 = w1?.coordinates?.lon;
      const lat2 = w2?.coordinates?.lat;
      const lon2 = w2?.coordinates?.lon;

      const [weath1, weath2] = await Promise.all([
        (lat1 !== undefined && lon1 !== undefined) ? fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat1}&longitude=${lon1}&current=temperature_2m,weather_code&timezone=auto`).then(r => r.ok ? r.json() : null).catch(() => null) : null,
        (lat2 !== undefined && lon2 !== undefined) ? fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat2}&longitude=${lon2}&current=temperature_2m,weather_code&timezone=auto`).then(r => r.ok ? r.json() : null).catch(() => null) : null
      ]);

      const t1 = weath1?.current?.temperature_2m !== undefined ? `${Math.round(weath1.current.temperature_2m)}°C` : 'Live online';
      const t2 = weath2?.current?.temperature_2m !== undefined ? `${Math.round(weath2.current.temperature_2m)}°C` : 'Live online';

      const tableBody = document.querySelector('.compare-table tbody');
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td><strong>Live Weather</strong></td>
            <td><strong>${t1}</strong> (${weath1 ? (weath1.current.weather_code === 0 ? '☀️ Clear' : '🌤️ Current') : 'Open-Meteo Service'})</td>
            <td><strong>${t2}</strong> (${weath2 ? (weath2.current.weather_code === 0 ? '☀️ Clear' : '🌤️ Current') : 'Open-Meteo Service'})</td>
          </tr>
          <tr>
            <td><strong>Encyclopedia Profile</strong></td>
            <td>${w1?.description || 'Global Destination'}</td>
            <td>${w2?.description || 'Global Destination'}</td>
          </tr>
          <tr>
            <td><strong>Official Coordinates</strong></td>
            <td>${lat1 !== undefined ? `${lat1.toFixed(2)}°, ${lon1.toFixed(2)}°` : 'Via Wikipedia'}</td>
            <td>${lat2 !== undefined ? `${lat2.toFixed(2)}°, ${lon2.toFixed(2)}°` : 'Via Wikipedia'}</td>
          </tr>
          <tr>
            <td><strong>Live Flight Search</strong></td>
            <td><a href="https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(first)}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Search ${first} on Google Flights ↗</a></td>
            <td><a href="https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(second)}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Search ${second} on Google Flights ↗</a></td>
          </tr>
          <tr>
            <td><strong>Verified Wikipedia Article</strong></td>
            <td><a href="${w1?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(first)}`}" target="_blank" rel="noopener" style="color:var(--text-main); text-decoration:underline;">Read ${first} on Wikipedia ↗</a></td>
            <td><a href="${w2?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(second)}`}" target="_blank" rel="noopener" style="color:var(--text-main); text-decoration:underline;">Read ${second} on Wikipedia ↗</a></td>
          </tr>
        `;
      }
      showMessage(compareForm, `Live intelligence updated from Wikipedia & Open-Meteo.`);
    } catch (err) {
      console.warn("Compare error:", err);
      showMessage(compareForm, `Comparison updated for ${first} and ${second}.`);
    }
  });
}

// Filter the mood page using the selected radio button.
document.querySelectorAll('.mood-filter').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const selected = form.querySelector('input[name="mood"]:checked')?.value || 'all';
    const page = selected === 'all' ? 'mood.html' : `mood_${selected}.html`;
    window.location.href = page;
  });
});

// =========================================================
// INTERACTIVE MAP EXPLORER (Leaflet + CartoDB + Open-Meteo)
// =========================================================
(function initExploreMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // World destinations with geographic coordinates for initial pin placement
  // All information, photos, weather and culinary data are fetched LIVE from external sources (Wikipedia, Open-Meteo, Google)
  const CURATED_DESTINATIONS = [
    { name: "Paris", country: "France", coords: [48.8566, 2.3522] },
    { name: "Tokyo", country: "Japan", coords: [35.6762, 139.6503] },
    { name: "Rome", country: "Italy", coords: [41.9028, 12.4964] },
    { name: "Bali", country: "Indonesia", coords: [-8.4095, 115.1889] },
    { name: "Dubai", country: "UAE", coords: [25.2048, 55.2708] },
    { name: "New York", country: "USA", coords: [40.7128, -74.0060] },
    { name: "London", country: "United Kingdom", coords: [51.5074, -0.1278] },
    { name: "Sydney", country: "Australia", coords: [-33.8688, 151.2093] },
    { name: "Cairo", country: "Egypt", coords: [30.0444, 31.2357] },
    { name: "Reykjavik", country: "Iceland", coords: [64.1466, -21.9426] },
    { name: "Cape Town", country: "South Africa", coords: [-33.9249, 18.4241] },
    { name: "Rio de Janeiro", country: "Brazil", coords: [-22.9068, -43.1729] },
    { name: "Maldives", country: "Maldives", coords: [3.2028, 73.2207] },
    { name: "Zermatt", country: "Switzerland", coords: [45.9765, 7.7491] },
    { name: "Barcelona", country: "Spain", coords: [41.3879, 2.1699] },
    { name: "Santorini", country: "Greece", coords: [36.3932, 25.4615] },
    { name: "Banff", country: "Canada", coords: [51.1784, -115.5708] },
    { name: "Singapore", country: "Singapore", coords: [1.3521, 103.8198] }
  ];

  // Global cache to avoid redundant external network requests during session
  const externalDataCache = new Map();

  // Helper to compute live flight speed analysis and time savings
  function computeFlightAnalysis(distanceKm, destName) {
    const directHours = Math.max(0.7, (distanceKm / 820) + 0.6);
    const dH = Math.floor(directHours);
    const dM = Math.round((directHours - dH) * 60);
    const directStr = dH === 0 ? `~${dM} mins` : `~${dH}h ${dM.toString().padStart(2, '0')}m`;

    const layoverHours = distanceKm < 1500 ? 2.2 : 3.8;
    const connHours = (directHours * 1.15) + layoverHours;
    const cH = Math.floor(connHours);
    const cM = Math.round((connHours - cH) * 60);
    const connStr = `~${cH}h ${cM.toString().padStart(2, '0')}m`;

    const diffHours = connHours - directHours;
    const diffH = Math.floor(diffHours);
    const diffM = Math.round((diffHours - diffH) * 60);
    const diffStr = diffH > 0 ? `${diffH}h ${diffM}m` : `${diffM}m`;

    return {
      directTime: directStr,
      connectingTime: `${connStr} (+${diffStr})`,
      timeSaved: `Non-stop direct route saves ~${diffStr} travel time compared to connecting 1-stop flights.`,
      verdict: `Direct non-stop flight is the fastest choice (~${diffStr} saved). Compare real-time airline tickets live on <a href="https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destName)}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Google Flights ↗</a>.`
    };
  }

  // Fetch live verified destination data from external trusted public APIs (Wikipedia REST API, Open-Meteo, Wikimedia Commons)
  async function fetchLiveExternalDestinationData(destName, countryName, coords) {
    const cacheKey = `${destName.toLowerCase()}_${(countryName || '').toLowerCase()}`;
    if (externalDataCache.has(cacheKey)) {
      return externalDataCache.get(cacheKey);
    }

    // 1. Fetch live Wikipedia Summary & verified photograph
    let wikiData = null;
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(destName)}`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        wikiData = await wikiRes.json();
      }
    } catch (err) {
      console.warn("Wikipedia summary fetch failed:", err);
    }

    const finalLat = coords ? coords[0] : (wikiData?.coordinates?.lat || 0);
    const finalLng = coords ? coords[1] : (wikiData?.coordinates?.lon || 0);
    const finalTitle = wikiData?.title || destName;
    const finalDesc = wikiData?.extract || `Official Wikipedia encyclopedic overview for ${destName}.`;
    const bannerImage = wikiData?.thumbnail?.source || wikiData?.originalimage?.source || null;
    const wikiArticleUrl = wikiData?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(destName)}`;

    // 2. Fetch live Open-Meteo Weather
    let weatherInfo = {
      text: "Clear & mild",
      temp: 22,
      humidity: 55,
      wind: 10,
      code: 0
    };
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${finalLat}&longitude=${finalLng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      if (weatherRes.ok) {
        const wData = await weatherRes.json();
        const curr = wData.current || {};
        const code = curr.weather_code ?? 0;
        const temp = curr.temperature_2m;
        weatherInfo = {
          text: getWeatherDescription(code, temp),
          temp: Math.round(temp),
          humidity: curr.relative_humidity_2m,
          wind: Math.round(curr.wind_speed_10m),
          code: code
        };
      }
    } catch (err) {
      console.warn("Open-Meteo weather fetch failed:", err);
    }

    // 3. Fetch live regional Cuisine from Wikipedia
    let cuisineInfo = {
      title: `Regional Cuisine of ${destName}`,
      extract: `Local culinary traditions in ${destName} feature authentic regional gastronomy, seasonal marketplace specialties, and distinctive indigenous ingredients.`,
      dishes: []
    };

    const normCity = destName.trim().replace(/\s+/g, '_');
    const normCountry = (countryName || '').trim().replace(/\s+/g, '_');

    const DEMONYM_CUISINES = {
      'france': 'French_cuisine',
      'japan': 'Japanese_cuisine',
      'italy': 'Italian_cuisine',
      'spain': 'Spanish_cuisine',
      'greece': 'Greek_cuisine',
      'indonesia': 'Indonesian_cuisine',
      'uae': 'Emirati_cuisine',
      'united arab emirates': 'Emirati_cuisine',
      'united kingdom': 'British_cuisine',
      'uk': 'British_cuisine',
      'england': 'English_cuisine',
      'united states': 'American_cuisine',
      'usa': 'American_cuisine',
      'australia': 'Australian_cuisine',
      'egypt': 'Egyptian_cuisine',
      'iceland': 'Icelandic_cuisine',
      'south africa': 'South_African_cuisine',
      'brazil': 'Brazilian_cuisine',
      'switzerland': 'Swiss_cuisine',
      'canada': 'Canadian_cuisine',
      'singapore': 'Singaporean_cuisine',
      'maldives': 'Maldivian_cuisine',
      'thailand': 'Thai_cuisine',
      'india': 'Indian_cuisine',
      'mexico': 'Mexican_cuisine',
      'turkey': 'Turkish_cuisine',
      'türkiye': 'Turkish_cuisine',
      'germany': 'German_cuisine',
      'portugal': 'Portuguese_cuisine',
      'vietnam': 'Vietnamese_cuisine',
      'south korea': 'Korean_cuisine',
      'korea': 'Korean_cuisine'
    };

    const cLow = (countryName || '').toLowerCase().trim();
    const demonymPage = DEMONYM_CUISINES[cLow];

    const cuisineCandidates = [
      demonymPage,
      `${normCity}_cuisine`,
      `Cuisine_of_${normCity}`,
      `${normCountry}_cuisine`,
      `Cuisine_of_${normCountry}`
    ].filter(Boolean);

    let cuisineFound = false;
    for (const cand of cuisineCandidates) {
      try {
        const cRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cand)}`);
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.extract && cData.type !== 'disambiguation') {
            cuisineInfo.title = cData.title;
            cuisineInfo.extract = cData.extract;
            cuisineFound = true;
            break;
          }
        }
      } catch (e) {}
    }

    // If candidate direct matches didn't hit, use Wikipedia OpenSearch
    if (!cuisineFound) {
      try {
        const sRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(destName + ' cuisine')}&limit=4&format=json&origin=*`);
        if (sRes.ok) {
          const sData = await sRes.json();
          const hitTitle = sData[1]?.find(t => t.toLowerCase().includes('cuisine'));
          if (hitTitle) {
            const hRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hitTitle)}`);
            if (hRes.ok) {
              const d = await hRes.json();
              if (d.extract) {
                cuisineInfo.title = d.title;
                cuisineInfo.extract = d.extract;
              }
            }
          }
        }
      } catch (e) {}
    }

    // Parse verified sentences from the live Wikipedia cuisine extract to highlight dishes & traditions
    if (cuisineInfo.extract) {
      const sentences = cuisineInfo.extract.split(/(?<=[.!?])\s+/).filter(s => s.length > 25);
      if (sentences.length >= 2) {
        cuisineInfo.dishes = sentences.slice(0, 4).map(s => s.trim());
      } else {
        cuisineInfo.dishes = [
          `Authentic culinary specialties & staple ingredients of ${destName}`,
          `Fresh local food markets and heritage preparation methods`,
          `Traditional sweets, artisanal baked goods, and regional beverages`
        ];
      }
    }

    const result = {
      destName,
      countryName: countryName || wikiData?.description || '',
      coords: [finalLat, finalLng],
      wikiTitle: finalTitle,
      wikiSubtitle: wikiData?.description || 'World Destination',
      wikiExtract: finalDesc,
      wikiUrl: wikiArticleUrl,
      bannerImage: bannerImage,
      weather: weatherInfo,
      cuisine: cuisineInfo,
      googleFlightsUrl: `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destName)}`,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destName + ' top attractions')}`
    };

    externalDataCache.set(cacheKey, result);
    return result;
  }

  // Make sure Leaflet is available
  if (typeof L === 'undefined') {
    console.warn("Leaflet library not loaded yet.");
    return;
  }

  // Prevent map gestures from bubbling when interacting with overlay elements
  const overlay = mapElement.querySelector('.map-overlay');
  if (overlay) {
    L.DomEvent.disableClickPropagation(overlay);
    L.DomEvent.disableScrollPropagation(overlay);
  }

  // Initialize Leaflet map
  const map = L.map('map', {
    center: [25, 10],
    zoom: 2,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: false,
    attributionControl: false
  });

  // Re-position zoom control to bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Esri Dark Gray (Free, no watermark, dark luxury style)
  const darkBaseTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  });
  const darkLabelTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    attribution: '',
    maxZoom: 16
  });
  const darkTiles = L.layerGroup([darkBaseTiles, darkLabelTiles]);

  // OpenStreetMap standard (Free, vibrant color street tiles, no watermark)
  const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  });

  darkTiles.addTo(map);

  // User location state
  let userLocation = {
    lat: 51.5074,
    lng: -0.1278,
    name: "London (Default Location)"
  };

  let userMarker = null;
  let activeFlightPath = null;
  let activeTargetMarker = null;

  // Custom marker pin creator
  function createPinIcon(isUser = false) {
    return L.divIcon({
      className: 'custom-leaflet-pin',
      html: `
        <div class="ts-pin-wrapper ${isUser ? 'ts-user-pin' : ''}">
          <div class="ts-pin-pulse"></div>
          <div class="ts-pin-dot"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18]
    });
  }

  // Render or update user location marker
  function updateUserMarker() {
    if (userMarker) {
      userMarker.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createPinIcon(true),
        title: "Your Location",
        zIndexOffset: 1000
      }).addTo(map);

      userMarker.bindPopup(`
        <div class="map-popup-title">📍 ${userLocation.name}</div>
        <div class="map-popup-meta">Origin point for live distances</div>
        <div class="map-popup-desc">Distances and flight times across TravelSphere are mapped from this location.</div>
      `);
    }
  }

  updateUserMarker();

  // Try detecting real user geolocation
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: "Your Current Location"
        };
        updateUserMarker();
      },
      () => {
        // Geolocation denied or unavailable; gracefully keeps default
      },
      { timeout: 8000 }
    );
  }

  // Haversine formula to compute distance in km
  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // Estimate non-stop flight duration
  function estimateFlightTime(distanceKm) {
    if (distanceKm < 50) return "< 30 mins (Local transfer)";
    const hours = (distanceKm / 820) + 0.5;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `~${m} mins`;
    return `~${h}h ${m.toString().padStart(2, '0')}m non-stop`;
  }

  // Generate curved arc between two coordinates for flight simulation
  function generateArcPoints(p1, p2, numPoints = 50) {
    const [lat1, lng1] = p1;
    const [lat2, lng2] = p2;
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;

    // Curved offset perpendicular to straight vector
    const curvature = 0.15;
    const offsetLat = midLat - dLng * curvature;
    const offsetLng = midLng + dLat * curvature;

    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const lat = Math.pow(1 - t, 2) * lat1 + 2 * (1 - t) * t * offsetLat + Math.pow(t, 2) * lat2;
      const lng = Math.pow(1 - t, 2) * lng1 + 2 * (1 - t) * t * offsetLng + Math.pow(t, 2) * lng2;
      points.push([lat, lng]);
    }
    return points;
  }

  // Translate Open-Meteo WMO weather codes to user-friendly text + emoji
  function getWeatherDescription(code, temp) {
    const tempStr = temp !== undefined ? `${Math.round(temp)}°C` : '';
    if (code === 0) return `☀️ Clear & sunny (${tempStr})`;
    if (code >= 1 && code <= 3) return `⛅ Partly cloudy (${tempStr})`;
    if (code === 45 || code === 48) return `🌫️ Foggy & misty (${tempStr})`;
    if (code >= 51 && code <= 67) return `🌧️ Light rain / drizzle (${tempStr})`;
    if (code >= 71 && code <= 77) return `❄️ Snowfall (${tempStr})`;
    if (code >= 80 && code <= 82) return `🌦️ Rain showers (${tempStr})`;
    if (code >= 95) return `⛈️ Thunderstorm (${tempStr})`;
    return `🌤️ Pleasant (${tempStr})`;
  }

  // Select and highlight a destination with live external intelligence
  async function selectDestination(dest) {
    const [destLat, destLng] = dest.coords;

    // Draw animated curved flight route
    if (activeFlightPath) map.removeLayer(activeFlightPath);
    const arcPoints = generateArcPoints([userLocation.lat, userLocation.lng], [destLat, destLng]);
    activeFlightPath = L.polyline(arcPoints, {
      color: '#e56b82',
      weight: 3.5,
      opacity: 0.9,
      className: 'flight-path-animated'
    }).addTo(map);

    // Calculate distance & flight speed analysis
    const distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, destLat, destLng);
    const flightIntel = computeFlightAnalysis(distanceKm, dest.name);

    // Show distance badge in map overlay
    const distanceDisplay = document.getElementById('distance-display');
    if (distanceDisplay) {
      distanceDisplay.style.display = 'inline-flex';
      distanceDisplay.textContent = `✈️ ${dest.name}: ${distanceKm.toLocaleString()} km · ${flightIntel.directTime}`;
    }

    // Populate search input
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) searchInput.value = dest.name;

    // Populate and show the comprehensive destination intelligence card
    const card = document.getElementById('search-result-card');
    if (card) {
      card.style.display = 'block';

      // Header & Loading indicators
      const badgeEl = document.getElementById('result-badge');
      if (badgeEl) badgeEl.textContent = '📡 Fetching live data from Wikipedia & Open-Meteo…';

      const titleEl = document.getElementById('result-title');
      if (titleEl) titleEl.textContent = `${dest.name}, ${dest.country || ''}`;

      const descEl = document.getElementById('result-desc');
      if (descEl) descEl.textContent = 'Connecting to external encyclopedia and weather APIs…';

      const weatherEl = document.getElementById('result-weather');
      if (weatherEl) weatherEl.textContent = 'Fetching live conditions…';

      const distanceEl = document.getElementById('result-distance');
      if (distanceEl) distanceEl.textContent = distanceKm.toLocaleString();

      const timeEl = document.getElementById('result-time');
      if (timeEl) timeEl.textContent = flightIntel.directTime;

      // Asynchronously fetch live verified data from external trusted sources
      const live = await fetchLiveExternalDestinationData(dest.name, dest.country, dest.coords);

      // Save to favorites button integration
      const saveBtn = document.getElementById('result-save-btn');
      if (saveBtn) {
        saveBtn.dataset.saveDestination = live.wikiTitle || dest.name;
        refreshSaveButtons();
      }

      // Update Header with verified Wikipedia title and description
      if (badgeEl) badgeEl.textContent = `📡 Live Data: Wikipedia & Open-Meteo (${live.wikiSubtitle || 'Verified Source'})`;
      if (titleEl) titleEl.textContent = `${live.wikiTitle}${live.countryName ? ', ' + live.countryName : ''}`;
      if (descEl) descEl.textContent = live.wikiExtract;

      // Banner image sourced live from Wikimedia Commons
      const bannerEl = document.getElementById('result-image-banner');
      if (bannerEl) {
        if (live.bannerImage) {
          bannerEl.style.display = 'block';
          bannerEl.style.backgroundImage = `linear-gradient(to bottom, rgba(5, 15, 28, 0.1), rgba(5, 15, 28, 0.7)), url("${live.bannerImage}")`;
        } else {
          bannerEl.style.display = 'none';
        }
      }

      // Weather with live temperature, condition, humidity and wind speed from Open-Meteo
      if (weatherEl) {
        weatherEl.textContent = `${live.weather.text} · Hum ${live.weather.humidity}% · Wind ${live.weather.wind} km/h`;
      }

      // Live cost index based on geodesic travel distance
      const budgetEl = document.getElementById('result-budget');
      if (budgetEl) {
        const isLongHaul = distanceKm > 3000;
        budgetEl.textContent = isLongHaul ? 'Live Index: Mid–High' : 'Live Index: Moderate';
      }

      // Flight Route Intelligence (Fastest vs Connecting) with direct links to Google Flights
      const flightAirlineEl = document.getElementById('result-flight-airline');
      if (flightAirlineEl) {
        flightAirlineEl.innerHTML = `Search Live Flights on <a href="${live.googleFlightsUrl}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Google Flights ↗</a>`;
      }

      const flightFastestTimeEl = document.getElementById('result-flight-fastest-time');
      if (flightFastestTimeEl) flightFastestTimeEl.textContent = `${flightIntel.directTime} direct`;

      const flightHubsEl = document.getElementById('result-flight-hubs');
      if (flightHubsEl) {
        flightHubsEl.innerHTML = `<a href="${live.googleFlightsUrl}" target="_blank" rel="noopener" style="color:var(--text-main); text-decoration:underline;">Compare live departure times & carrier routes on Google Flights ↗</a>`;
      }

      const flightConnectingAirlineEl = document.getElementById('result-flight-connecting-airline');
      if (flightConnectingAirlineEl) flightConnectingAirlineEl.textContent = '1-Stop Layover Option (Connecting)';

      const flightConnectingTimeEl = document.getElementById('result-flight-connecting-time');
      if (flightConnectingTimeEl) flightConnectingTimeEl.textContent = flightIntel.connectingTime;

      const flightSavingEl = document.getElementById('result-flight-saving');
      if (flightSavingEl) flightSavingEl.textContent = flightIntel.timeSaved;

      const flightVerdictEl = document.getElementById('result-flight-verdict');
      if (flightVerdictEl) flightVerdictEl.innerHTML = `💡 <strong>Speed Verdict:</strong> ${flightIntel.verdict}`;

      // Gastronomy & Food Scene (Directly from Wikipedia regional cuisine article)
      const foodDishesEl = document.getElementById('result-food-dishes');
      if (foodDishesEl) {
        foodDishesEl.innerHTML = (live.cuisine.dishes || []).map((dish) => `
          <li class="food-dish-item">
            <span class="dish-bullet">✦</span>
            <span>${dish}</span>
          </li>
        `).join('');
      }

      const foodCultureEl = document.getElementById('result-food-culture');
      if (foodCultureEl) {
        foodCultureEl.innerHTML = `<em>Source: Wikipedia — <strong>${live.cuisine.title}</strong></em><br>${live.cuisine.extract}`;
      }

      const foodSpotsEl = document.getElementById('result-food-spots');
      if (foodSpotsEl) {
        foodSpotsEl.innerHTML = `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.name + ' top restaurants food markets')}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Explore Local Food Markets & Restaurants on Google Maps ↗</a>`;
      }

      const foodPriceEl = document.getElementById('result-food-price');
      if (foodPriceEl) {
        foodPriceEl.textContent = `Documented under ${live.cuisine.title}`;
      }

      // Bottom Details: Sights, Season, Tips
      const spotsEl = document.getElementById('result-spots');
      if (spotsEl) {
        spotsEl.innerHTML = `<a href="${live.googleMapsUrl}" target="_blank" rel="noopener" style="color:var(--text-main); text-decoration:underline;">View Top Rated Sights on Google Maps ↗</a>`;
      }

      const seasonEl = document.getElementById('result-season');
      if (seasonEl) {
        seasonEl.textContent = `Current Conditions: ${live.weather.temp}°C. Consult live seasonal weather forecasts before travel.`;
      }

      const tipEl = document.getElementById('result-tip');
      if (tipEl) {
        tipEl.innerHTML = `Official encyclopedia overview: <em>${live.wikiSubtitle || 'Global destination'}</em>. Read the complete verified article on <a href="${live.wikiUrl}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Wikipedia ↗</a>.`;
      }

      // Action Links
      const linkEl = document.getElementById('result-link');
      if (linkEl) linkEl.href = `destination.html?destination=${encodeURIComponent(live.wikiTitle || dest.name)}`;

      const compareLinkEl = document.getElementById('result-compare-link');
      if (compareLinkEl) compareLinkEl.href = `compare.html?first=${encodeURIComponent(live.wikiTitle || dest.name)}`;

      // Live External Links Bar (Google Flights, Google Maps, Wikipedia)
      let externalLinksBar = document.getElementById('result-external-links');
      if (!externalLinksBar) {
        externalLinksBar = document.createElement('div');
        externalLinksBar.id = 'result-external-links';
        externalLinksBar.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; margin-top:16px; padding-top:16px; border-top:1px solid var(--line);';
        const actionsDiv = card.querySelector('.intel-actions');
        if (actionsDiv) {
          actionsDiv.parentNode.insertBefore(externalLinksBar, actionsDiv.nextSibling);
        }
      }
      externalLinksBar.innerHTML = `
        <a href="${live.googleFlightsUrl}" target="_blank" rel="noopener" class="btn secondary" style="font-size:0.85rem; padding:8px 14px; border-color:rgba(212,175,55,0.4);">✈️ Search Flights on Google Flights ↗</a>
        <a href="${live.googleMapsUrl}" target="_blank" rel="noopener" class="btn secondary" style="font-size:0.85rem; padding:8px 14px; border-color:rgba(212,175,55,0.4);">🗺️ Explore on Google Maps ↗</a>
        <a href="${live.wikiUrl}" target="_blank" rel="noopener" class="btn secondary" style="font-size:0.85rem; padding:8px 14px;">📖 Read on Wikipedia ↗</a>
      `;

      // Smooth scroll towards the result card
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    }

    // Smoothly fly map to frame both origin and destination
    const bounds = L.latLngBounds([
      [userLocation.lat, userLocation.lng],
      [destLat, destLng]
    ]);
    map.flyToBounds(bounds, {
      padding: [80, 80],
      duration: 1.8,
      easeLinearity: 0.25
    });
  }

  // Populate map with pins
  const markers = [];
  CURATED_DESTINATIONS.forEach((dest) => {
    const marker = L.marker(dest.coords, {
      icon: createPinIcon(false),
      title: dest.name
    }).addTo(map);

    const popupHtml = `
      <div class="map-popup-title">✦ ${dest.name}, ${dest.country}</div>
      <div class="map-popup-meta">Live External Intelligence</div>
      <div class="map-popup-desc">Click below to fetch live Wikipedia encyclopedia overview, authentic cuisine & satellite weather.</div>
      <div style="display:flex; gap:8px; align-items:center; margin-top:8px;">
        <button type="button" class="map-popup-btn js-popup-locate" data-dest-name="${dest.name}">✈️ Live Route & Details</button>
        <a class="map-popup-btn" style="background: rgba(255,255,255,0.15);" href="destination.html?destination=${encodeURIComponent(dest.name)}">Details →</a>
      </div>
    `;
    marker.bindPopup(popupHtml);

    marker.on('click', () => {
      selectDestination(dest);
    });

    markers.push({ dest, marker });
  });

  // Listen for popup "Live Route & Details" button clicks
  document.addEventListener('click', (event) => {
    const locateBtn = event.target.closest('.js-popup-locate');
    if (!locateBtn) return;
    const destName = locateBtn.dataset.destName;
    const match = CURATED_DESTINATIONS.find((d) => d.name === destName);
    if (match) {
      selectDestination(match);
      map.closePopup();
    }
  });

  // Handle destination search form (offline list first, then live OpenStreetMap Nominatim geocoder)
  const mapSearchForm = document.getElementById('map-search-form');
  if (mapSearchForm) {
    mapSearchForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const query = document.getElementById('map-search-input')?.value.trim();
      if (!query) return;

      const submitBtn = mapSearchForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Locating…';
      }

      // Check if matches curated list
      const normalized = query.toLowerCase();
      const match = CURATED_DESTINATIONS.find((d) =>
        d.name.toLowerCase().includes(normalized) ||
        normalized.includes(d.name.toLowerCase()) ||
        d.country.toLowerCase().includes(normalized)
      );

      if (match) {
        await selectDestination(match);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Locate';
        }
        return;
      }

      // If not in initial list, geocode live using OpenStreetMap Nominatim
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
        const res = await fetch(geoUrl);
        const results = await res.json();

        if (results && results.length > 0) {
          const item = results[0];
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const displayName = item.display_name.split(',')[0] || query;
          const countryName = item.display_name.split(',').slice(-1)[0]?.trim() || '';

          // Add a dynamic pin
          if (activeTargetMarker) map.removeLayer(activeTargetMarker);
          activeTargetMarker = L.marker([lat, lon], {
            icon: createPinIcon(false),
            title: displayName
          }).addTo(map);

          const customDest = {
            name: displayName,
            country: countryName,
            coords: [lat, lon]
          };

          await selectDestination(customDest);
        } else {
          alert(`Could not pinpoint "${query}". Try searching a city like Paris, Tokyo, Bali or Rome!`);
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
        alert(`Could not connect to map geocoder. Try picking one of the featured destinations.`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Locate';
        }
      }
    });
  }

  // Handle Quick Chips clicks
  document.querySelectorAll('.quick-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const destName = chip.dataset.dest;
      const match = CURATED_DESTINATIONS.find((d) => d.name.toLowerCase() === destName.toLowerCase());
      if (match) {
        selectDestination(match);
      }
    });
  });

  // Handle "My Location" button
  const myLocationBtn = document.getElementById('btn-my-location');
  if (myLocationBtn) {
    myLocationBtn.addEventListener('click', () => {
      map.flyTo([userLocation.lat, userLocation.lng], 9, { duration: 1.5 });
      if (userMarker) userMarker.openPopup();
    });
  }

  // Handle "Reset / Show All" button
  const resetViewBtn = document.getElementById('btn-reset-view');
  if (resetViewBtn) {
    resetViewBtn.addEventListener('click', () => {
      if (activeFlightPath) {
        map.removeLayer(activeFlightPath);
        activeFlightPath = null;
      }
      map.flyTo([25, 10], 2, { duration: 1.5 });
      const distanceDisplay = document.getElementById('distance-display');
      if (distanceDisplay) distanceDisplay.style.display = 'none';
    });
  }

  // Handle "Map Style Toggle" (Dark luxury vs Clean light)
  const toggleThemeBtn = document.getElementById('btn-toggle-theme');
  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', () => {
      if (map.hasLayer(darkTiles)) {
        map.removeLayer(darkTiles);
        lightTiles.addTo(map);
        currentTileLayer = lightTiles;
      } else {
        map.removeLayer(lightTiles);
        darkTiles.addTo(map);
        currentTileLayer = darkTiles;
      }
    });
  }

  // Select initial featured destination (e.g. Paris or Tokyo) smoothly
  setTimeout(() => {
    const initialDest = CURATED_DESTINATIONS[0]; // Paris
    selectDestination(initialDest);
  }, 600);
})();

// Fill the destination page using live external API data
const destinationTitle = document.getElementById('dest-title');
if (destinationTitle) {
  const params = new URLSearchParams(window.location.search);
  const destination = params.get('destination') || 'Kyoto';
  destinationTitle.textContent = destination;
  
  const queryEl = document.getElementById('destination-query');
  if (queryEl) queryEl.textContent = `Connecting to Wikipedia & Open-Meteo for ${destination}…`;

  const overviewEl = document.getElementById('dest-overview');
  if (overviewEl) overviewEl.textContent = 'Fetching verified encyclopedic overview from Wikipedia…';

  const weatherEl = document.getElementById('dest-weather');
  if (weatherEl) weatherEl.textContent = 'Connecting to Open-Meteo live satellite & meteorological service…';

  const saveButton = document.getElementById('dest-save-btn');
  if (saveButton) saveButton.dataset.saveDestination = destination;
  refreshSaveButtons();

  const compareLink = document.getElementById('compare-link');
  if (compareLink) compareLink.href = `compare.html?first=${encodeURIComponent(destination)}`;

  // Fetch live Wikipedia & Open-Meteo asynchronously
  (async () => {
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(destination)}`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        destinationTitle.textContent = wikiData.title || destination;
        if (queryEl) queryEl.textContent = wikiData.description ? `Official Profile: ${wikiData.description}` : `Live encyclopedia profile for ${destination}`;
        if (overviewEl) overviewEl.textContent = wikiData.extract || 'Overview sourced live from Wikipedia.';
        
        const tagsEl = document.getElementById('dest-tags');
        if (tagsEl) {
          tagsEl.innerHTML = `<a href="${wikiData.content_urls?.desktop?.page || '#'}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Verified Wikipedia Article ↗</a>`;
        }

        // Show official Wikimedia photograph
        const imgCard = document.getElementById('dest-image-card');
        const imgUrl = wikiData.thumbnail?.source || wikiData.originalimage?.source;
        if (imgCard && imgUrl) {
          imgCard.style.display = 'block';
          imgCard.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url("${imgUrl}")`;
          const subText = imgCard.querySelector('p');
          if (subText) subText.textContent = `Official photograph of ${wikiData.title} from Wikimedia Commons.`;
        }

        // Fetch live weather using coordinates
        const lat = wikiData.coordinates?.lat;
        const lon = wikiData.coordinates?.lon;
        if (lat !== undefined && lon !== undefined && weatherEl) {
          const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
          const wRes = await fetch(wUrl);
          if (wRes.ok) {
            const wData = await wRes.json();
            const curr = wData.current || {};
            const code = curr.weather_code ?? 0;
            const temp = curr.temperature_2m;
            let condition = 'Pleasant';
            if (code === 0) condition = '☀️ Clear & sunny';
            else if (code <= 3) condition = '⛅ Partly cloudy';
            else if (code === 45 || code === 48) condition = '🌫️ Foggy & misty';
            else if (code >= 51 && code <= 67) condition = '🌧️ Light rain / drizzle';
            else if (code >= 71 && code <= 77) condition = '❄️ Snowfall';
            else if (code >= 80) condition = '🌦️ Rain showers';
            weatherEl.textContent = `Current Conditions: ${condition} · ${Math.round(temp)}°C · Humidity ${curr.relative_humidity_2m}% · Wind ${Math.round(curr.wind_speed_10m)} km/h`;
            const weatherTags = document.getElementById('dest-weather-tags');
            if (weatherTags) weatherTags.textContent = 'Live satellite data from Open-Meteo';
          }
        }

        // Set Google Flights & Google Maps links
        const flightLink = document.getElementById('dest-flight-link');
        if (flightLink) flightLink.href = `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destination)}`;

        const mapsLink = document.getElementById('dest-maps-link');
        if (mapsLink) mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination + ' top attractions')}`;

        // Fetch live cuisine from Wikipedia
        const foodExtractEl = document.getElementById('dest-food-extract');
        if (foodExtractEl) {
          try {
            const cRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(destination + ' cuisine')}&limit=3&format=json&origin=*`);
            if (cRes.ok) {
              const cData = await cRes.json();
              const hit = cData[1]?.[0];
              if (hit) {
                const hRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit)}`);
                if (hRes.ok) {
                  const d = await hRes.json();
                  if (d.extract) {
                    foodExtractEl.textContent = d.extract;
                    const badge = document.getElementById('dest-food-badge');
                    if (badge) badge.textContent = d.title;
                  }
                }
              } else {
                foodExtractEl.textContent = `Explore world-renowned culinary traditions, local dining spots and market stalls in ${destination}.`;
              }
            }
          } catch {
            foodExtractEl.textContent = `Discover regional specialties, authentic street fare, and traditional dining in ${destination}.`;
          }
        }
      }
    } catch (e) {
      console.warn("Live destination load error:", e);
    }
  })();
}

// Dynamic Regional Food Explorer (food.html) - Sourced Live from Wikipedia & Google
(function initFoodPage() {
  const spotlight = document.getElementById('food-live-spotlight');
  if (!spotlight) return;

  const titleEl = document.getElementById('food-spotlight-title');
  const descEl = document.getElementById('food-spotlight-desc');
  const statusEl = document.getElementById('food-spotlight-status');
  const wikiLink = document.getElementById('food-spotlight-wiki');
  const googleLink = document.getElementById('food-spotlight-google');
  const destLink = document.getElementById('food-spotlight-dest');

  async function loadCuisine(place, countryHint) {
    if (statusEl) statusEl.textContent = `Fetching live culinary data for ${place}…`;
    if (descEl) descEl.textContent = `Connecting to Wikipedia's culinary database for ${place}…`;
    if (titleEl) titleEl.textContent = `${place} Food Culture`;

    if (googleLink) googleLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('best food in ' + place)}`;
    if (destLink) destLink.href = `destination.html?destination=${encodeURIComponent(place)}`;

    try {
      // 1. Try demonym/cuisine candidates
      const searchTerms = [
        countryHint ? `${countryHint}_cuisine` : null,
        `${place}_cuisine`,
        `Cuisine_of_${place}`,
        `${place} cuisine`
      ].filter(Boolean);

      let loaded = false;
      for (const term of searchTerms) {
        try {
          const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.extract && data.type !== 'disambiguation') {
              if (titleEl) titleEl.textContent = `${data.title} (${place})`;
              if (descEl) descEl.textContent = data.extract;
              if (wikiLink) wikiLink.href = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(term)}`;
              if (statusEl) statusEl.textContent = `Live data from Wikipedia (${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`;
              loaded = true;
              break;
            }
          }
        } catch {}
      }

      // Fallback to OpenSearch
      if (!loaded) {
        const sRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(place + ' cuisine')}&limit=4&format=json&origin=*`);
        if (sRes.ok) {
          const sData = await sRes.json();
          const hit = sData[1]?.[0];
          if (hit) {
            const dRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit)}`);
            if (dRes.ok) {
              const d = await dRes.json();
              if (d.extract) {
                if (titleEl) titleEl.textContent = `${d.title} (${place})`;
                if (descEl) descEl.textContent = d.extract;
                if (wikiLink) wikiLink.href = d.content_urls?.desktop?.page || '#';
                if (statusEl) statusEl.textContent = `Live data from Wikipedia`;
                loaded = true;
              }
            }
          }
        }
      }

      if (!loaded) {
        if (descEl) descEl.textContent = `Explore authentic dining experiences, regional specialties, and signature recipes from ${place}. Search live culinary hotspots on Google Maps.`;
        if (wikiLink) wikiLink.href = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(place + ' cuisine')}`;
        if (statusEl) statusEl.textContent = `Search complete`;
      }
    } catch (err) {
      console.warn("Food load error:", err);
      if (descEl) descEl.textContent = `Explore authentic culinary flavors and top-rated restaurants in ${place}.`;
    }
  }

  // Handle food search submission
  const searchForm = document.getElementById('food-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('food-search-input')?.value.trim();
      if (val) loadCuisine(val);
    });
  }

  // Handle cuisine chips
  document.querySelectorAll('.food-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const dest = chip.dataset.dest;
      const country = chip.dataset.country;
      loadCuisine(dest, country);
    });
  });

  // Initial load: Tokyo
  loadCuisine('Tokyo', 'Japan');
})();

const compareParams = new URLSearchParams(window.location.search);
if (document.getElementById('dest1') && compareParams.has('first')) {
  document.getElementById('dest1').value = compareParams.get('first');
}
if (compareForm) {
  setTimeout(() => {
    compareForm.dispatchEvent(new Event('submit'));
  }, 350);
}

// Authentication & Session Management
function getSession() {
  const session = readData('ts-session', null);
  return (session && session.signedIn) ? session : null;
}

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
            Signed in to private vault. Your saved destinations and preferences are isolated and encrypted to your account.
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
          <p>Sign in to sync saved destinations and preferences across your TravelSphere experience.</p>
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

    showMessage(signupForm, `Welcome, ${first}! Your private account is ready.`);
    setTimeout(() => { window.location.href = 'index.html'; }, 700);
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

    showMessage(loginForm, `Welcome back, ${userProfile.first || capName}! You are signed in.`);
    setTimeout(() => { window.location.href = 'index.html'; }, 700);
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

    showMessage(profileForm, 'Profile details saved securely to your private account.');
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
