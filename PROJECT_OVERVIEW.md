# 🍔 Food Cafe - Premium Restaurant Management System (SRS)

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
    *   **Live Dietary Filters**: Dynamic toggles for **Veg**, **Non-Veg**, **Vegan**, **Jain Veg**, and **Contains Egg** (Smartly hides unavailable types).
    *   **Universal Iconography**: Standardized visual indicators (Leaf for Veg/Vegan, Diamond for Jain, Egg for Egg) across Menu, Cart, and Order History.
    *   **Smart Instant Search**:
        *   **Offline First**: Search filters the menu instantly on the client-side without network latency.
        *   **Deep Discovery**: Searches across **Names**, **Descriptions**, and hidden **Tags** (e.g., "Spicy", "Chef Special") to find relevant items instantly.
        *   **Live URL Sync**: Search queries update the URL in real-time for easy sharing of filtered views.
    *   **Real-Time Availability**: Out-of-stock items disappear instantly from all active menus to prevent disappointment.
    *   **Max Quantity Limits**: Global setting or per-item overrides for order quantity limits, ensuring kitchen capacity management.
    *   **Performance Optimized**: Pre-fetching and database indexing ensure sub-100ms menu loads.
    *   **Immersive Photo Gallery**:
        *   **Interactive Lightbox**: Customers can view the restaurant's ambiance through a high-quality, full-screen image gallery.
        *   **Smart Pagination**: "See More" functionality keeps the initial load fast (limited to 8 images) while allowing deep exploration.
        *   **Accessible Design**: Fully keyboard and screen-reader accessible carousel.
*   **Live Order Tracking**: An "Uber-like" status tracker shows the payment journey status: *Queued -> Preparing -> Ready -> Served*.
*   **Unified Account Hub (New ✅)**:
    *   **Mobile Experience**: A dedicated **Bottom Sheet Hub** providing a personalized "Good Morning/Evening" greeting, pulsing "Current Table" indicator, and quick-access cards for Menu and Cart.
    *   **Desktop Experience**: A sleek **Popover Profile Menu** replacing cluttered inline text.
    *   **Decluttered Navigation**: User-related actions moved to the "Account" tab on mobile, focusing the header on Shop Identity.

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
    *   **Staff Take Order Interface**:
        *   **Table Selection**: Grid view with real-time status and OTP display for secure customer verification.
        *   **Smart Menu Browser**: Searchable, categorized menu with "Add to Cart" functionality.
        *   **Contextual Actions**: Ability to bill tables directly or clear them after payment.
        *   **Order Customization**: Staff can add specific notes (e.g., "Less Spicy", "No Ice") to individual items.
    *   **Quick Actions**: access Settle Bill, Clear Table, or Print QR directly from the canvas or mobile cards.
*   **Financial & Billing Engine**:
    *   **Digital Billing**: Auto-calculates Subtotal, Tax (Configurable), and Service Charge.
    *   **Payment Reconciliation**: Track payments via Cash, Card, or UPI.
    *   **Bill History**: A searchable archive of all past transactions with re-print functionality, optimized for mobile browsing.
*   **Menu Engineering**:
    *   **Visual Editor**: Create, edit, and organize Categories and Items with full support for extended dietary types (Jain, Egg).
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
    *   **Smart Unit Handling**: Intelligent dropdowns automatically select smaller units (e.g., 'g' instead of 'kg') for recipes to speed up data entry.
    *   **Dependency Protection**: "Safe Delete" system prevents removing ingredients that are actively used in recipes, with clear impact warnings (e.g., "Used in 5 recipes").
*   **End-Of-Day (EOD) Reconciliation**:
    *   **Variance Analysis**: Dedicated interface for managers to physically count stock and input "Actual" values.
    *   **Auto-Calculation**: System instantly highlights discrepancies (Variance) between theoretical usage and physical counts.
    *   **Bulk Correction**: One-click submission to adjust all stock levels to match physical reality, categorizing differences as "Correction".

