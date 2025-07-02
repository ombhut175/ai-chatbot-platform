# Project Purpose & Page/Route Descriptions

## Overview
This project is a Multi-Tenant AI Chatbot Platform that allows businesses to upload data, generate intelligent chatbots, and integrate them into their websites or internal systems. The platform is built with Next.js and supports both public and internal chatbot use cases, secure data handling, and extensive customization and analytics.

Below is a detailed description of each main page and route, explaining its purpose and how it fits into the overall system.

---

## Route & Page Descriptions

### `/` (HomePage)
- **Purpose:** Redirects users to the login page. This is the entry point for unauthenticated users.

### `/login` (LoginPage)
- **Purpose:** Allows company users to log in to their account. Includes email/password authentication and a link to sign up if the user does not have an account.

### `/signup` (SignupPage)
- **Purpose:** Enables new companies to register on the platform. Collects user and company information, and upon successful signup, redirects to the dashboard.

### `/dashboard` (DashboardPage)
- **Purpose:** The main hub for authenticated users. Displays a welcome message, quick actions (like uploading data, creating chatbots, testing chat, viewing analytics), stats cards, and recent activity. Central place to manage all aspects of the company's chatbots and data.

### `/dashboard/analytics` (AnalyticsPage)
- **Purpose:** Provides analytics and insights into chatbot performance, user engagement, top questions, and more. Allows users to monitor and export reports on their chatbot usage and effectiveness.

### `/dashboard/chatbots` (ChatbotsPage)
- **Purpose:** Lets users create, configure, and manage their AI chatbots. Users can set chatbot names, descriptions, welcome messages, personalities, and link them to specific data sources. Also allows toggling chatbot status and deleting chatbots.

### `/dashboard/data` (DataSourcesPage)
- **Purpose:** Central location for uploading and managing data sources that power the chatbots. Supports file uploads (PDF, CSV, XLSX, DOCX, JSON), manual text input, URL scraping, and Q&A pairs. Users can view, delete, and monitor the status of their data sources.

### `/dashboard/integrations` (IntegrationsPage)
- **Purpose:** Provides integration options for embedding chatbots into external websites or apps. Users can generate JavaScript widget code, iframe embed code, and see API access examples. Also allows customization of widget appearance and API key management.

### `/dashboard/profile` (ProfilePage)
- **Purpose:** Allows users to view and update their personal and company profile information, notification preferences, and security settings. Includes avatar upload, contact info, and account status.

### `/dashboard/settings` (SettingsPage)
- **Purpose:** Lets users manage company-wide and account-specific settings, including company branding, account details, chatbot default messages, and API keys. Supports updating company logo, changing passwords, and regenerating API keys.

### `/chat/public` (PublicChatPage)
- **Purpose:** Public-facing chat interface for website visitors. Showcases the AI chatbot's capabilities, features, and sample questions. Includes a chat widget for real-time interaction.

---

## How These Pages Fit the Requirements
- **Authentication & Dashboard:** `/login`, `/signup`, `/dashboard`, `/dashboard/profile`, `/dashboard/settings`
- **Data Upload:** `/dashboard/data`
- **Embedding & Integration:** `/dashboard/integrations`, `/chat/public`
- **Chat UI:** `/chat/public`, `/dashboard/chatbots`
- **Analytics:** `/dashboard/analytics`
- **Customization:** `/dashboard/settings`, `/dashboard/chatbots`, `/dashboard/integrations`
- **Security:** All dashboard and data routes are protected and scoped per company; settings and profile pages allow for secure management of sensitive information.

---

## Summary
Each page and route in this project is designed to fulfill a specific part of the multi-tenant AI chatbot platform's requirements, ensuring a seamless experience for both public users and internal company staff. The modular structure allows for easy expansion and customization as the platform evolves.
