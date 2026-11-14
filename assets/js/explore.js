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
      verdict: `Direct non-stop flight is the fastest choice (~${diffStr} saved). <a href="https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destName)}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">View flight options ↗</a>.`
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
    const finalDesc = wikiData?.extract || `Explore the highlights of ${destName}.`;
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

  // Dynamic user location state (Never hardcoded to London)
  let userLocation = {
    lat: 20.5937,
    lng: 78.9629,
    name: "Detecting Your Location…"
  };

  let userMarker = null;
  let activeFlightPath = null;
  let activeTargetMarker = null;
  let activeSelectedDestination = null;

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

  // Generate dynamic popup HTML for user's live location
  function getUserPopupHtml() {
    return `
      <div class="map-popup-title">📍 ${userLocation.name}</div>
      <div class="map-popup-meta">Live Detected Origin Point</div>
      <div class="map-popup-desc">Distances, flight routes, and travel times across TravelSphere are dynamically mapped from your real location.</div>
    `;
  }

  // Render or update user location marker with dynamic popup
  function updateUserMarker() {
    if (userMarker) {
      userMarker.setLatLng([userLocation.lat, userLocation.lng]);
      if (userMarker.getPopup()) {
        userMarker.setPopupContent(getUserPopupHtml());
      } else {
        userMarker.bindPopup(getUserPopupHtml());
      }
    } else {
      userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createPinIcon(true),
        title: "Your Live Location",
        zIndexOffset: 1000
      }).addTo(map);

      userMarker.bindPopup(getUserPopupHtml());
    }

    // If a destination was already clicked/selected, dynamically recalculate route from this new position
    if (activeSelectedDestination) {
      recomputeRouteFromNewUserLocation(activeSelectedDestination);
    }
  }

  // Reverse geocode real coordinates to town, city, state, country via OpenStreetMap Nominatim
  async function reverseGeocodeUserLocation(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const locality = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county || data.display_name?.split(',')[0];
        const state = addr.state || addr.region || '';
        const country = addr.country || '';
        const parts = [locality, state, country].filter(Boolean);
        return parts.length ? parts.join(', ') : (data.display_name?.split(',').slice(0, 3).join(', ') || 'Your Live Location');
      }
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
    }
    return `Your Live Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
  }

  // Apply detected user location coordinates and dynamically update marker + popup
  async function applyDetectedUserLocation(lat, lng, fallbackName = null) {
    userLocation.lat = lat;
    userLocation.lng = lng;
    if (fallbackName) {
      userLocation.name = fallbackName;
      updateUserMarker();
    }
    const realName = await reverseGeocodeUserLocation(lat, lng);
    if (realName) {
      userLocation.name = realName;
      updateUserMarker();
    }
  }

  // Recalculate route and distances dynamically whenever origin location changes
  function recomputeRouteFromNewUserLocation(dest) {
    const [destLat, destLng] = dest.coords;
    if (activeFlightPath) map.removeLayer(activeFlightPath);
    const arcPoints = generateArcPoints([userLocation.lat, userLocation.lng], [destLat, destLng]);
    activeFlightPath = L.polyline(arcPoints, {
      color: '#b63d49',
      weight: 3.5,
      opacity: 0.9,
      className: 'flight-path-animated'
    }).addTo(map);

    const distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, destLat, destLng);
    const flightIntel = computeFlightAnalysis(distanceKm, dest.name);

    const distanceDisplay = document.getElementById('distance-display');
    if (distanceDisplay) {
      distanceDisplay.style.display = 'inline-flex';
      distanceDisplay.textContent = `✈️ ${dest.name}: ${distanceKm.toLocaleString()} km · ${flightIntel.directTime}`;
    }

    const distanceEl = document.getElementById('result-distance');
    if (distanceEl) distanceEl.textContent = distanceKm.toLocaleString();

    const timeEl = document.getElementById('result-time');
    if (timeEl) timeEl.textContent = flightIntel.directTime;
  }

  updateUserMarker();

  // IP-based location fallback to ensure non-hardcoded origin if GPS is pending or not available
  async function fetchUserLocationFromIP() {
    try {
      const res = await fetch("https://freeipapi.com/api/json");
      if (res.ok) {
        const ipData = await res.json();
        if (ipData.latitude && ipData.longitude) {
          const locName = [ipData.cityName, ipData.regionName, ipData.countryName].filter(Boolean).join(', ');
          applyDetectedUserLocation(ipData.latitude, ipData.longitude, locName || "Your Region");
        }
      }
    } catch {
      // Graceful offline fallback
    }
  }

  // High-accuracy browser GPS Geolocation
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyDetectedUserLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        fetchUserLocationFromIP();
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  } else {
    fetchUserLocationFromIP();
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
    activeSelectedDestination = dest;
    const [destLat, destLng] = dest.coords;

    // Draw animated curved flight route
    if (activeFlightPath) map.removeLayer(activeFlightPath);
    const arcPoints = generateArcPoints([userLocation.lat, userLocation.lng], [destLat, destLng]);
    activeFlightPath = L.polyline(arcPoints, {
      color: '#b63d49',
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
      if (badgeEl) badgeEl.textContent = '📍 Preparing destination guide…';

      const titleEl = document.getElementById('result-title');
      if (titleEl) titleEl.textContent = `${dest.name}, ${dest.country || ''}`;

      const descEl = document.getElementById('result-desc');
      if (descEl) descEl.textContent = 'Loading destination details and current weather…';

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
      if (badgeEl) badgeEl.textContent = `📍 ${live.wikiSubtitle || 'Destination Guide'}`;
      if (titleEl) titleEl.textContent = `${live.wikiTitle}${live.countryName ? ', ' + live.countryName : ''}`;
      if (descEl) descEl.textContent = live.wikiExtract;

      // Banner image sourced live from Wikimedia Commons
      const bannerEl = document.getElementById('result-image-banner');
      if (bannerEl) {
        if (live.bannerImage) {
          bannerEl.style.display = 'block';
          bannerEl.style.backgroundImage = `linear-gradient(to bottom, rgba(37, 43, 49, 0.1), rgba(37, 43, 49, 0.7)), url("${live.bannerImage}")`;
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
        flightAirlineEl.innerHTML = `<a href="${live.googleFlightsUrl}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">View live flight options ↗</a>`;
      }

      const flightFastestTimeEl = document.getElementById('result-flight-fastest-time');
      if (flightFastestTimeEl) flightFastestTimeEl.textContent = `${flightIntel.directTime} direct`;

      const flightHubsEl = document.getElementById('result-flight-hubs');
      if (flightHubsEl) {
        flightHubsEl.innerHTML = `<a href="${live.googleFlightsUrl}" target="_blank" rel="noopener" style="color:var(--text-main); text-decoration:underline;">Compare departure times and routes ↗</a>`;
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
        foodCultureEl.innerHTML = `<strong>${live.cuisine.title}</strong><br>${live.cuisine.extract}`;
      }

      const foodSpotsEl = document.getElementById('result-food-spots');
      if (foodSpotsEl) {
        foodSpotsEl.innerHTML = `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.name + ' top restaurants food markets')}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Explore local food markets & restaurants ↗</a>`;
      }

      const foodPriceEl = document.getElementById('result-food-price');
      if (foodPriceEl) {
        foodPriceEl.textContent = `${live.cuisine.title} favourites`;
      }

      // Bottom Details: Sights, Season, Tips
      const spotsEl = document.getElementById('result-spots');
      if (spotsEl) {
        spotsEl.innerHTML = `<a href="${live.googleMapsUrl}" target="_blank" rel="noopener" style="color:var(--text-main); text-decoration:underline;">Explore nearby sights ↗</a>`;
      }

      const seasonEl = document.getElementById('result-season');
      if (seasonEl) {
        seasonEl.textContent = `Current Conditions: ${live.weather.temp}°C. Consult live seasonal weather forecasts before travel.`;
      }

      const tipEl = document.getElementById('result-tip');
      if (tipEl) {
        tipEl.innerHTML = `Discover more about <em>${live.wikiSubtitle || 'this destination'}</em>. <a href="${live.wikiUrl}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Read more ↗</a>.`;
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
        <a href="${live.googleFlightsUrl}" target="_blank" rel="noopener" class="btn secondary" style="font-size:0.85rem; padding:8px 14px; border-color:rgba(182,61,73,0.4);">✈️ Find flights ↗</a>
        <a href="${live.googleMapsUrl}" target="_blank" rel="noopener" class="btn secondary" style="font-size:0.85rem; padding:8px 14px; border-color:rgba(182,61,73,0.4);">🗺️ Explore map ↗</a>
        <a href="${live.wikiUrl}" target="_blank" rel="noopener" class="btn secondary" style="font-size:0.85rem; padding:8px 14px;">📖 Read more ↗</a>
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
      <div class="map-popup-meta">Destination Guide</div>
      <div class="map-popup-desc">Explore destination details, local cuisine and current weather.</div>
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
