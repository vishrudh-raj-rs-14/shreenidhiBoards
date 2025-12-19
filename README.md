# Finance Tracking Web App

A comprehensive finance tracking web application built with React and Supabase.

## Features

- **PIN-based Authentication** - Simple PIN-based access control
- **Party Master** - Manage parties (purchasers/suppliers) with contact details
- **Product Master** - Manage products with GST information
- **Price Master** - Matrix view for setting purchase and supply prices with version control
- **Purchase Transactions** - Record purchase transactions with multi-product support
- **Supply Transactions** - Record supply transactions linked to purchase vouchers
- **Receipts & Payments** - Track money received and paid
- **Expenses** - Record general business expenses
- **Reports** - Generate purchase and sales reports with party filtering

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Go to SQL Editor and run the SQL script from `supabase-schema.sql`
3. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application

```bash
npm run dev
```

## Database Schema

The application uses the following main tables:
- `parties` - Party master data
- `products` - Product master data
- `purchase_prices` / `supply_prices` - Price matrices
- `purchase_price_history` / `supply_price_history` - Price version control
- `purchase_transactions` / `purchase_transaction_items` - Purchase records
- `supply_transactions` / `supply_transaction_items` - Supply records
- `receipts` - Money received records
- `payments` - Money paid records
- `expenses` - General expense records

## Usage

1. **First Time Setup**: Enter a PIN when prompted (minimum 4 characters)
2. **Add Parties**: Go to Parties section and add purchasers/suppliers
3. **Add Products**: Go to Products section and add products with GST information
4. **Set Prices**: Go to Prices section to set purchase and supply prices for party-product combinations
5. **Record Transactions**: Use Purchase and Supply sections to record transactions
6. **Track Money**: Use Receipts and Payments to track cash flow
7. **Generate Reports**: Use Reports section to view purchase/sales reports by party

## Mobile Support

The application is fully responsive and mobile-friendly. All features work seamlessly on mobile devices.

## Technologies Used

- React 18
- Vite
- Supabase (PostgreSQL)
- jsPDF for PDF generation
- React Router for navigation

## Deployment

This app is ready to deploy to Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

The `vercel.json` file is already configured for optimal deployment.
