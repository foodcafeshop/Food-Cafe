# 🗺️ Food Cafe - Future Roadmap

Brief overview of planned features for the **Food Cafe** RMS.

---

### 🤖 1. AI Menu Suggestions
*   **Context-Aware**: Recommend dishes based on vague inputs (e.g., "spicy", "Italian").
*   **Order-Based Suggestions**: Analyze current order to suggest pairings (e.g., "Fries with Burger").
*   **Dietary Matching**: Filter items by complex dietary needs.

### 🛠️ 2. Advanced Customization
*   **Modifiers**: Support for add-ons (Extra Cheese), removals (No Onions), and variants (Size).
*   **Dynamic Pricing**: Update total cost in real-time based on selected modifiers.

### 🥗 3. Nutritional Insights
*   **Calorie Counter**: Real-time total for current order.
*   **Macros**: View Protein, Carbs, Fats per item.
*   **Health Tags**: Auto-flag "High Protein", "Low Calorie", etc.

### 🎟️ 4. Coupon System
*   **Promo Codes**: Support for percentage/flat discount codes.
*   **Auto-Apply**: Automatically apply best available deal.
*   **Usage Limits**: Cap usage per user or total redemptions.

### 🌗 5. UI/UX Customization (Live ✅)
*   **Theme Switch**: Toggle Dark/Light mode.
*   **System Sync**: Auto-match device preference

### 👨‍🍳 6. Staff-Placed Orders (Live ✅)
*   **Take Order Mode**: Admin/Staff button to open table view with `placed_by_staff` flag.
*   **Attribution**: Orders tagged with `staffId` for commission/tracking.

### 📸 7. AI Menu Digitization (Live ✅)
*   **Photo Import**: Upload multiple photos of physical menus.
*   **Auto-Generation**: AI parses text to generate CSVs for Menus, Categories, Items, and their relationships.

### 🚀 8. High-Converting Landing Page (Live ✅)
*   **Target Audience**: Restaurant/Cafe owners.
*   **Workflow Explanation**: Intuitive, visual walkthrough of the RMS capabilities.
*   **Design**: High-end, futuristic aesthetic to attract business owners.


### 💳 9. Billing & Payment Support
*   **Payment Integration**: Support for payment processing.
*   **Action Restrictions**: Restrict actions based on billing/payment status.



### 🍽️ 10. Advanced Restaurant Landing Page Features
*   **Table Reservations**: Booking engine for future dates and times (currently unsupported by schema).
*   **Events & Blog**: Dynamic content management for "What's On" or news updates.
*   **Advanced Promos**: "Enter code" style discount banners and conditional offers.
*   **Gallery Management (Live ✅)**: Admin UI to upload/manage gallery images (limit: 16).
*   **Smart Search (Live ✅)**: Offline-capable, tag-based search for instant menu filtering.

### 🏗️ 11. Architecture Split (Live ✅)
*   **Monorepo Structure**: Split codebase into `apps/merchant` and `apps/customer`.
*   **Performance**: Independent builds and deployments for smaller bundles.
*   **Security**: Strict separation of admin logic from customer-facing code.

---

### 📝 Original Requests
*   [ ] "Add feature to suggest menu items based on customer inputs, using AI"
*   [ ] "View calories based on orders"
*   [x] "dark/light theme switch"
*   [ ] "Add option to add coupons"
*   [ ] "Add customization feature in menu item"
*   [ ] "Suggest menu item based on order"
*   [x] "Add feature to allow staff place order for a table"
*   [x] "Add feature to upload multiple photos of paper menu and it will use AI to generate csv files"
*   [x] "Create attractive and futuristic looking homepage for users (restaurant owners)"
*   [x] "Add photo gallery management"
*   [x] "Add smart search for menu items"
*   [x] "Split app into Customer and merchant apps"
*   [ ] "add billing and payment support, accordingly add restrictions on various actions"

