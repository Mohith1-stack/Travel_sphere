// Dynamic regional food explorer (food.html).
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
    if (descEl) descEl.textContent = `Finding food highlights for ${place}…`;
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
              if (statusEl) statusEl.textContent = `Updated ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
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
                if (statusEl) statusEl.textContent = 'Cuisine guide updated';
                loaded = true;
              }
            }
          }
        }
      }

      if (!loaded) {
        if (descEl) descEl.textContent = `Explore authentic dining experiences, regional specialties, and signature recipes from ${place}. Find popular places to eat nearby.`;
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
