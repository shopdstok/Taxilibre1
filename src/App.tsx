import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  MapPin, 
  Settings, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Menu,
  X,
  ChevronRight,
  Search,
  Filter,
  Eye,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
}

interface Driver {
  userId: number;
  driverId: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  licence_number: string;
  brand: string;
  model: string;
  plate_number: string;
  type: string;
}

interface Ride {
  id: number;
  passengerName: string;
  driverName: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  price_total: number;
  created_at: string;
}

interface Payment {
  id: number;
  ride_id: number;
  method: string;
  amount: number;
  status: string;
  passengerName: string;
  created_at: string;
}

// --- Mock Data ---
const MOCK_PAYMENTS: Payment[] = [
  { id: 1, ride_id: 101, method: 'CARD', amount: 45.00, status: 'SUCCEEDED', passengerName: 'John Doe', created_at: '2026-02-22 14:30' },
  { id: 2, ride_id: 102, method: 'CASH', amount: 22.50, status: 'PENDING_CASH', passengerName: 'Jane Smith', created_at: '2026-02-22 15:00' },
];
const MOCK_STATS = {
  totalRides: 1248,
  totalRevenue: 15420.50,
  totalDrivers: 45,
  pendingDrivers: 3,
  monthlyRides: [
    { month: 'Sep', count: 400 },
    { month: 'Oct', count: 600 },
    { month: 'Nov', count: 800 },
    { month: 'Dec', count: 1200 },
    { month: 'Jan', count: 1100 },
    { month: 'Feb', count: 1248 },
  ]
};

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { config as appConfig } from './config';

const stripePromise = loadStripe(appConfig.stripePublishableKey);

// --- Components ---

const CheckoutForm = ({ clientSecret, onSucceeded }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setProcessing(true);
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement as any,
      },
    });

    if (result.error) {
      setError(result.error.message || 'Payment failed');
      setProcessing(false);
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        onSucceeded();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#fff',
              '::placeholder': { color: '#64748b' },
            },
          }
        }} />
      </div>
      {error && <div className="text-rose-500 text-sm">{error}</div>}
      <button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
      >
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon, trend, color }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full",
          trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

// --- Main App ---

