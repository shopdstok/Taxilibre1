# Deployment Guide - TaxiLibre

This guide provides instructions for deploying TaxiLibre to a production environment.

## 🚀 Vercel Deployment (Frontend)

The frontend can be easily deployed to Vercel as a static site.

1. **Connect to GitHub**: Import your repository into Vercel.
2. **Configure Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build:client`
   - Output Directory: `dist`
3. **Environment Variables**:
   - `VITE_API_BASE_URL`: The URL of your deployed backend (e.g., `https://api.taxilibre.com/api`).
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe public key.
   - `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps public key.

## 🛠 Backend Deployment Options

### Option 1: Standalone Server (Recommended)
Deploy the backend to a service like **Railway**, **Render**, or **DigitalOcean App Platform**.

1. **Build Command**: `npm run build:server`
2. **Start Command**: `npm run start`
3. **Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string.
   - `REDIS_URL`: Redis connection string.
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://taxilibre.vercel.app`).
   - `STRIPE_SECRET_KEY`, `JWT_SECRET`, etc.

### Option 2: Monolithic Deployment
If your host supports running a Node.js server that serves static files (like Railway or Render), you can use the monolithic setup:
1. **Build Command**: `npm run build`
2. **Start Command**: `npm run start`
This will build both the client and server, and the server will serve the client from the `dist` folder.

## 🔐 Security & CORS
When deploying the frontend and backend on different domains, ensure:
1. `ALLOWED_ORIGINS` on the backend includes your frontend domain.
2. Cookies (if used) are configured with `SameSite: 'None'` and `Secure: true`.

### 1. Database
- Use a managed PostgreSQL service (e.g., AWS RDS, GCP Cloud SQL).
- Update the `DATABASE_URL` in your environment variables.

### 2. Caching & Real-time
- Use a managed Redis service (e.g., AWS ElastiCache, GCP Memorystore).
- Update the `REDIS_URL`.

### 3. File Storage
- Use AWS S3 or GCP Cloud Storage for driver documents and profile photos.
- Implement the S3 abstraction in the backend.

### 4. SSL/TLS
- Use a reverse proxy like Nginx or a cloud load balancer to handle SSL termination.
- Ensure all API calls are made over HTTPS.

## 🔐 Environment Variables

Ensure the following variables are set in production:

- `NODE_ENV=production`
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string.
- `JWT_SECRET`: A long, random string for signing tokens.
- `STRIPE_SECRET_KEY`: Your Stripe secret key.
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key.
- `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`: For file storage.

## 📈 Monitoring & Logging

- **Logging**: Use structured JSON logs. Integrate with ELK stack or Datadog.
- **Monitoring**: Use Prometheus and Grafana for metrics.
- **Error Tracking**: Use Sentry for real-time error reporting.
