// Build a rough, editable per-person estimate from the origin and destination.
const budgetForm = document.getElementById('budget-form');
if (budgetForm) {
  const fields = ['hotel', 'flight', 'food', 'shopping', 'transport'];
  const estimateButton = document.getElementById('estimate-trip');
  const status = document.getElementById('budget-status');
  const currencySelect = document.getElementById('budget-currency');
  const destinationInput = document.getElementById('to-city');
  const params = new URLSearchParams(window.location.search);
  const destinationFromLink = params.get('destination');
  const lastOrigin = localStorage.getItem('ts-budget-origin') || '';
  if (destinationFromLink) destinationInput.value = destinationFromLink;
  document.getElementById('from-city').value = lastOrigin;

  const costBands = {
    INR: { symbol: '₹', locale: 'en-IN', airMin: 2500, airPerKm: 6.5, railMin: 500, railPerKm: 1.8, hotelNight: 2200, mealsDay: 900, localDay: 500, activitiesDay: 700 },
    USD: { symbol: '$', locale: 'en-US', airMin: 55, airPerKm: 0.12, railMin: 18, railPerKm: 0.035, hotelNight: 55, mealsDay: 30, localDay: 15, activitiesDay: 25 },
    EUR: { symbol: '€', locale: 'de-DE', airMin: 50, airPerKm: 0.11, railMin: 15, railPerKm: 0.03, hotelNight: 50, mealsDay: 28, localDay: 12, activitiesDay: 22 },
    GBP: { symbol: '£', locale: 'en-GB', airMin: 45, airPerKm: 0.10, railMin: 12, railPerKm: 0.025, hotelNight: 45, mealsDay: 25, localDay: 10, activitiesDay: 20 }
  };

  const formatMoney = (amount) => {
    const band = costBands[currencySelect.value] || costBands.INR;
    return `${band.symbol}${Math.round(amount).toLocaleString(band.locale)}`;
  };

  const calculateTotal = () => {
    const perPerson = fields.reduce((sum, id) => sum + Math.max(0, Number(document.getElementById(id)?.value || 0)), 0);
    const travellers = Math.max(1, Number(document.getElementById('travellers').value || 1));
    document.getElementById('total-amount').textContent = formatMoney(perPerson);
    document.getElementById('budget-group-total').textContent = `Estimated total for ${travellers} ${travellers === 1 ? 'traveller' : 'travellers'}: ${formatMoney(perPerson * travellers)}`;
    document.getElementById('budget-result').classList.remove('hidden');
    return perPerson;
  };

  const findCity = async (query) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('City lookup is temporarily unavailable. Please try again.');
    const data = await response.json();
    const result = data.results?.[0];
    if (!result) throw new Error(`We couldn't find “${query}”. Try adding its country name.`);
    return result;
  };

  const estimateTrip = async () => {
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
      const transport = Math.max(isAir ? band.airMin : band.railMin, distanceKm * (isAir ? band.airPerKm : band.railPerKm));
      const estimates = {
        hotel: nights * band.hotelNight,
        flight: transport,
        food: days * band.mealsDay,
        shopping: days * band.activitiesDay,
        transport: days * band.localDay
      };
      fields.forEach((id) => { document.getElementById(id).value = Math.round(estimates[id]); });
      localStorage.setItem('ts-budget-origin', originText);
      document.getElementById('budget-route-summary').textContent = `${origin.name}, ${origin.country || ''} → ${destination.name}, ${destination.country || ''} · about ${Math.round(distanceKm).toLocaleString()} km straight-line · ${days} ${days === 1 ? 'day' : 'days'} · ${isAir ? 'round-trip flight' : 'train / bus'}`;
      status.textContent = 'Estimate ready for standard-budget travel. Lodging assumes a shared room. Adjust any category below, then recalculate your total.';
      calculateTotal();
    } catch (error) {
      status.textContent = error.message || 'Could not prepare the estimate. Please try again.';
    } finally {
      estimateButton.disabled = false;
    }
  };

  estimateButton.addEventListener('click', estimateTrip);
  budgetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    calculateTotal();
  });
  currencySelect.addEventListener('change', () => {
    if (!document.getElementById('budget-result').classList.contains('hidden')) {
      status.textContent = 'Currency changed. Select “Estimate from these cities” again to refresh the category estimates.';
    }
  });
}
