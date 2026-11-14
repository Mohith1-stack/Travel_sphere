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