export default function App() {
  const { session, user: supabaseUser, loading: authLoading, signOut: supabaseSignOut } = useAuth();
  const [viewMode, setViewMode] = useState<'ADMIN' | 'PASSENGER'>('ADMIN');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [email, setEmail] = useState('admin@taxilibre.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!session;

  // Data states
  const [stats, setStats] = useState(MOCK_STATS);
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
              <Car size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">TaxiLibre Admin</h1>
            <p className="text-slate-400 text-sm">Sign in to manage your platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="admin@taxilibre.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
            {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transition-transform duration-300 transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Car size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">TaxiLibre</span>
        </div>

        <nav className="p-4 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Passengers" 
            active={activeTab === 'passengers'} 
            onClick={() => setActiveTab('passengers')} 
          />
          <SidebarItem 
            icon={Car} 
            label="Drivers" 
            active={activeTab === 'drivers'} 
            onClick={() => setActiveTab('drivers')} 
          />
          <SidebarItem 
            icon={CheckCircle} 
            label="Verifications" 
            active={activeTab === 'verifications'} 
            onClick={() => setActiveTab('verifications')} 
          />
          <SidebarItem 
            icon={MapPin} 
            label="Rides" 
            active={activeTab === 'rides'} 
            onClick={() => setActiveTab('rides')} 
          />
          <SidebarItem 
            icon={TrendingUp} 
            label="Live Map" 
            active={activeTab === 'map'} 
            onClick={() => setActiveTab('map')} 
          />
          <SidebarItem 
            icon={DollarSign} 
            label="Payments" 
            active={activeTab === 'payments'} 
            onClick={() => setActiveTab('payments')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <button 
            onClick={() => supabaseSignOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-6 sticky top-0 z-40 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode(viewMode === 'ADMIN' ? 'PASSENGER' : 'ADMIN')}
              className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-3 py-1 rounded-lg text-slate-400"
            >
              Switch to {viewMode === 'ADMIN' ? 'Passenger' : 'Admin'}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
              />
            </div>
            <div className="w-10 h-10 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center">
              <span className="text-emerald-500 font-bold">AD</span>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {viewMode === 'PASSENGER' ? (
            <div className="max-w-md mx-auto space-y-8">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">Confirm Your Ride</h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-slate-400">
                    <span>Route</span>
                    <span className="text-white">Paris → Orly</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Distance</span>
                    <span className="text-white">15.4 km</span>
                  </div>
                  <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-emerald-500">€45.00</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-400">Payment Method</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="bg-emerald-500 text-white py-3 rounded-xl font-bold border-2 border-emerald-500">Card</button>
                    <button className="bg-slate-800 text-slate-400 py-3 rounded-xl font-bold border-2 border-transparent">Cash</button>
                  </div>
                </div>

                <div className="mt-8">
                  <Elements stripe={stripePromise}>
                    <CheckoutForm clientSecret="mock_secret" onSucceeded={() => alert('Payment Successful!')} />
                  </Elements>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
            <div className="space-y-10">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Rides" value={stats.totalRides} icon={MapPin} trend={12} color="bg-blue-500" />
                <StatCard label="Total Revenue" value={`€${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} trend={8} color="bg-emerald-500" />
                <StatCard label="Active Drivers" value={stats.totalDrivers} icon={Car} trend={5} color="bg-violet-500" />
                <StatCard label="Pending Verifications" value={stats.pendingDrivers} icon={CheckCircle} trend={-2} color="bg-amber-500" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                  <h3 className="text-lg font-bold text-white mb-6">Ride Volume (Last 6 Months)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.monthlyRides}>
                        <defs>
                          <linearGradient id="colorRides" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" axisLine={false} tickLine={false} />
                        <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRides)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                  <h3 className="text-lg font-bold text-white mb-6">Revenue Growth</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlyRides}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" axisLine={false} tickLine={false} />
                        <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                          {stats.monthlyRides.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === stats.monthlyRides.length - 1 ? '#10b981' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Rides Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Recent Rides</h3>
                  <button className="text-emerald-500 text-sm font-bold hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-8 py-4">ID</th>
                        <th className="px-8 py-4">Passenger</th>
                        <th className="px-8 py-4">Driver</th>
                        <th className="px-8 py-4">Route</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Price</th>
                        <th className="px-8 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-8 py-4 text-sm font-medium text-slate-300">#RID-00{i}</td>
                          <td className="px-8 py-4 text-sm text-white">John Doe</td>
                          <td className="px-8 py-4 text-sm text-white">Marc Smith</td>
                          <td className="px-8 py-4 text-sm text-slate-400">Paris → Orly</td>
                          <td className="px-8 py-4">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full uppercase">Completed</span>
                          </td>
                          <td className="px-8 py-4 text-sm font-bold text-white">€45.00</td>
                          <td className="px-8 py-4 text-sm text-slate-500">22 Feb, 14:30</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white">Live Driver Map</h1>
                  <p className="text-slate-400">Real-time visualization of all online drivers</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 px-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">12 Drivers Online</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl h-[600px] relative overflow-hidden">
                {/* Mock Map Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px]"></div>
                </div>
                
                {/* Mock Drivers on Map */}
                {[
                  { id: 1, x: '20%', y: '30%', name: 'Marc S.' },
                  { id: 2, x: '45%', y: '60%', name: 'Jean D.' },
                  { id: 3, x: '70%', y: '25%', name: 'Sophie L.' },
                  { id: 4, x: '30%', y: '75%', name: 'Pierre K.' },
                  { id: 5, x: '80%', y: '50%', name: 'Lucie M.' },
                ].map((d) => (
                  <motion.div
                    key={d.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ left: d.x, top: d.y }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover:scale-110 transition-transform">
                        <Car size={20} className="text-white" />
                      </div>
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.name}
                      </div>
                    </div>
                  </motion.div>
                ))}

                <div className="absolute bottom-8 right-8 space-y-2">
                  <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl w-64">
                    <h4 className="text-sm font-bold text-white mb-3">Map Legend</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs text-slate-400">Available Driver</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <span className="text-xs text-slate-400">On Trip</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                        <span className="text-xs text-slate-400">Offline</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white">Payment Transactions</h1>
                  <p className="text-slate-400">Monitor all financial activities on the platform</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-8 py-4">ID</th>
                        <th className="px-8 py-4">Ride ID</th>
                        <th className="px-8 py-4">Passenger</th>
                        <th className="px-8 py-4">Method</th>
                        <th className="px-8 py-4">Amount</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {MOCK_PAYMENTS.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-8 py-4 text-sm font-medium text-slate-300">#PAY-{p.id}</td>
                          <td className="px-8 py-4 text-sm text-slate-400">#{p.ride_id}</td>
                          <td className="px-8 py-4 text-sm text-white">{p.passengerName}</td>
                          <td className="px-8 py-4 text-sm text-slate-400">{p.method}</td>
                          <td className="px-8 py-4 text-sm font-bold text-white">€{p.amount.toFixed(2)}</td>
                          <td className="px-8 py-4">
                            <span className={cn(
                              "px-2 py-1 text-[10px] font-bold rounded-full uppercase",
                              p.status === 'SUCCEEDED' ? "bg-emerald-500/10 text-emerald-500" : 
                              p.status === 'PENDING_CASH' ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-sm text-slate-500">{p.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'verifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white">Driver Verifications</h1>
                  <p className="text-slate-400">Review and approve new driver applications</p>
                </div>
                <div className="flex gap-3">
                  <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all">
                    <Filter size={18} />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[1, 2].map((i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col lg:flex-row gap-8 items-start lg:items-center"
                  >
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 font-bold text-2xl border border-slate-700">
                      JD
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">Jean Dupont</h3>
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full uppercase">Pending Review</span>
                      </div>
                      <div className="flex flex-wrap gap-6 text-sm text-slate-400">
                        <div className="flex items-center gap-2"><Users size={16} /> jean.dupont@email.com</div>
                        <div className="flex items-center gap-2"><Car size={16} /> Tesla Model 3 (ABC-123-DE)</div>
                        <div className="flex items-center gap-2"><MapPin size={16} /> Paris, France</div>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto">
                      <button className="flex-1 lg:flex-none bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                        <Eye size={18} />
                        View Docs
                      </button>
                      <button className="flex-1 lg:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                        <CheckCircle size={18} />
                        Approve
                      </button>
                      <button className="flex-1 lg:flex-none bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                        <XCircle size={18} />
                        Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

              {activeTab === 'settings' && (
                <div className="max-w-3xl space-y-8">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <DollarSign className="text-emerald-500" />
                      Pricing Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Base Price (€)</label>
                        <input type="number" defaultValue="5.00" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Price per KM (€)</label>
                        <input type="number" defaultValue="1.50" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Price per Minute (€)</label>
                        <input type="number" defaultValue="0.50" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Platform Commission (%)</label>
                        <input type="number" defaultValue="20" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    </div>
                    <button className="mt-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl transition-all">
                      Save Changes
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <TrendingUp className="text-emerald-500" />
                      Surge Pricing
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl">
                        <div>
                          <p className="font-bold text-white">Automatic Surge</p>
                          <p className="text-sm text-slate-400">Enable dynamic pricing based on demand</p>
                        </div>
                        <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Max Multiplier</label>
                        <input type="number" defaultValue="3.5" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
