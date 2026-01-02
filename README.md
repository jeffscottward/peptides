# Peptides Report Tracker

A modern web application to track and manage peptide analysis reports (e.g., from Janoshik). This tool automates the process of extracting data from report images using OCR and visualizing the results.

## Features

- **Automated OCR Processing** - Extract peptide data from report images (PNG/JPG) using Gemini 1.5 Flash.
- **Interactive Dashboard** - View and filter peptide reports with a clean, responsive UI.
- **tRPC Integration** - Type-safe communication between frontend and backend.
- **Drizzle ORM & SQLite** - Robust and fast data storage.
- **TanStack Start** - Modern SSR framework for high performance.

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) (v8 or later)
- Node.js (v18 or later)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jeffscottward/peptides.git
   cd peptides
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Create a `.env` file in `apps/web/` based on `.env.example`.
   - Add your `GEMINI_API_KEY` and other required credentials.

### Database Setup

1. Apply the schema to your local SQLite database:
   ```bash
   pnpm run db:push
   ```

### Development

Run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

- `apps/web/` - Fullstack application (TanStack Start + React)
- `packages/api/` - Shared tRPC routers and business logic
- `packages/db/` - Database schema and Drizzle configurations
- `packages/env/` - Shared environment variable validation

## License

MIT
