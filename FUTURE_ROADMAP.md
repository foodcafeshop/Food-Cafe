# 🗺️ Food Cafe - Future Roadmap

Brief overview of planned features for the **Food Cafe** RMS.

---

### 🤖 1. AI Menu Suggestions
*   **Context-Aware**: Recommend dishes based on vague inputs (e.g., "spicy", "Italian").
*   **Order-Based Suggestions**: Analyze current order to suggest pairings (e.g., "Fries with Burger").
*   **Dietary Matching**: Filter items by complex dietary needs.
*   **Group Ordering**: Smart suggestions for groups with mixed preferences (e.g., "6 people: 2 veg, 3 non-veg, 1 can eat egg" → recommends a balanced order for everyone).

### 🥗 2. Nutritional Insights
*   **Calorie Counter**: Real-time total for current order.
*   **Macros**: View Protein, Carbs, Fats per item.
*   **Health Tags**: Auto-flag "High Protein", "Low Calorie", etc.

### 🛠️ 3. Advanced Customization
*   **Modifiers**: Support for add-ons (Extra Cheese), removals (No Onions), and variants (Size).
*   **Dynamic Pricing**: Update total cost in real-time based on selected modifiers.

### 🎟️ 4. Coupon System (Live ✅)
*   **Dual-Scope Engine**:
    *   **Platform Coupons**: Super Admins create coupons for SaaS subscriptions.
    *   **Shop Coupons**: Merchants create coupons for customer food orders.
*   **Advanced Logic**:
    *   **Promo Codes**: Manual entry of percentage/flat discount codes.
    *   **Smart Limits**:
        *   **Global Cap**: Total number of times a coupon can be used.
        *   **Per-User Cap**: Limit redemptions per specific user/shop.
    *   **Targeting Rules**:
        *   **Whitelist**: Restrict coupons to specific users (UUIDs).
        *   **New User Only**: Restrict to first-time subscribers.
*   **Planned Enhancements 🚧**:
    *   **Auto-Apply**: Automatically apply best available deal.

### 🌗 5. UI/UX Customization (Live ✅)
*   **Theme Switch**: Toggle Dark/Light mode.
*   **System Sync**: Auto-match device preference.

### 👨‍🍳 6. Staff-Placed Orders (Live ✅)
*   **Take Order Mode**: Admin/Staff button to open table view with `placed_by_staff` flag.
*   **Attribution**: Orders tagged with `staffId` for commission/tracking.

### 📸 7. AI Menu Digitization (Live ✅)
*   **Photo Import**: Upload multiple photos of physical menus.
*   **Auto-Generation**: AI parses text to generate CSVs for Menus, Categories, Items, and their relationships.
*   **Auto Image Generation**: When adding menus, categories, menu items, or inventory items without an image, a thumbnail is auto-generated from the item name using Bing image search.

### 🚀 8. High-Converting Landing Page (Live ✅)
*   **Target Audience**: Restaurant/Cafe owners.
*   **Workflow Explanation**: Intuitive, visual walkthrough of the RMS capabilities.
*   **Design**: High-end, futuristic aesthetic to attract business owners.


### 📦 9. Inventory Management (Live ✅)
*   **Stock Tracking**: Track current quantity for each raw material/ingredient.
*   **Low Stock Alerts**: Set thresholds and receive visual notifications when stock runs low.
*   **Stock Adjustments**: Manual adjustments with reason codes (wastage, damage, theft, restock).
*   **Adjustment History**: Audit trail for all stock changes.
*   **Recipes**: Link raw materials to menu items with quantity requirements.
*   **Auto-Deduction**: Smart trigger deducts stock when order moves to 'preparing' and reverts on cancel/queue.
*   **EOD Reconciliation (Live ✅)**: UI to compare actual vs system stock and correct variances.

*   **🔮 Future**: Supplier management and purchase orders.

### 💳 10. Billing & Payment Support (Live ✅)
*   **Payment Integration**: Support for payment processing.
*   **Action Restrictions**: Restrict actions based on billing/payment status.


### 🍽️ 11. Advanced Restaurant Landing Page Features
*   **Table Reservations**: Booking engine for future dates and times (currently unsupported by schema).
*   **Events & Blog**: Dynamic content management for "What's On" or news updates.
*   **Advanced Promos**: "Enter code" style discount banners and conditional offers.
*   **Gallery Management (Live ✅)**: Admin UI to upload/manage gallery images (limit: 16).
*   **Smart Search (Live ✅)**: Offline-capable, tag-based search for instant menu filtering.