### 🏢 5. Shop Management & Data Sovereignty
*   **Staff Management**:
    *   **Role-Based Access Control (RBAC)**:
        *   **Shop Owner**: Complete control over shop, settings, financials, and deletion.
        *   **Admin**: can manage operations, menus, and add/edit/delete staff members.
        *   **Staff**: Restricted to order taking and table updates (cannot delete tables or view sensitive settings).
    *   **Secure Invitations**: Add staff securely; they inherit shop context automatically.
*   **Content Management**:
    *   **Gallery Control**:
        *   **Visual Manager**: Shop owners can manage the "Our Ambiance" gallery directly from the profile settings.
        *   **Input Validation**: Supports up to 16 high-res image URLs with automatic cleanup of empty inputs.
    *   **Ratings Visibility (New ✅)**:
        *   **Toggle Control**: Shop owners can choose to display or hide their aggregate star ratings on the customer landing page.
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
    *   **Visual Plan Manager**: Dedicated Admin UI to create, edit, and manage subscription tiers (`/saas/plans`).
    *   **Automated Invoicing**: System auto-generates compliant PDF invoices for every successful renewal.
    *   **Dunning Management**: Handles failed payments with grace periods and status updates (Active -> Past Due -> Cancelled).
*   **Marketing & Growth**:
    *   **Universal Coupon System**: Powerful engine supporting two distinct scopes:
        *   **Platform Coupons**: Created by Super Admin. Applied by **Merchants** during subscription checkout.
        *   **Shop Coupons**: Created by Shop Owners. Applied by **Customers** during food checkout.
        *   **Advanced Logic**: Supports per-user limits, customer whitelisting, and "New User Only" rules.
    *   **Promo Codes**: Support for percentage vs flat off, usage limits, and expiration dates.

### 🖨️ 8. Thermal Printer Integration (Live ✅)
*   **Universal Browser Support**:
    *   **Driverless Printing**: Works with any standard 80mm/58mm thermal printer recognized by the OS (USB/Bluetooth/Network).
    *   **Customizable Templates**: Dedicated layouts for **Kitchen Order Tickets (KOT)** (Large fonts, high contrast) and **Customer Bills** (Branded, detailed).
*   **Smart Receipt Engine**:
    *   **Dynamic Layouts**: Auto-adjusts for 80mm vs 58mm paper widths.
    *   **Configurable Branding**: Option to show/hide Shop Logo, custom Header/Footer messages.
    *   **Historical Accuracy**: Reprints past bills with the exact tax/price breakdown from the moment of sale.

### 🔔 9. Push Notifications (Live ✅)
*   **Edge-First Notification Architecture**:
    *   **Serverless Triggering**: Next.js API Routes trigger notifications directly via `web-push` libraries without needing heavy backend workers.
    *   **Standardized Protocol**: Uses VAPID (Voluntary Application Server Identification) for secure, browser-standard communication with FCM/APNs.
*   **Dual-Channel Strategy**:
    *   **Merchant Channel ("New Order Alert")**:
        *   **Critical Alerting**: High-priority notifications for staff when a new order is received.
        *   **Resilient Delivery**: Service Worker logic ensures "New Order" alerts play a sound and vibrate even if the device is locked (OS dependent).
        *   **Table Context**: Notification explicitly mentions "Table X - New Order" so waiters know where to look instantly.
    *   **Customer Channel ("Order Updates")**:
        *   **Guest Engagement**: Customers (including anonymous guests) can subscribe to updates for their specific table session.
        *   **Smart Triggers**: Notifications are sent *only* when status changes to critical states (e.g., "Ready" or "Served") to avoid spamming.
        *   **Deep Linking**: Tapping the notification opens the specific Order Status page for that order.
*   **Robust Subscription Management**:
    *   **Device Fingerprinting**: Unique constraints on subscription endpoints prevent duplicate alerts on the same device.
    *   **Auto-Cleanup**: System automatically prunes invalid/expired subscriptions (410 Gone) to maintain database hygiene.

