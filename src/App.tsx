/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { ref, push, set, serverTimestamp, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { auth, db } from './firebase';
import { 
  Search, 
  Home, 
  Compass, 
  Calendar, 
  User, 
  Trees,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  History,
  Info,
  QrCode,
  Camera,
  ShieldCheck,
  Wallet,
  ArrowRight,
  Settings,
  HelpCircle,
  Bell,
  CreditCard,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Screen, CartItem } from './types';
import { TOURS, FACILITIES } from './data';
import parolaImage from '../asset/parola.jpg';
import parolaPark1 from '../asset/parola-park (1).jpg';
import parolaPark2 from '../asset/parola-park (2).jpg';
import parolaPark3 from '../asset/parola-park (3).jpg';
import parola1 from '../asset/parola1.jpg';
import parola2 from '../asset/parola2.jpg';
import parolaSablayan from '../asset/Sablayan-Parola-Park-Sablayan-1003x380.jpg';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const addToCart = (item: CartItem) => {
    setCart([...cart, item]);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('home');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="relative h-screen w-full max-w-md mx-auto bg-sand-light overflow-hidden shadow-2xl flex flex-col font-sans">
      {/* App Header */}
      {currentScreen !== 'splash' && (
        <header className="bg-ocean-deep p-6 flex items-center gap-4 text-white shadow-lg z-50">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10">
            <Trees size={28} className="text-sunset-vibrant" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold leading-tight tracking-tight">Parola Park</h1>
            <p className="text-[10px] opacity-70 uppercase tracking-[0.2em] font-medium">Parola Park Concierge</p>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <AnimatePresence mode="wait">
          {currentScreen === 'splash' && (
            <SplashScreen onFinish={() => navigate('home')} />
          )}
          {currentScreen === 'home' && (
            <HomeScreen onNavigate={navigate} />
          )}
          {currentScreen === 'discover' && (
            <DiscoverScreen 
              onBack={() => navigate('home')} 
              onNavigate={navigate}
            />
          )}
          {currentScreen === 'reserve' && (
            <ReserveScreen 
              onBack={() => navigate('home')} 
              onAddToCart={addToCart}
              onNavigate={navigate}
            />
          )}
          {currentScreen === 'auth' && (
            <AuthScreen 
              onSuccess={() => {
                navigate('home');
              }} 
              onBack={() => navigate('home')}
            />
          )}
          {currentScreen === 'profile' && (
            <ProfileScreen 
              user={user} 
              onLogin={() => navigate('auth')} 
              onLogout={handleLogout}
            />
          )}
          {currentScreen === 'checkout' && (
            <CheckoutScreen 
              total={totalPrice} 
              cart={cart}
              user={user}
              onBack={() => navigate('home')} 
              onSuccess={() => {
                setCart([]);
                navigate('success');
              }}
            />
          )}
          {currentScreen === 'success' && (
            <SuccessScreen onHome={() => navigate('home')} />
          )}
        </AnimatePresence>
      </div>

      {/* Persistent Bottom Nav */}
      {currentScreen !== 'splash' && currentScreen !== 'auth' && currentScreen !== 'checkout' && currentScreen !== 'success' && (
        <nav className="h-20 bg-white/80 backdrop-blur-md border-t border-sand-muted flex items-center justify-around px-8 z-50">
          <NavButton icon={<Home size={22} />} active={currentScreen === 'home'} onClick={() => navigate('home')} />
          <NavButton icon={<Compass size={22} />} active={currentScreen === 'discover'} onClick={() => navigate('discover')} />
          <NavButton icon={<Calendar size={22} />} active={currentScreen === 'reserve'} onClick={() => navigate('reserve')} />
          <NavButton icon={<User size={22} />} active={currentScreen === 'profile'} onClick={() => navigate('profile')} />
        </nav>
      )}
    </div>
  );
}

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full relative flex flex-col items-center justify-center overflow-hidden bg-ocean-deep"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={parolaSablayan} 
          alt="Parola Park" 
          className="w-full h-full object-cover opacity-40 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep/60 via-ocean-deep/40 to-ocean-deep" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-10 space-y-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 15 }}
          className="bg-white/10 p-6 rounded-[40px] backdrop-blur-xl border border-white/20 shadow-2xl"
        >
          <Trees size={80} className="text-sunset-vibrant" />
        </motion.div>

        <div className="space-y-4">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-display font-bold text-white tracking-tight"
          >
            Parola Park
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sunset-soft/80 text-sm uppercase tracking-[0.3em] font-medium"
          >
            Historic Watchtower & Sunset
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full pt-8"
        >
          <button 
            onClick={onFinish}
            className="w-full py-5 bg-sunset-vibrant text-ocean-deep rounded-3xl font-bold text-lg shadow-2xl shadow-sunset-vibrant/20 active:scale-95 transition-all hover:bg-white"
          >
            Start Exploring
          </button>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20">
        <div className="w-1 h-12 bg-gradient-to-b from-white to-transparent rounded-full animate-bounce" />
      </div>
    </motion.div>
  );
}