### 🏗️ 12. Architecture Split (Live ✅)
*   **Monorepo Structure**: Split codebase into `apps/admin`, `apps/merchant` and `apps/customer`.
*   **Performance**: Independent builds and deployments for smaller bundles.
*   **Security**: Strict separation of admin logic from customer-facing code.

### 🖨️ 13. Thermal Printer Integration (Live ✅)
*   **Kitchen Tickets**: Automatic printing of order tickets to kitchen printers when orders are placed. (🚧 Manual trigger only)
*   **Customer Receipts**: Print itemized bills with QR code for payment. (🚧 QR code Pending)
*   **Bluetooth & Network**: Support for Bluetooth-connected and network printers. (🚧 Browser Print only)
*   **Template Customization**: Configurable receipt layouts with shop branding.

### 🏙️ 14. Enhanced Customer Landing Page (Live ✅)
*   **Shop Search**: Real-time search for restaurants by name and category tags.
*   **Smart Limits**: API-level pagination and limits (e.g., Top 9) for performance.
*   **Mobile Optimized**: Responsive design with sticky glassmorphism navbar and mobile-specific adjustments.
*   **PWA Installable**: Integrated PWA installation flow for app-like experience.
*   **Category Exploration**: Visual rail for quick category filtering.
*   **Smart Geolocation**: Auto-detects user city (GPS + IP Fallback) for hyper-local search intent.
*   **Contextual Search**: Dynamic placeholders and mobile-optimized interactions (auto-collapse/expand).
*   **Planned Enhancements 🚧**:
    *   **City Autocomplete**: Search and select from a list of operational cities (derived from registered shops).
    *   **Strict Geofencing**: Restrict manual selection to service areas only.
    *   **City-Scoped Discovery**: Global search results filtered strictly by the selected city context.

### 📱 15. Mandatory Customer Contact Info (Live ✅)
*   **Merchant Config**: Toggle option for merchants to make customer mobile number mandatory.
*   **Scope**:
    *   **Self-Ordering**: Customers must enter phone number before placing an order.
    *   **Staff-Placed**: Staff must enter customer phone number when taking an order on their behalf.
*   **Verification**: clear validation and potential OTP requirement (optional).

### 🔔 16. Push Notifications (Live ✅)
*   **Order Status Updates**: "Your order is being prepared", "Your food is ready for pickup".
*   **Staff Alerts**: Notify waiters when orders are ready for serving or new orders arrive.
*   **PWA Native**: Leverage service workers for browser-based notifications.
*   **Future**: **Notification Categories**:
    *   **granular control**: Allow users (Merchant/Customer) to toggle specific categories:
        *   **Order Updates**: Status changes (Preparing, Ready).
        *   **Promotions**: Marketing messages and offers.
        *   **System Alerts**: Maintenance or account security updates.
        *   **Staff Alerts**: New order assignments (Staff only).
*   **Future**: Marketing Alerts and Flash Deals.

### 💬 17. Messaging Integrations
*   **WhatsApp Business API**: Send order confirmations, digital receipts, and promotional messages.
*   **Telegram Bot**: Order status updates and customer support via Telegram.
*   **SMS Fallback**: Transactional SMS for customers without internet access.

### 📱 18. Social Sharing
*   **Dish Sharing**: "Share this dish" to Instagram Stories, WhatsApp Status, or Facebook.
*   **Order Celebrations**: Shareable cards for birthdays, anniversaries, or group celebrations.
*   **Referral Program**: Share referral links with friends for rewards.

### 📅 19. Table Reservations
*   **Booking Engine**: Customers can reserve tables for specific dates and times.
*   **Time Slot Management**: Configure available slots, table capacity, and blackout dates.
*   **Confirmation & Reminders**: Automated confirmation emails/SMS with calendar integration.
*   **Walk-in Queue**: Waitlist management for peak hours with estimated wait times.

### 🛵 20. Takeaway & Delivery Mode
*   **Order Type Selection**: Dine-in, Takeaway, or Delivery at checkout.
*   **Pickup Scheduling**: Customers can schedule pickups for later.
*   **Delivery Partner Integration**: Connect with Swiggy, Zomato, or custom delivery fleet.
*   **Packaging Instructions**: Special notes for takeaway packaging.

