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

### 👨‍🍳 2. Intelligent Kitchen Display System (KDS)
*   **Real-Time Ticket Board**: Orders appear on the kitchen screen with a distinctive "Ping" sound the millisecond they are placed.
*   **Visual Workflow**:
    *   **Queued**: New orders awaiting acceptance.
    *   **Preparing**: Active cooking items.
    *   **Ready**: Plated items waiting for pickup.
*   **Smart Aggregation**: The KDS groups identical items (e.g., "3x Chicken Burgers") so chefs can batch cook efficiently.
*   **Urgency Indicators**: Color-coded visualization helps prioritization during peak hours.

### 📊 3. Admin Command Center & Analytics
*   **Interactive Dashboard**:
    *   **Revenue Overview**: Area chart tracking **Gross Revenue**, **Net Sales**, **Tax Collected**, and **Service Charge** over custom date ranges (Today, Week, Month, Custom).
    *   **Category Analytics**: Interactive Pie Chart with a **smart toggle** to view breakdown by **Sales Volume (Qty)** or **Sales Value (Revenue)**.
    *   **Peak Hours Analysis**: Bar chart visualizing busiest hours of the last 30 days to optimize staff scheduling.
    *   **Real-time Metrics**: Live counters for Active Orders, Occupied Tables, and System Health.
    *   **Vercel Analytics**: Integrated web analytics for tracking traffic and performance.
*   **Floor Management (Mobile Optimized)**:
    *   **Visual Floor Plan**: A canvas-style view of the restaurant layout, now fully responsive with a **Card View** for mobile devices.
    *   **Live Status Indicators**: Tables change color in real-time: **Empty** (Green), **Occupied** (Blue), **Billed** (Red).
    *   **Staff Take Order**: Dedicated interface for waiters to place orders for tables, view OTPs, and add item notes directly.
    *   **Quick Actions**: access Settle Bill, Clear Table, or Print QR directly from the canvas or mobile cards.
*   **Financial & Billing Engine**:
    *   **Digital Billing**: Auto-calculates Subtotal, Tax (Configurable), and Service Charge.
    *   **Payment Reconciliation**: Track payments via Cash, Card, or UPI.
    *   **Bill History**: A searchable archive of all past transactions with re-print functionality, optimized for mobile browsing.
*   **Menu Engineering**:
    *   **Visual Editor**: Create, edit, and organize Categories and Items.
    *   **Bulk Operations**:
        *   **Smart CSV Import**: Import menus and categories with automatic JSON parsing for tags/images.
        *   **AI Menu Digitization**: Upload photos of physical menus to auto-generate a structured CSV ZIP.
            *   **Smart Parsing**: Uses Google Gemini AI to extract items, prices, and descriptions.
            *   **Auto-Enhancement**: Generates appetizing descriptions and fetches relevant stock images (via Bing Search) for every item.
            *   **Intelligent Logic**: Handles multi-price items (e.g. "Full/Half"), strictly enforces database schema constraints, and auto-generates tags.
            *   **Premium UX**: Featuring resilient background processing (persists during navigation), live timer, and AI status animations.
        *   **Relational Linking**: Advanced import logic connects Menus to Categories and Categories to Items by **Name**.
        *   **Data Integrity**: Database enforces `UNIQUE(shop_id, name)` constraints.

### 📦 4. Inventory & Supply Chain
*   **Raw Material Tracking**:
    *   **Granular Control**: Track stock in precision units (g, ml, pcs, kg) with real-time level monitoring.
    *   **Smart Alerts**: Set custom "Low Stock Thresholds" to receive instant warnings before running out of essential ingredients.
    *   **Visual Inventory**: Auto-generated product images (via Bing Search) make identifying stock items instant and error-free.
*   **Stock Operations**:
    *   **Adjustment Logs**: Comprehensive audit trail for all stock changes with specific reasons (Restock, Wastage, Theft, Usage).
    *   **Trending Insights**: Track stock movement direction with visual indicators for restocking vs. depletion.
