# TravelSphere

TravelSphere is a responsive travel discovery and planning website built with plain HTML, CSS, and JavaScript. Explore destinations, browse ideas by mood or season, compare places, and keep a local list of trips you want to remember.

## Features

- **Explore destinations:** Browse a curated set of places on an interactive Leaflet map.
- **Destination profiles:** View destination summaries, photos, and current weather when the external data sources are available.
- **Discover by mood and season:** Find ideas for adventure, culture, luxury, nature, relaxing breaks, and seasonal travel.
- **Food explorer:** Browse cuisine highlights and links to food searches for each destination.
- **Compare destinations:** Compare destination profiles and current weather, with links to flight searches.
- **Plan a budget:** Add common trip expenses and calculate a total in a selected currency.
- **Save places:** Keep a list of destinations in the current browser and manage profile preferences in the demo interface.
- **Destination photography:** The homepage hero gently breathes and rotates through six destination photographs every eight seconds, over a soft landscape photo background.
- **Rotating food highlights:** The homepage selects three dishes from a curated collection on each visit and avoids repeating the last selection.
- **Sign-in flow:** Show a branded redirect for guests, return them to their requested page after sign-in, and welcome them into the app.
- **Responsive layout:** Use the site on desktop, tablet, or phone.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Home page and featured destinations |
| `explore.html` | Interactive map and destination discovery |
| `destination.html` | Destination profile, opened with a `?destination=` URL parameter |
| `mood.html` | Browse travel ideas by mood |
| `mood_*.html` | Adventure, cultural, luxury, nature, and relaxing collections |
| `season.html` | Seasonal destination ideas |
| `food.html` | Food and cuisine explorer |
| `compare.html` | Destination comparison |
| `budget.html` | Trip budget calculator |
| `saved.html` | Locally saved destinations |
| `login.html`, `signup.html`, `settings.html` | Demo account and preference screens |

## Run locally

TravelSphere has no build step or package installation. Because the map and live data use browser requests, open the project through a local web server instead of relying on a `file://` URL.

### Option 1: Python

From the project directory, run:

```bash
python -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

### Option 2: VS Code Live Server

Open this folder in VS Code, start the Live Server extension from `index.html`, and use the local URL it provides.

## Project structure

```text
Travel_sphere/
├── index.html                 # Home page
├── explore.html               # Interactive map
├── destination.html           # Destination details
├── mood*.html, season.html    # Curated discovery pages
├── food.html, compare.html    # Food and comparison tools
├── budget.html, saved.html    # Planning tools
├── login.html, signup.html    # Demo account screens
├── settings.html              # Demo preferences
├── style.css                  # Shared styles and responsive layouts
├── js/                         # Page scripts and shared behavior
├── vercel.json                 # Vercel clean URL and header configuration
└── JAVASCRIPT_BEGINNER_GUIDE.md
```

### JavaScript modules

- `js/common.js` — shared browser storage, saved destinations, header search, and common helpers.
- `js/home.js` — mood and seasonal page interactions.
- `js/explore.js` — interactive map and destination data.
- `js/destination.js` — destination profile content.
- `js/food.js` — cuisine explorer.
- `js/compare.js` — destination comparison.
- `js/budget.js` — budget calculator.
- `js/auth.js` — demo profile, sign-in, sign-up, and preferences behavior.

## Online features

The map, destination details, photos, weather, and travel searches use online services and need an internet connection. If an online service is unavailable or rate-limited, some details may be missing.

## Deployment

The site is static and can be hosted by services such as Vercel or GitHub Pages. The included `vercel.json` configures clean URLs and response headers for Vercel. No server-side runtime or build command is required.

## Limitations and privacy

This is a front-end demo. It has no backend, database, or real authentication. Demo profile, preference, and saved-place data is stored in the browser's `localStorage`; it is not encrypted or synced between devices. Do not enter real passwords or sensitive personal information. Weather and destination content depend on third-party services, and any flight or map search opens the relevant external service.

## Learning guide

See [`JAVASCRIPT_BEGINNER_GUIDE.md`](JAVASCRIPT_BEGINNER_GUIDE.md) for an introduction to the page scripts and how they work together.
