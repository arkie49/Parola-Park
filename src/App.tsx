/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import emailjs from '@emailjs/browser';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { ref, push, set, serverTimestamp, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { auth, db } from './firebase';
import { 
  Search, 
  Home, 
  Compass, 
  Calendar, 
  User, 
  Trees,
  CheckCircle2,
  Download,
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
  Sun,
  Clock,
  Star,
  LogOut,
  Minus,
  Plus
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

const ADMIN_EMAIL = 'adminparola@gmail.com';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profileStatus, setProfileStatus] = useState<'unknown' | 'complete' | 'incomplete'>('unknown');
  const [postAuthRedirect, setPostAuthRedirect] = useState<Screen | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'completeProfile'>('login');
  const [cartHydratedForUserId, setCartHydratedForUserId] = useState<string | null>(null);
  const [lastEmailStatus, setLastEmailStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfileStatus('unknown');
      return;
    }

    const profileRef = ref(db, `users/${user.uid}/profile`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      const profile = snapshot.val();
      const isComplete = profile?.profileComplete || localStorage.getItem(`profile_complete_${user.uid}`) === 'true';
      setProfileStatus(isComplete ? 'complete' : 'incomplete');
    }, (error) => {
      console.error("Profile onValue error:", error);
      if (error.message.toLowerCase().includes('permission denied')) {
        // Check local storage as fallback
        const isComplete = localStorage.getItem(`profile_complete_${user.uid}`) === 'true';
        setProfileStatus(isComplete ? 'complete' : 'incomplete');
      }
    });

    return () => unsubscribe();
  }, [user]);

  const routeToAuth = ({
    mode,
    notice,
    redirect,
  }: {
    mode: 'login' | 'signup' | 'completeProfile';
    notice: string | null;
    redirect: Screen | null;
  }) => {
    setAuthMode(mode);
    setAuthNotice(notice);
    setPostAuthRedirect(redirect);
    setCurrentScreen('auth');
  };

  const navigate = (screen: Screen) => {
    const isProtected = screen === 'reserve' || screen === 'checkout';
    const isAdminRoute = screen === 'admin';

    if (isAdminRoute) {
      const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;
      if (!isAdmin) {
        routeToAuth({
          mode: 'login',
          notice: 'Admin access requires an admin account.',
          redirect: null,
        });
        return;
      }
    }

    if (isProtected) {
      if (!user) {
        routeToAuth({
          mode: 'signup',
          notice: 'Create an account and complete your profile to continue.',
          redirect: screen,
        });
        return;
      }

      // Allow access to reservation even if profile is incomplete
      // Only require full profile for checkout
      if (screen === 'checkout' && profileStatus === 'incomplete') {
        routeToAuth({
          mode: 'completeProfile',
          notice: 'Please complete your profile to continue to checkout.',
          redirect: screen,
        });
        return;
      }

      setCurrentScreen(screen);
      return;
    }

    if (isAdmin && screen !== 'admin') {
      setCurrentScreen('admin');
      return;
    }

    setCurrentScreen(screen);
  };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const exists = prev.some(i => i.id === item.id && i.type === item.type);
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = ({ id, type }: { id: string; type: CartItem['type'] }) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const toggleCartItem = (item: CartItem) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id && i.type === item.type);
      if (exists) {
        return prev.filter(i => !(i.id === item.id && i.type === item.type));
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const updateCartItemQuantity = (id: string, type: CartItem['type'], quantity: number) => {
    setCart(prev => prev.map(item => 
      (item.id === id && item.type === type) 
        ? { ...item, quantity: Math.max(1, quantity) } 
        : item
    ));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  useEffect(() => {
    if (!user) {
      setCartHydratedForUserId(null);
      return;
    }

    if (cartHydratedForUserId === user.uid) return;

    const hydrate = async () => {
      try {
        const cartSnap = await get(ref(db, `users/${user.uid}/cart/items`));
        const savedItems = cartSnap.val();
        if (Array.isArray(savedItems) && savedItems.length > 0 && cart.length === 0) {
          setCart(savedItems);
        }
      } catch (e) {
      } finally {
        setCartHydratedForUserId(user.uid);
      }
    };

    hydrate();
  }, [user, cartHydratedForUserId, cart.length]);

  useEffect(() => {
    if (!user) return;
    if (cartHydratedForUserId !== user.uid) return;

    const persist = async () => {
      try {
        await set(ref(db, `users/${user.uid}/cart`), {
          items: cart,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
      }
    };

    persist();
  }, [user, cartHydratedForUserId, cart]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('home');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="relative h-screen w-full max-w-md mx-auto bg-sand-light dark:bg-[#0F172A] overflow-hidden shadow-2xl flex flex-col font-sans">
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
            <SplashScreen onFinish={() => setCurrentScreen(isAdmin ? 'admin' : 'home')} />
          )}
          {currentScreen === 'home' && (
            <HomeScreen user={user} isAdmin={isAdmin} onNavigate={navigate} />
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
              cart={cart}
              onToggleCartItem={toggleCartItem}
              onUpdateQuantity={updateCartItemQuantity}
              onNavigate={navigate}
            />
          )}
          {currentScreen === 'auth' && (
            <AuthScreen 
              mode={authMode}
              notice={authNotice}
              onSuccess={(screen?: Screen) => {
                setAuthMode('login');
                setAuthNotice(null);

                // Check if profile was marked complete in localStorage
                if (user && localStorage.getItem(`profile_complete_${user.uid}`) === 'true') {
                  setProfileStatus('complete');
                }

                if (screen === 'admin') {
                  setPostAuthRedirect(null);
                  navigate('admin');
                  return;
                }

                const target = postAuthRedirect ?? 'home';
                setPostAuthRedirect(null);
                setCurrentScreen(target);
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
              onSuccess={(emailStatus?: string) => {
                setCart([]);
                setLastEmailStatus(emailStatus || null);
                navigate('success');
              }}
            />
          )}
          {currentScreen === 'success' && (
            <SuccessScreen 
              emailStatus={lastEmailStatus}
              onHome={() => {
                setLastEmailStatus(null);
                navigate('home');
              }} 
            />
          )}
          {currentScreen === 'admin' && (
            <AdminScreen onLogout={() => { signOut(auth).then(() => setCurrentScreen('home')); }} />
          )}
        </AnimatePresence>
      </div>

      {/* Persistent Bottom Nav */}
      {currentScreen !== 'splash' && currentScreen !== 'auth' && currentScreen !== 'checkout' && currentScreen !== 'success' && currentScreen !== 'admin' && (
        <nav className="h-20 bg-white/80 dark:bg-[#1E293B]/90 backdrop-blur-md border-t border-sand-muted dark:border-white/5 flex items-center justify-around px-8 z-50">
          <NavButton icon={<Home size={22} />} active={currentScreen === 'home'} onClick={() => navigate('home')} />
          <NavButton icon={<Compass size={22} />} active={currentScreen === 'discover'} onClick={() => navigate('discover')} />
          <NavButton icon={<Calendar size={22} />} active={currentScreen === 'reserve'} onClick={() => navigate('reserve')} />
          <NavButton icon={<User size={22} />} active={currentScreen === 'profile'} onClick={() => navigate('profile')} />
          {isAdmin && (
            <NavButton icon={<ShieldCheck size={22} />} active={currentScreen === 'admin'} onClick={() => navigate('admin')} />
          )}
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
      className="h-full w-full relative flex flex-col items-center justify-center overflow-hidden bg-ocean-deep dark:bg-[#0F172A]"
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
          className="bg-white/10 dark:bg-white/5 p-6 rounded-[40px] backdrop-blur-xl border border-white/20 shadow-2xl"
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
            className="w-full py-5 bg-sunset-vibrant text-ocean-deep dark:text-gray-200 rounded-3xl font-bold text-lg shadow-2xl shadow-sunset-vibrant/20 active:scale-95 transition-all hover:bg-white dark:bg-[#1E293B]"
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
      className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-ocean-deep dark:bg-ocean-primary text-white shadow-md' : 'text-gray-400 dark:text-gray-400 hover:text-ocean-deep dark:text-gray-200'}`}
    >
      {icon}
    </button>
  );
}

function HomeScreen({ user, isAdmin, onNavigate }: { user: FirebaseUser | null; isAdmin: boolean; onNavigate: (s: Screen) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredItems = [...TOURS, ...FACILITIES.map(f => ({ ...f, title: f.name }))].filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ('description' in item && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full relative"
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
          <div className="w-full max-w-xs relative group z-50">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors group-focus-within:text-ocean-primary">
              <Search size={18} className="text-gray-400 dark:text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 0);
              }}
              onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
              className="w-full h-12 pl-12 pr-4 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-sm rounded-2xl text-sm focus:outline-none focus:bg-white dark:bg-[#1E293B] transition-all shadow-lg"
            />

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showSearchResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden border border-sand-muted dark:border-white/10 z-50"
                >
                  <div className="max-h-64 overflow-y-auto p-2">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSearchQuery('');
                            setShowSearchResults(false);
                            onNavigate('reserve');
                          }}
                          className="w-full flex items-center gap-4 p-3 hover:bg-sand-light dark:bg-[#0B1120] rounded-2xl transition-colors text-left"
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-sand-muted dark:bg-[#1E293B] flex-shrink-0">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-ocean-deep dark:text-gray-200">{item.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-300">₱{item.price.toLocaleString()}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-300">No results found</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Backdrop for Search Results */}
      {showSearchResults && (
        <div 
          className="fixed inset-0 bg-black dark:bg-[#0B1120]/20 z-40 backdrop-blur-[2px]" 
          onClick={() => setShowSearchResults(false)}
        />
      )}

      {/* Main Buttons Row */}
      <div className="flex flex-wrap justify-center gap-4 p-6 -mt-8 z-10">
        <HomeActionButton icon={<Search size={24} />} label="Discover" onClick={() => onNavigate('discover')} />
        <HomeActionButton icon={<Calendar size={24} />} label="Reserve" onClick={() => onNavigate('reserve')} />
        {user ? (
          <HomeActionButton icon={<User size={24} />} label="Profile" onClick={() => onNavigate('profile')} />
        ) : (
          <HomeActionButton icon={<User size={24} />} label="Sign In" onClick={() => onNavigate('auth')} />
        )}
        {isAdmin && (
          <HomeActionButton icon={<ShieldCheck size={24} />} label="Admin" onClick={() => onNavigate('admin')} />
        )}
      </div>

      {/* Weather & Info Bar */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="glass-card flex items-center gap-4 px-5 py-3 rounded-2xl border-none shadow-sm">
          <div className="w-10 h-10 bg-sunset-soft/20 rounded-xl flex items-center justify-center">
            <Sun className="text-sunset-vibrant animate-pulse" size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Current Weather</p>
            <p className="text-sm font-bold text-ocean-deep dark:text-gray-200">29°C Sunny</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-4 px-5 py-3 rounded-2xl border-none shadow-sm">
          <div className="w-10 h-10 bg-ocean-primary/10 rounded-xl flex items-center justify-center">
            <Clock className="text-ocean-primary" size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Status</p>
            <p className="text-sm font-bold text-green-500">Open Now</p>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-ocean-deep dark:text-gray-200">Featured Tours</h3>
          <button onClick={() => onNavigate('discover')} className="text-xs font-bold text-ocean-primary flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
          {TOURS.slice(0, 2).map((tour) => (
            <motion.div 
              key={tour.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('reserve')}
              className="min-w-[280px] relative h-48 rounded-3xl overflow-hidden shadow-lg group cursor-pointer"
            >
              <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1 bg-yellow-400 px-1.5 py-0.5 rounded-lg">
                    <Star size={10} className="fill-black text-black dark:text-gray-200" />
                    <span className="text-[10px] font-bold text-black dark:text-gray-200">{tour.rating}</span>
                  </div>
                </div>
                <h4 className="text-white font-bold text-lg">{tour.title}</h4>
                <p className="text-white/70 text-xs line-clamp-1">{tour.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="p-8 space-y-8 text-center">
        <div className="space-y-2">
          <h3 className="text-2xl font-display font-bold text-ocean-deep dark:text-gray-200">About Parola Park</h3>
          <div className="w-12 h-1 bg-sunset-vibrant mx-auto rounded-full opacity-50" />
        </div>
        
        <div className="text-left space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Also known as <span className="font-bold text-ocean-deep dark:text-gray-200">Presing Park</span>, named after the wife of former Mayor Loreto Urieta. This Mountain Park served as a historic watchtower and cannon site built in 1861 to defend against intruders.
          </p>
          <p>
            Today, you can still find the historic lighthouse and old cannon. The park offers the <span className="font-bold text-ocean-primary">best sunset view in town</span>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="glass-card p-4 rounded-2xl text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1">Entrance</p>
            <p className="text-lg font-bold text-ocean-deep dark:text-gray-200">₱11.00</p>
          </div>
          <div className="glass-card p-4 rounded-2xl text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1">Urban Guide</p>
            <p className="text-lg font-bold text-ocean-deep dark:text-gray-200">₱1,000</p>
          </div>
        </div>

        <div className="pt-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-400">Contact Tourism Office</h4>
          <div className="flex flex-col gap-3">
            <a href="tel:09985465917" className="flex items-center gap-3 p-4 glass-card rounded-2xl hover:bg-ocean-deep dark:bg-ocean-primary hover:text-white transition-all">
              <Phone size={18} className="text-sunset-vibrant" />
              <span className="text-sm font-medium">0998 546 5917</span>
            </a>
            <a href="mailto:info.tourismsby@gmail.com" className="flex items-center gap-3 p-4 glass-card rounded-2xl hover:bg-ocean-deep dark:bg-ocean-primary hover:text-white transition-all">
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
      <div className="w-20 h-20 glass-card rounded-3xl flex items-center justify-center text-ocean-deep dark:text-gray-200 group-hover:bg-ocean-deep dark:bg-ocean-primary group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-ocean-deep dark:text-gray-200/60 group-hover:text-ocean-deep dark:text-gray-200 transition-colors">{label}</span>
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
        <button onClick={onBack} className="p-2 hover:bg-sand-muted dark:bg-[#1E293B] rounded-xl transition-colors">
          <Home size={20} className="text-ocean-deep dark:text-gray-200" />
        </button>
        <h2 className="text-3xl font-display font-bold text-ocean-deep dark:text-gray-200">Discover</h2>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-400">Gallery</h3>
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
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-400">Information</h3>
        <div className="glass-card p-6 rounded-3xl space-y-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <div className="flex items-start gap-4">
            <MapPin size={18} className="text-sunset-vibrant mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-ocean-deep dark:text-gray-200">Address</p>
              <p>Parola Park (Presing Park), Sablayan, Occidental Mindoro, Philippines</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Info size={18} className="text-sunset-vibrant mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-ocean-deep dark:text-gray-200">Hours</p>
              <p>Daily 6:00 AM – 6:00 PM (best view near sunset)</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <History size={18} className="text-sunset-vibrant mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-ocean-deep dark:text-gray-200">About</p>
              <p>Historic watchtower and cannon site built in 1861, featuring a lighthouse and panoramic views.</p>
            </div>
          </div>

          {/* Map Section */}
          <div className="w-full h-48 rounded-2xl overflow-hidden border border-sand-muted dark:border-white/10 shadow-inner">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d46300.01451212201!2d120.72520191666352!3d12.835759779404482!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bb9b2ccfbd5fab%3A0xe5220ae758f9007a!2sSablayan%20Parola%20Park!5e1!3m2!1sen!2sph!4v1773571253072!5m2!1sen!2sph"
              className="w-full h-full border-0"
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <a href="tel:09985465917" className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 dark:bg-[#1E293B]/50 hover:bg-ocean-deep dark:bg-ocean-primary hover:text-white transition-all">
              <Phone size={18} className="text-sunset-vibrant" />
              <span className="text-xs font-bold tracking-widest uppercase">Call</span>
            </a>
            <a href="mailto:info.tourismsby@gmail.com" className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 dark:bg-[#1E293B]/50 hover:bg-ocean-deep dark:bg-ocean-primary hover:text-white transition-all">
              <Mail size={18} className="text-sunset-vibrant" />
              <span className="text-xs font-bold tracking-widest uppercase">Email</span>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-[#1E293B]/50">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1">Entrance</p>
              <p className="text-lg font-bold text-ocean-deep dark:text-gray-200">₱11.00</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-[#1E293B]/50">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1">Urban Guide</p>
              <p className="text-lg font-bold text-ocean-deep dark:text-gray-200">₱1,000</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-400">Reviews</h3>
        <div className="space-y-4">
          {[
            { user: 'Juan D.', rating: 5, comment: 'Amazing sunset! The view from the lighthouse is breathtaking.', date: '2 days ago' },
            { user: 'Maria S.', rating: 4, comment: 'Very historical place. The guides are very knowledgeable.', date: '1 week ago' },
          ].map((review, i) => (
            <div key={i} className="glass-card p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-ocean-deep dark:text-gray-200">{review.user}</p>
                <span className="text-[10px] text-gray-400 dark:text-gray-400">{review.date}</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{review.comment}"</p>
            </div>
          ))}
          <button className="w-full py-4 text-xs font-bold text-ocean-primary hover:text-ocean-deep dark:text-gray-200 transition-colors">
            Read all 428 reviews
          </button>
        </div>
      </div>

      <button onClick={() => onNavigate('reserve')} className="btn-luxury w-full">
        Reserve
      </button>
    </motion.div>
  );
}

function ReserveScreen({
  onBack,
  cart,
  onToggleCartItem,
  onUpdateQuantity,
  onNavigate,
}: {
  onBack: () => void;
  cart: CartItem[];
  onToggleCartItem: (i: CartItem) => void;
  onUpdateQuantity: (id: string, type: CartItem['type'], q: number) => void;
  onNavigate: (s: Screen) => void;
}) {
  const mergedItems = [
    ...TOURS.map(t => ({ ...t, type: 'tour' as const })),
    ...FACILITIES.map(f => ({ ...f, title: f.name, type: 'facility' as const }))
  ];

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full overflow-y-auto"
    >
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-br from-ocean-deep via-ocean-primary to-sunset-vibrant">
        <div className="absolute inset-0 bg-black dark:bg-[#0B1120]/20" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-8 text-white">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-4 rounded-3xl mb-8"
          >
            <Calendar size={48} className="text-sunset-soft" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-display font-bold mb-4"
          >
            Reserve Your Experience
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sunset-soft/90 text-sm"
          >
            Choose from our exclusive tours and facilities
          </motion.p>
        </div>

        {/* Back Button */}
        <button 
          onClick={onBack} 
          className="absolute top-8 left-8 p-3 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl text-white hover:bg-white/20 transition-all"
        >
          <Home size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="px-8 py-8 pb-8 space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-display font-bold text-ocean-deep dark:text-gray-200">Tours and Facilities</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Select items to add to your reservation. Entrance fee can be adjusted for multiple people.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {mergedItems.map((item, index) => {
            const cartItem = cart.find(i => i.id === item.id && i.type === item.type);
            const isSelected = !!cartItem;
            const isEntranceFee = item.id === 'f1';

            return (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <button 
                  onClick={() => onToggleCartItem({ id: item.id, name: item.title, price: item.price, type: item.type })}
                  className={`w-full p-6 rounded-3xl transition-all duration-300 text-left group ${
                    isSelected 
                      ? 'bg-ocean-deep dark:bg-ocean-primary text-white shadow-2xl scale-[0.98]' 
                      : 'glass-card hover:shadow-xl hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl flex-shrink-0 ${
                      isSelected 
                        ? 'bg-white/20' 
                        : 'bg-ocean-deep dark:bg-ocean-primary/10'
                    }`}>
                      {item.id === 't1' && <History size={24} className={isSelected ? 'text-white' : 'text-ocean-deep dark:text-gray-200'} />}
                      {item.id === 't2' && <Sun size={24} className={isSelected ? 'text-white' : 'text-sunset-vibrant'} />}
                      {item.id === 't3' && <User size={24} className={isSelected ? 'text-white' : 'text-ocean-primary'} />}
                      {item.id === 'f1' && <Trees size={24} className={isSelected ? 'text-white' : 'text-ocean-deep dark:text-gray-200'} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-display font-bold text-lg ${
                          isSelected ? 'text-white' : 'text-ocean-deep dark:text-gray-200'
                        }`}>
                          {item.title}
                        </h4>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-sunset-vibrant rounded-full flex items-center justify-center"
                          >
                            <CheckCircle2 size={16} className="text-white" />
                          </motion.div>
                        )}
                      </div>
                      
                      {item.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          <span className={`text-xs font-bold ${isSelected ? 'text-white/90' : 'text-gray-700'}`}>
                            {item.rating}
                          </span>
                          <span className={`text-xs ${isSelected ? 'text-white/60' : 'text-gray-400 dark:text-gray-400'}`}>
                            ({item.reviews})
                          </span>
                        </div>
                      )}
                      
                      {'description' in item && (
                        <p className={`text-sm leading-relaxed mb-3 ${
                          isSelected ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${
                          isSelected ? 'text-sunset-soft' : 'text-sunset-vibrant'
                        }`}>
                          ₱{item.price === 0 ? 'FREE' : item.price.toLocaleString()}
                          {isEntranceFee && ' / person'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {isSelected && isEntranceFee && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 glass-card rounded-2xl mx-2 border-sunset-vibrant/30"
                  >
                    <span className="text-sm font-bold text-ocean-deep dark:text-gray-200">Number of People</span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(item.id, item.type, (cartItem.quantity || 1) - 1);
                        }}
                        className="p-2 bg-ocean-deep dark:bg-ocean-primary/20 text-white dark:text-gray-200 rounded-lg hover:opacity-80 transition-all"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-display font-bold text-lg text-ocean-deep dark:text-gray-200 w-8 text-center">
                        {cartItem.quantity || 1}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(item.id, item.type, (cartItem.quantity || 1) + 1);
                        }}
                        className="p-2 bg-ocean-deep dark:bg-ocean-primary/20 text-white dark:text-gray-200 rounded-lg hover:opacity-80 transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-sunset-vibrant/10 border border-sunset-vibrant/20 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-sunset-vibrant rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-ocean-deep dark:text-gray-200">{cart.length} item{cart.length === 1 ? '' : 's'} selected</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total: ₱{totalPrice.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-2 pb-4">
              {cart.map(item => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ocean-deep dark:text-gray-200">{item.name}</span>
                    {item.quantity && item.quantity > 1 && (
                      <span className="text-xs text-gray-500 dark:text-gray-300">x{item.quantity}</span>
                    )}
                  </div>
                  <span className="font-bold text-sunset-vibrant">
                    ₱{(item.price * (item.quantity || 1)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-300">Selected items are saved in your cart.</div>
          </motion.div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-8 pb-12">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('checkout')} 
            className="btn-luxury py-4 text-sm font-bold"
          >
            Checkout
          </button>
          <button 
            onClick={onBack}
            className="py-4 rounded-2xl border-2 border-sand-muted dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-sand-light dark:bg-[#0B1120] transition-all"
          >
            Add More
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AuthScreen({
  onSuccess,
  onBack,
  notice,
  mode,
}: {
  onSuccess: (screen?: Screen) => void;
  onBack: () => void;
  notice: string | null;
  mode: 'login' | 'signup' | 'completeProfile';
}) {
  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'completeProfile') {
      setStep('profile');
      return;
    }

    setStep('auth');
    setIsLogin(mode === 'login');
  }, [mode]);

  const goToProfileStepIfNeeded = async (userId: string) => {
    try {
      const profileSnap = await get(ref(db, `users/${userId}/profile`));
      const profile = profileSnap.val();
      if (profile?.profileComplete) {
        onSuccess();
        return;
      }
      
      if (profile) {
        if (profile.fullName) setFullName(profile.fullName);
        if (profile.phoneNumber) setPhoneNumber(profile.phoneNumber);
        if (profile.address) setAddress(profile.address);
      }
      
      setStep('profile');
    } catch (err: any) {
      console.error("Error checking profile:", err);
      if (err.message.toLowerCase().includes('permission denied')) {
        throw err;
      }
      setStep('profile');
    }
  };

  const handleAuthSubmit = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      if (email.toLowerCase() === ADMIN_EMAIL) {
        onSuccess('admin');
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication succeeded but user session is missing.');
      }

      if (!isLogin) {
        setStep('profile');
        return;
      }

      try {
        await goToProfileStepIfNeeded(currentUser.uid);
      } catch (err: any) {
        console.error("Non-blocking profile check error:", err);
        // If we can't check the profile due to permissions, let them in anyway
        if (err.message.toLowerCase().includes('permission denied')) {
          onSuccess();
        } else {
          setError(err?.message || 'Authentication failed');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError('Enter your email first, then tap Forgot Password.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo(`Password reset link sent to ${email}. Check your inbox and spam/junk.`);
    } catch (err: any) {
      const code = typeof err?.code === 'string' ? err.code : null;
      if (code === 'auth/user-not-found') {
        setError('No account exists for this email. Create it in Firebase Auth first, then try again.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes and try again.');
      } else {
        setError(err?.message || 'Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Please sign in to continue.');
      }

      const profileRef = ref(db, `users/${currentUser.uid}/profile`);
      let existingProfile = null;
      try {
        const snap = await get(profileRef);
        existingProfile = snap.val();
      } catch (e) {
        // Ignore read error here, we'll try to write anyway
      }

      const profileData: any = {
        email: currentUser.email || email,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        profileComplete: true,
        updatedAt: serverTimestamp(),
      };

      if (!existingProfile?.createdAt) {
        profileData.createdAt = serverTimestamp();
      }

      await set(profileRef, {
        ...(existingProfile || {}),
        ...profileData
      });

      localStorage.setItem(`profile_complete_${currentUser.uid}`, 'true');
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile.');
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
      <button onClick={onBack} className="p-2 hover:bg-sand-muted dark:bg-[#1E293B] rounded-xl transition-colors">
        <Home size={20} className="text-ocean-deep dark:text-gray-200" />
      </button>

      <div className="space-y-8">
        {notice && (
          <div className="glass-card p-4 rounded-2xl text-sm text-ocean-deep dark:text-gray-200">
            {notice}
          </div>
        )}

        {step === 'auth' ? (
          <>
            <div className="space-y-2">
              <h2 className="text-4xl font-display font-bold text-ocean-deep dark:text-gray-200">{isLogin ? 'Welcome Back' : 'Join Us'}</h2>
              <p className="text-gray-500 dark:text-gray-300 text-sm">{isLogin ? 'Sign in to your Parola Park account' : 'Create an account to start exploring'}</p>
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
            {info && <p className="text-emerald-600 text-xs font-bold">{info}</p>}

            <div className="text-center">
              {isLogin ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">New here? <button onClick={() => setIsLogin(false)} className="text-ocean-primary font-bold hover:underline">Create Account</button></p>
                  <button onClick={handleForgotPassword} className="text-xs font-bold text-ocean-primary hover:underline" disabled={loading}>
                    Forgot Password?
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">Already have an account? <button onClick={() => setIsLogin(true)} className="text-ocean-primary font-bold hover:underline">Log In</button></p>
              )}
            </div>

            <button 
              onClick={handleAuthSubmit}
              disabled={loading || !email || !password}
              className="btn-luxury w-full disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold text-ocean-deep dark:text-gray-200">Complete Your Profile</h2>
              <p className="text-gray-500 dark:text-gray-300 text-sm">Fill in the details below to continue browsing the app.</p>
            </div>

            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Full name" 
                className="input-modern" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input 
                type="tel" 
                placeholder="Phone number" 
                className="input-modern" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Address" 
                className="input-modern" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {error && (
              <div className="space-y-4">
                <p className="text-red-500 text-xs font-bold">{error}</p>
                {error.toLowerCase().includes('permission denied') && (
                  <button 
                    onClick={() => {
                      const currentUser = auth.currentUser;
                      if (currentUser) {
                        localStorage.setItem(`profile_complete_${currentUser.uid}`, 'true');
                        onSuccess();
                      }
                    }}
                    className="text-xs text-ocean-primary font-bold hover:underline block w-full text-center"
                  >
                    Skip this step and continue to App
                  </button>
                )}
              </div>
            )}

            <button 
              onClick={handleProfileSubmit}
              disabled={loading || !fullName.trim() || !phoneNumber.trim() || !address.trim()}
              className="btn-luxury w-full disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function ProfileScreen({ user, onLogin, onLogout }: { user: FirebaseUser | null, onLogin: () => void, onLogout: () => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'settings'>('profile');
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('parola_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      notifications: false,
      darkMode: document.documentElement.classList.contains('dark')
    };
  });

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('parola_settings', JSON.stringify(settings));
  }, [settings]);

  const toggleNotifications = async () => {
    if (!settings.notifications) {
      if ('Notification' in window) {
        const p = await window.Notification.requestPermission();
        if (p === 'granted') {
          setSettings(s => ({ ...s, notifications: true }));
          new window.Notification('Parola Park', { body: 'Notifications enabled!' });
        } else {
          alert('Notification permission denied.');
          setSettings(s => ({ ...s, notifications: false }));
        }
      } else {
        alert('Notifications not supported.');
      }
    } else {
      setSettings(s => ({ ...s, notifications: false }));
    }
  };

  const [modal, setModal] = useState<'payment' | 'notifications' | 'help' | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<any | null>(null);

  const [paymentMethods, setPaymentMethods] = useState<{ id: string, name: string, type: string, details: string, isDefault: boolean }[]>([
    { id: '1', name: 'GCash', type: 'ewallet', details: 'Linked • 0917****123', isDefault: true }
  ]);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState({ name: '', details: '' });

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
        <h2 className="text-3xl font-display font-bold text-ocean-deep dark:text-gray-200">Profile</h2>
        <div className="text-center py-20 space-y-8 glass-card rounded-3xl p-10">
          <div className="w-20 h-20 bg-sand-muted dark:bg-[#1E293B] rounded-full flex items-center justify-center mx-auto text-gray-400 dark:text-gray-400">
            <User size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-ocean-deep dark:text-gray-200">Guest Mode</h3>
            <p className="text-gray-500 dark:text-gray-300 text-sm">Sign in to unlock personalized experiences and manage your bookings.</p>
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
      className="flex flex-col h-full bg-sand-light dark:bg-[#0B1120] relative"
    >
      <AnimatePresence>
        {(modal || receiptBooking) && (
            <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-ocean-deep dark:bg-[#0B1120]/95 backdrop-blur-md p-4 sm:p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-display font-bold text-white capitalize">{receiptBooking ? 'receipt' : modal}</h3>
              <button 
                onClick={() => {
                  setModal(null);
                  setReceiptBooking(null);
                }}
                className="p-2 bg-white/10 dark:bg-white/5 rounded-xl text-white hover:bg-white/20 transition-colors"
              >
                <ArrowRight size={24} className="rotate-180" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {receiptBooking && (
                <div className="flex justify-center">
                  <ReceiptCard booking={receiptBooking} />
                </div>
              )}
              {modal === 'payment' && (
                <div className="space-y-4">
                  {paymentMethods.map(pm => (
                    <div 
                      key={pm.id} 
                      onClick={() => setPaymentMethods(pms => pms.map(p => ({ ...p, isDefault: p.id === pm.id })))} 
                      className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${pm.type === 'ewallet' ? 'bg-blue-600' : 'bg-gray-600'} rounded-lg flex items-center justify-center font-bold`}>{pm.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="font-bold text-white">{pm.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-400">{pm.details}</p>
                        </div>
                      </div>
                      {pm.isDefault && <CheckCircle2 size={20} className="text-sunset-vibrant" />}
                    </div>
                  ))}
                  
                  {isAddingPayment ? (
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                      <input 
                        className="w-full bg-transparent border-b border-white/20 text-white p-2 text-sm focus:outline-none focus:border-sunset-vibrant placeholder:text-gray-500" 
                        placeholder="Method Name (e.g. Maya, Credit Card)"
                        value={newPaymentForm.name}
                        onChange={e => setNewPaymentForm({ ...newPaymentForm, name: e.target.value })}
                      />
                      <input 
                        className="w-full bg-transparent border-b border-white/20 text-white p-2 text-sm focus:outline-none focus:border-sunset-vibrant placeholder:text-gray-500" 
                        placeholder="Details (e.g. 0912****)"
                        value={newPaymentForm.details}
                        onChange={e => setNewPaymentForm({ ...newPaymentForm, details: e.target.value })}
                      />
                      <div className="flex gap-2 pt-2">
                        <button 
                          className="flex-1 py-2 bg-sunset-vibrant text-ocean-deep font-bold rounded-xl text-sm hover:opacity-90"
                          onClick={() => {
                            if (newPaymentForm.name && newPaymentForm.details) {
                              setPaymentMethods([...paymentMethods, {
                                id: Date.now().toString(),
                                name: newPaymentForm.name,
                                type: newPaymentForm.name.toLowerCase().includes('card') ? 'card' : 'ewallet',
                                details: newPaymentForm.details,
                                isDefault: false
                              }]);
                              setIsAddingPayment(false);
                              setNewPaymentForm({ name: '', details: '' });
                            }
                          }}
                        >Save</button>
                        <button 
                          className="flex-1 py-2 border border-white/20 text-white tracking-wide font-bold rounded-xl text-sm hover:bg-white/10"
                          onClick={() => {
                            setIsAddingPayment(false);
                            setNewPaymentForm({ name: '', details: '' });
                          }}
                        >Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingPayment(true)}
                      className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-white/40 text-sm font-bold hover:border-white/40 hover:text-white/60 transition-all"
                    >
                      + Add Payment Method
                    </button>
                  )}
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
                      <p className="text-xs text-gray-400 dark:text-gray-400">{n.desc}</p>
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
                  <div className="p-6 bg-sunset-vibrant rounded-[32px] text-ocean-deep dark:text-gray-200">
                    <h4 className="font-display font-bold text-xl mb-2">Need direct help?</h4>
                    <p className="text-sm opacity-80 mb-6">Our support team is available 24/7 for urgent concerns.</p>
                    <button className="w-full py-4 bg-ocean-deep dark:bg-ocean-primary text-white rounded-2xl font-bold text-sm shadow-xl">Contact Support</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header */}
      <div className="p-8 pb-4">
        <h2 className="text-3xl font-display font-bold text-ocean-deep dark:text-gray-200 mb-6">Profile</h2>
        
        <div className="p-6 glass-card rounded-[32px] relative overflow-hidden flex items-center gap-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ocean-primary to-sunset-vibrant" />
          <div className="w-20 h-20 rounded-2xl bg-ocean-deep dark:bg-ocean-primary text-white flex items-center justify-center text-3xl font-display font-bold shadow-xl shrink-0">
            {user.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-display font-bold text-ocean-deep dark:text-gray-200 truncate">{user.email?.split('@')[0]}</h3>
            <p className="text-gray-500 dark:text-gray-300 text-xs truncate mb-2">{user.email}</p>
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
                ? 'bg-ocean-deep dark:bg-ocean-primary text-white shadow-lg' 
                : 'text-gray-400 dark:text-gray-400 hover:text-ocean-deep dark:text-gray-200'
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
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1">Total Visits</p>
                  <p className="text-xl font-bold text-ocean-deep dark:text-gray-200">{history.length}</p>
                </div>
                <div className="p-5 glass-card rounded-2xl text-center">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1">Reward Points</p>
                  <p className="text-xl font-bold text-sunset-vibrant">{history.length * 100}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400 px-2">Account Options</h4>
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
                <button
                  key={booking.id}
                  onClick={() => setReceiptBooking(booking)}
                  className="w-full text-left p-4 glass-card rounded-2xl space-y-3 border-l-4 border-sunset-vibrant hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-ocean-deep dark:text-gray-200">Booking Confirmed</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> {new Date(booking.timestamp).toLocaleDateString()}
                      </p>
                      {booking.receiptNo && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-400 font-bold tracking-widest uppercase">{booking.receiptNo}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-ocean-primary">₱{booking.total}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.payment?.method && (
                      <span className="px-2 py-0.5 bg-ocean-primary/10 rounded text-[10px] text-ocean-primary font-bold uppercase tracking-wider">{booking.payment.method}</span>
                    )}
                    {booking.payment?.provider && (
                      <span className="px-2 py-0.5 bg-sand-muted dark:bg-[#1E293B] rounded text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">{booking.payment.provider}</span>
                    )}
                    {booking.email?.sent === true && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Email Sent</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.items?.map((item: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-sand-muted dark:bg-[#1E293B] rounded text-[10px] text-gray-600 dark:text-gray-300">{item.name}</span>
                    ))}
                  </div>
                </button>
              )) : (
                <div className="text-center py-20 opacity-50">
                  <Clock size={40} className="mx-auto mb-4 text-gray-400 dark:text-gray-400" />
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
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400 px-2">App Preferences</h4>
                <div className="p-4 glass-card rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-ocean-deep dark:text-gray-200" />
                    <span className="text-sm font-bold text-ocean-deep dark:text-gray-200">Push Notifications</span>
                  </div>
                  <button 
                    onClick={toggleNotifications}
                    className={`w-10 h-6 rounded-full relative transition-colors ${settings.notifications ? 'bg-sunset-vibrant' : 'bg-sand-muted dark:bg-[#1E293B]'}`}
                  >
                    <motion.div 
                      animate={{ x: settings.notifications ? 16 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white dark:bg-[#1E293B] rounded-full shadow-sm" 
                    />
                  </button>
                </div>
                <div className="p-4 glass-card rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings size={18} className="text-ocean-deep dark:text-gray-200" />
                    <span className="text-sm font-bold text-ocean-deep dark:text-gray-200">Dark Mode</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                    className={`w-10 h-6 rounded-full relative transition-colors ${settings.darkMode ? 'bg-sunset-vibrant' : 'bg-sand-muted dark:bg-[#1E293B]'}`}
                  >
                    <motion.div 
                      animate={{ x: settings.darkMode ? 16 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white dark:bg-[#1E293B] rounded-full shadow-sm" 
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

function ReceiptCard({ booking }: { booking: any }) {
  const items: Array<{ name: string; price: number; type?: string }> = Array.isArray(booking?.items) ? booking.items : [];
  const total = typeof booking?.total === 'number' ? booking.total : Number(booking?.total || 0);
  const receiptNo = booking?.receiptNo || booking?.bookingId || booking?.id || '—';
  const customerName = booking?.customer?.fullName || booking?.userEmail || '—';
  const customerEmail = booking?.userEmail || booking?.customer?.email || '—';
  const customerPhone = booking?.customer?.phoneNumber || '—';
  const customerAddress = booking?.customer?.address || '—';
  const paymentMethod = booking?.payment?.method || booking?.paymentMethod || '—';
  const paymentProvider = booking?.payment?.provider || booking?.paymentDetails || '—';
  const dateLabel = booking?.timestamp ? new Date(booking.timestamp).toLocaleString() : '—';

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl w-full max-w-[860px]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400">Receipt</p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-ocean-deep dark:text-gray-200 break-words">{receiptNo}</p>
          <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{dateLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400">Total</p>
          <p className="text-3xl font-display font-bold text-sunset-vibrant">₱{total.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="p-4 rounded-2xl bg-sand-light dark:bg-[#0B1120] border border-sand-muted dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-2">Booked By</p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-ocean-deep dark:text-gray-200">{customerName}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 break-words">Email: {customerEmail}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">Phone: {customerPhone}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 break-words">Address: {customerAddress}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-sand-light dark:bg-[#0B1120] border border-sand-muted dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-2">Payment</p>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-ocean-deep dark:text-gray-200 uppercase tracking-wider">{paymentMethod}</span>
            <span className="font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{paymentProvider}</span>
          </div>
          {booking?.status && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">Status: {booking.status}</p>
          )}
          {booking?.email?.sent === true && (
            <p className="text-xs text-emerald-600 font-bold mt-2">Confirmation email sent</p>
          )}
          {booking?.email?.sent === false && (
            <p className="text-xs text-red-600 font-bold mt-2">Email failed: {booking?.email?.errorMessage || 'Unknown error'}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400">Items</p>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-ocean-deep dark:text-gray-200 truncate">{item.name}</p>
                  {item.quantity && item.quantity > 1 && (
                    <span className="text-xs text-gray-500 dark:text-gray-300">x{item.quantity}</span>
                  )}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400">{item.type || 'item'}</p>
              </div>
              <p className="font-bold text-sunset-vibrant">₱{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-300">No items found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileOption({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-4 glass-card rounded-2xl flex items-center justify-between group hover:bg-ocean-deep dark:bg-ocean-primary hover:text-white transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="text-sunset-vibrant group-hover:text-white transition-colors">{icon}</div>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <ChevronRight size={18} className="opacity-30 group-hover:opacity-100" />
    </button>
  );
}

const notifyUserActivity = (title: string, body: string) => {
  try {
    const saved = localStorage.getItem('parola_settings');
    const settings = saved ? JSON.parse(saved) : null;
    if (settings && settings.notifications === false) return;
  } catch (e) {}

  if ('Notification' in window && window.Notification.permission === 'granted') {
    new window.Notification(title, { body });
  }
};

function CheckoutScreen({ total, cart, user, onBack, onSuccess }: { total: number, cart: CartItem[], user: FirebaseUser | null, onBack: () => void, onSuccess: (emailStatus?: string) => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ewallet'>('card');
  const [selectedEWallet, setSelectedEWallet] = useState<'gcash' | 'maya' | null>(null);
  const [ewalletMode, setEwalletMode] = useState<'number' | 'scan'>('number');
  const [paymentStep, setPaymentStep] = useState<'form' | 'scanning' | 'confirm'>('form');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileRef = ref(db, `users/${user.uid}/profile`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      setProfile(snapshot.val());
    }, (error) => {
      console.error("Checkout profile onValue error:", error);
    });

    return () => unsubscribe();
  }, [user]);

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
      if (!user) {
        throw new Error('You must be signed in to complete checkout.');
      }

      const bookingsRef = ref(db, 'bookings');
      const newBookingRef = push(bookingsRef);
      const bookingId = newBookingRef.key;
      const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const receiptNo = `PP-${dateStamp}-${(bookingId || '').slice(-6).toUpperCase()}`;

      await set(newBookingRef, {
        bookingId,
        receiptNo,
        userId: user.uid,
        userEmail: user.email,
        customer: {
          fullName: profile?.fullName || null,
          phoneNumber: profile?.phoneNumber || null,
          address: profile?.address || null,
        },
        items: cart,
        total: total,
        currency: 'PHP',
        payment: {
          method: paymentMethod,
          provider: paymentMethod === 'ewallet' ? selectedEWallet : 'card',
          ewalletMode: paymentMethod === 'ewallet' ? ewalletMode : null,
        },
        timestamp: serverTimestamp(),
        status: 'confirmed'
      });

      return { bookingId, receiptNo };
    } catch (error) {
      console.error("Error saving booking:", error);
      throw error;
    }
  };

  const sendConfirmationEmail = async ({ bookingId, receiptNo }: { bookingId: string | null, receiptNo: string }) => {
    if (!user?.email) {
      const msg = 'Missing account email.';
      setEmailStatusMessage(msg);
      return msg;
    }
    
    try {
      console.log('Attempting to send email via EmailJS...', {
        email: user.email,
        receiptNo
      });

      const templateParams = {
        to_email: user.email,
        to_name: profile?.fullName || 'Guest',
        receipt_no: receiptNo,
        total_amount: `₱${total.toLocaleString()}`,
        items_list: cart.map(i => `- ${i.name} x${i.quantity || 1} (₱${(i.price * (i.quantity || 1)).toLocaleString()})`).join('\n'),
        customer_phone: profile?.phoneNumber || 'N/A',
        customer_address: profile?.address || 'N/A',
        payment_method: `${paymentMethod} ${selectedEWallet ? `(${selectedEWallet})` : ''}`,
        date: new Date().toLocaleString()
      };

      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey || serviceId.includes('your_') || publicKey.includes('your_')) {
        console.warn('EmailJS configuration incomplete or using placeholders.', { serviceId, templateId, publicKey });
        console.log('--- EMAILJS DEV LOG ---');
        console.table(templateParams);
        console.log('-----------------------');
        
        if (bookingId) {
          await set(ref(db, `bookings/${bookingId}/email`), {
            sent: true,
            sentTo: user.email,
            sentAt: serverTimestamp(),
            provider: 'console-log-emailjs',
            warning: 'Using placeholders or missing keys'
          });
        }
        const msg = `[DEV MODE] Receipt logged to console for ${user.email}`;
        setEmailStatusMessage(msg);
        return msg;
      }

      // Initialize and send
      emailjs.init(publicKey);
      const response = await emailjs.send(serviceId, templateId, templateParams);
      
      console.log('EmailJS Success:', response.status, response.text);

      if (bookingId) {
        await set(ref(db, `bookings/${bookingId}/email`), {
          sent: true,
          sentTo: user.email,
          sentAt: serverTimestamp(),
          provider: 'emailjs',
          status: response.status,
          text: response.text
        });
      }

      const msg = `Receipt successfully sent to ${user.email}`;
      setEmailStatusMessage(msg);
      return msg;
    } catch (e: any) {
      console.error('EmailJS Error:', e);
      const message = e?.text || e?.message || 'Failed to send confirmation email';
      if (bookingId) {
        try {
          await set(ref(db, `bookings/${bookingId}/email`), {
            sent: false,
            sentTo: user.email,
            errorAt: serverTimestamp(),
            errorMessage: message,
            provider: 'emailjs',
          });
        } catch (inner) {}
      }
      setEmailStatusMessage(message);
      return message;
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'card') {
      setIsProcessing(true);
      setEmailStatusMessage(null);
      setTimeout(async () => {
        const saved = await saveBooking();
        if (saved) {
          const emailStatus = await sendConfirmationEmail(saved);
          notifyUserActivity('Transfer Successful', `Your payment of ₱${total.toLocaleString()} was successful. ${emailStatus || ''}`);
          onSuccess(emailStatus);
        } else {
          onSuccess();
        }
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
    setEmailStatusMessage(null);
    setTimeout(async () => {
      try {
        const saved = await saveBooking();
        if (saved) {
          const emailStatus = await sendConfirmationEmail(saved);
          notifyUserActivity('Transfer Successful', `Your payment of ₱${total.toLocaleString()} was successful. ${emailStatus || ''}`);
          onSuccess(emailStatus);
        } else {
          onSuccess();
        }
      } catch (err: any) {
        console.error("Payment Process Error:", err);
        setEmailStatusMessage(err?.message || 'Payment processing failed.');
        setIsProcessing(false);
      }
    }, 2000);
  };

  if (paymentStep === 'scanning') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center p-8 bg-black dark:bg-[#0B1120] text-white"
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
          <p className="text-sm text-gray-400 dark:text-gray-400 px-6">Align the Parola Park QR code within the frame to pay</p>
        </div>

        <button 
          onClick={() => {
            stopScanner();
            setPaymentStep('form');
          }}
          className="mt-20 py-3 px-8 bg-white/10 dark:bg-white/5 hover:bg-white/20 rounded-2xl text-sm font-medium transition-all"
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
          <button onClick={() => setPaymentStep('form')} className="p-2 hover:bg-white/10 dark:bg-white/5 rounded-full transition-colors">
            <ArrowRight size={24} className="rotate-180" />
          </button>
          <span className="font-bold tracking-widest uppercase">{isGCash ? 'GCash' : 'Maya'}</span>
          <div className="w-10 h-10" />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 bg-sand-light dark:bg-[#0B1120] rounded-t-[40px] mt-4 p-8 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl ${isGCash ? 'bg-blue-600' : 'bg-[#00c07f]'} text-white`}>
              {isGCash ? <span className="text-3xl font-bold">G</span> : <span className="text-3xl font-bold">M</span>}
            </div>

            <p className="text-gray-400 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Paying To</p>
            <h3 className="text-2xl font-display font-bold text-ocean-deep dark:text-gray-200 mb-8">Parola Park (Presing Park)</h3>

            <div className="w-full bg-white dark:bg-[#1E293B] rounded-3xl p-6 shadow-sm border border-sand-muted dark:border-white/10 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 dark:text-gray-400">Total Amount</span>
                <span className="text-2xl font-display font-bold text-ocean-deep dark:text-gray-200">₱{total.toLocaleString()}</span>
              </div>
              <div className="border-t border-sand-muted dark:border-white/10 pt-4 flex justify-between items-center text-xs">
                <span className="text-gray-400 dark:text-gray-400">Transaction Fee</span>
                <span className="font-bold text-green-600">FREE</span>
              </div>
            </div>

            <div className="w-full mt-10 space-y-4">
              <div className="flex items-center gap-4 p-4 glass-card rounded-2xl">
                <Wallet size={20} className={isGCash ? 'text-blue-600' : 'text-green-600'} />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase font-bold tracking-widest">Payment Source</p>
                  <p className="text-sm font-bold text-ocean-deep dark:text-gray-200">{isGCash ? 'GCash Balance' : 'Maya Wallet'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase font-bold tracking-widest">Available</p>
                  <p className="text-sm font-bold text-ocean-deep dark:text-gray-200">₱5,240.50</p>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center text-[10px] text-gray-400 dark:text-gray-400 font-bold uppercase tracking-widest pt-4">
                <ShieldCheck size={14} className="text-green-500" />
                <span>Secure Payment Powered by {isGCash ? 'GCash' : 'Maya'}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 w-full">
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
        <button onClick={onBack} className="p-2 hover:bg-sand-muted dark:bg-[#1E293B] rounded-xl transition-colors">
          <Home size={20} className="text-ocean-deep dark:text-gray-200" />
        </button>
        <h2 className="text-3xl font-display font-bold text-ocean-deep dark:text-gray-200">Checkout</h2>
      </div>

      <div className="space-y-10">
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-400">Booking Summary</h3>

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 font-bold">Account</p>
              <p className="text-sm font-bold text-ocean-deep dark:text-gray-200">{user?.email || '—'}</p>
              {profile?.fullName && (
                <p className="text-xs text-gray-500 dark:text-gray-300">{profile.fullName}</p>
              )}
            </div>

            <div className="border-t border-sand-muted dark:border-white/10 pt-4 space-y-2">
              {cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-ocean-deep dark:text-gray-200 truncate">{item.name}</p>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-xs text-gray-500 dark:text-gray-300">x{item.quantity}</span>
                      )}
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 font-bold">{item.type}</p>
                  </div>
                  <p className="font-bold text-sunset-vibrant">₱{(item.price * (item.quantity || 1)).toLocaleString()}</p>
                </div>
              ))}

              {cart.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-300">Your cart is empty.</p>
              )}
            </div>

            <div className="border-t border-sand-muted dark:border-white/10 pt-4 flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-300 text-sm">Total</span>
              <span className="text-xl font-display font-bold text-ocean-deep dark:text-gray-200">₱{total.toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-400">Payment Method</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-3 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-ocean-deep bg-ocean-deep dark:bg-ocean-primary text-white' : 'border-sand-muted dark:border-white/10 text-gray-500 dark:text-gray-300'}`}
              >
                Card
              </button>
              <button 
                onClick={() => setPaymentMethod('ewallet')}
                className={`flex-1 py-3 rounded-xl border-2 transition-all ${paymentMethod === 'ewallet' ? 'border-ocean-deep bg-ocean-deep dark:bg-ocean-primary text-white' : 'border-sand-muted dark:border-white/10 text-gray-500 dark:text-gray-300'}`}
              >
                E-Wallet
              </button>
            </div>
          </div>

          {paymentMethod === 'card' ? (
            <div className="space-y-4 pt-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-400">Card Details</h3>
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
              <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-400">Select E-Wallet</h3>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setSelectedEWallet('gcash')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedEWallet === 'gcash' ? 'border-blue-500 bg-blue-50' : 'border-sand-muted dark:border-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">G</div>
                    <span className="font-bold text-ocean-deep dark:text-gray-200">GCash</span>
                  </div>
                  {selectedEWallet === 'gcash' && <CheckCircle2 size={20} className="text-blue-600" />}
                </button>
                <button 
                  onClick={() => setSelectedEWallet('maya')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedEWallet === 'maya' ? 'border-green-500 bg-green-50' : 'border-sand-muted dark:border-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">M</div>
                    <span className="font-bold text-ocean-deep dark:text-gray-200">Maya</span>
                  </div>
                  {selectedEWallet === 'maya' && <CheckCircle2 size={20} className="text-green-600" />}
                </button>
              </div>
              
              {selectedEWallet && (
                <div className="space-y-6 pt-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex p-1 bg-sand-muted dark:bg-[#1E293B]/50 rounded-xl">
                    <button 
                      onClick={() => setEwalletMode('number')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${ewalletMode === 'number' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-ocean-deep dark:text-gray-200' : 'text-gray-400 dark:text-gray-400'}`}
                    >
                      Number
                    </button>
                    <button 
                      onClick={() => setEwalletMode('scan')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${ewalletMode === 'scan' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-ocean-deep dark:text-gray-200' : 'text-gray-400 dark:text-gray-400'}`}
                    >
                      Scan QR
                    </button>
                  </div>

                  {ewalletMode === 'number' ? (
                    <input type="text" placeholder="Mobile Number (09xx...)" className="input-modern" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-4 bg-white dark:bg-[#1E293B] rounded-3xl border border-sand-muted dark:border-white/10 shadow-sm">
                      <div className="p-4 bg-sand-light dark:bg-[#0B1120] rounded-2xl border-2 border-dashed border-sand-muted dark:border-white/10">
                        <QrCode size={120} className={selectedEWallet === 'gcash' ? 'text-blue-600' : 'text-green-600'} />
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest text-center px-6">
                        Scan this QR code with your {selectedEWallet === 'gcash' ? 'GCash' : 'Maya'} app to pay ₱{total}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="pt-6 border-t border-sand-muted dark:border-white/10 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-300">Total Amount</span>
            <span className="text-3xl font-display font-bold text-ocean-deep dark:text-gray-200">₱{total.toLocaleString()}</span>
          </div>
          {emailStatusMessage && (
            <div className="glass-card rounded-2xl p-4 text-xs font-bold text-ocean-deep dark:text-gray-200">
              {emailStatusMessage}
            </div>
          )}
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

function SuccessScreen({ emailStatus, onHome }: { emailStatus: string | null, onHome: () => void }) {
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
          className="relative text-emerald-500 bg-white dark:bg-[#1E293B] p-8 rounded-[40px] shadow-2xl"
        >
          <CheckCircle2 size={100} strokeWidth={1.5} />
        </motion.div>
      </div>
      
      <div className="space-y-3">
        <h2 className="text-4xl font-display font-bold text-ocean-deep dark:text-gray-200">Success!</h2>
        <p className="text-gray-500 dark:text-gray-300 leading-relaxed">
          Your booking has been confirmed. See you at Parola Park!
        </p>
        {emailStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl"
          >
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {emailStatus}
            </p>
          </motion.div>
        )}
      </div>

      <button onClick={onHome} className="btn-luxury w-full max-w-[240px]">
        Return Home
      </button>
    </motion.div>
  );
}

function AdminScreen({ onLogout }: { onLogout: () => void }) {
  console.log('AdminScreen component rendered');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'bookings' | 'settings'>('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [receiptBooking, setReceiptBooking] = useState<any | null>(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'emailSent' | 'emailFailed' | 'ewallet' | 'card'>('all');
  const [userSearch, setUserSearch] = useState('');

  const toTimestampMs = (value: any): number | null => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const n = Number(value);
      if (!Number.isNaN(n)) return n;
      const d = Date.parse(value);
      if (!Number.isNaN(d)) return d;
      return null;
    }
    if (value && typeof value === 'object') {
      if (typeof value.seconds === 'number') return value.seconds * 1000;
      if (typeof value._seconds === 'number') return value._seconds * 1000;
    }
    return null;
  };

  const formatDateTime = (timestamp: any) => {
    const ms = toTimestampMs(timestamp);
    if (!ms) return '—';
    return `${new Date(ms).toLocaleDateString()} • ${new Date(ms).toLocaleTimeString()}`;
  };

  const normalizedSearch = bookingSearch.trim().toLowerCase();
  const filteredBookings = bookings
    .filter((b) => {
      if (!normalizedSearch) return true;
      const haystack = [
        b.receiptNo,
        b.bookingId,
        b.id,
        b.userEmail,
        b.customer?.fullName,
        b.customer?.phoneNumber,
        b.customer?.address,
        ...(Array.isArray(b.items) ? b.items.map((i: any) => i?.name) : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    })
    .filter((b) => {
      if (bookingFilter === 'all') return true;
      if (bookingFilter === 'emailSent') return b.email?.sent === true;
      if (bookingFilter === 'emailFailed') return b.email?.sent === false;
      if (bookingFilter === 'ewallet') return (b.payment?.method || b.paymentMethod) === 'ewallet';
      if (bookingFilter === 'card') return (b.payment?.method || b.paymentMethod) === 'card';
      return true;
    })
    .sort((a, b) => (toTimestampMs(b.timestamp) || 0) - (toTimestampMs(a.timestamp) || 0));

  const bookingCountByUserId = bookings.reduce((acc: Record<string, number>, b: any) => {
    if (!b?.userId) return acc;
    acc[b.userId] = (acc[b.userId] || 0) + 1;
    return acc;
  }, {});

  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const filteredUsers = users
    .filter((u) => {
      if (!normalizedUserSearch) return true;
      const haystack = [u.fullName, u.email, u.phoneNumber, u.address, u.uid]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedUserSearch);
    })
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

  const csvValue = (value: any) => {
    if (value === null || value === undefined) return '';
    const s = String(value);
    const escaped = s.replace(/"/g, '""');
    if (/[",\n\r]/.test(escaped)) return `"${escaped}"`;
    return escaped;
  };

  const toCsv = (headers: string[], rows: any[][]) => {
    const lines = [headers, ...rows].map((row) => row.map(csvValue).join(','));
    return lines.join('\r\n');
  };

  const downloadCsv = (filename: string, headers: string[], rows: any[][]) => {
    const csv = `\uFEFF${toCsv(headers, rows)}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const toIso = (timestamp: any) => {
    const ms = toTimestampMs(timestamp);
    if (!ms) return '';
    return new Date(ms).toISOString();
  };

  const exportBookingsCsv = () => {
    const headers = [
      'receiptNo',
      'bookingId',
      'createdAt',
      'userEmail',
      'customerName',
      'customerPhone',
      'customerAddress',
      'paymentMethod',
      'paymentProvider',
      'status',
      'total',
      'items',
      'emailSent',
      'emailProvider',
      'emailError',
    ];

    const rows = filteredBookings.map((b) => {
      const items = Array.isArray(b.items) ? b.items : [];
      const itemsLabel = items.map((i: any) => `${i?.name ?? ''}${typeof i?.price === 'number' ? ` (${i.price})` : ''}`).join(' | ');
      return [
        b.receiptNo || '',
        b.bookingId || b.id || '',
        toIso(b.timestamp),
        b.userEmail || b.customer?.email || '',
        b.customer?.fullName || '',
        b.customer?.phoneNumber || '',
        b.customer?.address || '',
        b.payment?.method || b.paymentMethod || '',
        b.payment?.provider || '',
        b.status || '',
        b.total ?? '',
        itemsLabel,
        b.email?.sent === true ? 'true' : b.email?.sent === false ? 'false' : '',
        b.email?.provider || '',
        b.email?.errorMessage || '',
      ];
    });

    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`bookings-${date}.csv`, headers, rows);
  };

  const exportUsersCsv = () => {
    const headers = [
      'uid',
      'fullName',
      'email',
      'phoneNumber',
      'address',
      'profileComplete',
      'bookingsCount',
      'createdAt',
      'updatedAt',
    ];

    const rows = filteredUsers.map((u) => [
      u.uid || '',
      u.fullName || '',
      u.email || '',
      u.phoneNumber || '',
      u.address || '',
      u.profileComplete ? 'true' : 'false',
      bookingCountByUserId[u.uid] || 0,
      toIso(u.createdAt),
      toIso(u.updatedAt),
    ]);

    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`users-${date}.csv`, headers, rows);
  };

  useEffect(() => {
    // Load users and bookings data
    const loadData = async () => {
      try {
        const usersRef = ref(db, 'users');
        onValue(usersRef, (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            setUsers([]);
            return;
          }

          const list = Object.keys(data).map((uid) => {
            const userNode = data[uid] || {};
            const profile = userNode.profile || {};
            return {
              uid,
              email: profile.email || userNode.email || null,
              fullName: profile.fullName || null,
              phoneNumber: profile.phoneNumber || null,
              address: profile.address || null,
              profileComplete: Boolean(profile.profileComplete),
              createdAt: profile.createdAt || null,
              updatedAt: profile.updatedAt || null,
            };
          });

          setUsers(list);
        });

        // Load bookings
        const bookingsRef = ref(db, 'bookings');
        const bookingsQuery = query(bookingsRef, orderByChild('timestamp'));
        onValue(bookingsQuery, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const bookingsList = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            })).reverse(); // Most recent first
            setBookings(bookingsList);
          }
        });
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    loadData();
  }, []);

  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.total || 0), 0);
  const totalBookings = bookings.length;
  const uniqueUsers = new Set(bookings.map(b => b.userId)).size;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-sand-light dark:bg-[#0B1120]"
    >
      {/* Admin Header */}
      <div className="p-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-display font-bold text-ocean-deep dark:text-gray-200">Admin Dashboard</h2>
          <button onClick={onLogout} className="p-2 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-2 group">
            <span className="text-xs font-bold uppercase tracking-widest text-red-500 group-hover:text-red-600 transition-colors">Logout</span>
            <LogOut size={20} className="text-red-500 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
        
        <div className="p-6 glass-card rounded-[32px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ocean-primary to-sunset-vibrant" />
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ocean-deep to-sunset-vibrant text-white flex items-center justify-center text-3xl font-display font-bold shadow-xl shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-display font-bold text-ocean-deep dark:text-gray-200">Administrator</h3>
              <p className="text-gray-500 dark:text-gray-300 text-xs mb-2">{ADMIN_EMAIL}</p>
              <span className="px-2 py-0.5 bg-sunset-vibrant/10 text-sunset-vibrant text-[10px] font-bold rounded-full uppercase tracking-wider">Admin Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 flex gap-4 mb-6 overflow-x-auto">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: <Home size={16} /> },
          { key: 'users', label: 'Users', icon: <User size={16} /> },
          { key: 'bookings', label: 'Bookings', icon: <Calendar size={16} /> },
          { key: 'settings', label: 'Settings', icon: <Settings size={16} /> }
        ].map((tab) => (
          <button 
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.key 
                ? 'bg-ocean-deep dark:bg-ocean-primary text-white shadow-lg' 
                : 'text-gray-400 dark:text-gray-400 hover:text-ocean-deep dark:text-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 relative">
        <AnimatePresence>
          {receiptBooking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[200] bg-ocean-deep dark:bg-ocean-primary/90 backdrop-blur-md p-4 sm:p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-display font-bold text-white capitalize">receipt</h3>
                <button
                  onClick={() => setReceiptBooking(null)}
                  className="p-2 bg-white/10 dark:bg-white/5 rounded-xl text-white hover:bg-white/20 transition-colors"
                >
                  <ArrowRight size={24} className="rotate-180" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto flex justify-center">
                <ReceiptCard booking={receiptBooking} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 glass-card rounded-2xl text-center">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1">Total Revenue</p>
                  <p className="text-xl font-bold text-sunset-vibrant">₱{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-5 glass-card rounded-2xl text-center">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1">Total Bookings</p>
                  <p className="text-xl font-bold text-ocean-deep dark:text-gray-200">{totalBookings}</p>
                </div>
                <div className="p-5 glass-card rounded-2xl text-center">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1">Unique Users</p>
                  <p className="text-xl font-bold text-ocean-primary">{uniqueUsers}</p>
                </div>
                <div className="p-5 glass-card rounded-2xl text-center">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1">Avg. Booking</p>
                  <p className="text-xl font-bold text-sunset-soft">₱{totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0}</p>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400 px-2">Recent Bookings</h4>
                {bookings.slice(0, 5).map((booking) => (
                  <button key={booking.id} onClick={() => setReceiptBooking(booking)} className="w-full text-left p-4 glass-card rounded-2xl space-y-3 hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-ocean-deep dark:text-gray-200">{booking.receiptNo || booking.id}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-300 font-bold">{booking.userEmail || 'Guest'}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-400">
                          {formatDateTime(booking.timestamp)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-ocean-primary">₱{(booking.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {booking.payment?.method && (
                        <span className="px-2 py-0.5 bg-ocean-primary/10 rounded text-[10px] text-ocean-primary font-bold uppercase tracking-wider">{booking.payment.method}</span>
                      )}
                      {booking.payment?.provider && (
                        <span className="px-2 py-0.5 bg-sand-muted dark:bg-[#1E293B] rounded text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">{booking.payment.provider}</span>
                      )}
                      {booking.email?.sent === true && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Email Sent</span>
                      )}
                      {booking.email?.sent === false && (
                        <span className="px-2 py-0.5 bg-red-500/10 rounded text-[10px] text-red-600 font-bold uppercase tracking-wider">Email Failed</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {booking.items?.slice(0, 6).map((item: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-sand-muted dark:bg-[#1E293B] rounded text-[10px] text-gray-600 dark:text-gray-300">{item.name}</span>
                      ))}
                      {booking.items?.length > 6 && (
                        <span className="px-2 py-0.5 bg-sand-muted dark:bg-[#1E293B] rounded text-[10px] text-gray-600 dark:text-gray-300">+{booking.items.length - 6} more</span>
                      )}
                    </div>
                  </button>
                ))}
                {bookings.length === 0 && (
                  <div className="text-center py-20 opacity-50">
                    <Calendar size={40} className="mx-auto mb-4 text-gray-400 dark:text-gray-400" />
                    <p className="text-sm">No bookings yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400">User Management</h4>
                <button onClick={exportUsersCsv} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/60 hover:bg-white/80 dark:bg-[#0B1120]/90 text-ocean-deep dark:text-gray-200 transition-all flex items-center gap-2">
                  <Download size={16} />
                  Export CSV
                </button>
              </div>

              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name, email, phone..."
                className="input-modern"
              />

              {filteredUsers.map((u) => (
                <div key={u.uid} className="p-4 glass-card rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ocean-deep dark:text-gray-200 truncate">{u.fullName || u.email || u.uid}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-300 font-bold truncate">{u.email || '—'}</p>
                      {(u.phoneNumber || u.address) && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-400 truncate">{[u.phoneNumber, u.address].filter(Boolean).join(' • ')}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400">Bookings</p>
                      <p className="text-sm font-bold text-ocean-primary">{bookingCountByUserId[u.uid] || 0}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {u.profileComplete && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Profile Complete</span>
                    )}
                    {!u.profileComplete && (
                      <span className="px-2 py-0.5 bg-sand-muted dark:bg-[#1E293B] rounded text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">Profile Incomplete</span>
                    )}
                    {u.updatedAt && (
                      <span className="px-2 py-0.5 bg-white/60 rounded text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">Updated {formatDateTime(u.updatedAt)}</span>
                    )}
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-20 opacity-50">
                  <User size={40} className="mx-auto mb-4 text-gray-400 dark:text-gray-400" />
                  <p className="text-sm">No users found</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'bookings' && (
            <motion.div 
              key="bookings"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400">All Bookings</h4>
                <button onClick={exportBookingsCsv} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/60 hover:bg-white/80 dark:bg-[#0B1120]/90 text-ocean-deep dark:text-gray-200 transition-all flex items-center gap-2">
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search receipt, email, name, phone, items..."
                  className="input-modern"
                />
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'emailSent', label: 'Email Sent' },
                    { key: 'emailFailed', label: 'Email Failed' },
                    { key: 'ewallet', label: 'E-Wallet' },
                    { key: 'card', label: 'Card' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setBookingFilter(f.key as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                        bookingFilter === (f.key as any)
                          ? 'bg-ocean-deep dark:bg-ocean-primary text-white shadow-lg'
                          : 'text-gray-400 dark:text-gray-400 hover:text-ocean-deep dark:text-gray-200 bg-white/60'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredBookings.map((booking) => (
                <button key={booking.id} onClick={() => setReceiptBooking(booking)} className="w-full text-left p-4 glass-card rounded-2xl space-y-3 border-l-4 border-sunset-vibrant hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-ocean-deep dark:text-gray-200">{booking.receiptNo || booking.id}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-300 font-bold">{booking.userEmail || 'Guest'}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> {formatDateTime(booking.timestamp)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-ocean-primary">₱{(booking.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.customer?.fullName && (
                      <span className="px-2 py-0.5 bg-sand-muted dark:bg-[#1E293B] rounded text-[10px] text-gray-600 dark:text-gray-300 font-bold">{booking.customer.fullName}</span>
                    )}
                    {booking.payment?.method && (
                      <span className="px-2 py-0.5 bg-ocean-primary/10 rounded text-[10px] text-ocean-primary font-bold uppercase tracking-wider">{booking.payment.method}</span>
                    )}
                    {booking.payment?.provider && (
                      <span className="px-2 py-0.5 bg-sand-muted dark:bg-[#1E293B] rounded text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">{booking.payment.provider}</span>
                    )}
                    {booking.status && (
                      <span className="px-2 py-0.5 bg-sunset-vibrant/10 rounded text-[10px] text-sunset-vibrant font-bold uppercase tracking-wider">{booking.status}</span>
                    )}
                    {booking.email?.sent === true && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Email Sent</span>
                    )}
                    {booking.email?.sent === false && (
                      <span className="px-2 py-0.5 bg-red-500/10 rounded text-[10px] text-red-600 font-bold uppercase tracking-wider">Email Failed</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.items?.slice(0, 10).map((item: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-sand-muted dark:bg-[#1E293B] rounded text-[10px] text-gray-600 dark:text-gray-300">
                        {item.name}
                        {item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ''}
                      </span>
                    ))}
                    {booking.items?.length > 10 && (
                      <span className="px-2 py-0.5 bg-sand-muted dark:bg-[#1E293B] rounded text-[10px] text-gray-600 dark:text-gray-300">+{booking.items.length - 10} more</span>
                    )}
                  </div>
                </button>
              ))}
              {filteredBookings.length === 0 && (
                <div className="text-center py-20 opacity-50">
                  <Calendar size={40} className="mx-auto mb-4 text-gray-400 dark:text-gray-400" />
                  <p className="text-sm">No bookings found</p>
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
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-400 px-2">Admin Settings</h4>
              <div className="space-y-4">
                <div className="p-4 glass-card rounded-2xl">
                  <p className="text-sm font-bold text-ocean-deep dark:text-gray-200 mb-2">System Status</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">All systems operational</p>
                </div>
                <div className="p-4 glass-card rounded-2xl">
                  <p className="text-sm font-bold text-ocean-deep dark:text-gray-200 mb-2">Database</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">Firebase Realtime Database connected</p>
                </div>
                <div className="p-4 glass-card rounded-2xl">
                  <p className="text-sm font-bold text-ocean-deep dark:text-gray-200 mb-2">Authentication</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">Firebase Auth active</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
