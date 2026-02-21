/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Car, 
  User, 
  Settings, 
  History, 
  Star, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  CreditCard,
  Bell,
  CheckCircle2,
  Clock,
  ShieldCheck,
  LayoutDashboard,
  Users,
  DollarSign,
  Search,
  FileText,
  AlertCircle,
  Check,
  Ban,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

// --- Types ---
type Role = 'passenger' | 'driver' | 'admin';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
}

interface Location {
  lat: number;
  lng: number;
  address: string;
}

// --- Mock Data for Preview ---
const MOCK_DRIVERS = [
  { id: 1, name: 'Jean Dupont', lat: 48.8566, lng: 2.3522, rating: 4.9, vehicle: 'Tesla Model 3' },
  { id: 2, name: 'Marie Curie', lat: 48.8584, lng: 2.2945, rating: 4.8, vehicle: 'Toyota Prius' },
];

// --- Helper Components ---

function AutocompleteInput({ placeholder, icon: Icon, iconColor, value, onChange, onSelect }: any) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) return;
    try {
      const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await res.json();
      setSuggestions(data.predictions || []);
      setShowSuggestions(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelect = async (suggestion: any) => {
    setShowSuggestions(false);
    onChange(suggestion.description);
    try {
      const res = await fetch(`/api/maps/details?placeId=${suggestion.place_id}`);
      const data = await res.json();
      const { lat, lng } = data.result.geometry.location;
      onSelect({ address: suggestion.description, lat, lng });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full", iconColor)}></div>
      <input 
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 lg:py-3 bg-neutral-50/50 border border-neutral-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
      />
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-neutral-100 z-50 max-h-60 overflow-y-auto"
          >
            {suggestions.map((s) => (
              <button
                key={s.place_id}
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0"
              >
                <p className="font-bold text-neutral-900 truncate">{s.structured_formatting.main_text}</p>
                <p className="text-xs text-neutral-500 truncate">{s.structured_formatting.secondary_text}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Directions({ pickup, destination }: { pickup: Location | null, destination: Location | null }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map, suppressMarkers: true }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !pickup || !destination) return;

    directionsService.route({
      origin: { lat: pickup.lat, lng: pickup.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode: google.maps.TravelMode.DRIVING
    }).then(response => {
      directionsRenderer.setDirections(response);
    });
  }, [directionsService, directionsRenderer, pickup, destination]);

  return null;
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [view, setView] = useState<'landing' | 'auth' | 'app'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('passenger');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Passenger State
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [rideStatus, setRideStatus] = useState<'idle' | 'searching' | 'accepted' | 'started' | 'completed'>('idle');
  
  // Driver State
  const [isOnline, setIsOnline] = useState(false);
  const [incomingRide, setIncomingRide] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'AUTH', token: 'mock-token' })); // In real app, send real JWT
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NEW_RIDE_REQUEST') {
        setIncomingRide(data.ride);
      } else if (data.type === 'RIDE_ACCEPTED') {
        setRideStatus('accepted');
      } else if (data.type === 'DRIVER_LOCATION') {
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    };

    return () => socket.close();
  }, [user]);

  // Driver location simulator
  useEffect(() => {
    if (user?.role === 'driver' && isOnline) {
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
          socketRef.current?.send(JSON.stringify({
            type: 'LOCATION_UPDATE',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }));
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, isOnline]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          role,
          identifier: data.email || data.phone // For login
        })
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      
      localStorage.setItem('token', result.token);
      setUser(result.user);
      setView('app');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
    setIsMenuOpen(false);
  };

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-emerald-100 selection:text-emerald-900">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <LandingPage onStart={() => setView('auth')} />
          )}

          {view === 'auth' && (
            <AuthPage 
              mode={authMode} 
              setMode={setAuthMode} 
              role={role} 
              setRole={setRole} 
              onSubmit={handleLogin} 
              onBack={() => setView('landing')}
            />
          )}

          {view === 'app' && user && (
            <div className="flex h-screen overflow-hidden flex-col lg:flex-row">
              {/* Sidebar / Navigation */}
              <Sidebar 
                user={user} 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                onLogout={handleLogout}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />

              {/* Main Content */}
              <main className="relative flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => setIsMenuOpen(true)} user={user} />
                
                <div className="flex-1 relative overflow-hidden">
                  {user.role === 'passenger' && (
                    <PassengerView 
                      user={user}
                      pickup={pickup} 
                      setPickup={setPickup}
                      destination={destination}
                      setDestination={setDestination}
                      rideStatus={rideStatus}
                      setRideStatus={setRideStatus}
                      driverLocation={driverLocation}
                    />
                  )}
                  {user.role === 'driver' && (
                    <div className="h-full relative overflow-hidden">
                      {activeTab === 'home' && (
                        <DriverView 
                          isOnline={isOnline}
                          setIsOnline={setIsOnline}
                          incomingRide={incomingRide}
                          setIncomingRide={setIncomingRide}
                        />
                      )}
                      {activeTab === 'wallet' && (
                        <DriverWallet user={user} />
                      )}
                    </div>
                  )}
                  {user.role === 'admin' && (
                    <AdminDashboard />
                  )}
                </div>
              </main>
            </div>
          )}
        </AnimatePresence>
      </div>
    </APIProvider>
  );
}