function NavButton({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-ocean-deep text-white shadow-md' : 'text-gray-400 hover:text-ocean-deep'}`}
    >
      {icon}
    </button>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      {/* Hero Section */}
      <div className="relative h-72">
        <img 
          src={parolaSablayan} 
          alt="Parola Park" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/80 via-ocean-deep/20 to-transparent flex flex-col items-center justify-end pb-12 px-6 text-center">
          <h2 className="text-white text-4xl font-display font-bold mb-6 tracking-tight">Parola Park</h2>
          
          {/* Search Bar */}
          <div className="w-full max-w-xs relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors group-focus-within:text-ocean-primary">
              <Search size={18} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search activities..."
              className="w-full h-12 pl-12 pr-4 bg-white/90 backdrop-blur-sm rounded-2xl text-sm focus:outline-none focus:bg-white transition-all shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Main Buttons Row */}
      <div className="flex justify-center gap-4 p-6 -mt-8 z-10">
        <HomeActionButton icon={<Search size={24} />} label="Discover" onClick={() => onNavigate('discover')} />
        <HomeActionButton icon={<Calendar size={24} />} label="Reserve" onClick={() => onNavigate('reserve')} />
        <HomeActionButton icon={<User size={24} />} label="Sign In" onClick={() => onNavigate('auth')} />
      </div>

      {/* About Section */}
      <div className="p-8 space-y-8 text-center">
        <div className="space-y-2">
          <h3 className="text-2xl font-display font-bold text-ocean-deep">About Parola Park</h3>
          <div className="w-12 h-1 bg-sunset-vibrant mx-auto rounded-full opacity-50" />
        </div>
        
        <div className="text-left space-y-4 text-sm text-gray-600 leading-relaxed">
          <p>
            Also known as <span className="font-bold text-ocean-deep">Presing Park</span>, named after the wife of former Mayor Loreto Urieta. This Mountain Park served as a historic watchtower and cannon site built in 1861 to defend against intruders.
          </p>
          <p>
            Today, you can still find the historic lighthouse and old cannon. The park offers the <span className="font-bold text-ocean-primary">best sunset view in town</span>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="glass-card p-4 rounded-2xl text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Entrance</p>
            <p className="text-lg font-bold text-ocean-deep">₱10.00</p>
          </div>
          <div className="glass-card p-4 rounded-2xl text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Urban Guide</p>
            <p className="text-lg font-bold text-ocean-deep">₱1,000</p>
          </div>
        </div>

        <div className="pt-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Contact Tourism Office</h4>
          <div className="flex flex-col gap-3">
            <a href="tel:09985465917" className="flex items-center gap-3 p-4 glass-card rounded-2xl hover:bg-ocean-deep hover:text-white transition-all">
              <Phone size={18} className="text-sunset-vibrant" />
              <span className="text-sm font-medium">0998 546 5917</span>
            </a>
            <a href="mailto:info.tourismsby@gmail.com" className="flex items-center gap-3 p-4 glass-card rounded-2xl hover:bg-ocean-deep hover:text-white transition-all">
              <Mail size={18} className="text-sunset-vibrant" />
              <span className="text-sm font-medium">info.tourismsby@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HomeActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="flex flex-col items-center gap-3 group"
    >
      <div className="w-20 h-20 glass-card rounded-3xl flex items-center justify-center text-ocean-deep group-hover:bg-ocean-deep group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-ocean-deep/60 group-hover:text-ocean-deep transition-colors">{label}</span>
    </button>
  );
}

function DiscoverScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: Screen) => void }) {
  const gallery = [
    { src: parolaImage, alt: 'Parola Park' },
    { src: parolaSablayan, alt: 'Parola View' },
    { src: parolaPark1, alt: 'Watchtower' },
    { src: parolaPark2, alt: 'Lighthouse' },
    { src: parolaPark3, alt: 'Park Grounds' },
    { src: parola1, alt: 'Historic Cannon' },
    { src: parola2, alt: 'Urban Guide' },
    ...TOURS.map(tour => ({ src: tour.image, alt: tour.title })),
  ].slice(0, 8);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-8 space-y-10"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-sand-muted rounded-xl transition-colors">
          <Home size={20} className="text-ocean-deep" />
        </button>
        <h2 className="text-3xl font-display font-bold text-ocean-deep">Discover</h2>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Gallery</h3>
        <div className="grid grid-cols-2 gap-4">
          {gallery.map((img, idx) => (
            <div key={`${img.alt}-${idx}`} className="relative h-32 rounded-3xl overflow-hidden glass-card">
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/30 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Information</h3>
        <div className="glass-card p-6 rounded-3xl space-y-5 text-sm text-gray-600 leading-relaxed">
          <div className="flex items-start gap-4">
            <MapPin size={18} className="text-sunset-vibrant mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-ocean-deep">Address</p>
              <p>Parola Park (Presing Park), Sablayan, Occidental Mindoro, Philippines</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Info size={18} className="text-sunset-vibrant mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-ocean-deep">Hours</p>
              <p>Daily 6:00 AM – 6:00 PM (best view near sunset)</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <History size={18} className="text-sunset-vibrant mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-ocean-deep">About</p>
              <p>Historic watchtower and cannon site built in 1861, featuring a lighthouse and panoramic views.</p>
            </div>
          </div>

          {/* Map Section */}
          <div className="w-full h-48 rounded-2xl overflow-hidden border border-sand-muted shadow-inner">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d46300.01451212201!2d120.72520191666352!3d12.835759779404482!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bb9b2ccfbd5fab%3A0xe5220ae758f9007a!2sSablayan%20Parola%20Park!5e1!3m2!1sen!2sph!4v1773571253072!5m2!1sen!2sph"
              className="w-full h-full border-0"
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <a href="tel:09985465917" className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 hover:bg-ocean-deep hover:text-white transition-all">
              <Phone size={18} className="text-sunset-vibrant" />
              <span className="text-xs font-bold tracking-widest uppercase">Call</span>
            </a>
            <a href="mailto:info.tourismsby@gmail.com" className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 hover:bg-ocean-deep hover:text-white transition-all">
              <Mail size={18} className="text-sunset-vibrant" />
              <span className="text-xs font-bold tracking-widest uppercase">Email</span>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/50">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Entrance</p>
              <p className="text-lg font-bold text-ocean-deep">₱10.00</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/50">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Urban Guide</p>
              <p className="text-lg font-bold text-ocean-deep">₱1,000</p>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => onNavigate('reserve')} className="btn-luxury w-full">
        Reserve
      </button>
    </motion.div>
  );
}

function ReserveScreen({ onBack, onAddToCart, onNavigate }: { onBack: () => void, onAddToCart: (i: CartItem) => void, onNavigate: (s: Screen) => void }) {
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  const toggleFacility = (id: string) => {
    if (selectedFacilities.includes(id)) {
      setSelectedFacilities(selectedFacilities.filter(i => i !== id));
    } else {
      setSelectedFacilities([...selectedFacilities, id]);
    }
  };

  const handleAddTour = () => {
    if (!selectedTourId) return;
    const tour = TOURS.find(t => t.id === selectedTourId);
    if (!tour) return;
    onAddToCart({ id: tour.id, name: tour.title, price: tour.price, type: 'tour' });
    setSelectedTourId(null);
  };

  const handleAddFacilities = () => {
    if (selectedFacilities.length === 0) return;
    selectedFacilities.forEach(id => {
      const item = FACILITIES.find(f => f.id === id);
      if (item) onAddToCart({ id: item.id, name: item.name, price: item.price, type: 'facility' });
    });
    setSelectedFacilities([]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-8 space-y-10"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-sand-muted rounded-xl transition-colors">
          <Home size={20} className="text-ocean-deep" />
        </button>
        <h2 className="text-3xl font-display font-bold text-ocean-deep">Reserve</h2>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Tours</h3>
        <div className="grid grid-cols-2 gap-4">
          {TOURS.map((tour) => (
            <button 
              key={tour.id}
              onClick={() => setSelectedTourId(tour.id)}
              className={`h-36 rounded-3xl font-bold transition-all duration-300 flex flex-col items-center justify-center gap-2 px-4 ${
                selectedTourId === tour.id 
                  ? 'bg-ocean-deep text-white shadow-xl scale-95' 
                  : 'glass-card text-ocean-deep hover:border-ocean-primary/30'
              }`}
            >
              <span className="text-sm tracking-widest uppercase text-center">{tour.title}</span>
              <span className="text-[10px] opacity-70 font-normal text-center leading-snug">{tour.description}</span>
              <span className="text-xs opacity-70 font-normal">₱{tour.price}</span>
            </button>
          ))}
        </div>
        <button 
          onClick={handleAddTour} 
          disabled={!selectedTourId}
          className="btn-luxury disabled:opacity-30 disabled:pointer-events-none"
        >
          Add Tour
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Facilities</h3>
        <div className="space-y-3">
          {FACILITIES.map((item) => (
            <button 
              key={item.id}
              onClick={() => toggleFacility(item.id)}
              className={`w-full py-5 px-8 rounded-3xl font-bold text-left transition-all duration-300 flex justify-between items-center ${
                selectedFacilities.includes(item.id) 
                  ? 'bg-ocean-deep text-white shadow-xl' 
                  : 'glass-card text-ocean-deep hover:border-ocean-primary/30'
              }`}
            >
              <span className="tracking-wide">{item.name}</span>
              <span className={`text-xs ${selectedFacilities.includes(item.id) ? 'text-sunset-soft' : 'text-gray-400'}`}>₱{item.price}</span>
            </button>
          ))}
        </div>
        <button 
          onClick={handleAddFacilities} 
          disabled={selectedFacilities.length === 0}
          className="btn-luxury disabled:opacity-30 disabled:pointer-events-none"
        >
          Add Facilities
        </button>
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-sand-muted"></div></div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400 bg-sand-light px-4">Navigation</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => onNavigate('checkout')} className="btn-outline py-3 text-sm">Checkout</button>
          <button onClick={() => onNavigate('discover')} className="btn-outline py-3 text-sm">Discover</button>
        </div>
      </div>
    </motion.div>
  );
}

function AuthScreen({ onSuccess, onBack }: { onSuccess: () => void, onBack: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-8 space-y-10"
    >
      <button onClick={onBack} className="p-2 hover:bg-sand-muted rounded-xl transition-colors">
        <Home size={20} className="text-ocean-deep" />
      </button>

      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-display font-bold text-ocean-deep">{isLogin ? 'Welcome Back' : 'Join Us'}</h2>
          <p className="text-gray-500 text-sm">{isLogin ? 'Sign in to your Parola Park account' : 'Create an account to start exploring'}</p>
        </div>

        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="input-modern" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-modern" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

        <div className="text-center">
          {isLogin ? (
            <p className="text-sm text-gray-600">New here? <button onClick={() => setIsLogin(false)} className="text-ocean-primary font-bold hover:underline">Create Account</button></p>
          ) : (
            <p className="text-sm text-gray-600">Already have an account? <button onClick={() => setIsLogin(true)} className="text-ocean-primary font-bold hover:underline">Log In</button></p>
          )}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="btn-luxury w-full disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </div>
    </motion.div>
  );
}

function ProfileScreen({ user, onLogin, onLogout }: { user: FirebaseUser | null, onLogin: () => void, onLogout: () => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'settings'>('profile');
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false
  });
  const [modal, setModal] = useState<'payment' | 'notifications' | 'help' | null>(null);

  useEffect(() => {
    if (user) {
      const bookingsRef = ref(db, 'bookings');
      const userBookingsQuery = query(bookingsRef, orderByChild('userId'), equalTo(user.uid));
      
      const unsubscribe = onValue(userBookingsQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const bookingsList = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setHistory(bookingsList);
        } else {
          setHistory([]);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 space-y-10"
      >
        <h2 className="text-3xl font-display font-bold text-ocean-deep">Profile</h2>
        <div className="text-center py-20 space-y-8 glass-card rounded-3xl p-10">
          <div className="w-20 h-20 bg-sand-muted rounded-full flex items-center justify-center mx-auto text-gray-400">
            <User size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-ocean-deep">Guest Mode</h3>
            <p className="text-gray-500 text-sm">Sign in to unlock personalized experiences and manage your bookings.</p>
          </div>
          <button onClick={onLogin} className="btn-luxury w-full">Sign In</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-sand-light relative"
    >
      <AnimatePresence>
        {modal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-ocean-deep/90 backdrop-blur-md p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-display font-bold text-white capitalize">{modal}</h3>
              <button 
                onClick={() => setModal(null)}
                className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
              >
                <ArrowRight size={24} className="rotate-180" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {modal === 'payment' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold">G</div>
                      <div>
                        <p className="font-bold text-white">GCash</p>
                        <p className="text-xs text-gray-400">Linked • 0917****123</p>
                      </div>
                    </div>
                    <CheckCircle2 size={20} className="text-sunset-vibrant" />
                  </div>
                  <button className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-white/40 text-sm font-bold hover:border-white/40 hover:text-white/60 transition-all">
                    + Add Payment Method
                  </button>
                </div>
              )}

              {modal === 'notifications' && (
                <div className="space-y-4">
                  {[
                    { title: 'Booking Confirmed', desc: 'Your tour for tomorrow is all set!', time: '2h ago' },
                    { title: 'New Reward!', desc: 'You earned 100 points from your last visit.', time: '1d ago' },
                  ].map((n, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                      <p className="font-bold text-white text-sm">{n.title}</p>
                      <p className="text-xs text-gray-400">{n.desc}</p>
                      <p className="text-[10px] text-sunset-vibrant pt-1 uppercase tracking-widest">{n.time}</p>
                    </div>
                  ))}
                </div>
              )}

              {modal === 'help' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-sunset-vibrant uppercase tracking-widest">FAQs</p>
                    {['How to book a tour?', 'Refund policy', 'Park rules'].map((q, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white text-sm font-medium flex justify-between items-center">
                        {q} <ChevronRight size={16} className="opacity-40" />
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-sunset-vibrant rounded-[32px] text-ocean-deep">
                    <h4 className="font-display font-bold text-xl mb-2">Need direct help?</h4>
                    <p className="text-sm opacity-80 mb-6">Our support team is available 24/7 for urgent concerns.</p>
                    <button className="w-full py-4 bg-ocean-deep text-white rounded-2xl font-bold text-sm shadow-xl">Contact Support</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header */}
      <div className="p-8 pb-4">
        <h2 className="text-3xl font-display font-bold text-ocean-deep mb-6">Profile</h2>
        
        <div className="p-6 glass-card rounded-[32px] relative overflow-hidden flex items-center gap-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ocean-primary to-sunset-vibrant" />
          <div className="w-20 h-20 rounded-2xl bg-ocean-deep text-white flex items-center justify-center text-3xl font-display font-bold shadow-xl shrink-0">
            {user.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-display font-bold text-ocean-deep truncate">{user.email?.split('@')[0]}</h3>
            <p className="text-gray-500 text-xs truncate mb-2">{user.email}</p>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-ocean-primary/10 text-ocean-primary text-[10px] font-bold rounded-full uppercase tracking-wider">Explorer</span>
              <span className="px-2 py-0.5 bg-sunset-vibrant/10 text-sunset-vibrant text-[10px] font-bold rounded-full uppercase tracking-wider">Lvl 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 flex gap-4 mb-6">
        {['profile', 'history', 'settings'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-ocean-deep text-white shadow-lg' 
                : 'text-gray-400 hover:text-ocean-deep'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 glass-card rounded-2xl text-center">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Total Visits</p>
                  <p className="text-xl font-bold text-ocean-deep">{history.length}</p>
                </div>
                <div className="p-5 glass-card rounded-2xl text-center">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Reward Points</p>
                  <p className="text-xl font-bold text-sunset-vibrant">{history.length * 100}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">Account Options</h4>
                <ProfileOption 
                  icon={<CreditCard size={18} />} 
                  label="Payment Methods" 
                  onClick={() => setModal('payment')}
                />
                <ProfileOption 
                  icon={<Bell size={18} />} 
                  label="Notifications" 
                  onClick={() => setModal('notifications')}
                />
                <ProfileOption 
                  icon={<HelpCircle size={18} />} 
                  label="Help & Support" 
                  onClick={() => setModal('help')}
                />
              </div>

              <button onClick={onLogout} className="w-full py-4 rounded-2xl text-red-500 font-bold text-sm border-2 border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                Log Out
              </button>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {history.length > 0 ? history.map((booking) => (
                <div key={booking.id} className="p-4 glass-card rounded-2xl space-y-3 border-l-4 border-sunset-vibrant">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-ocean-deep">Booking Confirmed</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> {new Date(booking.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-ocean-primary">₱{booking.total}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.items?.map((item: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-sand-muted rounded text-[10px] text-gray-600">{item.name}</span>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 opacity-50">
                  <Clock size={40} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">No past bookings yet</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">App Preferences</h4>
                <div className="p-4 glass-card rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-ocean-deep" />
                    <span className="text-sm font-bold text-ocean-deep">Push Notifications</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, notifications: !s.notifications }))}
                    className={`w-10 h-6 rounded-full relative transition-colors ${settings.notifications ? 'bg-sunset-vibrant' : 'bg-sand-muted'}`}
                  >
                    <motion.div 
                      animate={{ x: settings.notifications ? 16 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </button>
                </div>
                <div className="p-4 glass-card rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings size={18} className="text-ocean-deep" />
                    <span className="text-sm font-bold text-ocean-deep">Dark Mode</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                    className={`w-10 h-6 rounded-full relative transition-colors ${settings.darkMode ? 'bg-sunset-vibrant' : 'bg-sand-muted'}`}
                  >
                    <motion.div 
                      animate={{ x: settings.darkMode ? 16 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ProfileOption({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-4 glass-card rounded-2xl flex items-center justify-between group hover:bg-ocean-deep hover:text-white transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="text-sunset-vibrant group-hover:text-white transition-colors">{icon}</div>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <ChevronRight size={18} className="opacity-30 group-hover:opacity-100" />
    </button>
  );
}

function CheckoutScreen({ total, cart, user, onBack, onSuccess }: { total: number, cart: CartItem[], user: FirebaseUser | null, onBack: () => void, onSuccess: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ewallet'>('card');
  const [selectedEWallet, setSelectedEWallet] = useState<'gcash' | 'maya' | null>(null);
  const [ewalletMode, setEwalletMode] = useState<'number' | 'scan'>('number');
  const [paymentStep, setPaymentStep] = useState<'form' | 'scanning' | 'confirm'>('form');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (paymentStep === 'scanning') {
      const startScanner = async () => {
        try {
          const scanner = new Html5Qrcode("reader");
          scannerRef.current = scanner;
          const config = { fps: 10, qrbox: { width: 250, height: 250 } };
          
          await scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              // On success, we assume any valid QR is the payment QR for this demo
              console.log("QR Decoded:", decodedText);
              stopScanner();
              setPaymentStep('confirm');
            },
            (errorMessage) => {
              // Ignore errors while scanning
            }
          );
        } catch (err) {
          console.error("Scanner Error:", err);
        }
      };

      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [paymentStep]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Stop Error:", err);
      }
    }
  };

  const saveBooking = async () => {
    try {
      const bookingsRef = ref(db, 'bookings');
      const newBookingRef = push(bookingsRef);
      await set(newBookingRef, {
        userId: user?.uid || 'guest',
        userEmail: user?.email || 'guest',
        items: cart,
        total: total,
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === 'ewallet' ? selectedEWallet : 'card',
        timestamp: serverTimestamp(),
        status: 'confirmed'
      });
    } catch (error) {
      console.error("Error saving booking:", error);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'card') {
      setIsProcessing(true);
      setTimeout(async () => {
        await saveBooking();
        onSuccess();
      }, 2000);
    } else if (paymentMethod === 'ewallet') {
      if (!selectedEWallet) return;
      if (ewalletMode === 'scan') {
        setPaymentStep('scanning');
      } else {
        setPaymentStep('confirm');
      }
    }
  };

  const handleFinalPayment = () => {
    setIsProcessing(true);
    setTimeout(async () => {
      await saveBooking();
      onSuccess();
    }, 2000);
  };

  if (paymentStep === 'scanning') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center p-8 bg-black text-white"
      >
        <div className="relative w-full max-w-xs aspect-square border-2 border-white/30 rounded-3xl overflow-hidden bg-gray-900">
          <div id="reader" className="w-full h-full"></div>
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Scanning Line Animation */}
            <motion.div 
              animate={{ y: ["-100%", "100%", "-100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_blue] z-10"
            />
            {/* Corner accents */}
            <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
            <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
          </div>
        </div>
        
        <div className="mt-10 text-center space-y-2">
          <p className="text-xl font-bold tracking-widest text-blue-400">Scanner Active</p>
          <p className="text-sm text-gray-400 px-6">Align the Parola Park QR code within the frame to pay</p>
        </div>

        <button 
          onClick={() => {
            stopScanner();
            setPaymentStep('form');
          }}
          className="mt-20 py-3 px-8 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-medium transition-all"
        >
          Cancel
        </button>
      </motion.div>
    );
  }

  if (paymentStep === 'confirm' && selectedEWallet) {
    const isGCash = selectedEWallet === 'gcash';
    return (
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className={`h-full flex flex-col ${isGCash ? 'bg-blue-600' : 'bg-[#00c07f]'} overflow-hidden`}
      >
        {/* E-Wallet Header */}
        <div className="p-8 flex items-center justify-between text-white">
          <button onClick={() => setPaymentStep('form')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowRight size={24} className="rotate-180" />
          </button>
          <span className="font-bold tracking-widest uppercase">{isGCash ? 'GCash' : 'Maya'}</span>
          <div className="w-10 h-10" />
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-sand-light rounded-t-[40px] mt-4 p-8 flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl ${isGCash ? 'bg-blue-600' : 'bg-[#00c07f]'} text-white`}>
            {isGCash ? <span className="text-3xl font-bold">G</span> : <span className="text-3xl font-bold">M</span>}
          </div>

          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Paying To</p>
          <h3 className="text-2xl font-display font-bold text-ocean-deep mb-8">Parola Park (Presing Park)</h3>

          <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-sand-muted space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Total Amount</span>
              <span className="text-2xl font-display font-bold text-ocean-deep">₱{total.toLocaleString()}</span>
            </div>
            <div className="border-t border-sand-muted pt-4 flex justify-between items-center text-xs">
              <span className="text-gray-400">Transaction Fee</span>
              <span className="font-bold text-green-600">FREE</span>
            </div>
          </div>

          <div className="w-full mt-10 space-y-4">
            <div className="flex items-center gap-4 p-4 glass-card rounded-2xl">
              <Wallet size={20} className={isGCash ? 'text-blue-600' : 'text-green-600'} />
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Payment Source</p>
                <p className="text-sm font-bold text-ocean-deep">{isGCash ? 'GCash Balance' : 'Maya Wallet'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Available</p>
                <p className="text-sm font-bold text-ocean-deep">₱5,240.50</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-4">
              <ShieldCheck size={14} className="text-green-500" />
              <span>Secure Payment Powered by {isGCash ? 'GCash' : 'Maya'}</span>
            </div>
          </div>

          <div className="mt-auto w-full">
            <button 
              onClick={handleFinalPayment}
              disabled={isProcessing}
              className={`w-full py-5 rounded-3xl font-bold text-lg text-white shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 ${isGCash ? 'bg-blue-600 shadow-blue-600/20' : 'bg-[#00c07f] shadow-green-600/20'}`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : `Pay ₱${total.toLocaleString()}`}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="p-8 space-y-10"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-sand-muted rounded-xl transition-colors">
          <Home size={20} className="text-ocean-deep" />
        </button>
        <h2 className="text-3xl font-display font-bold text-ocean-deep">Checkout</h2>
      </div>

      <div className="space-y-10">
        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Payment Method</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-3 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-ocean-deep bg-ocean-deep text-white' : 'border-sand-muted text-gray-500'}`}
              >
                Card
              </button>
              <button 
                onClick={() => setPaymentMethod('ewallet')}
                className={`flex-1 py-3 rounded-xl border-2 transition-all ${paymentMethod === 'ewallet' ? 'border-ocean-deep bg-ocean-deep text-white' : 'border-sand-muted text-gray-500'}`}
              >
                E-Wallet
              </button>
            </div>
          </div>

          {paymentMethod === 'card' ? (
            <div className="space-y-4 pt-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">Card Details</h3>
                <div className="flex gap-2">
                  <div className="w-8 h-5 bg-gray-200 rounded-sm" />
                  <div className="w-8 h-5 bg-gray-200 rounded-sm" />
                </div>
              </div>
              <input type="text" placeholder="Card Number" className="input-modern" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="MM/YY" className="input-modern" />
                <input type="text" placeholder="CVC" className="input-modern" />
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4 animate-in fade-in duration-300">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">Select E-Wallet</h3>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setSelectedEWallet('gcash')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedEWallet === 'gcash' ? 'border-blue-500 bg-blue-50' : 'border-sand-muted'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">G</div>
                    <span className="font-bold text-ocean-deep">GCash</span>
                  </div>
                  {selectedEWallet === 'gcash' && <CheckCircle2 size={20} className="text-blue-600" />}
                </button>
                <button 
                  onClick={() => setSelectedEWallet('maya')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedEWallet === 'maya' ? 'border-green-500 bg-green-50' : 'border-sand-muted'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">M</div>
                    <span className="font-bold text-ocean-deep">Maya</span>
                  </div>
                  {selectedEWallet === 'maya' && <CheckCircle2 size={20} className="text-green-600" />}
                </button>
              </div>
              
              {selectedEWallet && (
                <div className="space-y-6 pt-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex p-1 bg-sand-muted/50 rounded-xl">
                    <button 
                      onClick={() => setEwalletMode('number')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${ewalletMode === 'number' ? 'bg-white shadow-sm text-ocean-deep' : 'text-gray-400'}`}
                    >
                      Number
                    </button>
                    <button 
                      onClick={() => setEwalletMode('scan')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${ewalletMode === 'scan' ? 'bg-white shadow-sm text-ocean-deep' : 'text-gray-400'}`}
                    >
                      Scan QR
                    </button>
                  </div>

                  {ewalletMode === 'number' ? (
                    <input type="text" placeholder="Mobile Number (09xx...)" className="input-modern" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-4 bg-white rounded-3xl border border-sand-muted shadow-sm">
                      <div className="p-4 bg-sand-light rounded-2xl border-2 border-dashed border-sand-muted">
                        <QrCode size={120} className={selectedEWallet === 'gcash' ? 'text-blue-600' : 'text-green-600'} />
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center px-6">
                        Scan this QR code with your {selectedEWallet === 'gcash' ? 'GCash' : 'Maya'} app to pay ₱{total}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="pt-6 border-t border-sand-muted space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Total Amount</span>
            <span className="text-3xl font-display font-bold text-ocean-deep">₱{total.toLocaleString()}</span>
          </div>
          <button 
            onClick={handlePayment}
            disabled={isProcessing || total === 0 || (paymentMethod === 'ewallet' && !selectedEWallet)}
            className="btn-luxury w-full disabled:opacity-30 flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : paymentMethod === 'ewallet' && ewalletMode === 'scan' ? 'Launch Scanner' : 'Pay Now'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SuccessScreen({ onHome }: { onHome: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col items-center justify-center p-10 text-center space-y-8"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="relative text-emerald-500 bg-white p-8 rounded-[40px] shadow-2xl"
        >
          <CheckCircle2 size={100} strokeWidth={1.5} />
        </motion.div>
      </div>
      
      <div className="space-y-3">
        <h2 className="text-4xl font-display font-bold text-ocean-deep">Success!</h2>
        <p className="text-gray-500 leading-relaxed">
          Your booking has been confirmed. A digital pass has been sent to your email. See you at Parola Park!
        </p>
      </div>

      <button onClick={onHome} className="btn-luxury w-full max-w-[240px]">
        Return Home
      </button>
    </motion.div>
  );
}
