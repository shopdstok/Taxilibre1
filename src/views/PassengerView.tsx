import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { 
  Car, 
  MapPin, 
  Search, 
  Clock, 
  CreditCard, 
  Star, 
  Menu, 
  X,
  Navigation,
  Shield,
  Gift,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

import { config } from '../config';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 48.8566,
  lng: 2.3522
};

export default function PassengerView() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage, country } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const theme = {
    primary: country === 'US' ? 'bg-blue-600' : country === 'ES' ? 'bg-red-600' : 'bg-black',
    accent: country === 'US' ? 'text-amber-500' : country === 'ES' ? 'text-yellow-500' : 'text-emerald-500',
    button: country === 'US' ? 'bg-blue-600 shadow-blue-600/20' : country === 'ES' ? 'bg-red-600 shadow-red-600/20' : 'bg-black shadow-black/20'
  };
  const [step, setStep] = useState<'IDLE' | 'SEARCHING' | 'RIDE_ACTIVE'>('IDLE');
  const [pickup, setPickup] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [serviceType, setServiceType] = useState<'TAXI' | 'VTC'>('VTC');
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: config.googleMapsApiKey
  });

  const handleRequestRide = () => {
    setStep('SEARCHING');
    // Simulate matching
    setTimeout(() => setStep('RIDE_ACTIVE'), 3000);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-full">
          <Menu size={24} className="text-slate-800" />
        </button>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${theme.primary} rounded-lg flex items-center justify-center`}>
            <Car size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">TaxiLibre</span>
        </div>
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
          {user?.name?.[0]}
        </div>
      </header>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={13}
            options={{
              disableDefaultUI: true,
              styles: [
                {
                  "featureType": "all",
                  "elementType": "labels.text.fill",
                  "stylers": [{"color": "#7c93a3"}]
                },
                {
                  "featureType": "administrative.locality",
                  "elementType": "labels.text.fill",
                  "stylers": [{"color": "#1d2c3d"}]
                }
              ]
            }}
          >
            {/* Mock Drivers */}
            <Marker position={{ lat: 48.8584, lng: 2.2945 }} icon={{ url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', scaledSize: new window.google.maps.Size(30, 30) }} />
            <Marker position={{ lat: 48.8606, lng: 2.3376 }} icon={{ url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', scaledSize: new window.google.maps.Size(30, 30) }} />
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-slate-200 animate-pulse flex items-center justify-center">
            <p className="text-slate-400 font-medium">Loading Map...</p>
          </div>
        )}

        {/* Overlay UI */}
        <div className="absolute inset-x-0 bottom-0 p-4 pointer-events-none">
          <AnimatePresence mode="wait">
            {step === 'IDLE' && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-6 pointer-events-auto max-w-lg mx-auto"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('where_to')}</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <input 
                      type="text" 
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder={t('pickup')} 
                      className="flex-1 bg-transparent outline-none text-slate-800 font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                    <input 
                      type="text" 
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder={t('destination')} 
                      className="flex-1 bg-transparent outline-none text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button 
                    onClick={() => setServiceType('TAXI')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${serviceType === 'TAXI' ? 'border-black bg-slate-50' : 'border-transparent bg-slate-50'}`}
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Car size={24} className={serviceType === 'TAXI' ? 'text-black' : 'text-slate-400'} />
                    </div>
                    <span className={`text-sm font-bold ${serviceType === 'TAXI' ? 'text-black' : 'text-slate-400'}`}>{t('taxi')}</span>
                  </button>
                  <button 
                    onClick={() => setServiceType('VTC')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${serviceType === 'VTC' ? 'border-black bg-slate-50' : 'border-transparent bg-slate-50'}`}
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Navigation size={24} className={serviceType === 'VTC' ? 'text-black' : 'text-slate-400'} />
                    </div>
                    <span className={`text-sm font-bold ${serviceType === 'VTC' ? 'text-black' : 'text-slate-400'}`}>{t('vtc')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Clock size={18} className="text-slate-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Recent</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Star size={18} className="text-slate-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Saved</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Gift size={18} className="text-slate-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Promo</span>
                  </button>
                </div>

                <button 
                  onClick={handleRequestRide}
                  disabled={!destination}
                  className={`w-full ${theme.button} text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50`}
                >
                  {t('request_ride')}
                </button>
              </motion.div>
            )}

            {step === 'SEARCHING' && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-8 pointer-events-auto max-w-lg mx-auto text-center"
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Car size={32} className="text-black" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('finding_ride')}</h2>
                <p className="text-slate-500 mb-8">Matching you with the best driver nearby...</p>
                <button 
                  onClick={() => setStep('IDLE')}
                  className="text-rose-500 font-bold hover:bg-rose-50 px-6 py-2 rounded-full transition-colors"
                >
                  {t('cancel_request')}
                </button>
              </motion.div>
            )}

            {step === 'RIDE_ACTIVE' && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-6 pointer-events-auto max-w-lg mx-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200">
                      <img src="https://picsum.photos/seed/driver/100/100" alt="Driver" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Marc Smith</h3>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-bold">4.9</span>
                        <span className="text-slate-400 font-medium ml-1">(1.2k rides)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('arriving_in')}</p>
                    <p className="text-2xl font-black text-black">4 min</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Tesla Model 3</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">ABC-123-DE • White</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Navigation size={20} className="text-blue-500" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold transition-colors">
                    {t('message')}
                  </button>
                  <button className="flex-1 bg-black text-white py-3 rounded-xl font-bold shadow-lg shadow-black/20 transition-all active:scale-95">
                    {t('call_driver')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sidebar Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-8 bg-black text-white">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center font-bold text-2xl">
                    {user?.name?.[0]}
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X size={24} />
                  </button>
                </div>
                <h3 className="text-2xl font-bold mb-1">{user?.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Star size={14} className="text-amber-500" fill="currentColor" />
                  <span>4.85 Rating</span>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-2">
                <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                  <Clock size={20} className="text-slate-600" />
                  <span className="font-bold text-slate-800">Your Trips</span>
                </button>
                <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                  <CreditCard size={20} className="text-slate-600" />
                  <span className="font-bold text-slate-800">Payment</span>
                </button>
                <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                  <Gift size={20} className="text-slate-600" />
                  <span className="font-bold text-slate-800">Promotions</span>
                </button>
                <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                  <Shield size={20} className="text-slate-600" />
                  <span className="font-bold text-slate-800">Safety</span>
                </button>

                <div className="p-4 border-t border-slate-100 mt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3 ml-2">Language</p>
                  <div className="flex gap-2">
                    {(['en', 'fr', 'es'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${language === lang ? 'bg-black text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-4 p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors"
                >
                  <X size={20} />
                  <span className="font-bold">{t('logout')}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