*   **Recipe Engine**:
    *   **Ingredient Linking**: Map Menu Items to specific Inventory Items (e.g., "Chicken Burger" consumes "1 Chicken Breast" + "1 Bun").
    *   **Cost Control**: (Ready for Future) Foundation laid for automatic COGS (Cost of Goods Sold) calculation based on recipe composition.

### 🏢 5. Shop Management & Data Sovereignty
*   **Staff Management**:
    *   **Role-Based Access Control (RBAC)**:
        *   **Shop Owner**: Complete control over shop, settings, financials, and deletion.
        *   **Admin**: can manage operations, menus, and add/edit/delete staff members.
        *   **Staff**: Restricted to order taking and table updates (cannot delete tables or view sensitive settings).
    *   **Secure Invitations**: Add staff securely; they inherit shop context automatically.
*   **Gallery Management**:
    *   **Visual Editor**: Admin interface to manage shop's photo gallery (up to 16 images).
    *   **Auto-Cleanup**: Automatically filters void inputs for a clean database.
*   **Localization**:
    *   **Multi-Currency Support**: Native support for global currencies, with **INR (₹)** prioritized.
*   **Enterprize-Grade Data Management**:
    *   **Full Data Export**: One-click "Export to ZIP" functionality generating portable CSVs for all shop data.
    *   **Cascade Shop Deletion**: "Danger Zone" feature allows complete removal of a shop and all associated data.

### 🔒 6. Security & Infrastructure
*   **Row Level Security (RLS)**:
    *   Robust PostgreSQL policies ensure complete data isolation between tenants.
    *   Specific policies allow Public read access for menus/tables (for QR scanning) while restricting write access to authenticated users.
*   **Authentication**:
    *   Supabase Auth integration.
    *   Custom `user_roles` table for granular permission management.
*   **Performance**:
    *   **Database Indexing**: Optimized indexes on `shop_id`, `created_at`, `status`, and `is_featured` for blazing fast queries.
    *   **Parallel Fetching**: API endpoints optimized with `Promise.all` to reduce Time-to-First-Byte (TTFB).

### 💳 7. SaaS Monetization & Revenue Operations (Live ✅)
*   **Provider-Agnostic Architecture**:
    *   **Adapter Pattern**: Designed to switch between **Razorpay**, Stripe, or PhonePe without code rewrites. Currently fully integrated with Razorpay for India.
    *   **Robust Webhooks**: Idempotent webhook handling ensures events (payments, cancellations) are never missed or processed twice.
*   **Subscription Engine**:
    *   **Tiered Plans**: Flexible recurring billing cycles (Monthly/Yearly) for Merchant SaaS subscriptions.
    *   **Automated Invoicing**: System auto-generates compliant PDF invoices for every successful renewal.
    *   **Dunning Management**: Handles failed payments with grace periods and status updates (Active -> Past Due -> Cancelled).
*   **Marketing & Growth**:
    *   **Universal Coupon System**: Powerful engine supporting two distinct scopes:
        *   **Platform Coupons**: Created by Super Admin. Applied by **Merchants** during subscription checkout.
        *   **Shop Coupons**: Created by Shop Owners. Applied by **Customers** during food checkout.
        *   **Advanced Logic**: Supports per-user limits, customer whitelisting, and "New User Only" rules.
    *   **Promo Codes**: Support for percentage vs flat off, usage limits, and expiration dates.

---

## 🛠️ Technical Architecture & Stack

*   **Frontend**: Next.js 14 (App Router) part of the Monorepo, focused on Admin Dashboard and Kitchen Display System (KDS).
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

    # Payment (Razorpay)
    RAZORPAY_KEY_ID=rzp_test_...
    RAZORPAY_KEY_SECRET=your_razorpay_secret
    RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
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
