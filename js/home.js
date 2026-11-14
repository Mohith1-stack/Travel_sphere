// Switch the seasonal information when a season tab is clicked.
document.querySelectorAll('[data-season]').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-season]').forEach((item) => item.classList.toggle('active', item === tab));
    document.querySelectorAll('.season-content').forEach((panel) => {
      panel.classList.toggle('active', panel.id === tab.dataset.season);
    });
  });
});

// Gently rotate the featured destination photo every eight seconds.
const heroImage = document.querySelector('[data-hero-image]');

if (heroImage) {
  const slides = [
    {
      title: 'Amalfi Coast, Italy',
      description: 'Cliffside villages · Mediterranean',
      image: 'https://images.unsplash.com/photo-1596569207858-466382cf0415?auto=format&fit=crop&w=1200&q=82',
      alt: 'Amalfi Coast village above the Mediterranean Sea'
    },
    {
      title: 'Santorini, Greece',
      description: 'Whitewashed villages · Aegean Sea',
      image: 'https://images.unsplash.com/photo-1590321513783-3dec68a497c9?auto=format&fit=crop&w=1200&q=82',
      alt: 'Whitewashed Santorini buildings overlooking the Aegean Sea'
    },
    {
      title: 'Kyoto, Japan',
      description: 'Temple paths · Autumn colour',
      image: 'https://images.unsplash.com/photo-1637679105331-a0cea188b83e?auto=format&fit=crop&w=1200&q=82',
      alt: 'Kiyomizu-dera temple in Kyoto framed by autumn foliage'
    },
    {
      title: 'Banff, Canada',
      description: 'Alpine lakes · Canadian Rockies',
      image: 'https://images.unsplash.com/photo-1564381461146-631310baa90e?auto=format&fit=crop&w=1200&q=82',
      alt: 'Moraine Lake and the Canadian Rockies near Banff'
    },
    {
      title: 'Bali, Indonesia',
      description: 'Lush rice terraces · Island life',
      image: 'https://images.unsplash.com/photo-1622833065251-be0d3ceaea04?auto=format&fit=crop&w=1200&q=82',
      alt: 'Green rice terraces cascading across a hillside in Bali'
    },
    {
      title: 'Paris, France',
      description: 'Iconic landmarks · Parisian charm',
      image: 'https://images.unsplash.com/photo-1532464298-ff809843058c?auto=format&fit=crop&w=1200&q=82',
      alt: 'Eiffel Tower beneath a clear blue sky in Paris'
    }
  ];
  const title = document.querySelector('[data-hero-title]');
  const description = document.querySelector('[data-hero-description]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeSlide = 0;
  let timer;
  let paused = reducedMotion.matches;

  // Preload the photos so each transition can display immediately.
  slides.forEach((slide) => {
    const image = new Image();
    image.src = slide.image;
  });

  const renderSlide = (index) => {
    const slide = slides[index];
    heroImage.classList.add('is-changing');
    window.setTimeout(() => {
      heroImage.src = slide.image;
      heroImage.alt = slide.alt;
      if (title) title.textContent = slide.title;
      if (description) description.textContent = slide.description;
      // Let the browser apply the new source before fading back in.
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => heroImage.classList.remove('is-changing')));
    }, 360);
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
    }, 8000);
  };

  reducedMotion.addEventListener?.('change', (event) => {
    if (event.matches) {
      paused = true;
      stop();
    }
  });

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
