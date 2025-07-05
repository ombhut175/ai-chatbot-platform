# AI Chatbot Platform

[➡️ Project Purpose & Route Descriptions](docs/projectPurpose.md)

A comprehensive multi-tenant platform to create, deploy, and manage AI-powered chatbots for your business. Built with Next.js 15, this platform enables easy data upload, custom chatbot creation, seamless integrations, and detailed analytics monitoring.

## 🚀 Features

- **Multi-Tenant Architecture:** Secure company-based isolation with user management
- **Custom Chatbot Builder:** Create AI chatbots with configurable personalities, welcome messages, and themes
- **Flexible Data Sources:** Support for PDFs, CSVs, DOCX, JSON, URLs, and Q&A pairs
- **Multiple Integrations:** Embed via JavaScript widget, iFrame, or REST API
- **Real-time Analytics:** Track conversations, user engagement, satisfaction, and performance metrics
- **Vector Search:** Powered by Pinecone for intelligent document retrieval
- **Multiple AI Models:** Support for Google Gemini and Hugging Face models
- **Background Processing:** Inngest-powered async data processing
- **Modern UI:** Built with Radix UI, Tailwind CSS, and Framer Motion

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase (Database & Auth)
- **AI/ML:** Google Gemini, Hugging Face, Pinecone (Vector Database)
- **Background Jobs:** Inngest
- **UI Components:** Radix UI, Lucide React, Framer Motion
- **State Management:** Zustand
- **File Processing:** PDF-parse, Mammoth, XLSX, Cheerio
- **Form Handling:** React Hook Form, Zod validation

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (preferred) or npm
- Supabase account and project
- Pinecone account and index
- Google Gemini API key
- Hugging Face API token (optional)

## 🚀 Installation

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
   - Copy `env.example.txt` to `.env.local`:
     ```bash
     cp env.example.txt .env.local
     ```
   - Fill in all required environment variables (see [Environment Variables](#environment-variables))

4. **Set up Supabase:**
   - Create a new Supabase project
   - Set up the database schema (refer to docs for schema setup)
   - Configure authentication settings

5. **Set up Pinecone:**
   - Create a Pinecone account
   - Create an index with appropriate dimensions
   - Note your API key and index name

6. **Run the development server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

## 📖 Usage

### Authentication
- **Sign Up:** Register a new company account with user details
- **Login:** Access your dashboard with email/password authentication
- **Multi-tenant:** Each company has isolated data and users

### Dashboard Features
- **Overview:** View chatbot statistics, quick actions, and recent activity
- **Chatbots:** Create, configure, and manage AI chatbots with custom personalities
- **Data Sources:** Upload files (PDF, CSV, DOCX, JSON), scrape URLs, or add Q&A pairs
- **Analytics:** Monitor performance, user engagement, and conversation insights
- **Integrations:** Generate embed codes for JavaScript widget, iFrame, or API usage
- **Settings:** Manage company profile, API keys, and chatbot defaults

### Chatbot Creation Workflow
1. **Upload Data:** Add knowledge base through file upload or URL scraping
2. **Create Chatbot:** Configure name, personality, and welcome message
3. **Link Data:** Associate data sources with your chatbot
4. **Test & Deploy:** Use the chat interface to test, then deploy via integrations
5. **Monitor:** Track performance through the analytics dashboard

## 📁 Project Structure

```
ai-chatbot-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── api/               # API routes
│   │   ├── chat/              # Chat interface
│   │   └── dashboard/         # Dashboard pages
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utilities, types, and stores
│   └── inngest/              # Background job functions
├── docs/                      # Documentation
├── public/                    # Static assets
└── clean-start.ps1           # Windows development script
```

### Key Directories
- **`src/app/`** — Next.js 15 App Router with route groups
- **`src/components/`** — Reusable UI components and layouts
- **`src/lib/`** — Utilities, types, Supabase client, and Zustand stores
- **`src/inngest/`** — Background processing functions
- **`docs/`** — Comprehensive project documentation

## 🔧 Environment Variables

Copy `env.example.txt` to `.env.local` and configure the following variables:

### Required Variables
```bash
# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Database & Authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Pinecone (Vector Database)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_pinecone_index_name

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Background Jobs (Inngest)
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### Optional Variables
```bash
# Hugging Face (Alternative AI Provider)
HUGGING_FACE_API_URL=https://api-inference.huggingface.co/models/your_model
HUGGING_FACE_API_TOKEN=your_hf_token
```

## 🔨 Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm dev:turbo        # Start development server with Turbo
pnpm dev:clean        # Clean start (Windows PowerShell)

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Maintenance
pnpm lint             # Run ESLint
pnpm clean            # Clean Next.js cache
```

## 📚 Documentation

- [Project Purpose & Routes](docs/projectPurpose.md)
- [System Architecture](docs/architecture/system-overview.md)
- [API Reference](docs/api/api-reference.md)
- [Process Flow](docs/detailed-process-flow.md)
- [Authentication Changes](docs/AUTHENTICATION_CHANGES.md)

## 🚀 Deployment

### Deploying to Vercel (Recommended)

1. **Set up Inngest Cloud** (Required for background processing):
   - Create account at [app.inngest.com](https://app.inngest.com)
   - Create new app and note your Event Key and Signing Key
   - See [detailed guide](docs/deployment/vercel-inngest-setup.md)

2. **Configure Vercel Environment Variables**:
   ```bash
   # Required for background processing
   INNGEST_EVENT_KEY=your_inngest_event_key
   INNGEST_SIGNING_KEY=your_inngest_signing_key
   
   # Other required variables
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   # ... (see env.example.txt for full list)
   ```

3. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

4. **Configure Inngest Webhook**:
   - In Inngest Cloud, set webhook URL to: `https://your-app.vercel.app/api/inngest`
   - Test the webhook connection

5. **Verify Deployment**:
   - Upload a test file
   - Check Inngest Cloud dashboard for event processing
   - Monitor Vercel Functions logs

### Other Platforms
- **Netlify**: Requires additional configuration for background jobs
- **Railway**: Full Node.js support, works out of the box
- **Self-hosted**: Ensure long-running process support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

