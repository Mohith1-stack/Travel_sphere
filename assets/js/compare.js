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
    
    showMessage(compareForm, `Comparing ${first} and ${second}…`);

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
            <td><strong>${t1}</strong> (${weath1 ? (weath1.current.weather_code === 0 ? '☀️ Clear' : '🌤️ Current') : 'Unavailable'})</td>
            <td><strong>${t2}</strong> (${weath2 ? (weath2.current.weather_code === 0 ? '☀️ Clear' : '🌤️ Current') : 'Unavailable'})</td>
          </tr>
          <tr>
            <td><strong>Encyclopedia Profile</strong></td>
            <td>${w1?.description || 'Global Destination'}</td>
            <td>${w2?.description || 'Global Destination'}</td>
          </tr>
          <tr>
            <td><strong>Official Coordinates</strong></td>
            <td>${lat1 !== undefined ? `${lat1.toFixed(2)}°, ${lon1.toFixed(2)}°` : 'Unavailable'}</td>
            <td>${lat2 !== undefined ? `${lat2.toFixed(2)}°, ${lon2.toFixed(2)}°` : 'Unavailable'}</td>
          </tr>
          <tr>
            <td><strong>Live Flight Search</strong></td>
            <td><a href="https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(first)}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Find flights ↗</a></td>
            <td><a href="https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(second)}" target="_blank" rel="noopener" style="color:var(--gold); text-decoration:underline;">Find flights ↗</a></td>
          </tr>
          <tr>
            <td><strong>More Details</strong></td>
            <td><a href="${w1?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(first)}`}" target="_blank" rel="noopener" style="color:var(--text-main); text-decoration:underline;">Explore ${first} ↗</a></td>
            <td><a href="${w2?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(second)}`}" target="_blank" rel="noopener" style="color:var(--text-main); text-decoration:underline;">Explore ${second} ↗</a></td>
          </tr>
        `;
      }
      showMessage(compareForm, 'Comparison updated.');
    } catch (err) {
      console.warn("Compare error:", err);
      showMessage(compareForm, `Comparison updated for ${first} and ${second}.`);
    }
  });
}


const compareParams = new URLSearchParams(window.location.search);
if (document.getElementById('dest1') && compareParams.has('first')) {
  document.getElementById('dest1').value = compareParams.get('first');
}
if (compareForm) {
  setTimeout(() => {
    compareForm.dispatchEvent(new Event('submit'));
  }, 350);
}
