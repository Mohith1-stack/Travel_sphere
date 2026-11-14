# TravelSphere JavaScript — Beginner Guide

The JavaScript is divided into small files inside `assets/js/`.

- `common.js` — shared helpers, browser storage, header search, saved places.
- `home.js` — seasonal tabs and mood filter.
- `budget.js` — trip budget calculator.
- `compare.js` — destination comparison, live weather, and comparison links.
- `explore.js` — Leaflet map, map markers, location, routes, and live destination data.
- `destination.js` — destination details, image, weather, and cuisine information.
- `food.js` — cuisine search and cuisine suggestion chips.
- `auth.js` — demo login/signup, profile, preferences, and settings.
- `../archive/legacy-script-backup.js` — original script backup; it is not loaded by the website.

## How to open the project
Open `index.html` using your usual local server/live preview. Avoid opening multiple old copies of the project at the same time.

## How scripts connect
Each HTML page loads `assets/js/common.js` first, then the page's feature script, then `assets/js/auth.js`. The `defer` attribute lets the browser finish reading the HTML before executing each script. The order matters because feature files reuse shared functions from `common.js`.

## Suggested learning order
1. Start with `common.js`: variables, functions, localStorage, arrays, and click events.
2. Learn `home.js`: click events and changing CSS classes.
3. Learn `budget.js`: form submission, numbers, arrays, and `reduce`.
4. Learn `compare.js`: `fetch`, `async`, `await`, and APIs.
5. Learn `destination.js` and `food.js`: reading URL parameters and displaying API results.
6. Learn `explore.js`: map library, objects, arrays, and geolocation.
7. Learn `auth.js`: forms, localStorage, and conditional UI.

## Important note about login
This is a front-end demonstration. Login/signup data is stored in the browser's localStorage and does not provide real server-side authentication or password security. Do not use real passwords or sensitive personal information in this demo.
