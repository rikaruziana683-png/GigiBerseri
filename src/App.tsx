import React, { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Plus,
  User,
  Activity,
  Stethoscope,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Lock,
  Sparkles,
  RefreshCw,
  PenTool,
  CheckCircle2,
  Clock,
  Heart,
  Play,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import SignatureCanvas from 'react-signature-canvas';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from './lib/utils';
import { DIAGNOSIS_DATA, Patient, AIAnalysisResult } from './types';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  FirebaseUser,
  Timestamp
} from './lib/firebase';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Ups! Terjadi Kesalahan</h2>
            <p className="text-gray-600 text-sm">
              {this.state.error?.message || "Terjadi kesalahan yang tidak terduga dalam aplikasi."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// Mock Data
const MOCK_STATS = [];

const MOCK_PATIENTS: Patient[] = [];

const EDUCATION_ITEMS = [
  { 
    title: 'Teknik Menyikat Gigi Bass', 
    desc: 'Gunakan metode Bass untuk membersihkan saku gusi secara efektif. Arahkan bulu sikat 45 derajat ke arah gusi.', 
    icon: Activity, 
    color: 'bg-blue-500',
    infographic: 'https://picsum.photos/seed/bass/800/1200'
  },
  { 
    title: 'Pentingnya Dental Flossing', 
    desc: 'Membersihkan sela gigi yang tidak terjangkau oleh sikat gigi. Lakukan minimal sekali sehari sebelum tidur.', 
    icon: ShieldCheck, 
    color: 'bg-purple-500',
    infographic: 'https://picsum.photos/seed/floss/800/1200'
  },
  { 
    title: 'Diet Rendah Gula & Karies', 
    desc: 'Kurangi konsumsi makanan manis dan lengket untuk mencegah pembentukan asam oleh bakteri karies.', 
    icon: Stethoscope, 
    color: 'bg-orange-500',
    infographic: 'https://picsum.photos/seed/sugar/800/1200'
  },
  { 
    title: 'Kesehatan Gusi (Gingiva)', 
    desc: 'Gusi sehat berwarna merah muda, kenyal, dan tidak mudah berdarah saat menyikat gigi.', 
    icon: Heart, 
    color: 'bg-rose-500',
    infographic: 'https://picsum.photos/seed/gum/800/1200'
  },
  { 
    title: 'Cara Menyikat Gigi yang Benar', 
    desc: 'Video tutorial langkah-langkah menyikat gigi yang efektif untuk menjaga kebersihan mulut.', 
    icon: Activity, 
    color: 'bg-emerald-500',
    videoUrl: 'https://www.youtube.com/embed/B6JnZt7NA5c',
    infographic: 'https://picsum.photos/seed/brushing/800/1200'
  },
  { 
    title: 'Edukasi Kesehatan Gigi & Mulut', 
    desc: 'Informasi penting mengenai cara merawat gigi agar tetap sehat dan kuat sepanjang hari.', 
    icon: ShieldCheck, 
    color: 'bg-cyan-500',
    videoUrl: 'https://www.youtube.com/embed/wAjnJ0sGF3Q',
    infographic: 'https://picsum.photos/seed/dental-health/800/1200'
  },
  { 
    title: 'Pencegahan Gigi Berlubang', 
    desc: 'Memahami proses terjadinya karies dan langkah-langLxah untuk mencegah kerusakan gigi.', 
    icon: Stethoscope, 
    color: 'bg-amber-500',
    videoUrl: 'https://www.youtube.com/embed/bTwh-7hvrKI',
    infographic: 'https://picsum.photos/seed/cavity-prev/800/1200'
  },
];

// Components
const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean, key?: string }) => (
  <Link 
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-pink-500 text-white shadow-lg shadow-pink-200" 
        : "text-pink-400 hover:bg-pink-50 hover:text-pink-600"
    )}
  >
    <Icon size={20} className={cn("transition-transform group-hover:scale-110", active ? "text-white" : "text-pink-400")} />
    <span className="font-medium">{label}</span>
  </Link>
);

