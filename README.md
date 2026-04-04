# InsightBoard - Hotel Analytics Admin Dashboard

Professional admin dashboard for hotel analytics, booking oversight, and transaction monitoring.

Live Demo: [insightboard-admin.vercel.app](https://insightboard-admin.vercel.app)

## Features

- Live KPI cards for bookings, revenue, success rate, and daily stats
- Revenue bar chart for the last 6 months
- Payment status donut chart
- Daily bookings trend chart
- Recent bookings table
- Room-type revenue breakdown
- Searchable bookings page
- Transactions monitoring page
- Collapsible sidebar navigation

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 17 |
| Charts | Chart.js 4.x |
| Styling | SCSS |
| HTTP | Angular HttpClient |
| State | Angular Signals |
| Deployment | Vercel |

## Quick Start

```bash
npm install
npm start
# http://localhost:4202
```

## Demo Login

- Email: `admin@example.com`
- Password: `AdminPass123`

These credentials are created by the backend seed endpoint. You can customize them with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` in the backend environment.

## Project Structure

```text
src/app/
|-- core/
|   |-- services/
|       |-- analytics.service.ts
|-- shared/components/
|   |-- sidebar/
|   |-- header/
|-- features/
    |-- dashboard/
    |-- bookings-table/
    |-- transactions/
```

Built by Athitthiyan - Portfolio 2026
