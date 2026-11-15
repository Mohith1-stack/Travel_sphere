# TravelSphere

TravelSphere is a responsive travel discovery and planning website built with HTML, CSS, and JavaScript. Explore destinations, find ideas by mood or season, compare places, and keep a local list of trips to remember.

## Features

- **Explore destinations:** Browse a curated set of places on an interactive Leaflet map.
- **Destination profiles:** View destination summaries, photos, and current weather when the external data sources are available.
- **Discover by mood and season:** Find ideas for adventure, culture, luxury, nature, relaxing breaks, and seasonal travel.
- **Food explorer:** Browse cuisine highlights and links to food searches for each destination.
- **Compare destinations:** Compare destination profiles and current weather, with links to flight searches.
- **Plan a budget:** Estimate a rough per-person trip cost from origin and destination, trip length, and travel mode; adjust the categories and recalculate.
- **Save places:** Keep destinations, profile details, and currency/language preferences in a Supabase account.
- **Destination photography:** The homepage hero gently breathes and rotates through six destination photographs every eight seconds, over a soft landscape photo background.
- **Rotating food highlights:** The homepage features real food photography and selects three dishes from a curated collection on each visit, avoiding the previous selection.
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
| `login.html`, `signup.html`, `settings.html` | Account sign-in, profile, and preferences |

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
├── index.html, explore.html, destination.html  # Main destination pages
├── mood*.html, season.html                     # Curated discovery pages
├── food.html, compare.html, budget.html         # Food and planning tools
├── saved.html, login.html, signup.html          # Profile and saved places
├── settings.html                                # Preferences
├── assets/
│   ├── css/main.css                             # Shared styles and responsive layouts
│   └── js/                                      # Page scripts and shared behavior
├── docs/javascript-beginner-guide.md           # JavaScript learning guide
├── docs/supabase-setup.md                      # Supabase account and database setup
├── supabase/schema.sql                         # User tables and Row Level Security policies
├── archive/legacy-script-backup.js              # Unused original script backup
└── vercel.json                                  # Static deployment configuration
```

Page files stay at the repository root so the existing static routes and destination links continue to work. Styles, scripts, and documentation live in dedicated folders.

### JavaScript modules

- `assets/js/common.js` — shared browser storage, saved destinations, header search, and common helpers.
- `assets/js/home.js` — homepage food highlights, mood filters, and seasonal interactions.
- `assets/js/explore.js` — interactive map and destination data.
- `assets/js/destination.js` — destination profile content.
- `assets/js/food.js` — cuisine explorer.
- `assets/js/compare.js` — destination comparison.
- `assets/js/budget.js` — budget calculator.
- `assets/js/auth.js` — Supabase sign-in, sign-up, profile, and preferences behavior.
- `assets/js/supabase-backend.js` — Supabase Auth and database operations.
- `assets/js/supabase-config.js` — public project URL and publishable key configuration.

## Online features

The map, destination details, photos, weather, and travel searches use online services and need an internet connection. If an online service is unavailable or rate-limited, some details may be missing.

## Deployment

The site is static and can be hosted by services such as Vercel or GitHub Pages. The included `vercel.json` configures clean URLs and response headers for Vercel. No server-side runtime or build command is required. Supabase provides authentication and the database; set it up using [the Supabase guide](docs/supabase-setup.md).

## Limitations and privacy

Supabase credentials must be configured before account sign-in and cloud sync can work. The browser uses only the public publishable key; database access is limited by Row Level Security. The budget calculator provides broad planning estimates rather than live fares. Weather and destination content depend on third-party services, and flight or map searches open external services.

## Learning guide

See the [JavaScript beginner guide](docs/javascript-beginner-guide.md) for an introduction to the page scripts and how they work together.
