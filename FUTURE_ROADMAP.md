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

### 🏙️ 14. Enhanced Customer Landing Page
*   **Shop Search**: Search for restaurants/cafes by name, cuisine, or dish.
*   **Advanced Filters**: Filter by city, distance, rating, price range, and dietary options.
*   **Sorting**: Sort results by relevance, distance, rating, or popularity.
*   **Featured Shops**: Highlight premium or boosted restaurants on the homepage.
*   **Location-Based**: Auto-detect user location to show nearby options.

### 📱 15. Mandatory Customer Contact Info
*   **Merchant Config**: Toggle option for merchants to make customer mobile number mandatory.
*   **Scope**:
    *   **Self-Ordering**: Customers must enter phone number before placing an order.
    *   **Staff-Placed**: Staff must enter customer phone number when taking an order on their behalf.
*   **Verification**: clear validation and potential OTP requirement (optional).

### 🔔 16. Push Notifications
*   **Order Status Updates**: "Your order is being prepared", "Your food is ready for pickup".
*   **Marketing Alerts**: New menu items, flash deals, and promotions.
*   **Staff Alerts**: Notify waiters when orders are ready for serving.
*   **PWA Native**: Leverage service workers for browser-based notifications.

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

---

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
*   [ ] "Customer landing page with shop search, filters (city, distance), sorting, and featured shops"
*   [ ] "Option for merchant to make customer mobile number required for ordering"
*   [ ] "Push notifications for order status updates"
*   [ ] "WhatsApp and Telegram integration for order confirmations"
*   [ ] "Social sharing for dishes and orders"
*   [ ] "Table reservation system with booking engine"
*   [ ] "Split bill feature (equal or pay for what you ordered)"
*   [ ] "Takeaway and delivery mode with Swiggy/Zomato integration"
*   [ ] "Loyalty and rewards program for customers"
*   [ ] "Wait time estimation using AI"
*   [ ] "Add multi-language support for Indian languages"
*   [ ] "Advanced analytics for customer, menu, and staff performance"
