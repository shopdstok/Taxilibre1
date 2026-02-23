# TaxiLibre - Professional Ride-Sharing Platform

TaxiLibre is a scalable, secure, and production-ready ride-sharing platform built with NestJS and React. It provides a robust backend for mobile applications and a comprehensive web dashboard for administrators.

## 🚀 Features

- **Backend (NestJS)**: Modular architecture, JWT Auth, WebSocket support, Google Maps integration, Stripe payments.
- **Admin Dashboard (React)**: Real-time stats, driver verification, ride management, pricing configuration.
- **Database**: PostgreSQL (structured for production), Redis (caching & real-time location).
- **Security**: JWT, bcrypt, Roles-based access control (RBAC).

## 🛠 Tech Stack

- **Backend**: NestJS, TypeScript, Passport.js, Swagger.
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Recharts.
- **Infrastructure**: Docker, Redis, PostgreSQL.

## 📦 Installation

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up environment variables**:
   Create a `.env` file based on `.env.example`.
4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📖 API Documentation

Once the server is running, visit `http://localhost:3000/docs` to view the Swagger documentation.

## 🚀 Deployment
For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Vercel Deploy (Frontend)
1. Push your code to GitHub.
2. Import to Vercel.
3. Set `VITE_API_BASE_URL` to your backend API.
4. Deploy!

## 🏗 Project Structure

- `server/`: NestJS backend source code.
- `src/`: React Admin Dashboard source code.
- `taxi.db`: SQLite database for local development.

## 🔐 Authentication (Supabase)

TaxiLibre uses **Supabase Auth** for secure user management.

### Configuration

1. **Create a Supabase Project**: Go to [Supabase](https://supabase.com) and create a new project.
2. **Set Environment Variables**:
   - `SUPABASE_URL`: Your project URL.
   - `SUPABASE_KEY`: Your `anon` public key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your `service_role` secret key (backend only).
   - `VITE_SUPABASE_URL`: Same as `SUPABASE_URL`.
   - `VITE_SUPABASE_ANON_KEY`: Same as `SUPABASE_KEY`.

### How it works

- **Registration**: Users are created in Supabase Auth first, then a corresponding record is created in the local `users` table with a `supabase_user_id`.
- **Login**: Handled by Supabase. The frontend receives a JWT which is sent to the TaxiLibre API.
- **Verification**: The TaxiLibre backend verifies the Supabase JWT and maps it to the local user record to enforce roles and permissions.

## 💳 Stripe Integration

TaxiLibre uses Stripe for secure payment processing.

### Configuration

1. **Get your Stripe keys**: Sign up at [Stripe](https://stripe.com) and get your `Secret Key` and `Publishable Key`.
2. **Set environment variables**:
   - `STRIPE_SECRET_KEY`: Your Stripe Secret Key (starts with `sk_test_`).
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe Webhook Signing Secret (get this from the Stripe CLI or Dashboard).
3. **Frontend Publishable Key**: Update the `stripePromise` in `src/App.tsx` with your `Publishable Key`.

### Testing Webhooks Locally

Use the Stripe CLI to forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

### Payment Flow

- **Passenger**: Requests a ride -> Backend creates a `PaymentIntent` -> Frontend confirms payment using Stripe Elements.
- **Admin**: Monitors all transactions in the "Payments" tab of the dashboard.