---

### 👤 10. Customer Identity & Session Architecture (Live ✅)
*   **Shop-Bound Identity**:
    *   **Strict Isolation**: Customer profiles are tightly scoped to specific `shop_id`s. "John" at Shop A is legally distinct from "John" at Shop B.
    *   **Cross-Shop Protection**: Smart Guard logic in the frontend immediately detects if a user scans a QR code for a different shop while still logged in, forcibly clearing the old session to prevent data leaks.
*   **Dual-Profile System**:
    *   **Registered Users**: Users providing a phone number are persistent. Returning to the shop immediately resumes their history and loyalty status.
    *   **Guest Profiles ("Ghost Users")**: Users providing *only* a name (no phone) are assigned a unique, ephemeral `customer_id` marked with `is_guest=true`.
        *   **Privacy-First**: Allows frictionless "Join & Eat" without data collection.
        *   **Session Integrity**: Even anonymous guests have unique IDs, preventing "John A" and "John B" from colliding on the same table.
*   **Global App Readiness**:
    *   **Future-Proof Schema**: `customers` table includes a `global_user_id` foreign key, ready to link local shop profiles to a master "Food Cafe Global Account" (Supabase Auth) in the future.
*   **The Session Lifecycle**:
    1.  **Scan & Join**: User is bound to `shop_id` + `table_id` + `customer_id`.
    2.  **Active Eating**: All orders are tagged with this binding.
    3.  **Bill & Clear**: When staff marks the table "Empty", the system triggers a **Real-Time Logout** command.
        *   **Client Side**: User's device is wiped of session data and returned to the Welcome Screen.
        *   **Server Side**: Guest profiles remain for audit history (but can be pruned); Registered profiles remain for loyalty.
*   **The "Roaming" Protocol (Global User Flow)**:
    *   **Scenario**: A Global User ("Alice") leaves Shop A and scans the QR code for Shop B.
    *   **Auto-Disconnect**: The customer app immediately detects the `shop_id` mismatch and performs a hard logout from Shop A (clearing local cart and session).
    *   **Federated Identity**: Alice **automatically logs in** (the Global App passes her credentials securely). The system:
        *   **Check**: Finds no active session.
        *   **Link**: Retrieves (or creates) her Shop B specific `customer_id` using her Global ID.
    *   **The "One-Tap" Welcome**: Since her identity is known, the Welcome Dialog **DOES NOT** ask for Name/Phone. It only prompts for:
        1.  **Table Number** (if not scanned).
        2.  **OTP** (if security is enabled).
    *   **Result**: Alice has a seamless experience ("Alice" everywhere) but technically maintains distinct, legally isolated profiles for each shop (`customer_id_A`, `customer_id_B`).

---

## 🛠️ Technical Architecture & Stack

*   **Frontend Monorepo**: Split architecture separating `apps/customer` (SEO-optimized, lightweight) and `apps/merchant` (Admin Dashboard, feature-rich) for improved code isolation and build performance.
*   **Database**: Supabase (PostgreSQL) for relational data integrity.
*   **Real-Time Engine**: Supabase Realtime (WebSockets) for sub-50ms latency updates.
*   **Authorization**: Supabase Auth with custom `user_roles` linking users to specific Shops.
*   **UI/UX**: Tailwind CSS + Shadcn UI for a premium, accessible, and responsive design.
*   **Mobile Optimization**: Dedicated mobile views (Cards vs Tables) for complex admin interfaces.
*   **Progressive Web App (PWA)**: Fully installable app experience with offline capabilities, persistent assets caching, and "app-like" navigation (no full page reloads). Supported on iOS and Android.
*   **Theme Support**: Built-in `next-themes` integration allowing dynamic switching between Light, Dark, and System modes.
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

*Built with ❤️ for the Future of Dining.*
