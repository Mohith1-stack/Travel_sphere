// Build a rough, editable per-person estimate from the origin and destination.
const budgetForm = document.getElementById('budget-form');
if (budgetForm) {
  const fields = ['hotel', 'flight', 'food', 'shopping', 'transport'];
  const estimateButton = document.getElementById('estimate-trip');
  const saveEstimateButton = document.getElementById('save-budget-estimate');
  const savedTrips = document.getElementById('budget-saved-trips');
  const status = document.getElementById('budget-status');
  const currencySelect = document.getElementById('budget-currency');
  const destinationInput = document.getElementById('to-city');
  let currencyNeedsRefresh = false;
  const params = new URLSearchParams(window.location.search);
  const destinationFromLink = params.get('destination');
  const lastOrigin = localStorage.getItem('ts-budget-origin') || '';
  if (destinationFromLink) destinationInput.value = destinationFromLink;
  document.getElementById('from-city').value = lastOrigin;

  const costBands = {
    INR: { symbol: '₹', locale: 'en-IN', airMin: 2500, airPerKm: 6.5, internationalAirMin: 12000, internationalAirPerKm: 7.5, railMin: 500, railPerKm: 1.8, hotelNight: 2200, mealsDay: 900, localDay: 500, activitiesDay: 700 },
    USD: { symbol: '$', locale: 'en-US', airMin: 55, airPerKm: 0.12, internationalAirMin: 180, internationalAirPerKm: 0.14, railMin: 18, railPerKm: 0.035, hotelNight: 55, mealsDay: 30, localDay: 15, activitiesDay: 25 },
    EUR: { symbol: '€', locale: 'de-DE', airMin: 50, airPerKm: 0.11, internationalAirMin: 165, internationalAirPerKm: 0.13, railMin: 15, railPerKm: 0.03, hotelNight: 50, mealsDay: 28, localDay: 12, activitiesDay: 22 },
    GBP: { symbol: '£', locale: 'en-GB', airMin: 45, airPerKm: 0.10, internationalAirMin: 150, internationalAirPerKm: 0.12, railMin: 12, railPerKm: 0.025, hotelNight: 45, mealsDay: 25, localDay: 10, activitiesDay: 20 }
  };

  const destinationCostFactors = {
    IN: 1, NP: 1.05, LK: 1.1, TH: 1.25, VN: 1.1, ID: 1.2, MY: 1.25, PH: 1.2,
    JP: 2, KR: 1.8, SG: 2.1, HK: 2.2, TW: 1.6,
    PT: 1.55, ES: 1.7, IT: 1.9, FR: 2, DE: 1.9, NL: 2.1, CH: 2.8, GB: 2.2,
    US: 2.4, CA: 2.1, AU: 2.2, NZ: 2, AE: 2.3
  };

  const formatMoney = (amount) => {
    const band = costBands[currencySelect.value] || costBands.INR;
    return `${band.symbol}${Math.round(amount).toLocaleString(band.locale)}`;
  };

  const calculateTotal = () => {
    const perPerson = fields.reduce((sum, id) => sum + Math.max(0, Number(document.getElementById(id)?.value || 0)), 0);
    const travellers = Math.max(1, Number(document.getElementById('travellers').value || 1));
    document.getElementById('budget-result-label').textContent = 'Cost per person based on your amounts';
    document.getElementById('total-amount').textContent = formatMoney(perPerson);
    document.getElementById('budget-group-total').textContent = `Estimated total for ${travellers} ${travellers === 1 ? 'traveller' : 'travellers'}: ${formatMoney(perPerson * travellers)}`;
    document.getElementById('budget-result').classList.remove('hidden');
    saveEstimateButton?.classList.remove('hidden');
    return perPerson;
  };

  const renderSavedTrips = (plans) => {
    if (!savedTrips) return;
    savedTrips.replaceChildren();
    if (!plans.length) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = 'No saved estimates yet. Save one above to keep it here.';
      savedTrips.appendChild(empty);
      return;
    }
    plans.forEach((plan) => {
      const card = document.createElement('article');
      card.className = 'saved-trip-card';
      const title = document.createElement('h3');
      title.textContent = plan.title;
      const amount = document.createElement('strong');
      const currency = plan.currency || 'INR';
      const locales = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };
      amount.textContent = new Intl.NumberFormat(locales[currency] || 'en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(plan.budget) || 0);
      const detail = document.createElement('p');
      detail.className = 'muted';
      detail.textContent = plan.notes || plan.destination;
      const remove = document.createElement('button');
      remove.className = 'btn secondary';
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove saved estimate for ${plan.destination}`);
      remove.addEventListener('click', async () => {
        remove.disabled = true;
        try {
          await window.tsBackend.deleteTripPlan(plan.id);
          const updated = await window.tsBackend.listTripPlans();
          renderSavedTrips(updated);
        } catch (error) {
          remove.disabled = false;
          status.textContent = `Could not remove this estimate: ${error.message}`;
        }
      });
      card.append(title, amount, detail, remove);
      savedTrips.appendChild(card);
    });
  };

  const loadSavedTrips = async () => {
    if (!savedTrips || !window.tsBackend.configured) {
      if (savedTrips) savedTrips.innerHTML = '<p class="muted">Sign in to save trip estimates to your account.</p>';
      return;
    }
    try {
      renderSavedTrips(await window.tsBackend.listTripPlans());
    } catch (error) {
      savedTrips.innerHTML = '';
      const message = document.createElement('p');
      message.className = 'muted';
      message.textContent = `Your saved estimates could not be loaded: ${error.message}`;
      savedTrips.appendChild(message);
    }
  };

  const findCity = async (query) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('City lookup is temporarily unavailable. Please try again.');
    const data = await response.json();
    const results = data.results || [];
    if (!results.length) throw new Error(`We couldn't find “${query}”. Try adding its state and country.`);

    const hasQualifier = query.includes(',');
    if (!hasQualifier) {
      const regions = new Set(results.map((result) => `${result.country_code || result.country}|${result.admin1 || ''}`));
      if (regions.size > 1) {
        const examples = results.slice(0, 3).map((result) => [result.name, result.admin1, result.country].filter(Boolean).join(', '));
        throw new Error(`“${query}” matches more than one place. Add the state or country, for example ${examples.join(' or ')}.`);
      }
    }
    return results[0];
  };

  const estimateTrip = async () => {
    document.getElementById('budget-result').classList.add('hidden');
    document.getElementById('budget-flight-link').classList.add('hidden');
    const originText = document.getElementById('from-city').value.trim();
    const destinationText = destinationInput.value.trim();
    if (!originText || !destinationText) {
      status.textContent = 'Enter both your starting city and destination city first.';
      return;
    }

    estimateButton.disabled = true;
    status.textContent = 'Finding both cities and preparing your estimate…';
    try {
      const [origin, destination] = await Promise.all([findCity(originText), findCity(destinationText)]);
      const radians = (degrees) => degrees * Math.PI / 180;
      const latitudeDelta = radians(destination.latitude - origin.latitude);
      const longitudeDelta = radians(destination.longitude - origin.longitude);
      const a = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
      const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distanceKm < 5) throw new Error('Choose two different cities so we can estimate the journey.');

      const band = costBands[currencySelect.value] || costBands.INR;
      const days = Math.min(60, Math.max(1, Number(document.getElementById('trip-days').value || 1)));
      const nights = Math.max(0, days - 1);
      const isAir = document.getElementById('travel-mode').value === 'air';
      const international = origin.country_code !== destination.country_code;
      const flightFloor = international ? band.internationalAirMin : band.airMin;
      const flightRate = international ? band.internationalAirPerKm : band.airPerKm;
      const transport = isAir
        ? Math.max(flightFloor, distanceKm * (distanceKm > 2500 ? flightRate : band.airPerKm))
        : Math.max(band.railMin, distanceKm * band.railPerKm);
      const destinationFactor = destinationCostFactors[destination.country_code] || (destination.country_code === origin.country_code ? 1 : 1.45);
      const estimates = {
        hotel: nights * band.hotelNight * destinationFactor,
        flight: transport,
        food: days * band.mealsDay * destinationFactor,
        shopping: days * band.activitiesDay * destinationFactor,
        transport: days * band.localDay * destinationFactor
      };
      fields.forEach((id) => { document.getElementById(id).value = Math.round(estimates[id]); });
      currencyNeedsRefresh = false;
      localStorage.setItem('ts-budget-origin', originText);
      document.getElementById('budget-result-label').textContent = 'Rough cost range per person';
      document.getElementById('budget-route-summary').textContent = `${origin.name}${origin.admin1 ? `, ${origin.admin1}` : ''}, ${origin.country || ''} → ${destination.name}${destination.admin1 ? `, ${destination.admin1}` : ''}, ${destination.country || ''} · about ${Math.round(distanceKm).toLocaleString()} km straight-line · ${days} ${days === 1 ? 'day' : 'days'} · ${isAir ? 'round-trip flight' : 'train / bus'}`;
      const flightLink = document.getElementById('budget-flight-link');
      flightLink.href = `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights from ${origin.name} to ${destination.name}`)}`;
      flightLink.classList.remove('hidden');
      status.textContent = `Estimate uses typical mid-range costs for ${destination.country || destination.name}. Lodging assumes a shared room. Adjust categories and recalculate for your own plans.`;
      const perPerson = fields.reduce((sum, id) => sum + Math.max(0, Number(document.getElementById(id)?.value || 0)), 0);
      const travellers = Math.max(1, Number(document.getElementById('travellers').value || 1));
      const low = Math.round(perPerson * 0.8);
      const high = Math.round(perPerson * 1.3);
      document.getElementById('total-amount').textContent = `${formatMoney(low)}–${formatMoney(high)}`;
      document.getElementById('budget-group-total').textContent = `Estimated total for ${travellers} ${travellers === 1 ? 'traveller' : 'travellers'}: ${formatMoney(low * travellers)}–${formatMoney(high * travellers)}`;
      document.getElementById('budget-result').classList.remove('hidden');
      saveEstimateButton?.classList.remove('hidden');
    } catch (error) {
      status.textContent = error.message || 'Could not prepare the estimate. Please try again.';
    } finally {
      estimateButton.disabled = false;
    }
  };

  estimateButton.addEventListener('click', estimateTrip);
  saveEstimateButton?.addEventListener('click', async () => {
    if (!window.tsBackend.configured) {
      status.textContent = 'Connect Supabase to save trip estimates to your account.';
      return;
    }
    saveEstimateButton.disabled = true;
    saveEstimateButton.textContent = 'Saving your estimate…';
    try {
      const destination = destinationInput.value.trim();
      const origin = document.getElementById('from-city').value.trim();
      const currency = currencySelect.value;
      const total = fields.reduce((sum, id) => sum + Math.max(0, Number(document.getElementById(id)?.value || 0)), 0);
      const duration = Number(document.getElementById('trip-days').value || 1);
      const title = `${origin} → ${destination}`;
      const breakdown = fields.map((id) => `${id}: ${formatMoney(Number(document.getElementById(id).value || 0))}`).join(' · ');
      await window.tsBackend.saveTripPlan({
        title,
        destination,
        budget: total,
        currency,
        notes: `${duration} ${duration === 1 ? 'day' : 'days'} · per person · ${breakdown}`
      });
      status.textContent = 'Estimate saved to your trip plans.';
      await loadSavedTrips();
    } catch (error) {
      status.textContent = `Could not save this estimate: ${error.message}`;
    } finally {
      saveEstimateButton.disabled = false;
      saveEstimateButton.textContent = 'Save this estimate to my trips';
    }
  });
  budgetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (currencyNeedsRefresh) {
      status.textContent = 'Please estimate the route again after changing currency so every category uses the same currency.';
      return;
    }
    calculateTotal();
  });
  currencySelect.addEventListener('change', () => {
    if (!document.getElementById('budget-result').classList.contains('hidden')) {
      currencyNeedsRefresh = true;
      status.textContent = 'Currency changed. Select “Estimate from these cities” again to refresh the category estimates.';
      document.getElementById('budget-result-label').textContent = 'Re-estimate to see the new currency';
      document.getElementById('total-amount').textContent = '—';
      document.getElementById('budget-group-total').textContent = '';
    }
  });
  window.tsBackend.ready.then(loadSavedTrips);
  window.addEventListener('travel-sphere-backend-ready', loadSavedTrips);
}
