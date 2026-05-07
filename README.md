<div align="center">

# InsightBoard

Hotel analytics and admin operations dashboard for the Stayvora platform.

[![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![CI](https://github.com/athitthiyan/insightboard-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/athitthiyan/insightboard-admin/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Live App:** [insightboard-admin.vercel.app](https://insightboard-admin.vercel.app) | **Platform:** [stayvora.co.in](https://stayvora.co.in)

</div>

---

## About

**InsightBoard** is the internal analytics and operations dashboard for the Stayvora platform. It gives ops and admin teams a real-time view of booking performance, payment health, and revenue trends across all hotels.

## Features

- Live KPI cards: total bookings, revenue, payment success rate, and daily stats
- Revenue bar chart for the last 6 months
- Payment status donut chart
- Daily bookings trend chart
- Recent bookings table with status and guest details
- Room-type revenue breakdown
- Searchable bookings page with filters
- Transactions monitoring page
- Collapsible sidebar navigation

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Angular 17 standalone components |
| Language | TypeScript strict mode |
| Charts | Chart.js 4.x |
| Styling | SCSS |
| State | Angular Signals |
| HTTP | Angular HttpClient |
| Deployment | Vercel |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/athitthiyan/insightboard-admin.git
cd insightboard-admin
npm install
npm start
```

The dev server runs at [http://localhost:4202](http://localhost:4202).

## Seeded Login

- **Email:** `ops@stayvora.co.in`
- **Password:** `AdminPass123`

Credentials are created by the backend seed endpoint. You can customise them with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` in the backend environment.

## Project Structure

```text
src/app/
|-- core/
|   |-- services/
|       |-- analytics.service.ts
|-- shared/components/
|   |-- sidebar/
|   |-- header/
`-- features/
    |-- dashboard/
    |-- bookings-table/
    `-- transactions/
```

## Connected Apps

| App | Repository | Purpose |
| --- | --- | --- |
| Stayvora Booking | [athitthiyan/stayease-booking-app](https://github.com/athitthiyan/stayease-booking-app) | Guest-facing booking frontend |
| PayFlow | [athitthiyan/payflow-payment-app](https://github.com/athitthiyan/payflow-payment-app) | Payment processing |
| HotelAPI | [athitthiyan/hotelapi-backend](https://github.com/athitthiyan/hotelapi-backend) | Shared backend API |
| Partner Portal | [athitthiyan/partner-portal](https://github.com/athitthiyan/partner-portal) | Hotel-partner operations |

## Contributing

Contributions are welcome — bug reports, feature ideas, and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) and please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

This project is licensed under the [MIT License](LICENSE).
