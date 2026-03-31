# 📊 InsightBoard — Hotel Analytics Admin Dashboard

> A professional dark analytics dashboard with real-time charts, booking management, and transaction monitoring.

**Live Demo:** [insightboard-admin.vercel.app](https://insightboard-admin.vercel.app)

---

## ✨ Features

- 📈 **8 Live KPI Cards** — Total bookings, revenue, success rate, avg value, today stats
- 📊 **Revenue Bar Chart** — Monthly revenue for last 6 months (Chart.js)
- 🍩 **Payment Donut Chart** — Success / failed / pending / refunded breakdown
- 📉 **Daily Bookings Line Chart** — 30-day activity trend with gradient fill
- 📋 **Recent Bookings Table** — Latest reservations with guest details
- 📌 **Room Type Revenue Bars** — Animated progress bars by room category
- 🔍 **Bookings Page** — Full searchable + filterable table
- 💳 **Transactions Page** — All payment records with status badges
- 🔀 **Collapsible Sidebar** — Icon-only or full navigation

## 🛠️ Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Framework   | Angular 17 (Standalone Components) |
| Charts      | Chart.js 4.x                  |
| Styling     | SCSS (Dark Indigo/Cyan Theme) |
| Fonts       | JetBrains Mono + Inter        |
| HTTP        | Angular HttpClient            |
| State       | Angular Signals               |
| Deployment  | Vercel                        |

## 🚀 Quick Start

```bash
npm install
npm start
# → http://localhost:4202
```

## 📂 Project Structure

```
src/app/
├── core/
│   └── services/
│       └── analytics.service.ts   # KPIs, charts, recent data
├── shared/components/
│   ├── sidebar/                   # Collapsible nav
│   └── header/                    # Search + user info
└── features/
    ├── dashboard/                 # Main overview with Chart.js
    ├── bookings-table/            # Filterable bookings
    └── transactions/              # Payment records
```

---

*Built by Athitthiyan — Portfolio 2026*