// --- Sub-components ---

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="relative min-h-screen flex flex-col"
    >
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/taxi/1920/1080?blur=2" 
            className="w-full h-full object-cover opacity-20" 
            alt="Background"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white"></div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="z-10 max-w-3xl"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
              <Car className="text-white w-8 h-8" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-neutral-900">TaxiLibre</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-neutral-900 mb-6 leading-[1.1] tracking-tight">
            Votre trajet, <br />
            <span className="text-emerald-600">en toute liberté.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-xl mx-auto leading-relaxed">
            La plateforme de mobilité nouvelle génération. Plus rapide, plus sûr, plus humain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
            >
              Commander une course
            </button>
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-white text-neutral-900 border border-neutral-200 rounded-2xl font-semibold text-lg hover:bg-neutral-50 transition-all active:scale-95"
            >
              Devenir chauffeur
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Courses', value: '1M+' },
            { label: 'Chauffeurs', value: '50k+' },
            { label: 'Villes', value: '120+' },
            { label: 'Note moyenne', value: '4.9/5' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{stat.value}</div>
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function AuthPage({ mode, setMode, role, setRole, onSubmit, onBack }: any) {
  const [driverType, setDriverType] = useState<'taxi' | 'vtc'>('taxi');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen flex items-center justify-center p-6 bg-neutral-50"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-neutral-200/50 p-8 border border-neutral-100">
        <button onClick={onBack} className="mb-6 text-neutral-400 hover:text-neutral-900 transition-colors">
          <ChevronRight className="rotate-180 inline w-5 h-5" /> Retour
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            {mode === 'login' ? 'Bon retour !' : 'Créer un compte'}
          </h2>
          <p className="text-neutral-500">
            {mode === 'login' ? 'Connectez-vous pour continuer' : 'Rejoignez la révolution TaxiLibre'}
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex p-1 bg-neutral-100 rounded-2xl mb-8">
          <button 
            onClick={() => setRole('passenger')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
              role === 'passenger' ? "bg-white text-emerald-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Passager
          </button>
          <button 
            onClick={() => setRole('driver')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
              role === 'driver' ? "bg-white text-emerald-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Chauffeur
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Nom complet</label>
                <input 
                  name="name"
                  type="text" 
                  required
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="Jean Dupont"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Téléphone</label>
                <input 
                  name="phone"
                  type="tel" 
                  required
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              {role === 'driver' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Type de chauffeur</label>
                    <input type="hidden" name="driverType" value={driverType} />
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setDriverType('taxi')}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                          driverType === 'taxi' ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-white border-neutral-200 text-neutral-500"
                        )}
                      >
                        Taxi (Licence requise)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDriverType('vtc')}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                          driverType === 'vtc' ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-white border-neutral-200 text-neutral-500"
                        )}
                      >
                        VTC (Carte Pro)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Numéro de licence / Carte Pro</label>
                    <input 
                      name="licenseNumber"
                      type="text" 
                      required
                      className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="TX-12345678"
                    />
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                      Votre compte sera soumis à une validation manuelle par nos administrateurs. Veuillez vous assurer que vos documents sont prêts.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Email ou Téléphone</label>
            <input 
              name={mode === 'login' ? "identifier" : "email"}
              type={mode === 'login' ? "text" : "email"}
              required
              className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder={mode === 'login' ? "Email ou +33..." : "jean@example.com"}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Mot de passe</label>
            <input 
              name="password"
              type="password" 
              required
              className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98] mt-4">
            {mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-neutral-500 text-sm">
            {mode === 'login' ? "Pas encore de compte ?" : "Déjà un compte ?"}
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-emerald-600 font-bold hover:underline"
            >
              {mode === 'login' ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Sidebar({ user, isOpen, onClose, onLogout, activeTab, setActiveTab }: any) {
  const menuItems = [
    { id: 'home', label: 'Accueil', icon: MapPin },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'wallet', label: 'Paiement', icon: CreditCard },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  if (user.role === 'admin') {
    menuItems.unshift({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-white border-r border-neutral-100 z-50 flex flex-col transition-transform lg:relative lg:translate-x-0",
          !isOpen && "-translate-x-full"
        )}
      >
        <div className="p-6 border-bottom border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Car className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">TaxiLibre</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-neutral-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all",
                activeTab === item.id 
                  ? "bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100/50" 
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-neutral-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{user.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function Header({ onMenuClick, user }: any) {
  return (
    <header className="h-16 bg-white border-b border-neutral-100 px-6 flex items-center justify-between z-30">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-neutral-100 rounded-xl">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-neutral-500">
          <span>TaxiLibre</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-neutral-900 capitalize">{user.role}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-neutral-100 rounded-xl relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-neutral-100 mx-2"></div>
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none">{user.name}</p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mt-1">{user.role}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold text-xs">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}

function PassengerView({ user, pickup, setPickup, destination, setDestination, rideStatus, setRideStatus, driverLocation }: any) {
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'taxi' | 'vtc'>('taxi');

  useEffect(() => {
    if (pickup && destination) {
      const fetchEstimate = async () => {
        try {
          const res = await fetch(`/api/maps/estimate?origin=${encodeURIComponent(pickup.address)}&destination=${encodeURIComponent(destination.address)}`);
          const data = await res.json();
          setEstimate(data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchEstimate();
    }
  }, [pickup, destination]);

  const handleRequestRide = async () => {
    if (!estimate || !user) return;
    
    setRideStatus('searching');
    try {
      // 1. Create Payment Intent
      const payRes = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: estimate.price, rideId: 0 }) // rideId 0 for now
      });
      const { clientSecret } = await payRes.json();
      
      // 2. Request Ride
      const rideRes = await fetch('/api/rides/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerId: user.id,
          pickup,
          destination,
          price: estimate.price,
          distance: estimate.distance,
          duration: estimate.duration
        })
      });
      const { rideId } = await rideRes.json();
      console.log(`Ride ${rideId} requested with payment intent ${clientSecret}`);
    } catch (e) {
      console.error(e);
      setRideStatus('idle');
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row relative">
      {/* Map Area */}
      <div className="flex-1 relative overflow-hidden h-[50vh] lg:h-full">
        <Map
          defaultCenter={{ lat: 48.8566, lng: 2.3522 }}
          defaultZoom={13}
          mapId="taxilibre_map"
          className="w-full h-full"
          disableDefaultUI={true}
        >
          <Directions pickup={pickup} destination={destination} />
          
          {pickup && (
            <AdvancedMarker position={{ lat: pickup.lat, lng: pickup.lng }}>
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
            </AdvancedMarker>
          )}
          
          {destination && (
            <AdvancedMarker position={{ lat: destination.lat, lng: destination.lng }}>
              <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
            </AdvancedMarker>
          )}

          {driverLocation && (
            <AdvancedMarker position={{ lat: driverLocation.lat, lng: driverLocation.lng }}>
              <div className="p-2 bg-emerald-600 rounded-full shadow-lg border border-white">
                <Car className="w-5 h-5 text-white" />
              </div>
            </AdvancedMarker>
          )}

          {MOCK_DRIVERS.map(driver => (
            <AdvancedMarker
              key={driver.id}
              position={{ lat: driver.lat, lng: driver.lng }}
            >
              <div className="p-2 bg-white rounded-full shadow-lg border border-neutral-100">
                <Car className="w-5 h-5 text-emerald-600" />
              </div>
            </AdvancedMarker>
          ))}
        </Map>
        
        {/* Map UI Elements - Floating Search on Mobile */}
        <div className="absolute top-4 left-4 right-4 lg:left-6 lg:top-6 lg:right-auto lg:w-96 z-10">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl shadow-neutral-900/10 p-3 lg:p-4 border border-white/20">
            <div className="space-y-2 lg:space-y-3">
              <AutocompleteInput 
                placeholder="Point de départ"
                iconColor="bg-blue-500"
                value={pickup?.address || ''}
                onChange={(val: string) => setPickup((prev: any) => ({ ...(prev || { lat: 0, lng: 0 }), address: val }))}
                onSelect={setPickup}
              />
              <AutocompleteInput 
                placeholder="Où allez-vous ?"
                iconColor="bg-emerald-500"
                value={destination?.address || ''}
                onChange={(val: string) => setDestination((prev: any) => ({ ...(prev || { lat: 0, lng: 0 }), address: val }))}
                onSelect={setDestination}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Panel - Bottom Sheet on Mobile */}
      <motion.div 
        className={cn(
          "w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-neutral-100 flex flex-col z-20 transition-all duration-300",
          isPanelExpanded ? "h-[70vh]" : "h-[40vh] lg:h-full"
        )}
      >
        <div 
          className="p-4 lg:p-6 border-b border-neutral-100 flex items-center justify-between cursor-pointer lg:cursor-default"
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        >
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-neutral-900">Choisir une course</h3>
            <p className="text-xs lg:text-sm text-neutral-500">Sélectionnez le type de véhicule</p>
          </div>
          <div className="lg:hidden w-8 h-1 bg-neutral-200 rounded-full"></div>
        </div>

        {/* Taxi / VTC Switcher */}
        <div className="p-4 flex gap-2">
          <button 
            onClick={() => setSelectedType('taxi')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
              selectedType === 'taxi' ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-white border-neutral-100 text-neutral-500"
            )}
          >
            Taxi Officiel
          </button>
          <button 
            onClick={() => setSelectedType('vtc')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
              selectedType === 'vtc' ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-white border-neutral-100 text-neutral-500"
            )}
          >
            VTC Privé
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {[
            { id: 'standard', name: selectedType === 'taxi' ? 'Taxi Standard' : 'VTC Eco', price: estimate ? estimate.price : 12.50, time: '3 min', icon: Car, color: 'emerald' },
            { id: 'premium', name: selectedType === 'taxi' ? 'Taxi Berline' : 'VTC Premium', price: estimate ? (estimate.price * 1.8).toFixed(2) : 24.00, time: '5 min', icon: ShieldCheck, color: 'indigo' },
            { id: 'xl', name: selectedType === 'taxi' ? 'Taxi Van' : 'VTC XL', price: estimate ? (estimate.price * 1.4).toFixed(2) : 18.75, time: '8 min', icon: Users, color: 'orange' },
          ].map((type) => (
            <button 
              key={type.id}
              className="w-full flex items-center gap-4 p-3 lg:p-4 rounded-2xl border border-neutral-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
            >
              <div className={cn(
                "w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-colors",
                type.color === 'emerald' ? "bg-emerald-100 text-emerald-600" : 
                type.color === 'indigo' ? "bg-indigo-100 text-indigo-600" : 
                "bg-orange-100 text-orange-600"
              )}>
                <type.icon className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-sm lg:text-base text-neutral-900">{type.name}</p>
                <p className="text-[10px] lg:text-xs text-neutral-500">{type.time} d'attente • {estimate?.distance?.toFixed(1) || '0'} km</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm lg:text-base text-neutral-900">{type.price}€</p>
                <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-emerald-500 transition-colors inline" />
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 lg:p-6 bg-neutral-50 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
              <CreditCard className="w-4 h-4" />
              <span>•••• 4242</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <ShieldCheck className="w-3 h-3" />
              SÉCURISÉ
            </div>
          </div>
          <button 
            onClick={handleRequestRide}
            disabled={rideStatus === 'searching' || !estimate}
            className="w-full py-3.5 lg:py-4 bg-emerald-600 text-white rounded-2xl font-bold text-base lg:text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {rideStatus === 'searching' ? 'Recherche en cours...' : 'Payer & Commander'}
          </button>
          <p className="text-[10px] text-center text-neutral-400 mt-3 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Cryptage SSL 256-bit • Paiement via Stripe
          </p>
        </div>
      </motion.div>

      {/* Ride Status Overlay */}
      <AnimatePresence>
        {rideStatus === 'searching' && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-96 bg-white rounded-3xl shadow-2xl p-6 border border-neutral-100 z-40"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin"></div>
                <Car className="absolute inset-0 m-auto w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Recherche de chauffeur</h4>
                <p className="text-sm text-neutral-500">Nous trouvons le meilleur trajet pour vous</p>
              </div>
            </div>
            <button 
              onClick={() => setRideStatus('idle')}
              className="w-full py-3 bg-neutral-100 text-neutral-600 rounded-xl font-bold hover:bg-neutral-200 transition-all"
            >
              Annuler la recherche
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DriverView({ isOnline, setIsOnline, incomingRide, setIncomingRide }: any) {
  return (
    <div className="h-full flex flex-col relative">
      {/* Map Background */}
      <div className="flex-1 relative overflow-hidden h-[60vh] lg:h-full">
        <Map
          defaultCenter={{ lat: 48.8566, lng: 2.3522 }}
          defaultZoom={13}
          mapId="taxilibre_driver_map"
          className="w-full h-full"
          disableDefaultUI={true}
        />
        
        {/* Status Toggle */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full px-6 max-w-xs">
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={cn(
              "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full font-bold text-base lg:text-lg shadow-2xl transition-all active:scale-95",
              isOnline 
                ? "bg-emerald-600 text-white shadow-emerald-200" 
                : "bg-white text-neutral-900 shadow-neutral-200"
            )}
          >
            <div className={cn("w-3 h-3 rounded-full animate-pulse", isOnline ? "bg-white" : "bg-red-500")}></div>
            {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
          </button>
        </div>

        {/* Stats Overlay */}
        <div className="absolute bottom-6 left-6 right-6 flex gap-3 lg:gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { label: 'Gains', value: '124.50€', icon: DollarSign },
            { label: 'Courses', value: '12', icon: Navigation },
            { label: 'Note', value: '4.9', icon: Star },
            { label: 'Temps', value: '5h 20m', icon: Clock },
          ].map((stat, i) => (
            <div key={i} className="flex-shrink-0 bg-white/90 backdrop-blur-md p-3 lg:p-4 rounded-2xl shadow-xl border border-white/20 min-w-[120px] lg:min-w-[140px]">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <stat.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="text-lg lg:text-xl font-bold text-neutral-900">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Incoming Ride Modal */}
      <AnimatePresence>
        {isOnline && !incomingRide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center p-6 z-20 pointer-events-none"
          >
             <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/40 shadow-xl text-emerald-700 font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                En attente de courses...
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DriverWallet({ user }: any) {
  return (
    <div className="h-full overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <DollarSign className="w-32 h-32" />
          </div>
          <p className="text-emerald-100 font-medium mb-2">Solde disponible</p>
          <h2 className="text-4xl font-bold mb-8">1,245.80€</h2>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-white text-emerald-600 rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-all">
              Retirer vers banque
            </button>
            <button className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-400 transition-all">
              Détails
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
            <h3 className="font-bold mb-4">Statistiques de la semaine</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-sm">Courses</span>
                <span className="font-bold">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-sm">Pourboires</span>
                <span className="font-bold text-emerald-600">45.00€</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-neutral-50">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">342.50€</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
            <h3 className="font-bold mb-4">Sécurité du compte</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-900">Vérification d'identité</p>
                  <p className="text-[10px] text-emerald-700">Validé le 12/02/2026</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl">
                <Lock className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-blue-900">Double authentification</p>
                  <p className="text-[10px] text-blue-700">Activée (Email + SMS)</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/drivers/pending')
      .then(res => res.json())
      .then(setPendingDrivers);
  }, []);

  const handleVerify = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/admin/drivers/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setPendingDrivers(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">Tableau de bord Admin</h2>
            <p className="text-neutral-500">Vue d'ensemble de l'activité TaxiLibre</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-all">Exporter</button>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">Rapports</button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Revenu Total', value: '42,850€', trend: '+12.5%', icon: DollarSign, color: 'emerald' },
            { label: 'Utilisateurs Actifs', value: '1,240', trend: '+5.2%', icon: Users, color: 'blue' },
            { label: 'Courses Terminées', value: '8,420', trend: '+18.1%', icon: CheckCircle2, color: 'indigo' },
            { label: 'Chauffeurs en Ligne', value: '42', trend: '-2.4%', icon: Car, color: 'orange' },
          ].map((metric, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl", metric.color === 'emerald' ? "bg-emerald-50 text-emerald-600" : metric.color === 'blue' ? "bg-blue-50 text-blue-600" : metric.color === 'indigo' ? "bg-indigo-50 text-indigo-600" : "bg-orange-50 text-orange-600")}>
                  <metric.icon className="w-6 h-6" />
                </div>
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-lg",
                  metric.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {metric.trend}
                </span>
              </div>
              <p className="text-sm font-medium text-neutral-500 mb-1">{metric.label}</p>
              <h4 className="text-2xl font-bold text-neutral-900">{metric.value}</h4>
            </div>
          ))}
        </div>

        {/* Driver Verification Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Vérification des chauffeurs</h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">
              {pendingDrivers.length} en attente
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="pb-4 font-bold text-xs text-neutral-400 uppercase tracking-wider">Chauffeur</th>
                  <th className="pb-4 font-bold text-xs text-neutral-400 uppercase tracking-wider">Type</th>
                  <th className="pb-4 font-bold text-xs text-neutral-400 uppercase tracking-wider">Licence</th>
                  <th className="pb-4 font-bold text-xs text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {pendingDrivers.map((driver) => (
                  <tr key={driver.id} className="group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-600">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{driver.name}</p>
                          <p className="text-xs text-neutral-500">{driver.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                        driver.driver_type === 'taxi' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                      )}>
                        {driver.driver_type}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-xs text-neutral-600">{driver.license_number}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleVerify(driver.id, 'approved')}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleVerify(driver.id, 'rejected')}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingDrivers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-neutral-400 text-sm italic">
                      Aucun chauffeur en attente de validation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
