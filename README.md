# MarketCap

A stock-tracking web app in the spirit of Google Finance: live prices, charts, news, and a personal
portfolio you can log in to and keep. Prices and news come from free-tier market APIs; accounts and
saved data live in Supabase.

> **Not financial advice.** Data comes from free API tiers and may be delayed or incomplete.

## Features

- **Market overview**: S&P 500, Nasdaq 100, Dow and Russell 2000 (via ETFs), top gainers/losers among
  popular large-caps, and market news.
- **Search**: ticker and company-name typeahead.
- **Stock pages**: live price, interactive price chart (1D / 5D / 1M / 6M / YTD / 1Y / 5Y), key stats
  (market cap, P/E, 52-week range, dividend yield, beta), and company news.
- **Accounts**: email + password sign-up and sign-in.
- **Watchlist**: save stocks and watch them update live.
- **Portfolios**: multiple portfolios, buy / sell / dividend transactions, average-cost holdings,
  unrealized and realized gain/loss, dividends received, and an allocation chart.
- Light and dark themes, responsive layout.

## Tech stack

| Area | Choice |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router, Cache Components), React, TypeScript |
| Styling / charts | Tailwind CSS, Recharts, lucide-react |
| Auth + database | [Supabase](https://supabase.com) (Postgres, Auth, Row Level Security) |
| Prices, news, search | [Finnhub](https://finnhub.io) (free tier) |
| Price history | [Twelve Data](https://twelvedata.com) (free tier) |
| Tests | Vitest |

## Getting started

Requires Node.js 20.9 or newer.

```bash
git clone https://github.com/wahabcs/MarketCap.git
cd MarketCap
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Where to get it |
|---|---|
| `FINNHUB_API_KEY` | Free key at [finnhub.io](https://finnhub.io/register) |
| `TWELVEDATA_API_KEY` | Free key at [twelvedata.com](https://twelvedata.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same page (the `sb_publishable_…` key) |

The two market API keys are only ever used on the server (`src/app/api/*` and `src/lib/market/*`);
they are never sent to the browser. `.env.local` is git-ignored.

### Database setup

1. Create a Supabase project.
2. Run the SQL files in [`supabase/migrations`](supabase/migrations) in order (SQL Editor, or the
   Supabase CLI). They create `watchlist_items`, `portfolios` and `transactions`, enable Row Level
   Security on every table, and restrict each row to its owner.
3. In Authentication → URL Configuration, set your Site URL and add your redirect URLs
   (for local development: `http://localhost:3000/**`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (portfolio math) |

## How it works

- **Server-side market data.** The browser calls this app's own API routes
  (`/api/quote`, `/api/search`, `/api/company`, `/api/news`, `/api/history`), which call the market
  providers with the secret keys and cache responses (`"use cache"`), so the free-tier rate limits
  (Finnhub 60 calls/min, Twelve Data 8/min) go a long way. Failed responses are cached for only a
  couple of seconds, and rate-limit errors are shown to the user as such.
- **Live prices** refresh by polling (every 30 s, 60 s on the overview page) while the tab is visible.
- **Privacy.** Every table has Row Level Security: users can only read and write their own rows.
  A transaction can only point at a portfolio owned by the same user (composite foreign key).
- **Portfolio math** (average cost, realized P/L, dividends) is a set of pure functions in
  [`src/lib/portfolio/holdings.ts`](src/lib/portfolio/holdings.ts) with unit tests.

## Project layout

```
src/app/            Pages and API routes (overview, portfolio, watchlist, transactions, news, stocks/[symbol])
src/components/     UI components
src/lib/market/     Finnhub + Twelve Data clients (server-only, cached)
src/lib/portfolio/  Holdings and gain/loss calculations (+ tests)
src/lib/supabase/   Supabase clients, session-refresh proxy, generated DB types
supabase/migrations SQL schema and security policies
```

## Limitations

- Free data tiers: quotes can be delayed, and "top movers" are ranked within a fixed set of 12
  popular stocks because the free plan has no market-wide movers feed.
- US-listed stocks and ETFs only; all amounts are in USD.
- No portfolio-value-over-time chart yet.

## License

No license has been chosen yet; all rights reserved by default.
