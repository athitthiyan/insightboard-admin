# Contributing to InsightBoard

Thanks for helping improve InsightBoard. This project welcomes bug reports, feature ideas, documentation fixes, and tests.

## Ways to Contribute

- Pick an issue labeled `good first issue` or `help wanted`.
- Report a bug with expected behavior, actual behavior, screenshots if useful, and reproduction steps.
- Suggest a chart or analytics feature by describing the operational insight it surfaces.
- Improve test coverage, accessibility, or documentation.

## Local Setup

```bash
npm install
npm start
```

The app runs at [http://localhost:4202](http://localhost:4202).

You'll need a running HotelAPI instance (see [hotelapi-backend](https://github.com/athitthiyan/hotelapi-backend)) or the live API configured in `environment.ts`.

## Before Opening a Pull Request

```bash
npm run lint
npm test
npm run build
```

## Pull Request Guidelines

- Keep PRs focused on one behavior or improvement.
- Include screenshots for chart or layout changes.
- Add or update tests when behavior changes.
- Describe any analytics endpoint changes required from HotelAPI.

## Good First Issue Ideas

- Add a date-range filter to the revenue chart.
- Add an export-to-CSV button on the bookings table.
- Improve the empty state for the transactions page when there is no data.
- Add keyboard navigation support to the collapsible sidebar.
- Write unit tests for the analytics service data-transformation functions.
