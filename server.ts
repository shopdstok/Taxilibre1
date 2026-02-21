import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "./server/db.ts";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // --- Google Maps Proxy ---
  app.get("/api/maps/autocomplete", async (req, res) => {
    const { input } = req.query;
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Maps API key missing" });
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input as string)}&key=${apiKey}`
      );
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  app.get("/api/maps/details", async (req, res) => {
    const { placeId } = req.query;
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${apiKey}`
      );
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch place details" });
    }
  });

  app.get("/api/maps/estimate", async (req, res) => {
    const { origin, destination } = req.query;
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin as string)}&destinations=${encodeURIComponent(destination as string)}&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.rows[0].elements[0].status === "OK") {
        const distanceKm = data.rows[0].elements[0].distance.value / 1000;
        const durationMin = data.rows[0].elements[0].duration.value / 60;
        
        // International dynamic pricing (simplified)
        // Base price + (price per km * distance) + (price per min * duration)
        // Adjusting coefficients for a more "real" international feel
        const basePrice = 4.50; // Base fare
        const pricePerKm = 1.35; // Per km
        const pricePerMin = 0.45; // Per minute
        
        const estimate = basePrice + (pricePerKm * distanceKm) + (pricePerMin * durationMin);
        
        res.json({
          price: Math.round(estimate * 100) / 100,
          distance: Math.round(distanceKm * 10) / 10,
          duration: Math.round(durationMin),
          currency: "EUR"
        });
      } else {
        res.status(400).json({ error: "Could not estimate route" });
      }
    } catch (err) {
      res.status(500).json({ error: "Estimation failed" });
    }
  });

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password, role } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      const result = db.prepare(
        "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)"
      ).run(name, email, phone, hash, role);
      
      const userId = result.lastInsertRowid;
      
      if (role === 'driver') {
        const { licenseNumber, driverType, vehicle } = req.body;
        db.prepare("INSERT INTO drivers (user_id, license_number, driver_type) VALUES (?, ?, ?)")
          .run(userId, licenseNumber, driverType);
        db.prepare("INSERT INTO vehicles (driver_id, make, model, plate, type) VALUES (?, ?, ?, ?, ?)")
          .run(userId, vehicle.make, vehicle.model, vehicle.plate, vehicle.type);
      }

      const token = jwt.sign({ userId, role }, JWT_SECRET);
      res.json({ token, user: { id: userId, name, email, role } });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { identifier, password } = req.body; // identifier can be email or phone
    const user: any = db.prepare("SELECT * FROM users WHERE email = ? OR phone = ?").get(identifier, identifier);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  });

  // --- Admin Routes ---
  app.get("/api/admin/drivers/pending", (req, res) => {
    const drivers = db.prepare(`
      SELECT users.id, users.name, users.email, drivers.license_number, drivers.driver_type, drivers.verification_status
      FROM users
      JOIN drivers ON users.id = drivers.user_id
      WHERE drivers.verification_status = 'pending'
    `).all();
    res.json(drivers);
  });

  app.post("/api/admin/drivers/:id/verify", (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    const userId = req.params.id;
    const isVerified = status === 'approved' ? 1 : 0;
    
    db.prepare("UPDATE drivers SET verification_status = ?, is_verified = ? WHERE user_id = ?")
      .run(status, isVerified, userId);
    
    res.json({ success: true });
  });

  // --- Ride Routes ---
  app.post("/api/rides/request", (req, res) => {
    const { passengerId, pickup, destination, price, distance, duration } = req.body;
    const result = db.prepare(`
      INSERT INTO rides (passenger_id, pickup_address, pickup_lat, pickup_lng, destination_address, destination_lat, destination_lng, price, distance, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      passengerId, 
      pickup.address, pickup.lat, pickup.lng, 
      destination.address, destination.lat, destination.lng, 
      price, distance, duration
    );
    
    const rideId = result.lastInsertRowid;
    
    // Broadcast to available drivers
    broadcastToRole('driver', { type: 'NEW_RIDE_REQUEST', ride: { id: rideId, pickup, destination, price } });
    
    res.json({ rideId });
  });

  app.post("/api/rides/:id/accept", (req, res) => {
    const { driverId } = req.body;
    const rideId = req.params.id;
    
    db.prepare("UPDATE rides SET driver_id = ?, status = 'accepted' WHERE id = ?").run(driverId, rideId);
    
    const ride: any = db.prepare("SELECT * FROM rides WHERE id = ?").get(rideId);
    broadcastToUser(ride.passenger_id, { type: 'RIDE_ACCEPTED', rideId, driverId });
    
    res.json({ success: true });
  });

  // --- Payment Routes ---
  app.post("/api/payments/create-intent", async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    const { amount, rideId } = req.body;
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
      });
      db.prepare("INSERT INTO payments (ride_id, stripe_payment_intent_id, amount) VALUES (?, ?, ?)")
        .run(rideId, paymentIntent.id, amount);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- WebSocket Logic ---
  const clients = new Map<number, WebSocket>();

  wss.on("connection", (ws, req) => {
    let currentUserId: number | null = null;

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'AUTH') {
        try {
          const decoded: any = jwt.verify(message.token, JWT_SECRET);
          currentUserId = decoded.userId;
          clients.set(currentUserId!, ws);
          console.log(`User ${currentUserId} connected via WS`);
        } catch (e) {
          ws.close();
        }
      }

      if (message.type === 'LOCATION_UPDATE' && currentUserId) {
        const { lat, lng } = message;
        db.prepare("UPDATE drivers SET current_lat = ?, current_lng = ? WHERE user_id = ?")
          .run(lat, lng, currentUserId);
        
        // If driver is on a ride, notify passenger
        const activeRide: any = db.prepare("SELECT passenger_id FROM rides WHERE driver_id = ? AND status IN ('accepted', 'arrived', 'in_progress')").get(currentUserId);
        if (activeRide) {
          broadcastToUser(activeRide.passenger_id, { type: 'DRIVER_LOCATION', lat, lng });
        }
      }
    });

    ws.on("close", () => {
      if (currentUserId) clients.delete(currentUserId);
    });
  });

  function broadcastToRole(role: string, data: any) {
    const users: any[] = db.prepare("SELECT id FROM users WHERE role = ?").all(role);
    users.forEach(u => broadcastToUser(u.id, data));
  }

  function broadcastToUser(userId: number, data: any) {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(3000, "0.0.0.0", () => {
    console.log("TaxiLibre server running on http://localhost:3000");
  });
}

startServer();