### 💸 21. Split Bill
*   **Equal Split**: Divide total bill equally among N guests.
*   **Pay for What You Ordered**: Each guest pays only for their items (tracked via collaborative cart).
*   **Custom Split**: Manually assign portions to different payment methods.
*   **Group Payment Links**: Generate individual payment links for each guest.

### ⏱️ 22. Wait Time Estimation
*   **AI-Predicted Wait Times**: Estimate based on current kitchen load and order complexity.
*   **Live Queue Display**: Show customers their position in the queue.
*   **Kitchen Capacity Alerts**: Notify staff when kitchen is overloaded.

### 🌐 23. Multi-Language Support
*   **Merchant App Localization**: Full translation support for the admin dashboard (Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, etc.).
*   **Customer App Localization**: Translated menus, order tracking, and UI for customers in their preferred language.
*   **Dynamic Language Selection**: Shop owners set available languages; customers choose their preference.
*   **Regional Focus**: Priority support for major Indian languages to serve the domestic market.

### 🎁 24. Loyalty & Rewards Program (Shop level, merchant can set)
*   **Points System**: Earn points on every order, redeem for discounts or free items.
*   **Tiered Memberships**: Bronze, Silver, Gold levels with increasing benefits.
*   **Birthday Rewards**: Automatic discounts or freebies on customer birthdays.
*   **Repeat Customer Tracking**: Identify and reward frequent diners.

### 📊 25. Advanced Analytics & Insights
*   **Customer Analytics**: Repeat visit frequency, average spend, favorite items per customer.
*   **Menu Performance**: Profit margin analysis, slow-selling item alerts, pricing optimization suggestions.
*   **Staff Performance**: Orders served, tips collected, efficiency during peak hours.
*   **Demand Forecasting**: AI predictions for busy days to optimize staffing and inventory.

### ⚡ 26. API Caching Strategy
*   **Audit**: Identify list of API calls that can be cached (e.g., Menu, Shop Settings, Static Content).
*   **Strategy**: Implement caching layers:
    *   **Browser Cache**: Service Worker / LocalStorage for offline-first experience.
    *   **Edge Cache**: CDN caching for public assets (images, logos).
    *   **Server State**: React Query / SWR for efficient server state management with hydration.
*   **Implementation**: Apply caching logic cautiously to different apps (Customer vs Merchant) to prevent stale data issues.

---
### 👤 27. Customer Identity & Global Architecture (Live ✅)
*   **Guest Profiles**: "Ghost User" system allowing frictionless, name-only access for temporary customers (`is_guest=true`).
*   **Smart Session Guard**: Automatic cross-shop logout protection to prevent data leaks when scanning different QR codes.
*   **Federated Schema**: `global_user_id` and `is_guest` columns ready for future Global App integration.

### 📸 29. QR Code Integration (Live ✅)
*   **Native-Like Scanner**:
    *   **Auto-Start Camera**: Camera feed opens immediately upon dialog launch (no extra clicks), mimicking a native app experience.
    *   **Environment Mode**: Automatically selects the back camera for optimal scanning.
*   **Seamless Entry**: Allows customers to scan table codes without leaving the web app.
*   **Strict Security**:
    *   **Domain Lockdown**: Validates scanned URLs against a strict allowlist (Production: `foodcafeshop.in`, Dev: `localhost`).
    *   **Phishing Protection**: Blocks any non-Food Cafe QR codes to keep users safe.
*   **Responsive UI**: Optimized scanning interface with "Starting Camera" loader and full-width viewfinder.

### 🌍 30. Food Cafe Global App (Planned 🚧)
*   **Automatic Login Flow**: "One-Tap" Welcome Dialog logic designed to accept Global credentials.
*   **Aggregator App**: A standalone consumer app listing all "Food Cafe" partner shops.
*   **Global Auth**: Single sign-on (SSO) for customers using Supabase Auth.
*   **Unified Profile**: Manage one profile (Name, Phone, Saved Payment Methods) usable across all shops.
*   **Shop Discovery**: Map-based search to find nearby Food Cafe powered restaurants.
*   **Order History**: Centralized view of all past orders from any shop.