const EducationModal = ({ item, onClose, onNext, onPrev }: { item: any, onClose: () => void, onNext: () => void, onPrev: () => void }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-pink-50/30">
          <div>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">{item.title}</h3>
            <p className="text-sm text-pink-500 font-bold uppercase tracking-widest mt-1">Materi Edukasi Pasien</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button onClick={onPrev} className="p-2 bg-white rounded-full shadow-sm hover:bg-pink-50 text-pink-500 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={onNext} className="p-2 bg-white rounded-full shadow-sm hover:bg-pink-50 text-pink-500 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm ml-4">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {item.type === 'video' ? (
            <div className="aspect-video rounded-3xl overflow-hidden bg-black shadow-inner">
              <iframe 
                width="100%" 
                height="100%" 
                src={item.videoUrl} 
                title="Dental Education Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="rounded-3xl overflow-hidden border border-pink-100 shadow-lg">
                <img 
                  src={item.infographic} 
                  alt="Infographic" 
                  className="w-full h-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="bg-pink-50/30 p-8 rounded-3xl border border-pink-100">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Ringkasan Materi</h4>
                <p className="text-gray-600 leading-relaxed text-justify">
                  {item.desc} Materi ini dirancang untuk membantu pasien memahami pentingnya perawatan mandiri di rumah guna mendukung keberhasilan asuhan kesehatan gigi dan mulut yang diberikan oleh terapis.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50 flex justify-between items-center">
          <div className="flex gap-4">
            <button 
              onClick={onPrev}
              className="px-6 py-3 bg-white text-gray-600 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <ChevronLeft size={18} /> Materi Sebelumnya
            </button>
            <button 
              onClick={onNext}
              className="px-6 py-3 bg-white text-gray-600 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              Materi Selanjutnya <ChevronRight size={18} />
            </button>
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all"
          >
            Selesai Membaca
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Login = ({ onLogin }: { onLogin: (role: string, user?: FirebaseUser) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const generateCaptcha = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = (role: string) => {
    if (!username || !password) {
      setError('Username dan Password wajib diisi!');
      return;
    }
    if (captchaInput !== captcha) {
      setError('Captcha tidak valid!');
      generateCaptcha();
      return;
    }
    onLogin(role);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore, if not create
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let role = 'Terapis Gigi'; // Default role
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: role,
          createdAt: Timestamp.now()
        });
      } else {
        role = userDoc.data().role;
      }
      
      onLogin(role, user);
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError('Gagal masuk dengan Google. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-2xl shadow-pink-200 w-full max-w-md border border-pink-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200 mb-4">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-black text-pink-600">GigiBerseri</h1>
          <p className="text-gray-500 text-sm">Sistem Asuhan Kesehatan Gigi & Mulut</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl border-pink-100 focus:ring-pink-500 focus:border-pink-500 bg-pink-50/30" 
              placeholder="admin / dokter / terapis" 
            />
          </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-xl border-pink-100 focus:ring-pink-500 focus:border-pink-500 bg-pink-50/30 pr-10" 
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-300 hover:text-pink-500"
                >
                  <Lock size={16} />
                </button>
              </div>
            </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Captcha</label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 bg-pink-100 rounded-xl flex items-center justify-center font-mono font-bold text-pink-600 tracking-widest select-none py-2 border-2 border-dashed border-pink-200 italic">
                {captcha}
              </div>
              <button 
                onClick={generateCaptcha}
                className="p-2 text-pink-500 hover:bg-pink-50 rounded-xl transition-colors"
                title="Refresh Captcha"
              >
                <RefreshCw size={20} />
              </button>
            </div>
            <input 
              type="text" 
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              className="w-full p-3 rounded-xl border-pink-100 focus:ring-pink-500 focus:border-pink-500 bg-pink-50/30" 
              placeholder="Masukkan kode di atas" 
            />
            {error && <p className="text-red-500 text-xs mt-1 font-bold">{error}</p>}
          </div>
          
          <div className="pt-4 space-y-2">
            <button 
              onClick={() => handleLogin('Admin')}
              className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all"
            >
              Masuk sebagai Admin
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleLogin('Dokter Gigi')} className="py-2 bg-white border border-pink-200 text-pink-500 rounded-xl text-xs font-bold hover:bg-pink-50">Dokter Gigi</button>
              <button onClick={() => handleLogin('Terapis Gigi')} className="py-2 bg-white border border-pink-200 text-pink-500 rounded-xl text-xs font-bold hover:bg-pink-50">Terapis Gigi</button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400 font-bold">Atau</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw size={20} className="animate-spin text-pink-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Masuk dengan Google
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Sesuai Standar WHO & Kemenkes RI • 2026
        </p>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ patients, user }: { patients: Patient[], user: FirebaseUser | null }) => (
  <div className="space-y-6">
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Utama</h1>
        <p className="text-gray-500">Selamat datang kembali, {user?.displayName || 'Pengguna'}</p>
      </div>
      <div className="flex gap-3">
        <button className="p-2 bg-white rounded-full shadow-sm text-pink-500 hover:bg-pink-50 transition-colors">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-pink-100">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold">
              {(user?.displayName || 'U')[0]}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700">{user?.displayName || 'Pengguna'}</span>
        </div>
      </div>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Total Pasien', value: patients.length.toLocaleString(), icon: Users, color: 'bg-blue-500' },
        { label: 'Kunjungan Hari Ini', value: '0', icon: Calendar, color: 'bg-pink-500' },
        { label: 'Rata-rata DMF-T', value: '0.0', icon: Activity, color: 'bg-purple-500' },
        { label: 'Follow-up', value: '0', icon: Bell, color: 'bg-orange-500' },
      ].map((stat, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-pink-50 flex items-center gap-4"
        >
          <div className={cn("p-3 rounded-xl text-white", stat.color)}>
            <stat.icon size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
          </div>
        </motion.div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-pink-50">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Tren DMF-T & OHI-S</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_STATS}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="dmft" stroke="#ec4899" strokeWidth={3} dot={{ r: 6, fill: '#ec4899' }} activeDot={{ r: 8 }} name="DMF-T" />
              <Line type="monotone" dataKey="ohis" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6, fill: '#8b5cf6' }} activeDot={{ r: 8 }} name="OHI-S" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-50">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Bell size={20} className="text-pink-500" />
          Notifikasi Follow-up
        </h3>
        <div className="space-y-4">
          {[].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-pink-50/50 border border-pink-100">
              <div className="flex justify-between items-start mb-1">
                <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                <span className="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full">{item.date}</span>
              </div>
              <p className="text-xs text-gray-500">{item.task}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-50">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Antrian Pasien Hari Ini</h3>
        <button className="text-pink-500 text-sm font-bold hover:underline">Lihat Semua</button>
      </div>
      <div className="space-y-4">
        {patients.slice(0, 5).map((patient, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-pink-50 transition-colors border border-transparent hover:border-pink-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                {patient.name[0]}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{patient.name}</h4>
                <p className="text-xs text-gray-500">{patient.medicalRecordNumber} • {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">09:00 AM</p>
                <p className="text-xs text-pink-500 font-medium">Pemeriksaan Rutin</p>
              </div>
              <Link to={`/patient/${patient.id}`} className="p-2 text-gray-400 hover:text-pink-500">
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PatientList = ({ patients, onAddPatient }: { patients: Patient[], onAddPatient: (p: Patient) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    gender: 'L',
    maritalStatus: 'Belum Menikah',
    incomeRange: '0-2jt',
    insuranceType: 'BPJS',
    importanceLevel: 'Cukup'
  });

  const handleSave = () => {
    if (!newPatient.name || !newPatient.nik) {
      alert('Nama dan NIK wajib diisi!');
      return;
    }
    const patient: Patient = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPatient.name || '',
      nik: newPatient.nik || '',
      medicalRecordNumber: `RM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      birthDate: newPatient.birthDate || new Date().toISOString().split('T')[0],
      gender: newPatient.gender as 'L' | 'P',
      address: newPatient.address || 'Alamat belum diisi',
      phone: newPatient.phone || '08123456789',
      insurance: newPatient.insurance || 'BPJS Kesehatan',
      insuranceType: newPatient.insuranceType as 'BPJS' | 'Swasta' | 'Mandiri',
      occupation: newPatient.occupation || 'Karyawan',
      education: newPatient.education || 'SMA',
      maritalStatus: newPatient.maritalStatus as any,
      incomeRange: newPatient.incomeRange as any,
      recreationalActivities: newPatient.recreationalActivities || 'Membaca',
      importanceLevel: newPatient.importanceLevel as any
    };
    onAddPatient(patient);
    setShowModal(false);
    setNewPatient({
      gender: 'L',
      maritalStatus: 'Belum Menikah',
      incomeRange: '0-2jt',
      insuranceType: 'BPJS',
      importanceLevel: 'Cukup'
    });
  };
  
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Master Pasien</h1>
          <p className="text-gray-500">Kelola informasi identitas dan sosial pasien</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all"
        >
          <Plus size={20} />
          Tambah Pasien Baru
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Cari berdasarkan Nama, NIK, atau No. Rekam Medis..." 
          className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700 placeholder:text-gray-400"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-pink-50 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-pink-50 text-pink-600 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">No. RM</th>
              <th className="px-6 py-4">Nama Lengkap</th>
              <th className="px-6 py-4">Status Sosial</th>
              <th className="px-6 py-4">Jenis Kelamin</th>
              <th className="px-6 py-4">Asuransi</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-50">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-pink-50/30 transition-colors group">
                <td className="px-6 py-4 font-mono text-sm text-pink-600 font-bold">{patient.medicalRecordNumber}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{patient.name}</div>
                  <div className="text-xs text-gray-500">{patient.nik}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700 font-medium">{patient.maritalStatus || 'Menikah'}</div>
                  <div className="text-xs text-gray-500">Inc: {patient.incomeRange || '2-5jt'}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase",
                    patient.insuranceType === 'Swasta' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {patient.insuranceType || 'BPJS'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/patient/${patient.id}`} className="text-pink-500 font-bold hover:underline text-sm">
                    Detail Rekam Medis
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Pasien (Simplified) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Registrasi Pasien Baru</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-pink-50 rounded-full text-gray-400">
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-pink-500 uppercase tracking-widest">Identitas Dasar</h3>
                  <input 
                    type="text" 
                    placeholder="Nama Lengkap" 
                    value={newPatient.name || ''}
                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                    className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/30" 
                  />
                  <input 
                    type="text" 
                    placeholder="NIK" 
                    value={newPatient.nik || ''}
                    onChange={(e) => setNewPatient({...newPatient, nik: e.target.value})}
                    className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/30" 
                  />
                  <div className="flex gap-4">
                    <select 
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({...newPatient, gender: e.target.value as any})}
                      className="flex-1 p-3 rounded-xl border-pink-100 bg-pink-50/30"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                    <input 
                      type="date" 
                      value={newPatient.birthDate || ''}
                      onChange={(e) => setNewPatient({...newPatient, birthDate: e.target.value})}
                      className="flex-1 p-3 rounded-xl border-pink-100 bg-pink-50/30" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-pink-500 uppercase tracking-widest">Riwayat Sosial & Ekonomi</h3>
                  <select 
                    value={newPatient.maritalStatus}
                    onChange={(e) => setNewPatient({...newPatient, maritalStatus: e.target.value as any})}
                    className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/30"
                  >
                    <option value="Belum Menikah">Belum Menikah</option>
                    <option value="Menikah">Menikah</option>
                    <option value="Janda/Duda">Janda/Duda</option>
                  </select>
                  <select 
                    value={newPatient.incomeRange}
                    onChange={(e) => setNewPatient({...newPatient, incomeRange: e.target.value as any})}
                    className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/30"
                  >
                    <option value="0-2jt">0-2jt</option>
                    <option value="2-5jt">2-5jt</option>
                    <option value="5-10jt">5-10jt</option>
                    <option value=">10jt">{'>'}10jt</option>
                  </select>
                  <select 
                    value={newPatient.insuranceType}
                    onChange={(e) => setNewPatient({...newPatient, insuranceType: e.target.value as any})}
                    className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/30"
                  >
                    <option value="BPJS">BPJS</option>
                    <option value="Swasta">Swasta</option>
                    <option value="Mandiri">Mandiri</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-black text-pink-500 uppercase tracking-widest">Gaya Hidup</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Aktivitas Rekreasi" 
                      value={newPatient.recreationalActivities || ''}
                      onChange={(e) => setNewPatient({...newPatient, recreationalActivities: e.target.value})}
                      className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/30" 
                    />
                    <select 
                      value={newPatient.importanceLevel}
                      onChange={(e) => setNewPatient({...newPatient, importanceLevel: e.target.value as any})}
                      className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/30"
                    >
                      <option value="Sangat Penting">Sangat Penting</option>
                      <option value="Penting">Penting</option>
                      <option value="Cukup">Cukup</option>
                      <option value="Kurang">Kurang</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-6 py-3 text-gray-500 font-bold">Batal</button>
                <button onClick={handleSave} className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200">Simpan Pasien</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EducationPage = () => {
  const [showEduDetail, setShowEduDetail] = useState<any>(null);

  const handleNext = () => {
    const currentIndex = EDUCATION_ITEMS.findIndex(i => i.title === showEduDetail.title);
    const nextIdx = (currentIndex + 1) % EDUCATION_ITEMS.length;
    setShowEduDetail({ ...EDUCATION_ITEMS[nextIdx], type: showEduDetail.type || 'infographic' });
  };

  const handlePrev = () => {
    const currentIndex = EDUCATION_ITEMS.findIndex(i => i.title === showEduDetail.title);
    const prevIdx = (currentIndex - 1 + EDUCATION_ITEMS.length) % EDUCATION_ITEMS.length;
    setShowEduDetail({ ...EDUCATION_ITEMS[prevIdx], type: showEduDetail.type || 'infographic' });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Edukasi Pasien</h1>
        <p className="text-gray-500">Materi edukasi kesehatan gigi dan mulut untuk pasien GigiBerseri</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {EDUCATION_ITEMS.map((item, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -10 }}
            onClick={() => setShowEduDetail({ ...item, type: 'infographic' })}
            className="p-8 bg-white rounded-[32px] border border-pink-50 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform", item.color)}>
              <item.icon size={28} />
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h4>
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{item.desc}</p>
            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowEduDetail({ ...item, type: 'infographic' }); }}
                className="flex-1 py-2 bg-pink-50 text-pink-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all flex items-center justify-center gap-1"
              >
                <BookOpen size={14} /> Baca
              </button>
              {item.videoUrl && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowEduDetail({ ...item, type: 'video' }); }}
                  className="flex-1 py-2 bg-pink-50 text-pink-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all flex items-center justify-center gap-1"
                >
                  <Play size={14} /> Tonton
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showEduDetail && (
          <EducationModal 
            item={showEduDetail} 
            onClose={() => setShowEduDetail(null)} 
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminManagement = () => {
  const admins = [
    { name: 'Drg. Rika', role: 'Super Admin', email: 'rika@gigiberseri.com', status: 'Online' },
    { name: 'Sarah Admin', role: 'Administrator', email: 'sarah@gigiberseri.com', status: 'Offline' },
    { name: 'Andi TGM', role: 'TGM Admin', email: 'andi@gigiberseri.com', status: 'Online' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Admin & Studio TGM</h1>
          <p className="text-gray-500">Daftar personil yang memiliki hak akses sistem</p>
        </div>
        <button className="flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all">
          <Plus size={20} />
          Tambah Admin
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {admins.map((admin, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className={cn(
                "w-2 h-2 rounded-full",
                admin.status === 'Online' ? "bg-green-500 animate-pulse" : "bg-gray-300"
              )} />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl">
                {admin.name[0]}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{admin.name}</h4>
                <p className="text-xs text-pink-500 font-bold">{admin.role}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FileText size={14} /> {admin.email}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={14} /> Akses Studio TGM: <span className="text-green-600 font-bold">Aktif</span>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="flex-1 py-2 bg-pink-50 text-pink-500 rounded-xl text-xs font-bold hover:bg-pink-500 hover:text-white transition-all">Edit Akses</button>
              <button className="p-2 text-gray-400 hover:text-red-500 rounded-xl"><X size={18} /></button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-pink-500 p-8 rounded-3xl text-white flex items-center justify-between shadow-xl shadow-pink-200">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Sparkles size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black">AI Studio TGM Integration</h3>
            <p className="text-pink-100 text-sm">Sistem terhubung dengan Google AI Studio untuk analisis asuhan kesehatan gigi otomatis.</p>
          </div>
        </div>
        <button 
          onClick={async () => {
            if (window.aistudio) {
              await window.aistudio.openSelectKey();
            } else {
              alert('Fitur ini hanya tersedia di lingkungan AI Studio.');
            }
          }}
          className="px-6 py-3 bg-white text-pink-500 rounded-xl font-bold shadow-lg hover:bg-pink-50 transition-all"
        >
          Konfigurasi AI
        </button>
      </div>
    </div>
  );
};

const DentalRecord = ({ patients, records, onSaveRecord }: { patients: Patient[], records: Record<string, any>, onSaveRecord: (id: string, data: any) => void }) => {
  const { id } = useParams();
  const patient = patients.find(p => p.id === id);
  
  const [teethState, setTeethState] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState('pengkajian');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [nextVisit, setNextVisit] = useState('');
  const [nextVisitTime, setNextVisitTime] = useState('09:00');

  // Anamnesis State
  const [anamnesis, setAnamnesis] = useState({
    keluhanUtama: '',
    penyakitSekarang: '',
    penyakitDahulu: '',
    alergi: '',
    obat: '',
    kebiasaanBuruk: ''
  });

  // Clinical State
  const [clinical, setClinical] = useState({
    extraOral: {
      limfe: 'Normal',
      tmj: 'Normal',
      wajah: 'Normal'
    },
    intraOral: {
      gingiva: 'Sehat',
      mukosa: 'Sehat',
      lidah: 'Sehat',
      plak: 'Sehat'
    },
    indices: {
      dmft: '0',
      ohis: '0.0',
      cpitn: '0',
      plaque: '0%'
    },
    masalahLain: ''
  });

  // Health History State
  const [healthHistory, setHealthHistory] = useState({
    medical: {
      sehat: false,
      sakitSerius: '',
      pembekuanDarah: '',
      alergi: { makanan: '', obatSuntik: '', obatObatan: '', cuaca: '', lainLain: '' }
    },
    pharmacological: {
      q1: '', q2: '', q3: '', q4: '', q5: ''
    },
    social: ''
  });

  // Dental History State
  const [dentalHistory, setDentalHistory] = useState({
    part1: { 
      reason: '', 
      knowledge: [] as string[], 
      xRay: { ans: '', type: '' }, 
      complication: { ans: '', detail: '' },
      previousVisitOpinion: '',
      healthImpactOpinion: '',
      symptoms: [] as string[],
      grinding: { ans: '', biteGuard: '' },
      appearanceConcern: { ans: '', details: [] as string[] },
      injury: { ans: '', detail: '' },
      treatments: [] as string[]
    },
    part2: { 
      tools: [] as string[], 
      toothpaste: [] as string[], 
      brushTime: '', 
      flossTime: '',
      brushFreq: { day: '', week: '' },
      flossFreq: { day: '', week: '' },
      difficulty: { ans: '', detail: '' },
      cancerCheck: '',
      habits: [] as string[]
    },
    part3: { 
      snacks: [] as { name: string, freq: string }[] 
    },
    part4: { 
      cavityRisk: '', 
      importance: '', 
      canMaintain: '', 
      beliefStatus: '' 
    }
  });

  // Vital Signs State
  const [vitalSigns, setVitalSigns] = useState({ bp: '', pulse: '', resp: '' });

  // Examination State
  const [exam, setExam] = useState({
    extraOral: {} as Record<string, string>,
    intraOral: {} as Record<string, string>,
    ohis: { 
      debris: [0,0,0,0,0,0], 
      calculus: [0,0,0,0,0,0] 
    },
    plaqueControl: {} as Record<number, boolean>
  });

  // SOAPIE Evaluation
  const [evaluation, setEvaluation] = useState('');

  // Load existing record
  useEffect(() => {
    if (id && records[id]) {
      const data = records[id];
      setAnamnesis(prev => ({ ...prev, ...(data.anamnesis || {}) }));
      setClinical(prev => ({ ...prev, ...(data.clinical || {}) }));
      setTeethState(data.teethState || {});
      setAiResult(data.aiResult || null);
      setNextVisit(data.nextVisit || '');
      setHealthHistory(prev => ({
        ...prev,
        ...(data.healthHistory || {}),
        medical: { 
          ...prev.medical, 
          ...(data.healthHistory?.medical || {}),
          alergi: { ...prev.medical.alergi, ...(data.healthHistory?.medical?.alergi || {}) }
        },
        pharmacological: { ...prev.pharmacological, ...(data.healthHistory?.pharmacological || {}) }
      }));
      setDentalHistory(prev => ({
        ...prev,
        ...(data.dentalHistory || {}),
        part1: { ...prev.part1, ...(data.dentalHistory?.part1 || {}) },
        part2: { ...prev.part2, ...(data.dentalHistory?.part2 || {}) },
        part3: { ...prev.part3, ...(data.dentalHistory?.part3 || {}) },
        part4: { ...prev.part4, ...(data.dentalHistory?.part4 || {}) }
      }));
      setVitalSigns(prev => ({ ...prev, ...(data.vitalSigns || {}) }));
      setExam(prev => ({ ...prev, ...(data.exam || {}) }));
      setEvaluation(data.evaluation || '');
    }
  }, [id, records]);

  const handleSaveAll = () => {
    if (id) {
      onSaveRecord(id, {
        anamnesis,
        clinical,
        teethState,
        aiResult,
        nextVisit,
        healthHistory,
        dentalHistory,
        vitalSigns,
        exam,
        evaluation,
        timestamp: new Date().toISOString()
      });
      alert('Rekam medis berhasil disimpan!');
    }
  };

  if (!patient) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Pasien tidak ditemukan</h2>
        <Link to="/patients" className="text-pink-500 hover:underline mt-4 inline-block">Kembali ke Daftar Pasien</Link>
      </div>
    );
  }

  const selectDiagnosisCategory = (diagId: string) => {
    const diag = DIAGNOSIS_DATA.find(d => d.id === diagId);
    if (diag) {
      setAiResult({
        diagnosisId: diagId,
        analysisText: '',
        generatedCauses: [],
        generatedSigns: [],
        clientCenteredGoals: [],
        interventions: []
      });
    }
  };

  const generateAIAnalysis = async (diagnosisId: string) => {
    setIsAnalyzing(true);
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      const diagnosis = DIAGNOSIS_DATA.find(d => d.id === diagnosisId);
      
      const prompt = `Sebagai pakar Dental Hygiene Therapist, berikan analisis mendalam untuk diagnosis: "${diagnosis?.title}". 
      Berikan output dalam format JSON dengan struktur:
      {
        "analysisText": "Penjelasan singkat kondisi",
        "generatedCauses": ["Penyebab 1", "Penyebab 2"],
        "generatedSigns": ["Tanda 1", "Tanda 2"],
        "clientCenteredGoals": ["Goal 1", "Goal 2"],
        "interventions": ["Intervensi 1", "Intervensi 2"]
      }
      Gunakan bahasa Indonesia yang profesional medis.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setAiResult({
        diagnosisId,
        ...result
      });
    } catch (error) {
      console.error("AI Analysis failed:", error);
      alert("Gagal menghasilkan analisis AI. Silakan isi secara manual.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSignature = () => sigCanvas.current?.clear();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showEduDetail, setShowEduDetail] = useState<any>(null);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % EDUCATION_ITEMS.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + EDUCATION_ITEMS.length) % EDUCATION_ITEMS.length);

  const handleNext = () => {
    const currentIndex = EDUCATION_ITEMS.findIndex(i => i.title === showEduDetail.title);
    const nextIdx = (currentIndex + 1) % EDUCATION_ITEMS.length;
    setShowEduDetail({ ...EDUCATION_ITEMS[nextIdx], type: showEduDetail.type || 'infographic' });
  };

  const handlePrev = () => {
    const currentIndex = EDUCATION_ITEMS.findIndex(i => i.title === showEduDetail.title);
    const prevIdx = (currentIndex - 1 + EDUCATION_ITEMS.length) % EDUCATION_ITEMS.length;
    setShowEduDetail({ ...EDUCATION_ITEMS[prevIdx], type: showEduDetail.type || 'infographic' });
  };

  const tabs = [
    { id: 'pengkajian', label: 'Pengkajian (Assessment)', icon: ClipboardList },
    { id: 'pemeriksaan', label: 'Pemeriksaan (Examination)', icon: Stethoscope },
    { id: 'odontogram', label: 'Odontogram', icon: Activity },
    { id: 'diagnosis', label: 'Diagnosis (A)', icon: ShieldCheck },
    { id: 'treatment', label: 'Rencana & Tindakan (P/I)', icon: FileText },
    { id: 'evaluation', label: 'Evaluasi (E)', icon: CheckCircle2 },
    { id: 'education', label: 'Edukasi Pasien', icon: BookOpen },
    { id: 'consent', label: 'Informed Consent', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-pink-500 font-bold mb-1">
            <Link to="/patients" className="hover:underline">Pasien</Link>
            <ChevronRight size={16} />
            <span>Rekam Dental Hygiene</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Rekam Dental Hygiene: {patient.name} ({patient.medicalRecordNumber})</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-pink-200 text-pink-500 rounded-xl font-bold hover:bg-pink-50 transition-colors">
            Cetak RME
          </button>
          <button 
            onClick={handleSaveAll}
            className="px-4 py-2 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all"
          >
            Simpan Perubahan
          </button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-pink-500 text-white shadow-md shadow-pink-100" 
                : "bg-white text-gray-500 hover:bg-pink-50 hover:text-pink-500 border border-pink-50"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-pink-50 p-8 min-h-[600px]">
        {activeTab === 'pengkajian' && (
          <div className="space-y-12">
            {/* Data Demografi */}
            <section className="bg-pink-50/30 p-8 rounded-3xl border border-pink-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                1. Data Demografi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div><span className="text-gray-500">Nama Lengkap:</span> <p className="font-bold text-gray-800">{patient.name}</p></div>
                <div><span className="text-gray-500">NIK:</span> <p className="font-bold text-gray-800">{patient.nik}</p></div>
                <div><span className="text-gray-500">No. RM:</span> <p className="font-bold text-gray-800">{patient.medicalRecordNumber}</p></div>
                <div><span className="text-gray-500">Tanggal Lahir:</span> <p className="font-bold text-gray-800">{patient.birthDate}</p></div>
                <div><span className="text-gray-500">Jenis Kelamin:</span> <p className="font-bold text-gray-800">{patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p></div>
                <div><span className="text-gray-500">Pekerjaan:</span> <p className="font-bold text-gray-800">{patient.occupation}</p></div>
                <div><span className="text-gray-500">Status:</span> <p className="font-bold text-gray-800">{patient.maritalStatus}</p></div>
                <div><span className="text-gray-500">Asuransi:</span> <p className="font-bold text-gray-800">{patient.insurance} ({patient.insuranceType})</p></div>
                <div><span className="text-gray-500">Alamat:</span> <p className="font-bold text-gray-800">{patient.address}</p></div>
              </div>
            </section>

            {/* Riwayat Kesehatan */}
            <section className="space-y-8">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                2. Riwayat Kesehatan (Health History)
              </h3>
              
              <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm space-y-6">
                <h4 className="font-bold text-pink-500 uppercase tracking-widest text-xs">a. Riwayat Medis (Medical History)</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-pink-50/20 rounded-2xl border border-pink-50">
                    <span className="text-sm font-medium text-gray-700">Pasien merasa dalam keadaan sehat?</span>
                    <div className="flex gap-2">
                      {[true, false].map((val) => (
                        <button 
                          key={val.toString()}
                          onClick={() => setHealthHistory({...healthHistory, medical: {...healthHistory.medical, sehat: val}})}
                          className={cn(
                            "px-4 py-1 rounded-lg border text-xs font-bold transition-all",
                            healthHistory.medical.sehat === val ? "bg-pink-500 border-pink-500 text-white" : "bg-white border-pink-100 text-pink-500"
                          )}
                        >
                          {val ? 'Ya' : 'Tidak'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Penyakit Serius/Operasi (5 thn terakhir)</label>
                      <input 
                        type="text" 
                        className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/10 text-sm"
                        value={healthHistory.medical.sakitSerius}
                        onChange={(e) => setHealthHistory({...healthHistory, medical: {...healthHistory.medical, sakitSerius: e.target.value}})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Kelainan Pembekuan Darah</label>
                      <input 
                        type="text" 
                        className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/10 text-sm"
                        value={healthHistory.medical.pembekuanDarah}
                        onChange={(e) => setHealthHistory({...healthHistory, medical: {...healthHistory.medical, pembekuanDarah: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500">Reaksi Alergi:</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { key: 'makanan', label: 'Makanan' },
                        { key: 'obatSuntik', label: 'Obat Suntik' },
                        { key: 'obatObatan', label: 'Obat-obatan' },
                        { key: 'cuaca', label: 'Cuaca' },
                        { key: 'lainLain', label: 'Lain-lain' }
                      ].map((item) => (
                        <div key={item.key}>
                          <label className="block text-[10px] text-gray-400 uppercase mb-1">{item.label}</label>
                          <input 
                            type="text" 
                            className="w-full p-2 rounded-lg border-pink-100 bg-pink-50/10 text-xs"
                            value={healthHistory.medical.alergi[item.key as keyof typeof healthHistory.medical.alergi] || ''}
                            onChange={(e) => setHealthHistory({
                              ...healthHistory, 
                              medical: {
                                ...healthHistory.medical, 
                                alergi: {...healthHistory.medical.alergi, [item.key]: e.target.value}
                              }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm space-y-6">
                <h4 className="font-bold text-pink-500 uppercase tracking-widest text-xs">b. Riwayat Sosial (Social History)</h4>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Keterangan Riwayat Sosial:</label>
                  <textarea 
                    className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/10 text-sm"
                    rows={3}
                    placeholder="Contoh: Kebiasaan merokok, konsumsi alkohol, dll."
                    value={healthHistory.social}
                    onChange={(e) => setHealthHistory({...healthHistory, social: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm space-y-6">
                <h4 className="font-bold text-pink-500 uppercase tracking-widest text-xs">c. Pharmacological History</h4>
                <div className="space-y-6">
                  {[
                    { id: 'q1', text: '1. Apakah Anda sedang/pernah mengkonsumsi obat-obatan (termasuk herbal)?' },
                    { id: 'q2', text: '2. Apa efek samping dari obat tersebut?' },
                    { id: 'q3', text: '3. Apa pengaruh positif dari obat tersebut?' },
                    { id: 'q4', text: '4. Apakah ada masalah dengan dosis obat tersebut?' },
                    { id: 'q5', text: '5. Apakah Anda mengkonsumsi obat tersebut secara teratur?' },
                  ].map((q) => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">{q.text}</p>
                      <textarea 
                        className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/10 text-sm"
                        rows={2}
                        value={healthHistory.pharmacological[q.id as keyof typeof healthHistory.pharmacological] as string}
                        onChange={(e) => setHealthHistory({
                          ...healthHistory,
                          pharmacological: { ...healthHistory.pharmacological, [q.id]: e.target.value }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Riwayat Kesehatan Gigi */}
            <section className="space-y-8">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                3. Riwayat Kesehatan Gigi (Dental History)
              </h3>
              
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm space-y-6">
                  <h4 className="font-bold text-pink-500 uppercase tracking-widest text-xs">Bagian I : Pengalaman & Gejala</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alasan utama kunjungan:</label>
                      <textarea 
                        className="w-full p-3 rounded-xl border-pink-100 bg-pink-50/10 text-sm"
                        value={dentalHistory.part1.reason}
                        onChange={(e) => setDentalHistory({...dentalHistory, part1: {...dentalHistory.part1, reason: e.target.value}})}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gejala yang dirasakan:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Gigi Sensitif', 'Sakit Rahang', 'Sakit Gigi', 'Gusi Berdarah', 'Mulut Kering', 'Bau Mulut', 'Bengkak'].map(s => (
                            <label key={s} className="flex items-center gap-2 text-xs text-gray-600">
                              <input 
                                type="checkbox" 
                                checked={dentalHistory.part1.symptoms.includes(s)}
                                onChange={(e) => {
                                  const newSymptoms = e.target.checked 
                                    ? [...dentalHistory.part1.symptoms, s]
                                    : dentalHistory.part1.symptoms.filter(item => item !== s);
                                  setDentalHistory({...dentalHistory, part1: {...dentalHistory.part1, symptoms: newSymptoms}});
                                }}
                                className="rounded border-pink-200 text-pink-500 focus:ring-pink-500"
                              />
                              {s}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pernah Rontgen Gigi (2 thn terakhir)?</label>
                        <div className="flex gap-4 items-center">
                          <div className="flex gap-2">
                            {['Ya', 'Tidak'].map(val => (
                              <button 
                                key={val}
                                onClick={() => setDentalHistory({...dentalHistory, part1: {...dentalHistory.part1, xRay: {...dentalHistory.part1.xRay, ans: val}}})}
                                className={cn(
                                  "px-4 py-1 rounded-lg border text-xs font-bold",
                                  dentalHistory.part1.xRay.ans === val ? "bg-pink-500 text-white border-pink-500" : "bg-white text-pink-500 border-pink-100"
                                )}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                          {dentalHistory.part1.xRay.ans === 'Ya' && (
                            <input 
                              type="text" 
                              placeholder="Jenis Rontgen..."
                              className="flex-1 p-2 rounded-lg border-pink-100 bg-pink-50/10 text-xs"
                              value={dentalHistory.part1.xRay.type}
                              onChange={(e) => setDentalHistory({...dentalHistory, part1: {...dentalHistory.part1, xRay: {...dentalHistory.part1.xRay, type: e.target.value}}})}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm space-y-6">
                  <h4 className="font-bold text-pink-500 uppercase tracking-widest text-xs">Bagian II : Pemeliharaan Mandiri</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">Alat yang digunakan di rumah:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Sikat Lunak', 'Sikat Keras', 'Sikat Elektrik', 'Benang Gigi', 'Obat Kumur', 'Tusuk Gigi'].map(t => (
                          <label key={t} className="flex items-center gap-2 text-xs text-gray-600">
                            <input 
                              type="checkbox" 
                              checked={dentalHistory.part2.tools.includes(t)}
                              onChange={(e) => {
                                const newTools = e.target.checked 
                                  ? [...dentalHistory.part2.tools, t]
                                  : dentalHistory.part2.tools.filter(item => item !== t);
                                setDentalHistory({...dentalHistory, part2: {...dentalHistory.part2, tools: newTools}});
                              }}
                              className="rounded border-pink-200 text-pink-500 focus:ring-pink-500"
                            />
                            {t}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Durasi Sikat Gigi (menit)</label>
                          <input 
                            type="text" 
                            className="w-full p-2 rounded-lg border-pink-100 bg-pink-50/10 text-sm"
                            value={dentalHistory.part2.brushTime}
                            onChange={(e) => setDentalHistory({...dentalHistory, part2: {...dentalHistory.part2, brushTime: e.target.value}})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Frekuensi (kali/hari)</label>
                          <input 
                            type="text" 
                            className="w-full p-2 rounded-lg border-pink-100 bg-pink-50/10 text-sm"
                            value={dentalHistory.part2.brushFreq.day}
                            onChange={(e) => setDentalHistory({...dentalHistory, part2: {...dentalHistory.part2, brushFreq: {...dentalHistory.part2.brushFreq, day: e.target.value}}})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tanda-tanda Vital */}
            <section className="bg-pink-500 p-8 rounded-3xl text-white shadow-xl shadow-pink-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity size={24} />
                4. Tanda-tanda Vital (Vital Signs)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Tekanan Darah</label>
                  <div className="flex items-end gap-2">
                    <input 
                      type="text" 
                      className="bg-transparent border-none p-0 text-3xl font-black focus:ring-0 w-32 placeholder:text-white/30"
                      placeholder="120/80"
                      value={vitalSigns.bp}
                      onChange={(e) => setVitalSigns({...vitalSigns, bp: e.target.value})}
                    />
                    <span className="text-sm font-bold opacity-60 mb-1">mmHg</span>
                  </div>
                </div>
                <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Denyut Nadi</label>
                  <div className="flex items-end gap-2">
                    <input 
                      type="text" 
                      className="bg-transparent border-none p-0 text-3xl font-black focus:ring-0 w-24 placeholder:text-white/30"
                      placeholder="80"
                      value={vitalSigns.pulse}
                      onChange={(e) => setVitalSigns({...vitalSigns, pulse: e.target.value})}
                    />
                    <span className="text-sm font-bold opacity-60 mb-1">BPM</span>
                  </div>
                </div>
                <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Pernafasan</label>
                  <div className="flex items-end gap-2">
                    <input 
                      type="text" 
                      className="bg-transparent border-none p-0 text-3xl font-black focus:ring-0 w-24 placeholder:text-white/30"
                      placeholder="20"
                      value={vitalSigns.resp}
                      onChange={(e) => setVitalSigns({...vitalSigns, resp: e.target.value})}
                    />
                    <span className="text-sm font-bold opacity-60 mb-1">RPM</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'pemeriksaan' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                  Extra Oral & Intra Oral
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'limfe', label: 'Kelenjar Limfe' },
                    { key: 'tmj', label: 'TMJ (Sendi Rahang)' },
                    { key: 'wajah', label: 'Wajah (Simetri)' },
                    { key: 'gingiva', label: 'Gingiva' },
                    { key: 'mukosa', label: 'Mukosa' },
                    { key: 'lidah', label: 'Lidah' },
                    { key: 'langit', label: 'Langit-langit (Palate)' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-pink-50/30 rounded-2xl border border-pink-100">
                      <span className="font-bold text-gray-700 text-sm">{item.label}</span>
                      <div className="flex gap-2">
                        {['Normal', 'Abnormal'].map((val) => (
                          <button 
                            key={val}
                            onClick={() => setExam({
                              ...exam, 
                              extraOral: { ...exam.extraOral, [item.key]: val }
                            })}
                            className={cn(
                              "px-4 py-1 rounded-lg border text-[10px] font-bold transition-all",
                              exam.extraOral[item.key] === val
                                ? "bg-pink-500 border-pink-500 text-white"
                                : "bg-white border-pink-200 text-pink-500 hover:bg-pink-50"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-8">
                <div className="bg-pink-50/50 p-8 rounded-3xl border border-pink-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">OHI-S (Oral Hygiene Index Simplified)</h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-pink-500 uppercase mb-4 tracking-widest">Debris Index (DI)</p>
                      <div className="grid grid-cols-6 gap-2">
                        {exam.ohis.debris.map((val, idx) => (
                          <input 
                            key={idx}
                            type="number"
                            min="0" max="3"
                            className="w-full p-2 text-center rounded-lg border-pink-100 bg-white text-sm font-bold"
                            value={val}
                            onChange={(e) => {
                              const newDebris = [...exam.ohis.debris];
                              newDebris[idx] = parseInt(e.target.value) || 0;
                              setExam({...exam, ohis: {...exam.ohis, debris: newDebris}});
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 text-center">Gigi: 16, 11, 26, 36, 31, 46</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-pink-500 uppercase mb-4 tracking-widest">Calculus Index (CI)</p>
                      <div className="grid grid-cols-6 gap-2">
                        {exam.ohis.calculus.map((val, idx) => (
                          <input 
                            key={idx}
                            type="number"
                            min="0" max="3"
                            className="w-full p-2 text-center rounded-lg border-pink-100 bg-white text-sm font-bold"
                            value={val}
                            onChange={(e) => {
                              const newCalculus = [...exam.ohis.calculus];
                              newCalculus[idx] = parseInt(e.target.value) || 0;
                              setExam({...exam, ohis: {...exam.ohis, calculus: newCalculus}});
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-pink-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-600">Total OHI-S:</span>
                      <span className="text-2xl font-black text-pink-500">
                        {((exam.ohis.debris.reduce((a,b) => a+b, 0) + exam.ohis.calculus.reduce((a,b) => a+b, 0)) / 6).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-8 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                Plaque Control Index (Kunjungan I)
              </h3>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Rahang Atas</span>
                  <div className="grid grid-cols-16 gap-1">
                    {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(num => (
                      <button 
                        key={num}
                        onClick={() => setExam({...exam, plaqueControl: {...exam.plaqueControl, [num]: !exam.plaqueControl[num]}})}
                        className={cn(
                          "w-6 h-6 border rounded flex items-center justify-center text-[8px] font-bold transition-all",
                          exam.plaqueControl[num] ? "bg-red-500 border-red-600 text-white" : "bg-white border-pink-100 text-gray-300"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-16 gap-1">
                    {[null, null, null, 55, 54, 53, 52, 51, 61, 62, 63, 64, 65, null, null, null].map((num, idx) => (
                      num ? (
                        <button 
                          key={num}
                          onClick={() => setExam({...exam, plaqueControl: {...exam.plaqueControl, [num]: !exam.plaqueControl[num]}})}
                          className={cn(
                            "w-6 h-6 border rounded flex items-center justify-center text-[8px] font-bold transition-all",
                            exam.plaqueControl[num] ? "bg-red-500 border-red-600 text-white" : "bg-white border-pink-100 text-gray-300"
                          )}
                        >
                          {num}
                        </button>
                      ) : <div key={`empty-p-up-${idx}`} className="w-6 h-6" />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <div className="grid grid-cols-16 gap-1">
                    {[null, null, null, 85, 84, 83, 82, 81, 71, 72, 73, 74, 75, null, null, null].map((num, idx) => (
                      num ? (
                        <button 
                          key={num}
                          onClick={() => setExam({...exam, plaqueControl: {...exam.plaqueControl, [num]: !exam.plaqueControl[num]}})}
                          className={cn(
                            "w-6 h-6 border rounded flex items-center justify-center text-[8px] font-bold transition-all",
                            exam.plaqueControl[num] ? "bg-red-500 border-red-600 text-white" : "bg-white border-pink-100 text-gray-300"
                          )}
                        >
                          {num}
                        </button>
                      ) : <div key={`empty-p-low-${idx}`} className="w-6 h-6" />
                    ))}
                  </div>
                  <div className="grid grid-cols-16 gap-1">
                    {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(num => (
                      <button 
                        key={num}
                        onClick={() => setExam({...exam, plaqueControl: {...exam.plaqueControl, [num]: !exam.plaqueControl[num]}})}
                        className={cn(
                          "w-6 h-6 border rounded flex items-center justify-center text-[8px] font-bold transition-all",
                          exam.plaqueControl[num] ? "bg-red-500 border-red-600 text-white" : "bg-white border-pink-100 text-gray-300"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Rahang Bawah</span>
                </div>
                <div className="pt-6 text-center">
                  <p className="text-sm font-bold text-gray-600">Skor Plaque Control:</p>
                  <p className="text-4xl font-black text-pink-500">
                    {(Object.values(exam.plaqueControl).filter(v => v).length / 32 * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Kategori: {(Object.values(exam.plaqueControl).filter(v => v).length / 32 * 100) < 15 ? 'Baik' : 'Buruk'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'odontogram' && (
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="bg-pink-50 p-8 rounded-3xl border border-pink-100 w-full max-w-5xl">
              <h3 className="text-center font-bold text-gray-800 mb-8 uppercase tracking-widest">Odontogram Digital</h3>
              
              <div className="space-y-8">
                {/* Upper Teeth */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-pink-400 mb-2 uppercase tracking-widest">Rahang Atas (Upper)</span>
                  
                  {/* Permanent Upper */}
                  <div className="grid grid-cols-16 gap-1 mb-2">
                    {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((num) => (
                      <button 
                        key={num} 
                        onClick={() => {
                          const states = ['', 'C', 'F', 'M', 'I'];
                          const current = teethState[num] || '';
                          const next = states[(states.indexOf(current) + 1) % states.length];
                          setTeethState({ ...teethState, [num]: next });
                        }}
                        className={cn(
                          "w-8 h-10 border-2 rounded-md flex flex-col items-center justify-center transition-all",
                          teethState[num] === 'C' ? "bg-red-500 border-red-600 text-white" :
                          teethState[num] === 'F' ? "bg-blue-500 border-blue-600 text-white" :
                          teethState[num] === 'M' ? "bg-gray-400 border-gray-500 text-white" :
                          teethState[num] === 'I' ? "bg-purple-500 border-purple-600 text-white" :
                          "bg-white border-pink-100 text-pink-400 hover:bg-pink-50"
                        )}
                      >
                        <span className="text-[8px] opacity-60 mb-1">{num}</span>
                        <span className="text-[10px] font-black">{teethState[num] || '-'}</span>
                      </button>
                    ))}
                  </div>

                  {/* Primary Upper */}
                  <div className="grid grid-cols-16 gap-1">
                    {[null, null, null, 55, 54, 53, 52, 51, 61, 62, 63, 64, 65, null, null, null].map((num, idx) => (
                      num ? (
                        <button 
                          key={num} 
                          onClick={() => {
                            const states = ['', 'C', 'F', 'M', 'I'];
                            const current = teethState[num] || '';
                            const next = states[(states.indexOf(current) + 1) % states.length];
                            setTeethState({ ...teethState, [num]: next });
                          }}
                          className={cn(
                            "w-8 h-10 border-2 rounded-md flex flex-col items-center justify-center transition-all",
                            teethState[num] === 'C' ? "bg-red-500 border-red-600 text-white" :
                            teethState[num] === 'F' ? "bg-blue-500 border-blue-600 text-white" :
                            teethState[num] === 'M' ? "bg-gray-400 border-gray-500 text-white" :
                            teethState[num] === 'I' ? "bg-purple-500 border-purple-600 text-white" :
                            "bg-white border-pink-100 text-pink-400 hover:bg-pink-50"
                          )}
                        >
                          <span className="text-[8px] opacity-60 mb-1">{num}</span>
                          <span className="text-[10px] font-black">{teethState[num] || '-'}</span>
                        </button>
                      ) : <div key={`empty-up-${idx}`} className="w-8 h-10" />
                    ))}
                  </div>
                </div>

                {/* Lower Teeth */}
                <div className="flex flex-col items-center">
                  {/* Primary Lower */}
                  <div className="grid grid-cols-16 gap-1 mb-2">
                    {[null, null, null, 85, 84, 83, 82, 81, 71, 72, 73, 74, 75, null, null, null].map((num, idx) => (
                      num ? (
                        <button 
                          key={num} 
                          onClick={() => {
                            const states = ['', 'C', 'F', 'M', 'I'];
                            const current = teethState[num] || '';
                            const next = states[(states.indexOf(current) + 1) % states.length];
                            setTeethState({ ...teethState, [num]: next });
                          }}
                          className={cn(
                            "w-8 h-10 border-2 rounded-md flex flex-col items-center justify-center transition-all",
                            teethState[num] === 'C' ? "bg-red-500 border-red-600 text-white" :
                            teethState[num] === 'F' ? "bg-blue-500 border-blue-600 text-white" :
                            teethState[num] === 'M' ? "bg-gray-400 border-gray-500 text-white" :
                            teethState[num] === 'I' ? "bg-purple-500 border-purple-600 text-white" :
                            "bg-white border-pink-100 text-pink-400 hover:bg-pink-50"
                          )}
                        >
                          <span className="text-[10px] font-black">{teethState[num] || '-'}</span>
                          <span className="text-[8px] opacity-60 mt-1">{num}</span>
                        </button>
                      ) : <div key={`empty-low-${idx}`} className="w-8 h-10" />
                    ))}
                  </div>

                  {/* Permanent Lower */}
                  <div className="grid grid-cols-16 gap-1">
                    {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map((num) => (
                      <button 
                        key={num} 
                        onClick={() => {
                          const states = ['', 'C', 'F', 'M', 'I'];
                          const current = teethState[num] || '';
                          const next = states[(states.indexOf(current) + 1) % states.length];
                          setTeethState({ ...teethState, [num]: next });
                        }}
                        className={cn(
                          "w-8 h-10 border-2 rounded-md flex flex-col items-center justify-center transition-all",
                          teethState[num] === 'C' ? "bg-red-500 border-red-600 text-white" :
                          teethState[num] === 'F' ? "bg-blue-500 border-blue-600 text-white" :
                          teethState[num] === 'M' ? "bg-gray-400 border-gray-500 text-white" :
                          teethState[num] === 'I' ? "bg-purple-500 border-purple-600 text-white" :
                          "bg-white border-pink-100 text-pink-400 hover:bg-pink-50"
                        )}
                      >
                        <span className="text-[10px] font-black">{teethState[num] || '-'}</span>
                        <span className="text-[8px] opacity-60 mt-1">{num}</span>
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-pink-400 mt-2 uppercase tracking-widest">Rahang Bawah (Lower)</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-xs font-bold mt-10">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded shadow-sm" /> Karies (C)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded shadow-sm" /> Tambalan (F)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-400 rounded shadow-sm" /> Missing (M)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-purple-500 rounded shadow-sm" /> Impaksi (I)</div>
              </div>
            </div>
            <button 
              onClick={handleSaveAll}
              className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all"
            >
              Simpan Odontogram
            </button>
          </div>
        )}

        {activeTab === 'diagnosis' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Diagnosis Dental Hygiene</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-bold">8 Kategori WHO</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DIAGNOSIS_DATA.map((diag) => (
                <button 
                  key={diag.id}
                  onClick={() => selectDiagnosisCategory(diag.id)}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all group relative overflow-hidden",
                    aiResult?.diagnosisId === diag.id 
                      ? "border-pink-500 bg-pink-50 shadow-md" 
                      : "border-pink-100 hover:border-pink-300 bg-white"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800 pr-8">{diag.title}</h4>
                    <Plus size={16} className={cn("transition-colors", aiResult?.diagnosisId === diag.id ? "text-pink-500" : "text-pink-200")} />
                  </div>
                </button>
              ))}
            </div>

            {aiResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-3xl border-2 border-pink-200 shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-pink-600">
                    <PenTool size={24} />
                    <h3 className="text-xl font-bold">Isi Diagnosis: {DIAGNOSIS_DATA.find(d => d.id === aiResult.diagnosisId)?.title}</h3>
                  </div>
                  <button 
                    onClick={() => generateAIAnalysis(aiResult.diagnosisId)}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-600 rounded-xl font-bold text-xs hover:bg-pink-200 transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Generate dengan AI Studio
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-pink-400 uppercase tracking-widest">Analisis Kondisi</label>
                    <textarea 
                      className="w-full mt-1 p-4 rounded-2xl bg-pink-50/50 border-pink-100 text-gray-700 text-sm leading-relaxed focus:ring-pink-500"
                      rows={3}
                      value={aiResult.analysisText}
                      onChange={(e) => setAiResult({...aiResult, analysisText: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section>
                      <label className="block text-sm font-bold text-gray-600 mb-2">Etiologi (Sebab)</label>
                      <div className="bg-pink-50/20 p-4 rounded-2xl border border-pink-100 mb-4">
                        <p className="text-[10px] font-bold text-pink-400 uppercase mb-2">Pilih dari Daftar Standar:</p>
                        <div className="flex flex-wrap gap-2">
                          {DIAGNOSIS_DATA.find(d => d.id === aiResult.diagnosisId)?.causes.map((c) => (
                            <button 
                              key={c}
                              onClick={() => {
                                if (!aiResult.generatedCauses.includes(c)) {
                                  setAiResult({...aiResult, generatedCauses: [...aiResult.generatedCauses, c]});
                                }
                              }}
                              className="px-2 py-1 bg-white border border-pink-100 rounded text-[10px] text-gray-600 hover:bg-pink-500 hover:text-white transition-all"
                            >
                              + {c.substring(0, 30)}...
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {aiResult.generatedCauses.map((cause, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input 
                              type="text"
                              className="flex-1 p-2 text-sm rounded-lg border-pink-100 bg-pink-50/10"
                              value={cause}
                              onChange={(e) => {
                                const newCauses = [...aiResult.generatedCauses];
                                newCauses[idx] = e.target.value;
                                setAiResult({...aiResult, generatedCauses: newCauses});
                              }}
                            />
                            <button 
                              onClick={() => {
                                const newCauses = aiResult.generatedCauses.filter((_, i) => i !== idx);
                                setAiResult({...aiResult, generatedCauses: newCauses});
                              }}
                              className="text-pink-300 hover:text-pink-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => setAiResult({...aiResult, generatedCauses: [...aiResult.generatedCauses, '']})}
                          className="text-xs text-pink-500 font-bold flex items-center gap-1 mt-2"
                        >
                          <Plus size={12} /> Tambah Etiologi Manual
                        </button>
                      </div>
                    </section>

                    <section>
                      <label className="block text-sm font-bold text-gray-600 mb-2">Tanda & Gejala</label>
                      <div className="bg-pink-50/20 p-4 rounded-2xl border border-pink-100 mb-4">
                        <p className="text-[10px] font-bold text-pink-400 uppercase mb-2">Pilih dari Daftar Standar:</p>
                        <div className="flex flex-wrap gap-2">
                          {DIAGNOSIS_DATA.find(d => d.id === aiResult.diagnosisId)?.signs.map((s) => (
                            <button 
                              key={s}
                              onClick={() => {
                                if (!aiResult.generatedSigns.includes(s)) {
                                  setAiResult({...aiResult, generatedSigns: [...aiResult.generatedSigns, s]});
                                }
                              }}
                              className="px-2 py-1 bg-white border border-pink-100 rounded text-[10px] text-gray-600 hover:bg-pink-500 hover:text-white transition-all"
                            >
                              + {s.substring(0, 30)}...
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {aiResult.generatedSigns.map((sign, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input 
                              type="text"
                              className="flex-1 p-2 text-sm rounded-lg border-pink-100 bg-pink-50/10"
                              value={sign}
                              onChange={(e) => {
                                const newSigns = [...aiResult.generatedSigns];
                                newSigns[idx] = e.target.value;
                                setAiResult({...aiResult, generatedSigns: newSigns});
                              }}
                            />
                            <button 
                              onClick={() => {
                                const newSigns = aiResult.generatedSigns.filter((_, i) => i !== idx);
                                setAiResult({...aiResult, generatedSigns: newSigns});
                              }}
                              className="text-pink-300 hover:text-pink-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => setAiResult({...aiResult, generatedSigns: [...aiResult.generatedSigns, '']})}
                          className="text-xs text-pink-500 font-bold flex items-center gap-1 mt-2"
                        >
                          <Plus size={12} /> Tambah Tanda/Gejala Manual
                        </button>
                      </div>
                    </section>
                  </div>

                  <div className="pt-4 border-t border-pink-100">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <BookOpen size={18} className="text-pink-500" />
                      Client Centered Goals & Interventions (TGM)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-pink-500 uppercase">Goals</p>
                        <textarea 
                          className="w-full p-3 rounded-xl bg-pink-50/30 border border-pink-100 text-sm text-gray-600 focus:ring-pink-500"
                          rows={4}
                          value={aiResult.clientCenteredGoals.join('\n')}
                          onChange={(e) => setAiResult({...aiResult, clientCenteredGoals: e.target.value.split('\n')})}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-pink-500 uppercase">Interventions</p>
                        <textarea 
                          className="w-full p-3 rounded-xl bg-pink-50/30 border border-pink-100 text-sm text-gray-600 focus:ring-pink-500"
                          rows={4}
                          value={aiResult.interventions.join('\n')}
                          onChange={(e) => setAiResult({...aiResult, interventions: e.target.value.split('\n')})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveAll}
                    className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all"
                  >
                    Verifikasi & Simpan Diagnosis
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'treatment' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Perencanaan & Implementasi</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-bold">SOAPIE: P & I</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <label className="block text-sm font-bold text-gray-600">Tujuan Berpusat Pada Klien (Client-Centered Goals)</label>
                <div className="space-y-2">
                  {(aiResult?.clientCenteredGoals || []).map((goal, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-pink-50/30 rounded-xl border border-pink-100">
                      <CheckCircle2 size={16} className="text-pink-500" />
                      <input 
                        type="text"
                        className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0"
                        value={goal}
                        onChange={(e) => {
                          const newGoals = [...(aiResult?.clientCenteredGoals || [])];
                          newGoals[idx] = e.target.value;
                          setAiResult({...aiResult!, clientCenteredGoals: newGoals});
                        }}
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => setAiResult({...aiResult!, clientCenteredGoals: [...(aiResult?.clientCenteredGoals || []), '']})}
                    className="text-xs text-pink-500 font-bold flex items-center gap-1 mt-2"
                  >
                    <Plus size={12} /> Tambah Tujuan
                  </button>
                </div>
              </section>

              <section className="space-y-4">
                <label className="block text-sm font-bold text-gray-600">Intervensi Dental Hygiene</label>
                <div className="space-y-2">
                  {(aiResult?.interventions || []).map((int, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-pink-50/30 rounded-xl border border-pink-100">
                      <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
                      <input 
                        type="text"
                        className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0"
                        value={int}
                        onChange={(e) => {
                          const newInts = [...(aiResult?.interventions || [])];
                          newInts[idx] = e.target.value;
                          setAiResult({...aiResult!, interventions: newInts});
                        }}
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => setAiResult({...aiResult!, interventions: [...(aiResult?.interventions || []), '']})}
                    className="text-xs text-pink-500 font-bold flex items-center gap-1 mt-2"
                  >
                    <Plus size={12} /> Tambah Intervensi
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'evaluation' && (
          <div className="max-w-4xl space-y-8">
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                Pernyataan Evaluatif (Evaluative Statement)
              </h3>
              <textarea 
                className="w-full p-6 rounded-3xl border-pink-100 bg-pink-50/30 min-h-[200px] text-gray-700 leading-relaxed"
                placeholder="Tuliskan hasil evaluasi tindakan..."
                value={evaluation}
                onChange={(e) => setEvaluation(e.target.value)}
              />
            </section>

            <section className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl">
                  <Calendar size={24} />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tanggal Kunjungan Berikutnya</label>
                    <input 
                      type="date" 
                      className="w-full p-2 rounded-lg border-pink-100 bg-pink-50/10 font-bold text-gray-800"
                      value={nextVisit}
                      onChange={(e) => setNextVisit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Waktu (Jam)</label>
                    <input 
                      type="time" 
                      className="w-full p-2 rounded-lg border-pink-100 bg-pink-50/10 font-bold text-gray-800"
                      value={nextVisitTime}
                      onChange={(e) => setNextVisitTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Edukasi & Tips Kesehatan Gigi</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-bold">Relevan dengan Diagnosis</span>
              </div>
            </div>

            {/* Interactive Carousel */}
            <div className="relative group">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentSlide}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-pink-500 to-rose-500 p-12 text-white shadow-2xl shadow-pink-200 min-h-[400px] flex items-center"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-400/20 rounded-full -ml-20 -mb-20 blur-3xl" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 w-full">
                    <div className="flex-1 space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-md text-xs font-black uppercase tracking-widest">
                        <Sparkles size={14} /> Tips Terpilih
                      </div>
                      <h2 className="text-4xl font-black leading-tight">{EDUCATION_ITEMS[currentSlide].title}</h2>
                      <p className="text-pink-100 text-lg leading-relaxed">
                        {EDUCATION_ITEMS[currentSlide].desc}
                      </p>
                      <div className="flex gap-4 pt-4">
                        <button 
                          onClick={() => setShowEduDetail({ ...EDUCATION_ITEMS[currentSlide], type: 'video' })}
                          className="px-8 py-4 bg-white text-pink-600 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform"
                        >
                          Tonton Video
                        </button>
                        <button 
                          onClick={() => setShowEduDetail({ ...EDUCATION_ITEMS[currentSlide], type: 'infographic' })}
                          className="px-8 py-4 bg-pink-600 text-white rounded-2xl font-black border border-pink-400 hover:bg-pink-700 transition-colors"
                        >
                          Lihat Infografis
                        </button>
                      </div>
                    </div>
                    <div 
                      onClick={() => setShowEduDetail({ ...EDUCATION_ITEMS[currentSlide], type: 'infographic' })}
                      className="w-full md:w-80 h-80 bg-white/10 rounded-[40px] backdrop-blur-md border border-white/20 flex items-center justify-center relative group cursor-pointer overflow-hidden"
                    >
                      <img 
                        src={`https://picsum.photos/seed/${EDUCATION_ITEMS[currentSlide].title}/800/800`} 
                        alt={EDUCATION_ITEMS[currentSlide].title} 
                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="relative z-10 bg-white/20 p-6 rounded-full backdrop-blur-xl border border-white/30 text-white group-hover:scale-125 transition-transform">
                        <BookOpen size={48} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Carousel Controls */}
              <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all z-20"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all z-20"
              >
                <ChevronRight size={24} />
              </button>

              {/* Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {EDUCATION_ITEMS.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      currentSlide === i ? "w-8 bg-white" : "bg-white/40"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Education Detail Modal */}
            <AnimatePresence>
              {showEduDetail && (
                <EducationModal 
                  item={showEduDetail} 
                  onClose={() => setShowEduDetail(null)} 
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {EDUCATION_ITEMS.map((item, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  onClick={() => setShowEduDetail({ ...item, type: 'infographic' })}
                  className="p-8 bg-white rounded-[32px] border border-pink-50 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform", item.color)}>
                    <item.icon size={28} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{item.desc}</p>
                  <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">Detail Materi</span>
                    <ChevronRight size={16} className="text-pink-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'consent' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white p-10 rounded-[40px] border border-pink-100 shadow-xl space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Surat Persetujuan Tindakan</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">(Informed Consent)</p>
              </div>

              <div className="text-sm text-gray-600 leading-relaxed space-y-4 text-justify">
                <p>
                  Yang bertanda tangan di bawah ini, menyatakan telah mendapat penerangan mengenai pemeriksaan dan perawatan yang akan dilaksanakan terhadap saya / anak saya, dengan akibat sampingan yang mungkin terjadi, jumlah kunjungan yang harus dilaksanakan serta biaya yang harus dibayar untuk pemeriksaan dan perawatan dimaksud.
                </p>
                <p>
                  Selanjutnya saya memberikan persetujuan kepada perawat gigi yang ditunjuk untuk melaksanakan tindakan asuhan keperawatan gigi kepada saya/anak saya sesuai dengan yang telah dijelaskan kepada saya sebelumnya.
                </p>
                <p>
                  Persetujuan ini diberikan dengan penuh kesadaran akan kemungkinan terjadinya akibat sampingan dari tindakan tersebut di atas.
                </p>
              </div>

              <div className="pt-8 border-t border-pink-50">
                <label className="block text-xs font-bold text-pink-500 uppercase tracking-widest mb-4 text-center">Tanda Tangan Pasien / Wali</label>
                <div className="bg-pink-50/30 rounded-3xl border-2 border-dashed border-pink-100 overflow-hidden">
                  <SignatureCanvas 
                    ref={sigCanvas}
                    penColor='#ec4899'
                    canvasProps={{className: 'w-full h-48 cursor-crosshair'}}
                  />
                </div>
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={clearSignature}
                    className="text-xs font-bold text-pink-400 hover:text-pink-600 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Ulangi Tanda Tangan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 pt-8">
                <div className="text-center space-y-12">
                  <p className="text-xs font-bold text-gray-400 uppercase">Pasien / Wali</p>
                  <p className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1">{patient.name}</p>
                </div>
                <div className="text-center space-y-12">
                  <p className="text-xs font-bold text-gray-400 uppercase">Operator (TGM)</p>
                  <p className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1">Amir (Mahasiswa)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Schedule = ({ patients }: { patients: Patient[] }) => {
  const [appointments, setAppointments] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [newAppt, setNewAppt] = useState({
    patientId: '',
    newPatientName: '',
    date: '',
    time: '09:00',
    type: 'Kontrol Rutin'
  });

  const handleAddAppointment = () => {
    if ((newAppt.patientId || newAppt.newPatientName) && newAppt.date) {
      const apptData = {
        ...newAppt,
        id: Math.random().toString(36).substr(2, 9),
        status: 'Confirmed',
        patientName: newAppt.patientId ? patients.find(p => p.id === newAppt.patientId)?.name : newAppt.newPatientName
      };
      setAppointments([...appointments, apptData]);
      setShowModal(false);
      setNewAppt({ patientId: '', newPatientName: '', date: '', time: '09:00', type: 'Kontrol Rutin' });
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Jadwal & Janji Temu</h1>
          <p className="text-gray-500">Manajemen kunjungan pasien dan jadwal baru</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-pink-500 text-white rounded-2xl font-bold shadow-xl shadow-pink-200 hover:bg-pink-600 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Buat Janji Temu Baru
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-pink-50 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-pink-500" />
              Agenda Mendatang
            </h3>
            <div className="space-y-4">
              {appointments.map((appt: any) => {
                const patient = patients.find(p => p.id === appt.patientId);
                const displayName = patient?.name || appt.patientName || 'Pasien Baru';
                return (
                  <div key={appt.id} className="flex items-center gap-6 p-6 bg-pink-50/20 rounded-3xl border border-pink-50 hover:border-pink-200 transition-all group">
                    <div className="w-16 h-16 rounded-2xl bg-white flex flex-col items-center justify-center shadow-sm border border-pink-100 shrink-0">
                      <span className="text-[10px] font-black text-pink-500 uppercase">{new Date(appt.date).toLocaleString('id-ID', { month: 'short' })}</span>
                      <span className="text-xl font-black text-gray-800">{new Date(appt.date).getDate()}</span>
                      <span className="text-[8px] font-bold text-gray-400">{new Date(appt.date).getFullYear()}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-lg">{displayName}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} /> {appt.time}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Activity size={12} /> {appt.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        appt.status === 'Confirmed' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                      )}>
                        {appt.status}
                      </span>
                      <button className="text-xs font-bold text-pink-500 hover:underline">Detail</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-8 rounded-[40px] text-white shadow-xl shadow-pink-200">
            <h3 className="text-xl font-black mb-4">Statistik Jadwal</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] font-black text-pink-100 uppercase mb-1">Hari Ini</p>
                <p className="text-2xl font-black">12</p>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] font-black text-pink-100 uppercase mb-1">Minggu Ini</p>
                <p className="text-2xl font-black">48</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-pink-50 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Pasien Menunggu</h3>
            <div className="space-y-4">
              {patients.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                    {p.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">{p.name}</p>
                    <p className="text-[10px] text-gray-400">Terakhir: 2 minggu lalu</p>
                  </div>
                  <button className="p-2 text-pink-500 hover:bg-pink-50 rounded-lg transition-colors">
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Buat Janji Temu</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Pilih Pasien</label>
                  <select 
                    className="w-full p-4 rounded-2xl border-pink-100 bg-pink-50/30 text-sm font-bold focus:ring-pink-500"
                    value={newAppt.patientId}
                    onChange={(e) => setNewAppt({...newAppt, patientId: e.target.value, newPatientName: e.target.value === 'new' ? '' : newAppt.newPatientName})}
                  >
                    <option value="">-- Pilih Pasien --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    <option value="new" className="text-pink-500 font-bold">+ Pasien Baru (Input Manual)</option>
                  </select>
                </div>

                {newAppt.patientId === 'new' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nama Pasien Baru</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan nama lengkap pasien..."
                      className="w-full p-4 rounded-2xl border-pink-100 bg-pink-50/30 text-sm font-bold focus:ring-pink-500"
                      value={newAppt.newPatientName}
                      onChange={(e) => setNewAppt({...newAppt, newPatientName: e.target.value})}
                    />
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tanggal</label>
                    <input 
                      type="date" 
                      className="w-full p-4 rounded-2xl border-pink-100 bg-pink-50/30 text-sm font-bold focus:ring-pink-500"
                      value={newAppt.date}
                      onChange={(e) => setNewAppt({...newAppt, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Waktu</label>
                    <input 
                      type="time" 
                      className="w-full p-4 rounded-2xl border-pink-100 bg-pink-50/30 text-sm font-bold focus:ring-pink-500"
                      value={newAppt.time}
                      onChange={(e) => setNewAppt({...newAppt, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Jenis Tindakan</label>
                  <select 
                    className="w-full p-4 rounded-2xl border-pink-100 bg-pink-50/30 text-sm font-bold focus:ring-pink-500"
                    value={newAppt.type}
                    onChange={(e) => setNewAppt({...newAppt, type: e.target.value})}
                  >
                    <option value="Kontrol Rutin">Kontrol Rutin</option>
                    <option value="Scaling">Scaling</option>
                    <option value="Pencabutan">Pencabutan</option>
                    <option value="Konsultasi">Konsultasi</option>
                  </select>
                </div>

                <button 
                  onClick={handleAddAppointment}
                  className="w-full py-4 bg-pink-500 text-white rounded-2xl font-black shadow-xl shadow-pink-200 hover:bg-pink-600 transition-all"
                >
                  Simpan Janji Temu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RecordsList = ({ patients }: { patients: Patient[] }) => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Rekam Dental Hygiene</h1>
        <p className="text-gray-500">Daftar rekam medis asuhan kesehatan gigi dan mulut</p>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Cari pasien..." 
          className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <div key={patient.id} className="bg-white p-6 rounded-3xl border border-pink-50 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl">
                {patient.name[0]}
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold uppercase">Lengkap</span>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">{patient.name}</h3>
            <p className="text-xs text-gray-500 mb-4">{patient.medicalRecordNumber} • {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Kelengkapan Data</span>
                <span>85%</span>
              </div>
              <div className="w-full h-1.5 bg-pink-50 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-pink-500 rounded-full" />
              </div>
            </div>

            <Link 
              to={`/patient/${patient.id}`}
              className="w-full py-3 bg-pink-50 text-pink-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-pink-500 group-hover:text-white transition-all"
            >
              <ClipboardList size={18} />
              Buka Rekam Medis
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

const Reports = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-2xl font-bold text-gray-800">Modul Pelaporan</h1>
      <p className="text-gray-500">Laporan individu dan agregat epidemiologi</p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { title: 'Laporan DMF-T Rata-rata', desc: 'Statistik karies populasi bulanan.', icon: Activity },
        { title: 'Prevalensi Penyakit', desc: 'Distribusi gingivitis & periodontitis.', icon: Stethoscope },
        { title: 'Kunjungan Pasien', desc: 'Rekapitulasi jumlah kunjungan.', icon: Users },
      ].map((report, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-500 mb-4">
            <report.icon size={24} />
          </div>
          <h4 className="font-bold text-gray-800 mb-2">{report.title}</h4>
          <p className="text-sm text-gray-500 mb-4">{report.desc}</p>
          <button className="w-full py-2 bg-pink-50 text-pink-500 rounded-xl text-sm font-bold hover:bg-pink-500 hover:text-white transition-all">
            Unduh Laporan (PDF/Excel)
          </button>
        </div>
      ))}
    </div>
  </div>
);

const SecurityModule = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-2xl font-bold text-gray-800">Keamanan & Audit Data</h1>
      <p className="text-gray-500">Pemantauan akses dan integritas rekam medis</p>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ShieldCheck className="text-green-500" /> Status Enkripsi
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl border border-green-100">
            <span className="text-sm font-bold text-green-700">Database Encryption (AES-256)</span>
            <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-black rounded uppercase">Active</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl border border-green-100">
            <span className="text-sm font-bold text-green-700">Automatic Backup (Cloud)</span>
            <span className="text-xs text-green-600">Terakhir: 5 Menit Lalu</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Audit Trail (Aktivitas Terakhir)</h3>
        <div className="space-y-3">
          {[].map((log, i) => (
            <div key={i} className="flex justify-between items-center text-sm p-2 border-b border-pink-50 last:border-0">
              <span className="font-bold text-gray-700">{log.user}</span>
              <span className="text-gray-500">{log.action}</span>
              <span className="text-xs text-pink-400">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Layout = ({ children, userRole, onLogout, user }: { children: React.ReactNode, userRole: string, onLogout: () => void, user: FirebaseUser | null }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Users, label: 'Data Master Pasien', to: '/patients' },
    { icon: ClipboardList, label: 'Rekam Dental Hygiene', to: '/records' },
    { icon: BookOpen, label: 'Edukasi', to: '/education' },
    { icon: Sparkles, label: 'Admin & Studio TGM', to: '/admin' },
    { icon: Calendar, label: 'Jadwal', to: '/schedule' },
    { icon: FileText, label: 'Laporan', to: '/reports' },
    { icon: ShieldCheck, label: 'Keamanan', to: '/security' },
    { icon: Settings, label: 'Pengaturan', to: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#fff5f8] flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-pink-100 transition-all duration-300 flex flex-col fixed h-full z-50",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-200 shrink-0">
            <Activity size={24} />
          </div>
          {isSidebarOpen && <span className="font-black text-xl tracking-tight text-pink-600">GigiBerseri</span>}
        </div>

        <div className="px-6 mb-6">
          {isSidebarOpen && (
            <div className="p-3 bg-pink-50 rounded-2xl border border-pink-100">
              <div className="flex items-center gap-3 mb-2">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
                    {(user?.displayName || 'U')[0]}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-800 truncate">{user?.displayName || 'Pengguna'}</p>
                </div>
              </div>
              <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-1">Role Akses</p>
              <p className="text-sm font-bold text-pink-600">{userRole}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={location.pathname === item.to} 
            />
          ))}
        </nav>

        <div className="p-4 border-t border-pink-50">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 p-8",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-8 left-8 z-50 w-10 h-10 bg-white border border-pink-100 rounded-full shadow-lg flex items-center justify-center text-pink-500 hover:bg-pink-50 transition-all"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  );
};

export default function App() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole('Terapis Gigi'); // Default
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setUserRole('Terapis Gigi');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('gigiberseri_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('gigiberseri_records', JSON.stringify(records));
  }, [records]);

  const handleLogin = (role: string, firebaseUser?: FirebaseUser) => {
    setUserRole(role);
    if (firebaseUser) setUser(firebaseUser);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      setUser(null);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const addPatient = (newPatient: Patient) => {
    setPatients([...patients, newPatient]);
  };

  const saveRecord = (patientId: string, recordData: any) => {
    setRecords({ ...records, [patientId]: recordData });
    console.log(`Saved record for patient ${patientId}:`, recordData);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <RefreshCw size={48} className="animate-spin text-pink-500" />
      </div>
    );
  }

  if (!userRole) {
    return (
      <ErrorBoundary>
        <Login onLogin={handleLogin} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Layout userRole={userRole} onLogout={handleLogout} user={user}>
          <Routes>
            <Route path="/" element={<Dashboard patients={patients} user={user} />} />
            <Route path="/patients" element={<PatientList patients={patients} onAddPatient={addPatient} />} />
            <Route path="/records" element={<RecordsList patients={patients} />} />
            <Route path="/patient/:id" element={<DentalRecord patients={patients} records={records} onSaveRecord={saveRecord} />} />
            <Route path="/schedule" element={<Schedule patients={patients} />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/admin" element={<AdminManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/security" element={<SecurityModule />} />
            <Route path="*" element={<Dashboard patients={patients} user={user} />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}
