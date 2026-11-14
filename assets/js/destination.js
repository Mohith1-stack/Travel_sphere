// Fill the destination page using live external API data
const destinationTitle = document.getElementById('dest-title');
if (destinationTitle) {
  const params = new URLSearchParams(window.location.search);
  const destination = params.get('destination') || 'Kyoto';
  destinationTitle.textContent = destination;
  
  const queryEl = document.getElementById('destination-query');
  if (queryEl) queryEl.textContent = `Loading details for ${destination}…`;

  const overviewEl = document.getElementById('dest-overview');
  if (overviewEl) overviewEl.textContent = 'Loading destination overview…';

  const weatherEl = document.getElementById('dest-weather');
  if (weatherEl) weatherEl.textContent = 'Loading current weather…';

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
        if (queryEl) queryEl.textContent = wikiData.description ? wikiData.description : `Explore ${destination} and plan your visit.`;
        if (overviewEl) overviewEl.textContent = wikiData.extract || `Discover the highlights of ${destination}.`;
        
        const tagsEl = document.getElementById('dest-tags');
        if (tagsEl) {
          tagsEl.innerHTML = `<a href="${wikiData.content_urls?.desktop?.page || '#'}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">More about ${destination} ↗</a>`;
        }

        // Show official Wikimedia photograph
        const imgCard = document.getElementById('dest-image-card');
        const imgUrl = wikiData.thumbnail?.source || wikiData.originalimage?.source;
        if (imgCard && imgUrl) {
          imgCard.style.display = 'block';
          imgCard.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url("${imgUrl}")`;
          const subText = imgCard.querySelector('p');
          if (subText) subText.textContent = `A view of ${wikiData.title}.`;
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
            if (weatherTags) weatherTags.textContent = 'Current weather';
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
