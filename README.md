# Food Cafe

A modern, full-stack restaurant management system built with Next.js, Supabase, and Tailwind CSS. It features a customer-facing digital menu and ordering system, along with a comprehensive admin dashboard for staff to manage orders, tables, menus, and finances.

## Features

### 🍽️ Customer Interface
- **Digital Menu**: Browse categories and items with rich images and descriptions.
- **Cart & Ordering**: Add items to cart, customize orders (e.g., "Extra spicy"), and place orders directly from the table.
- **Real-time Status**: Track order status (Queued -> Preparing -> Ready -> Served).
- **Multi-User Sessions**: Multiple customers can join the same table. Sessions are managed securely via `active_customers` tracking.
- **Auto-Logout**: Sessions are automatically cleared when the table is marked as "Empty" by staff, ensuring privacy for the next guest.
- **Secure Access**: **OTP Authentication** for tables (optional admin setting).
- **Smart URLs**: Access menus via `https://foodcafeshop.in/[slug]/menu?table=Label` for automatic shop and table assignment.

### 👨‍🍳 Admin / Staff Dashboard
- **Dashboard Overview**: Real-time metrics for Total Revenue, Active Orders, Table Occupancy, and Popular Items.
- **Order Management (KDS)**: Kanban-style board to manage order lifecycle.
- **Table Management**: Visual floor plan to track table status (Empty, Occupied, Billed) with **Real-time Updates**.
    - **Session Control**: Clearing a table automatically logs out all active customers on that table.
    - **QR Codes**: Generate and print QR codes linked to your specific shop slug.
- **Shop Management**: Create shops with **custom URL slugs** (validated for uniqueness and format).
- **Menu Management**: CRUD operations for Menus, Categories, and Items. Support for dietary restrictions (Veg/Non-Veg/Vegan) and item visibility toggles.
- **Billing & History**: Generate bills, split payments, and view historical sales data with date filtering and sorting.
- **Analytics**: Visual charts for Revenue Trends and Sales by Category.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Date Handling**: [date-fns](https://date-fns.org/)

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
    - Admin Dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)

## Project Structure

- `app/`: Next.js App Router pages and layouts.
  - `admin/`: Admin dashboard routes.
  - `menu/`: Customer menu routes.
  - `cart/`: Shopping cart routes.
- `components/`: Reusable UI components.
  - `ui/`: shadcn/ui primitives.
  - `features/`: Feature-specific components (e.g., `menu`, `cart`, `admin`).
- `lib/`: Utility functions, API wrappers, and types.
- `supabase/`: Database schema and SQL scripts.

## License

This project is licensed under the MIT License.
