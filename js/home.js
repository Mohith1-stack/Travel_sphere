// Switch the seasonal information when a season tab is clicked.
document.querySelectorAll('[data-season]').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-season]').forEach((item) => item.classList.toggle('active', item === tab));
    document.querySelectorAll('.season-content').forEach((panel) => {
      panel.classList.toggle('active', panel.id === tab.dataset.season);
    });
  });
});

// Rotate the featured destination photo every second. Photos are real Unsplash
// photographs, with the photographer and source linked in the caption.
const heroImage = document.querySelector('[data-hero-image]');

if (heroImage) {
  const slides = [
    {
      title: 'Amalfi Coast, Italy',
      description: 'Cliffside villages · Mediterranean',
      image: 'https://images.unsplash.com/photo-1596569207858-466382cf0415?auto=format&fit=crop&w=1200&q=82',
      alt: 'Amalfi Coast village above the Mediterranean Sea',
      photographer: 'Ken Shono',
      credit: 'https://unsplash.com/photos/white-and-brown-concrete-buildings-near-body-of-water-during-daytime-B301ihe-PYY'
    },
    {
      title: 'Santorini, Greece',
      description: 'Whitewashed villages · Aegean Sea',
      image: 'https://images.unsplash.com/photo-1590321513783-3dec68a497c9?auto=format&fit=crop&w=1200&q=82',
      alt: 'Whitewashed Santorini buildings overlooking the Aegean Sea',
      photographer: 'Kameron Kincade',
      credit: 'https://unsplash.com/pt-br/fotografias/edificios-brancos-caem-em-cascata-de-um-penhasco-com-vista-para-o-mar-OML07Ww3aXE'
    },
    {
      title: 'Kyoto, Japan',
      description: 'Temple paths · Autumn colour',
      image: 'https://images.unsplash.com/photo-1637679105331-a0cea188b83e?auto=format&fit=crop&w=1200&q=82',
      alt: 'Kiyomizu-dera temple in Kyoto framed by autumn foliage',
      photographer: 'Ritz',
      credit: 'https://unsplash.com/ja/photos/木々に囲まれた丘の上にある建物-LECGKbTdZhI'
    },
    {
      title: 'Banff, Canada',
      description: 'Alpine lakes · Canadian Rockies',
      image: 'https://images.unsplash.com/photo-1564381461146-631310baa90e?auto=format&fit=crop&w=1200&q=82',
      alt: 'Moraine Lake and the Canadian Rockies near Banff',
      photographer: 'Joseph Northcutt',
      credit: 'https://unsplash.com/photos/lac-moraine-cxXIlpKEcqU'
    }
  ];
  const title = document.querySelector('[data-hero-title]');
  const description = document.querySelector('[data-hero-description]');
  const credit = document.querySelector('[data-hero-credit]');
  const count = document.querySelector('[data-hero-count]');
  const toggle = document.querySelector('[data-hero-toggle]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeSlide = 0;
  let timer;
  let paused = reducedMotion.matches;

  // Preload the photos so each one-second transition can display immediately.
  const preloaded = slides.map((slide) => {
    const image = new Image();
    image.src = slide.image;
    return image;
  });

  const renderSlide = (index) => {
    const slide = slides[index];
    heroImage.classList.add('is-changing');
    window.setTimeout(() => {
      heroImage.src = slide.image;
      heroImage.alt = slide.alt;
      if (title) title.textContent = slide.title;
      if (description) description.textContent = slide.description;
      if (credit) {
        credit.href = slide.credit;
        credit.textContent = `Photo by ${slide.photographer} / Unsplash ↗`;
      }
      if (count) count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      // Let the browser apply the new source before fading back in.
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => heroImage.classList.remove('is-changing')));
    }, 180);
  };

  const stop = () => {
    window.clearInterval(timer);
    timer = undefined;
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => {
      activeSlide = (activeSlide + 1) % slides.length;
      renderSlide(activeSlide);
    }, 1000);
  };

  const syncToggle = () => {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Play destination slideshow' : 'Pause destination slideshow');
    toggle.textContent = paused ? '▶' : 'Ⅱ';
  };

  if (toggle) {
    toggle.addEventListener('click', () => {
      paused = !paused;
      if (paused) stop();
      else start();
      syncToggle();
    });
  }

  reducedMotion.addEventListener?.('change', (event) => {
    if (event.matches) {
      paused = true;
      stop();
      syncToggle();
    }
  });

  syncToggle();
  if (!paused) start();
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
