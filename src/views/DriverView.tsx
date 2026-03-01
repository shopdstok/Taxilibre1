import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { 
  Car, 
  MapPin, 
  Navigation, 
  DollarSign, 
  Star, 
  Menu, 
  Power,
  Bell,
  TrendingUp,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

import { config } from '../config';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 48.8566,
  lng: 2.3522
};

export default function DriverView() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [newRideRequest, setNewRideRequest] = useState<any>(null);
  const [earnings, setEarnings] = useState({ today: 145.50, week: 840.00 });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: config.googleMapsApiKey
  });

  // Simulate a ride request after going online
  useEffect(() => {
    if (isOnline && !activeRide && !newRideRequest) {
      const timer = setTimeout(() => {
        setNewRideRequest({
          id: 'R-123',
          passenger: 'Alice Johnson',
          pickup: '123 Rue de Rivoli, Paris',
          destination: 'Gare du Nord',
          price: 24.50,
          distance: '4.2 km'
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, activeRide, newRideRequest]);

  const handleAcceptRide = () => {
    setActiveRide(newRideRequest);
    setNewRideRequest(null);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Car size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">Driver Portal</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">TaxiLibre Pro</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-500 uppercase">{t('earnings')}</p>
            <p className="text-emerald-500 font-bold">€{earnings.today.toFixed(2)}</p>
          </div>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${
              isOnline 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Power size={16} />
            <span>{isOnline ? t('online') : t('offline')}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={14}
            options={{
              disableDefaultUI: true,
              styles: [
                { "elementType": "geometry", "stylers": [{ "color": "#1d2c4d" }] },
                { "elementType": "labels.text.fill", "stylers": [{ "color": "#8ec3b9" }] },
                { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a3646" }] },
                { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#304a7d" }] }
              ]
            }}
          >
            {activeRide && (
              <Marker position={center} icon={{ url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', scaledSize: new window.google.maps.Size(40, 40) }} />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center">
            <p className="text-slate-600 font-medium">Initializing Navigation...</p>
          </div>
        )}

        {/* Overlay UI */}
        <div className="absolute inset-x-0 bottom-0 p-4 pointer-events-none">
          <AnimatePresence mode="wait">
            {!isOnline && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-8 pointer-events-auto max-w-md mx-auto text-center shadow-2xl"
              >
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Power size={40} className="text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('offline')}</h2>
                <p className="text-slate-400 mb-8">Go online to start receiving ride requests and earning money.</p>
                <button 
                  onClick={() => setIsOnline(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                >
                  {t('online')}
                </button>
              </motion.div>
            )}

            {isOnline && !activeRide && !newRideRequest && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 pointer-events-auto max-w-xs mx-auto text-center shadow-xl"
              >
                <div className="flex items-center justify-center gap-3 text-emerald-500 mb-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  <span className="text-sm font-bold uppercase tracking-widest">Searching for rides</span>
                </div>
                <p className="text-xs text-slate-500">Stay in busy areas to get more requests</p>
              </motion.div>
            )}

            {newRideRequest && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-6 pointer-events-auto max-w-lg mx-auto"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase mb-2 inline-block">{t('new_request')}</span>
                    <h2 className="text-2xl font-black text-slate-900">€{newRideRequest.price.toFixed(2)}</h2>
                    <p className="text-slate-500 text-sm font-medium">{newRideRequest.distance} • 8 min away</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <Bell size={24} className="animate-bounce" />
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1 py-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div className="w-0.5 flex-1 bg-slate-200"></div>
                      <div className="w-2 h-2 rounded-full bg-black"></div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{t('pickup')}</p>
                        <p className="text-sm font-bold text-slate-800">{newRideRequest.pickup}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{t('destination')}</p>
                        <p className="text-sm font-bold text-slate-800">{newRideRequest.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setNewRideRequest(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-4 rounded-2xl font-bold transition-colors"
                  >
                    {t('decline')}
                  </button>
                  <button 
                    onClick={handleAcceptRide}
                    className="flex-2 bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-black/20 transition-all active:scale-95"
                  >
                    {t('accept_ride')}
                  </button>
                </div>
              </motion.div>
            )}

            {activeRide && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 pointer-events-auto max-w-lg mx-auto shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-bold">
                      {activeRide.passenger[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{activeRide.passenger}</h3>
                      <p className="text-xs text-slate-500">Pickup: {activeRide.pickup}</p>
                    </div>
                  </div>
                  <button className="p-3 bg-slate-800 rounded-xl text-emerald-500">
                    <Navigation size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Earnings</p>
                    <p className="text-xl font-bold text-white">€{activeRide.price.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Distance</p>
                    <p className="text-xl font-bold text-white">{activeRide.distance}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveRide(null)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Complete Trip
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation (Mobile Style) */}
      <nav className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-between items-center">
        <button className="flex flex-col items-center gap-1 text-emerald-500">
          <TrendingUp size={20} />
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-colors">
          <Clock size={20} />
          <span className="text-[10px] font-bold uppercase">History</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-colors">
          <DollarSign size={20} />
          <span className="text-[10px] font-bold uppercase">Earnings</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-colors">
          <Star size={20} />
          <span className="text-[10px] font-bold uppercase">Ratings</span>
        </button>
      </nav>
    </div>
  );
}