### 📊 31. Data Migration & Integrations
*   **Platform Imports**: Tools to import menu, inventory, and sales reports from legacy systems (e.g., Petpooja, DotPe).
*   **Format Support**: CSV/Excel mapping tool to standardize external data into Food Cafe schema.
*   **Historical Data**: Import past order history for analytics continuity.

### 🔐 32. Authentication & Security Enhancements
*   **Firebase Integration**: Hybrid auth support linking Firebase Auth with Supabase RLS.
*   **Phone Auth**: Robust OTP login flow using Firebase Phone Auth as an alternative provider.
*   **Account Linking**: Allow users to link Email and Phone credentials to a single identity.

### 🥘 33. Advanced Menu Variants
*   **Complex Variants**: Support for multi-dimensional variants (e.g., Size + Crust + Toppings).
*   **Price Overrides**: Set distinct base prices for each variant combination.
*   **Stock Linking**: Map variants to specific inventory items (e.g., "Large" uses "Large Pizza Base").

### 💸 34. Ad-hoc Bill Discounts (Live ✅)
*   **Manual Discounts**: Allow authorized staff to apply flat discounts directly on the bill.
*   **Reason Codes**: Mandatory selection of reason (e.g., "Staff Meal", "Customer Complaint", "Loyalty").
*   **Audit Trail**: Track who applied discounts and why.
*   **Future**: Percentage discounts and Manager Approval PINs.

### 🍽️ 35. Service Types & Order Modes
*   **Dine-in**: Standard flow with table selection and service charge logic.
*   **Takeaway**: Optimized flow skipping table headers; collects customer name/phone directly.
*   **Packaging Charges**: Auto-apply packaging fees based on service type.
*   **Kitchen Routing**: Distinct ticket headers (DINE-IN vs TAKEAWAY) for kitchen staff awareness.

### 🤵 36. Staff Attribution & Performance
*   **Order Linking**: Explicitly tag every order/item to the staff member who punched it.
*   **Table Ownership**: Assign tables to specific waiters for the duration of a meal.
*   **Performance Reports**: Track sales by staff member, average tip, and table turnover time.
*   **Tip Management**: Calculate and distribute tips (if recorded) based on attribution.

### 📝 Original Requests
*   [ ] "Add feature to suggest menu items based on customer inputs, using AI"
*   [ ] "View calories based on orders"
*   [x] "dark/light theme switch"
*   [x] "Add option to add coupons"
*   [ ] "Add customization feature in menu item"
*   [ ] "Suggest menu item based on order"
*   [x] "Add feature to allow staff place order for a table"
*   [x] "Add feature to upload multiple photos of paper menu and it will use AI to generate csv files"
*   [x] "Create attractive and futuristic looking homepage for users (restaurant owners)"
*   [x] "Add photo gallery management"
*   [x] "Add smart search for menu items"
*   [x] "Split app into Customer and merchant apps"
*   [x] "add billing and payment support, accordingly add restrictions on various actions"
*   [x] "Order should have name of person who placed it, also a field showing if that person is a staff"
*   [x] "Add inventory management to merchant app"
*   [x] "Thermal printer integration for kitchen tickets and receipts"
*   [x] "Customer landing page with shop search, filters (city, distance), sorting, and featured shops"
*   [x] "Option for merchant to make customer mobile number required for ordering"
*   [x] "Push notifications for order status updates"
*   [ ] "WhatsApp and Telegram integration for order confirmations"
*   [ ] "Social sharing for dishes and orders"
*   [ ] "Table reservation system with booking engine"
*   [ ] "Split bill feature (equal or pay for what you ordered)"
*   [ ] "Takeaway and delivery mode with Swiggy/Zomato integration"
*   [ ] "Loyalty and rewards program for customers"
*   [ ] "Wait time estimation using AI"
*   [ ] "Add multi-language support for Indian languages"
*   [ ] "Advanced analytics for customer, menu, and staff performance"
*   [ ] "Identify list of API calls that can be cached, and cache them in different apps"
*   [ ] "Add notification categories for granular user control"
*   [ ] "Import reports from other platforms"
*   [ ] "Integrate firebase auth with supabase"
*   [ ] "Add variants to menu items"
*   [x] "Discount option in bill"
*   [ ] "Service type: dine-in, takeaway"
*   [ ] "Linking orders to waiters"

