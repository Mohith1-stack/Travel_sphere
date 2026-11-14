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

// Give the homepage food cards a fresh mix on each visit. Keep the previous
// selection out of the next draw so the content feels new after reloading.
const foodCards = [...document.querySelectorAll('.food-showcase .food-card')];

if (foodCards.length) {
  const foodHighlights = [
    {
      id: 'tokyo-sushi', title: 'Tokyo Sushi', description: 'Fresh sushi, elegant omakase and unforgettable Japanese dining experiences.',
      region: 'Japan · Fine dining', image: 'https://images.unsplash.com/photo-1570780775848-bc1897788ce0?auto=format&fit=crop&w=900&q=82',
      alt: 'Sushi assortment with nigiri, maki, wasabi and pickled ginger'
    },
    {
      id: 'naples-pizza', title: 'Neapolitan Pizza', description: 'Soft fermented dough, blistered crust and the timeless flavours of Naples.',
      region: 'Italy · Classic', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=82',
      alt: 'Wood-fired pizza with mozzarella and fresh basil'
    },
    {
      id: 'hyderabad-biryani', title: 'Hyderabadi Biryani', description: 'Fragrant rice, rich spices and a legendary culinary tradition from India.',
      region: 'India · Heritage', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=82',
      alt: 'Aromatic biryani served with mint and fresh accompaniments'
    },
    {
      id: 'bangkok-pad-thai', title: 'Bangkok Pad Thai', description: 'Tamarind, lime and wok-fried noodles make this a Bangkok street-food favourite.',
      region: 'Thailand · Street food', image: 'https://images.unsplash.com/photo-1637806931098-af30b519be53?auto=format&fit=crop&w=900&q=82',
      alt: 'Pad Thai noodles with crushed peanuts, bean sprouts and lime'
    },
    {
      id: 'paris-croissants', title: 'Parisian Croissants', description: 'Golden, flaky layers and buttery pastries from the cafés of Paris.',
      region: 'France · Bakery', image: 'https://images.unsplash.com/photo-1681072368184-a5a906887cf2?auto=format&fit=crop&w=900&q=82',
      alt: 'Freshly baked golden croissant on a plate'
    },
    {
      id: 'istanbul-baklava', title: 'Istanbul Baklava', description: 'Crisp pastry, toasted nuts and a delicate syrup in a beloved Turkish dessert.',
      region: 'Türkiye · Sweet', image: 'https://images.unsplash.com/photo-1676014959543-81df1079b423?auto=format&fit=crop&w=900&q=82',
      alt: 'Turkish pistachio baklava arranged on a serving tray'
    },
    {
      id: 'hanoi-pho', title: 'Hanoi Pho', description: 'A fragrant broth, fresh herbs and rice noodles in Vietnam’s iconic soup.',
      region: 'Vietnam · Comfort food', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=900&q=82',
      alt: 'Vietnamese pho with beef, rice noodles and fresh herbs'
    },
    {
      id: 'new-york-bagels', title: 'New York Bagels', description: 'A chewy, kettle-boiled classic served with favourite city-style toppings.',
      region: 'United States · Deli', image: 'https://images.unsplash.com/photo-1574691696373-a097069fec03?auto=format&fit=crop&w=900&q=82',
      alt: 'Sesame bagel sandwich with cream cheese and tomato'
    }
  ];
  const selectionKey = 'travelSphere.homeFoodSelection';
  let previousSelection = [];

  try {
    const storedSelection = JSON.parse(localStorage.getItem(selectionKey) || '[]');
    previousSelection = Array.isArray(storedSelection) ? storedSelection : [];
  } catch {
    previousSelection = [];
  }

  const shuffle = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  };

  const freshHighlights = foodHighlights.filter((item) => !previousSelection.includes(item.id));
  const drawFrom = freshHighlights.length >= foodCards.length ? freshHighlights : foodHighlights;
  const selection = shuffle(drawFrom).slice(0, foodCards.length);

  foodCards.forEach((card, index) => {
    const item = selection[index];
    if (!item) return;
    const image = card.querySelector('[data-food-image]');
    const heading = card.querySelector('h3');
    const copy = card.querySelector('p');
    const region = card.querySelector('[data-food-region]');
    if (image) {
      image.src = item.image;
      image.alt = item.alt;
    }
    if (heading) heading.textContent = item.title;
    if (copy) copy.textContent = item.description;
    if (region) region.textContent = item.region;
  });

  try {
    localStorage.setItem(selectionKey, JSON.stringify(selection.map((item) => item.id)));
  } catch {
    // The cards still randomize when browser storage is unavailable.
  }
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
