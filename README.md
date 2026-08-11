# Jeju Pet Care Finder

A static, browser-based map and dashboard for finding pet services on Jeju Island. The app covers grooming salons, trainers, pet hotels, doggy day care, dog walkers, sitters, and veterinary clinics.

> Repo name note: `jeju-petcare-finder` is the stable repository name. The app's display name may change later. See [issue #1](https://github.com/AntoineChalons/jeju-petcare-finder/issues/1).

## Features

- Interactive MapLibre GL map with all active places.
- Sortable provider table with service badges, ratings, and booking links.
- Filters for city, pet type, language, service, and veterinary clinics.
- Detail drawer with addresses, prices, contacts, reviews, and booking actions.
- English, Chinese, Japanese, and Korean user interfaces.
- Client-side SQLite queries through sql.js.
- Static GitHub Pages deployment with no application backend.

## Data architecture

The web app and its source data are separate:

- `AntoineChalons/jeju-petcare-finder` contains only the web application.
- The private `AntoineChalons/jeju-petcare-data` repository contains the CSV source files, validation code, tests, and database build scripts.
- [AntoineChalons/public-data](https://github.com/AntoineChalons/public-data) contains only the generated `pet_services.db` file.

The browser downloads the current database from:

```text
https://antoinechalons.github.io/public-data/pet_services.db
```

Set `VITE_DATABASE_URL` at build time to use a different database endpoint.

## Project structure

```text
repo-root/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.js
    ├── state.js
    ├── filters.js
    ├── filter-bar.js
    ├── reviews.js
    ├── db-loader.js
    ├── db-diagnostics.js
    ├── map-controller.js
    ├── table-controller.js
    ├── drawer-controller.js
    └── i18n/
```

## Development

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

The development server uses the published database by default. You can use another endpoint for local work:

```bash
VITE_DATABASE_URL=http://localhost:8000/pet_services.db npm run dev
```

## Deployment

GitHub Actions builds and deploys the app to GitHub Pages after each push to `main`.

## Contributing

Spotted an error or a missing place? [Open an issue](https://github.com/AntoineChalons/jeju-petcare-finder/issues/new).
