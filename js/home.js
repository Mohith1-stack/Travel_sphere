// Switch the seasonal information when a season tab is clicked.
document.querySelectorAll('[data-season]').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-season]').forEach((item) => item.classList.toggle('active', item === tab));
    document.querySelectorAll('.season-content').forEach((panel) => {
      panel.classList.toggle('active', panel.id === tab.dataset.season);
    });
  });
});


// Filter the mood page using the selected radio button.
document.querySelectorAll('.mood-filter').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const selected = form.querySelector('input[name="mood"]:checked')?.value || 'all';
    const page = selected === 'all' ? 'mood.html' : `mood_${selected}.html`;
    window.location.href = page;
  });
});
