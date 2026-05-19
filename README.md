# CryptoIntel | Market Intelligence Platform

![CryptoIntel Banner](https://images.unsplash.com/photo-1621504450181-5d356f61d307?q=80&w=1200&auto=format&fit=crop)

> A production-grade, full-stack cryptocurrency intelligence platform. Built for high-performance real-time data streaming, portfolio management, and automated market alerts.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Getting Started](#-getting-started)
- [Docker Setup](#-docker-setup-recommended)
- [API Documentation](#-api-documentation)
- [WebSocket Events](#-websocket-events)
- [Environment Variables](#-environment-variables)
- [Future Improvements](#-future-improvements)

---

## 📖 Overview

CryptoIntel is a comprehensive SaaS platform designed for traders and crypto enthusiasts. It aggregates live data from the CoinGecko API, processes it through a dedicated background worker, and streams real-time updates directly to a React-based client using WebSockets. The platform allows users to build and track their portfolios, analyze historical volatility, and set custom price-action triggers that push instant notifications.

---

## ✨ Features

- **Real-Time Market Dashboard:** Live updates of top cryptocurrencies, global market cap, volume, and BTC dominance.
- **Premium Fintech UI:** Glassmorphism aesthetics, dark mode by default, interactive sparklines, and Recharts integration.
- **Portfolio Management:** Calculate cost basis, total value, and absolute/percentage P&L across multiple portfolios.
- **Advanced Analytics:** Dynamic correlation matrices, 7-day volatility analysis, and historical area charts.
- **Custom Price Alerts:** Set ABOVE/BELOW price triggers with instant real-time push notifications.
- **Resilient Background Processing:** Built-in rate-limit handling, exponential backoff, and caching layers to ensure stability.

---

## 🏗 Architecture

```mermaid
graph TD
    Client[React Client (Vite + Zustand)] <-->|REST API| Server[Express.js Server]
    Client <-->|WebSockets| Server
    Server <-->|Prisma ORM| DB[(PostgreSQL / SQLite)]
    Server <-->|Pub/Sub & Cache| Redis[(Redis / Memory)]
    Worker[Background Worker] -->|Fetch Market Data| CoinGecko[CoinGecko API]
    Worker -->|Write Data| DB
    Worker -->|Publish Updates| Redis
```

---

## 💻 Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + custom glassmorphism tokens
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Data Visualization:** Recharts
- **Icons:** Lucide React

### Backend
- **Framework:** Node.js + Express
- **Language:** TypeScript
- **Database:** Prisma ORM (Supports PostgreSQL / SQLite)
- **Real-Time:** Socket.io
- **Caching & Queues:** Redis & BullMQ (or in-memory for local dev)
- **Security:** Helmet, Express Rate Limit, bcryptjs, JWT

---

## 📂 Folder Structure

```text
crypto-dashboard/
├── client/                 # React Frontend Application
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Reusable UI components & charts
│       ├── pages/          # Application routes (Dashboard, Portfolio, etc.)
│       ├── services/       # Axios API client & WebSocket singleton
│       ├── stores/         # Zustand state management
│       └── utils/          # Formatters and helpers
├── server/                 # Node.js Backend & Worker
│   ├── prisma/             # Database schema and migrations
│   └── src/
│       ├── controllers/    # Express route handlers
│       ├── middlewares/    # Auth, Validation (Zod), and Error handling
│       ├── routes/         # API route definitions
│       ├── services/       # Core business logic (Market, Portfolio, Alerts)
│       ├── websocket/      # Socket.io room management and broadcasters
│       └── worker.ts       # Background job for polling & alert evaluation
├── docker-compose.yml      # Orchestration for Prod/Docker environments
└── package.json            # Root configuration for local concurrent execution
```

---

## 🚀 Getting Started (Local Execution)

If you don't have Docker installed, you can run the entire platform locally using SQLite and an in-memory cache.

1. **Install Dependencies:**
   ```bash
   npm run install:all
   ```

2. **Initialize Database:**
   ```bash
   cd server
   npx prisma db push
   cd ..
   ```

3. **Start Application:**
   ```bash
   npm start
   ```
   The client will be available at `http://localhost:5173` and the server at `http://localhost:4000`.

---

## 🐳 Docker Setup (Recommended)

For production or environments with Docker Desktop installed, the application utilizes PostgreSQL and Redis.

1. **Start the stack:**
   ```bash
   docker compose up --build -d
   ```
2. **Access the Application:**
   Navigate to `http://localhost:5173`.

---

## 🔌 API Documentation

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate and receive JWT | No |
| `GET`  | `/api/market` | Get paginated crypto market data | Yes |
| `GET`  | `/api/market/global` | Get global market statistics | Yes |
| `GET`  | `/api/portfolio` | Retrieve user portfolios and P&L | Yes |
| `POST` | `/api/portfolio` | Create a new portfolio | Yes |
| `POST` | `/api/alerts` | Create a new price trigger alert | Yes |

---

## ⚡ WebSocket Events

The platform uses `socket.io` for real-time synchronization.

### Client Listens To:
- `prices:update`: Broadcasts an array of the top cryptocurrencies every 60 seconds.
- `alert:triggered`: Pushed specifically to the user's room when a target price is breached.

### Server Listens To:
- `join`: Used to authenticate the socket and join a user-specific room (`user_${userId}`).

---

## 🔐 Environment Variables

Create a `.env` file in both the root and `/server` directory.

```env
# Database
DATABASE_URL=file:./dev.db
# Or for Docker: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crypto_intel

# JWT Configuration
JWT_SECRET=super-secret-jwt-key-for-development
JWT_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development

# Third-Party APIs
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=your_optional_api_key_here

# Frontend
VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000
```

---

## 📸 Screenshots

*(Replace with actual image links)*
- **Live Market Dashboard:** `[Insert Link]`
- **Coin Details & Analytics:** `[Insert Link]`
- **Portfolio Tracker:** `[Insert Link]`
- **Real-Time Alerts:** `[Insert Link]`

---

## 🔑 Demo Credentials

To test the application without registering, use the following credentials (if seeded):

- **Email:** `demo@cryptointel.com`
- **Password:** `password123`

---

## 🔮 Future Improvements

- [ ] **Exchange Integrations:** Connect via API to Binance/Coinbase to automatically sync holdings.
- [ ] **Historical Portfolio Tracking:** Track portfolio value over time (Net Worth Chart).
- [ ] **Advanced Charting:** Integrate TradingView Lightweight Charts for candlestick data.
- [ ] **Social Features:** Allow users to make their portfolios public and share them via links.
- [ ] **Mobile App:** Package the web app using React Native or Capacitor.

---

*Designed and engineered for high performance and modern aesthetics.*
