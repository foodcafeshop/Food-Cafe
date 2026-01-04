# 🍔 Food Cafe - Premium Restaurant Management System

**Version:** 1.0 (Investor Ready)  
**Last Updated:** Dec 2025

**Food Cafe** is a state-of-the-art, multi-tenant Restaurant Management System (RMS) designed to revolutionize the dining experience. It unifies customer ordering, kitchen operations, and administrative management into a single, real-time ecosystem.

This document serves as a comprehensive **Software Requirements Specification (SRS)** and feature overview for investors, stakeholders, and potential customers.

---

## 🚀 Executive Summary & Value Proposition

For restaurant owners, the chaos of peak hours, disconnected systems, and staffing shortages are major profit leaks. **Food Cafe** solves this with a **"Serverless, Real-Time, Edge-First"** architecture.

1.  **Maximize Table Turnover**: Direct-from-table QR ordering reduces wait times, allowing tables to turn 20-30% faster.
2.  **Zero-Error Operations**: Customer orders flow directly to the Kitchen Display System (KDS). No handwriting, no misheard orders, no food waste.
3.  **Collaborative Social Dining**: **Unique Selling Point (USP)**. Multiple guests at the same table can scan the QR code and join a shared "Live Session". They see each other's items in real-time before placing the group order.
4.  **Mobile-First Administration**: Shop owners and staff can manage the entire floor, bills, and menu from their smartphones with a fully responsive admin interface.
5.  **Data-Driven Growth**: Real-time financial analytics and product performance reports empower owners to make informed menu decisions.
6.  **Installable App (PWA)**: Works offline and installs on devices like a native app for instant access and smoother performance.
7.  **Theme Personalization**: Flexible appearance settings with Light, Dark, or System Sync modes to suit any environment.

---

## 🌟 Comprehensive Feature Specifications

### 📱 1. The Guest Experience (Customer Facing)
*   **Smart QR Ordering System**:
    *   **Context-Aware URLs**: Scanning a QR code auto-detects the specific shop and table (e.g., `foodcafeshop.in/shop-slug/menu?table=T1`).
    *   **Secure Table Access**:
        *   **Geo-Fencing via OTP**: (Optional) Prevents prank orders by requiring a 4-digit OTP displayed physically on the table. OTPs auto-rotate immediately when a table is cleared, ensuring security for the next guest.
        *   **Session Management**: Guests are "logged in" to a table session identified by `active_customers` JSONB data in the database.
    *   **Collaborative Cart**: Using **Supabase Realtime**, multiple devices sync instantaneously. Guest A adds a burger, Guest B sees it immediately on their phone.
*   **Dynamic Digital Menu**:
    *   **Rich Media**: High-quality images for every item.
    *   **Live Dietary Filters**: Instant toggles for **Veg**, **Non-Veg**, and **Vegan**.
    *   **Smart Instant Search**: Offline-capable, deep search across names, descriptions, and **Tags**.
    *   **Real-Time Availability**: Out-of-stock items disappear instantly from all active menus to prevent disappointment.
    *   **Performance Optimized**: Pre-fetching and database indexing ensure sub-100ms menu loads.
    *   **Immersive Photo Gallery**: High-quality "Ambiance" section with lightbox viewer and smart pagination.
*   **Live Order Tracking**: An "Uber-like" status tracker shows the food journey: *Queued -> Preparing -> Ready -> Served*.
*   **Unified Account Hub**:
    *   **Mobile Bottom Sheet**: Centralized hub for profile, current table status, and quick links to Menu/Cart.
    *   **Desktop Popover**: Clean, non-intrusive profile dropdown replacing cluttered headers.
    *   **Personalized Experience**: Time-aware greetings (Good Morning/Evening) and prominent logout access.

### 👤 2. Identity & Session Architecture
*   **Frictionless Entry**:
    *   **Name-Only Guest**: Users can join a table with just a name. System creates a temporary "Guest Profile" (`is_guest=true`) bound to that specific shop and table.
    *   **Registered User**: Providing a phone number links to a persistent profile for order history and loyalty.
