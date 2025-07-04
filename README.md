# AI Chatbot Platform

[➡️ Project Purpose & Route Descriptions](docs/projectPurpose.md)

A multi-tenant platform to create, deploy, and manage AI-powered chatbots for your business. Easily upload data, build custom chatbots, integrate them into your website or app, and monitor performance with advanced analytics.

## Features

- **Multi-Tenant Support:** Manage multiple companies, users, and chatbots in one platform.
- **Custom Chatbot Builder:** Create chatbots with configurable personalities, welcome messages, and themes.
- **Flexible Data Sources:** Upload PDFs, CSVs, DOCX, URLs, and more to power your chatbot's knowledge base.
- **Integrations:** Embed chatbots via JavaScript widget, iFrame, or API.
- **Analytics Dashboard:** Track conversations, user engagement, satisfaction, and more.
- **User Management:** Company and user profile management, authentication, and settings.
- **24/7 AI Support:** Always-available, context-aware AI chat for your customers.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (preferred) or npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd ai-chatbot-platform
   ```
2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```
3. **Configure environment variables:**
   - Copy `env.example.txt` to `.env` and adjust as needed:
     ```bash
     cp env.example.txt .env
     ```
   - The following environment variables are required:
     - `NODE_ENV` (e.g., `development`)
     - `HUGGING_FACE_API_URL` (e.g., `https://api-inference.huggingface.co/models/...`)
     - `HUGGING_FACE_API_TOKEN` (your Hugging Face API token)

4. **Run the development server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

## Usage

- **Sign Up / Login:** Register a new account or use demo credentials (any email/password) to explore the platform.
- **Dashboard:** View chatbot stats, quick actions, and recent activity.
- **Chatbots:** Create, configure, and manage your AI chatbots. Assign data sources and set custom personalities.
- **Data Sources:** Upload files, add manual text, scrape URLs, or input Q&A pairs to build your chatbot's knowledge base.
- **Integrations:** Get code snippets to embed your chatbot as a widget, iFrame, or use the API.
- **Analytics:** Monitor chatbot performance, user engagement, and top questions.
- **Settings/Profile:** Manage company info, user profile, API keys, and chatbot defaults.

## Project Structure

- `src/app/` — Next.js app directory (pages, routes, layouts)
- `src/components/` — UI and functional components
- `src/lib/` — Types, stores, utilities, and mock data
- `public/` — Static assets (images, logos)

## Environment Variables

See `env.example.txt` for all required variables. Key variables include:

```
NODE_ENV=development
HUGGING_FACE_API_URL=your_hf_endpoint_url   # e.g. https://api-inference.huggingface.co/models/…
HUGGING_FACE_API_TOKEN=your_hf_token
```

## Scripts

- `pnpm dev` / `npm run dev` — Start development server
- `pnpm build` / `npm run build` — Build for production
- `pnpm start` / `npm start` — Start production server
- `pnpm lint` / `npm run lint` — Lint code

## License

MIT