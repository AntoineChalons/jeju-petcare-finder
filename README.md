# Jeju Pet Care Finder

A static, browser-based map and dashboard for finding pet services on Jeju Island — grooming salons, trainers, pet hotels, doggy day cares, dog walkers and sitters — backed by a normalized SQLite database.

> Repo name note: `jeju-petcare-finder` is the stable repository name. The app's display name may change later — see [issue #1](https://github.com/AntoineChalons/jeju-petcare-finder/issues/1).

## Features

- Interactive map (MapLibre GL + OpenFreeMap) with all places marked; selected place highlighted in coral.
- Sortable table of places with per-service badges, ratings and booking links.
- Filters: city, pet type, and seven service checkboxes — boarding, house sitting, drop-in visits, doggy day care, dog walking, grooming, pet training.
- Detail drawer with address, accepted pets, prices, contact methods, platform reviews and quotes from local pet owners, plus a booking call-to-action.
- Fully multi-lingual UI (English, Chinese, Japanese, Korean) with automatic browser-language detection and a persistent language switcher.
- Client-side only: the SQLite database is fetched as a static file and queried in the browser via sql.js (WebAssembly). No backend required.
- GitHub Pages compatible deployment.

## Project Structure

```text
repo-root/
├── index.html          # Vite entry HTML (theme CSS inline)
├── package.json
├── vite.config.js
├── src/                 # Application source (bundled by Vite)
│   ├── main.js           # Single render pipeline wiring state → views
│   ├── state.js          # Centralized state container (single store + subscribe)
│   ├── filters.js        # Pure filter-option derivation and filter-apply logic
│   ├── filter-bar.js     # Filter bar DOM rendering and event wiring
│   ├── reviews.js        # Pure review grouping/staleness logic
│   ├── db-loader.js      # sql.js bootstrap + v_place_dashboard query
│   ├── db-diagnostics.js # ?debug=1 developer banner
│   ├── map-controller.js
│   ├── table-controller.js
│   ├── drawer-controller.js
│   └── i18n/
│       ├── translations.js       # en/zh/ja/ko dictionaries
│       ├── i18n.js               # detection, persistence, t() lookup
│       └── language-switcher.js  # top-right language switcher UI
├── public/              # Static assets copied as-is to dist/
│   └── pet_services.db
├── data/
│   ├── places.csv       # Canonical CSV source of truth (one row = one place)
│   └── reviews.csv      # Review entries: platform summaries + local-owner quotes
└── tools/               # Python data pipeline
    ├── schema.py        # Shared column definitions + validation rules
    ├── validate.py      # CSV validation (also used by import)
    ├── import_csv.py    # CSV → SQLite (regenerates public/pet_services.db)
    ├── export_csv.py    # SQLite → CSV round-trip
    └── db.py            # Schema DDL + v_place_dashboard view
```

## Data workflow

The CSV files in `data/` are the source of truth, versioned in git. The SQLite file in `public/` is a build artifact regenerated from them:

```bash
# validate the CSVs
python tools/validate.py data/places.csv

# regenerate the database (also validates first)
python tools/import_csv.py data/places.csv public/pet_services.db

# round-trip back to CSV (e.g. after a manual DB edit)
python tools/export_csv.py public/pet_services.db data/places.csv
```

Service columns are tri-state: `true` / `false` / blank (unknown). A service checkbox in the UI only matches places where the service is confirmed `true`.

## Development

```bash
npm install
npm run dev       # dev server
npm run lint      # eslint
npm test          # vitest unit tests
python -m pytest tools/   # data pipeline tests
npm run build     # production build to dist/
```

## Deployment

GitHub Actions builds and deploys to GitHub Pages on every push to `main` (see `.github/workflows/deploy.yml`).

## Contributing

Spotted an error or a missing place? [Open an issue](https://github.com/AntoineChalons/jeju-petcare-finder/issues/new).