*   **Advanced Session Security**:
    *   **Smart Shop Guard**: The app detects if a user (with an active session) scans a QR code for a *different* shop. It immediately **wipes local storage** and logs them out to prevent cross-shop data leaks.
    *   **Auto-Logout**: When the waiter clears the table, a Realtime signal forces all connected devices to the Welcome Screen.

### 👨‍🍳 3. Kitchen Display System (Integration)
*   **Real-Time Sync**: Orders placed here appear instantly on the Merchant KDS.
*   **Live Status Updates**: "Preparing" and "Ready" statuses are pushed back to the customer device in real-time.

### 🏙️ 4. The D2C Marketplace (Live ✅)
*   **Consumer Landing Page**:
    *   **Unified Search**: Real-time discovery of restaurants with smart filters and API-level pagination.
    *   **PWA Installable**: Native-like app experience with offline support and home screen installation.
    *   **Built-In QR Scanner**: Integrated camera scanner for seamless table entry.
*   **Smart Discovery**:
    *   **Popular Restaurants**: "Top 9" grid layout showcasing trending spots.
    *   **Category Rail**: Visual browsing by cuisine or food type.

### 🔒 5. Security & Infrastructure
*   **Row Level Security (RLS)**:
    *   Robust PostgreSQL policies ensure complete data isolation between tenants.
    *   Specific policies allow Public read access for menus/tables (for QR scanning) while restricting write access to authenticated users.
*   **Authentication**:
    *   Supabase Auth integration.
    *   Custom `user_roles` table for granular permission management.
*   **Performance**:
    *   **Database Indexing**: Optimized indexes on `shop_id`, `created_at`, `status`, and `is_featured` for blazing fast queries.
    *   **Parallel Fetching**: API endpoints optimized with `Promise.all` to reduce Time-to-First-Byte (TTFB).

---

## 🛠️ Technical Architecture & Stack

*   **Frontend**: Next.js 14 (App Router) for Server-Side Rendering (SSR) and SEO.
*   **Database**: Supabase (PostgreSQL) for relational data integrity.
*   **Real-Time Engine**: Supabase Realtime (WebSockets) for sub-50ms latency updates.
*   **Authorization**: Supabase Auth with custom `user_roles` linking users to specific Shops.
*   **UI/UX**: Tailwind CSS + Shadcn UI for a premium, accessible, and responsive design.
*   **Mobile Optimization**: Dedicated mobile views (Cards vs Tables) for complex admin interfaces.
*   **Deploy**: Vercel for edge-network distribution and automatic scaling.

---

## 📦 Usage Guide (Standard Operating Procedure)

1.  **Setup**: Shop Owner creates a shop, sets currency (e.g. ₹), uploads the menu via CSV, and configures the floor plan.
2.  **Go Live**: QR codes are printed and placed on tables.
3.  **The Loop**:
    *   **Guest** scans QR -> Authenticates (OTP optional) -> Joins Session -> Orders Food.
    *   **Kitchen** hears ping -> Prepares Food -> Marks "Ready".
    *   **Waiter** serves food -> Marks "Served".
    *   **Guest** requests bill -> **Admin** settles bill on Dashboard -> Marks "Clear Table".
    *   **System** auto-logs out all guest devices and rotates the OTP, resetting the table for the next group.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/food-cafe.git
    cd food-cafe
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    ```

4.  **Database Setup:**
    - Run the SQL scripts in `supabase/schema.sql` in your Supabase SQL Editor to create tables and policies.
    - (Optional) Run the seed script to populate initial data:
      ```bash
      npx tsx run-seed.ts
      ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  **Open the app:**
    - Customer View: [http://localhost:3000](http://localhost:3000)
    - Admin Dashboard: [http://localhost:3000/[shop-slug]](http://localhost:3000/[shop-slug])

## License

This project is licensed under the MIT License.
