# TravelSphere

A static HTML, CSS and JavaScript travel-planning website.

## Run it

1. Extract the project folder.
2. Open `index.html` in a browser. For the most consistent local-storage behavior, use VS Code with the Live Server extension.
3. All HTML pages share `style.css` and modular scripts in the `js/` folder (such as `js/common.js`, `js/auth.js`, etc.). See `JAVASCRIPT_BEGINNER_GUIDE.md` for details.

## JavaScript features

- Header search opens a destination profile.
- Save/unsave destination buttons and saved-place counts use browser `localStorage`.
- `saved.html` displays saved destinations.
- Seasonal tabs switch between Spring, Summer, Autumn and Winter.
- Budget planner adds the entered expenses and displays the total in the selected currency.
- Compare form updates the destination headings. The ratings in the table are sample values, not live data.
- Mood filter links to the matching mood page.
- Destination pages read the destination name from the URL.
- Signup/profile/preferences demo data is stored locally in the current browser.

## Important limitations

This is a front-end learning demo. It does not have a server, database, real account authentication, live weather, a real map, or live destination ratings. Passwords are not stored by the JavaScript. Do not use this demo for real accounts or sensitive information; real authentication requires a secure backend.

## Quick JavaScript concepts

- `addEventListener()` runs code when a user submits a form or clicks a button.
- `getElementById()` finds an HTML element by its ID.
- `textContent` changes visible text safely.
- `localStorage` keeps small demo settings in the current browser.
- `URLSearchParams` reads values such as `?destination=Kyoto` from a URL.
