import React from 'react';
import {
  PlayCircle, CheckCircle2, ShieldCheck, Cloud, ChevronRight,
  Search, Bell, User, Calendar, TrendingUp, Mail, Lock, Eye, EyeOff,
  User as UserIcon, BookOpen, Clock, FileText, Check, ArrowRight
} from 'lucide-react';

// Helper Icons for mockups
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
    <path fill="#f35325" d="M1 1h10v10H1z" />
    <path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" />
    <path fill="#ffba08" d="M12 12h10v10H12z" />
  </svg>
);

const AppLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M14.31 8l5.74 9.94" />
        <path d="M9.69 8h11.48" />
        <path d="M7.38 12l5.74-9.94" />
        <path d="M9.69 16L3.95 6.06" />
        <path d="M14.31 16H2.83" />
        <path d="M16.62 12l-5.74 9.94" />
      </svg>
    </div>
    <div className="flex flex-col">
      <span className="font-bold text-xl leading-tight text-gray-800">AppGuru</span>
      <span className="text-[10px] text-gray-500 leading-tight">Manajemen Guru</span>
    </div>
  </div>
);

const HeroSection = () => {
  return (
    <div className="bg-white rounded-[32px] p-10 shadow-sm relative overflow-hidden h-[800px] border border-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-16 relative z-10">
        <AppLogo />
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#" className="text-gray-900 font-semibold">Beranda</a>
          <a href="#" className="hover:text-gray-900">Fitur</a>
          <a href="#" className="hover:text-gray-900">Keunggulan</a>
          <a href="#" className="hover:text-gray-900">Testimoni</a>
          <a href="#" className="hover:text-gray-900">Harga</a>
          <a href="#" className="hover:text-gray-900">Bantuan</a>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-semibold text-gray-700 hover:text-gray-900">Masuk</button>
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold py-2.5 px-6 rounded-full transition-colors">
            Daftar Gratis
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex relative z-10">
        {/* Left Text */}
        <div className="w-1/2 pt-10 pr-8">
          <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-500 px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
            <span className="text-sm">✨</span> Aplikasi untuk Guru, dibuat untuk Guru
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-[1.1] mb-6">
            Mengajar lebih fokus,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">
              Administrasi jadi mudah
            </span>
          </h1>
          <p className="text-gray-600 text-lg mb-10 max-w-md leading-relaxed">
            AppGuru membantu guru mengelola absensi, penilaian, agenda, dan data siswa dalam satu aplikasi yang modern, cepat, dan menyenangkan.
          </p>
          <div className="flex items-center gap-4 mb-12">
            <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-8 rounded-full flex items-center gap-2 transition-colors">
              Mulai Gratis Sekarang <ArrowRight size={18} />
            </button>
            <button className="bg-white border border-gray-200 text-gray-700 font-semibold py-3 px-8 rounded-full flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <PlayCircle size={18} /> Lihat Demo
            </button>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-indigo-400" /> Mudah Digunakan</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-green-500" /> Aman & Terpercaya</span>
            <span className="flex items-center gap-1.5"><Cloud size={16} className="text-blue-400" /> Data Tersimpan Otomatis</span>
          </div>
        </div>

        {/* Right Illustration & Mockup */}
        <div className="w-1/2 relative">
          {/* Dashboard Mockup (Simplified) */}
          <div className="absolute right-[-100px] top-0 w-[600px] h-[450px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 flex flex-col z-0 transform translate-y-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-500 rounded-md"></div>
                <span className="font-bold text-gray-800">Dashboard</span>
              </div>
              <div className="flex items-center gap-4">
                <Search size={18} className="text-gray-400" />
                <div className="relative">
                  <Bell size={18} className="text-gray-400" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                   <img src="https://i.pravatar.cc/150?img=47" alt="User" />
                </div>
              </div>
            </div>
            
            {/* Greeting */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">Selamat pagi, Siti Nurafifah! 👋</h2>
              <p className="text-xs text-gray-500">Berikut ringkasan aktivitas mengajar hari ini.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-xl">
                <p className="text-xs text-indigo-500 mb-1 font-semibold">Total Siswa</p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-bold text-gray-800">250</p>
                  <UserIcon size={20} className="text-indigo-300" />
                </div>
                <p className="text-[10px] text-gray-500 mt-2">5 Kelas Aktif</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 mb-1 font-semibold">Kehadiran Hari Ini</p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-bold text-gray-800">92%</p>
                  <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center"><Check size={14} className="text-green-600"/></div>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">230 / 250 hadir</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <p className="text-xs text-orange-500 mb-1 font-semibold">Tugas Hari Ini</p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-bold text-gray-800">3</p>
                  <Calendar size={20} className="text-orange-300" />
                </div>
                <p className="text-[10px] text-gray-500 mt-2">Agenda aktif</p>
              </div>
            </div>

            {/* Charts & Agenda */}
            <div className="flex gap-4 flex-1">
              <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-800 mb-4">Tren Kehadiran (7 Hari Terakhir)</p>
                {/* Dummy chart graphic */}
                <div className="h-24 w-full flex items-end justify-between relative mt-4">
                    <div className="absolute top-[-10px] right-0 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full">92%</div>
                    {[40, 60, 45, 70, 85, 75, 92].map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 w-full relative group">
                        <div className="w-1.5 bg-indigo-200 rounded-t-full" style={{ height: `${h}%` }}></div>
                        {i === 6 && <div className="absolute top-[-6px] w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white shadow-sm z-10"></div>}
                        <span className="text-[8px] text-gray-400 mt-1">
                          {['Sen','Sel','Rab','Kam','Jum','Sab','Min'][i]}
                        </span>
                      </div>
                    ))}
                    {/* Line overlay mock */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                       <path d="M 0 70 Q 40 40 80 65 T 160 30 T 240 15 T 320 25 T 380 5" fill="none" stroke="#6366f1" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                    </svg>
                </div>
              </div>
              <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-800 mb-4">Agenda Hari Ini</p>
                <div className="space-y-3 relative">
                  {/* Timeline line */}
                  <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                  
                  <div className="flex gap-3 relative">
                     <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white relative z-10 mt-1"></div>
                     <div>
                       <p className="text-[10px] text-gray-400">07:30 - 09:00</p>
                       <p className="text-xs font-semibold text-gray-800">Matematika - Kelas 7-6</p>
                       <p className="text-[10px] text-gray-500">Aljabar Linear</p>
                     </div>
                  </div>
                  <div className="flex gap-3 relative">
                     <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white relative z-10 mt-1"></div>
                     <div>
                       <p className="text-[10px] text-gray-400">09:15 - 10:45</p>
                       <p className="text-xs font-semibold text-gray-800">Matematika - Kelas 7-7</p>
                       <p className="text-[10px] text-gray-500">Persamaan & Pertidaksamaan</p>
                     </div>
                  </div>
                   <div className="flex gap-3 relative">
                     <div className="w-3 h-3 rounded-full bg-green-400 border-2 border-white relative z-10 mt-1"></div>
                     <div>
                       <p className="text-[10px] text-gray-400">11:00 - 12:30</p>
                       <p className="text-xs font-semibold text-gray-800">Matematika - Kelas 7-8</p>
                       <p className="text-[10px] text-gray-500">Statistika Dasar</p>
                     </div>
                  </div>
                </div>
                <div className="mt-3 text-right">
                  <a href="#" className="text-[10px] text-indigo-500 font-semibold flex items-center justify-end gap-1">Lihat semua agenda <ChevronRight size={10}/></a>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Teacher Avatar (Using generic shapes as placeholder for the rich 3D asset) */}
          <div className="absolute bottom-[-40px] left-[-20px] z-20 w-[400px] h-[400px]">
            {/* Since we can't load the actual 3D image, we'll create a stylized representation to match the layout intent */}
            <div className="relative w-full h-full flex items-end justify-center pb-10">
               {/* Body mock */}
               <div className="w-48 h-56 bg-indigo-900 rounded-t-[100px] relative z-10">
                  {/* Laptop */}
                  <div className="absolute -left-10 bottom-10 w-64 h-40 bg-gray-800 rounded-xl transform -rotate-6 flex flex-col justify-between p-2 shadow-2xl">
                      <div className="h-full bg-gray-900 rounded-lg flex items-center justify-center">
                         <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex flex-wrap gap-1 p-1">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                         </div>
                      </div>
                      <div className="h-2 bg-gray-700 mt-2 rounded-full w-1/2 mx-auto"></div>
                  </div>
                  {/* Hand mock */}
                  <div className="absolute right-[-20px] top-10 w-8 h-24 bg-[#f1c27d] rounded-full transform rotate-12 z-20 flex flex-col justify-start items-center pt-2">
                    <div className="w-4 h-6 bg-[#f1c27d] rounded-full -mt-4"></div>
                  </div>
               </div>
               {/* Head mock */}
               <div className="absolute top-10 w-36 h-40 bg-indigo-700 rounded-full z-20 flex justify-center items-center overflow-hidden">
                  {/* Face */}
                  <div className="w-28 h-32 bg-[#f1c27d] rounded-full mt-8 relative">
                     {/* Glasses */}
                     <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-1">
                        <div className="w-10 h-10 border-4 border-gray-800 rounded-full"></div>
                        <div className="w-10 h-10 border-4 border-gray-800 rounded-full"></div>
                        <div className="absolute top-4 left-9 w-3 h-1 bg-gray-800"></div>
                     </div>
                     {/* Smile */}
                     <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-4 border-b-2 border-gray-800 rounded-b-full"></div>
                  </div>
               </div>
               
               {/* Floating Tag */}
               <div className="absolute bottom-16 left-10 bg-white p-2 rounded-xl shadow-lg flex items-center gap-2 z-30">
                  <div className="text-xs font-bold text-gray-800">Guru<br/>Hebat</div>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">☕</div>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer / Partners (Bottom of Hero) */}
      <div className="mt-auto pt-8 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
        <p>Dipercaya oleh sekolah-sekolah di seluruh Indonesia</p>
        <div className="flex items-center gap-2">
            {/* Mock partner logos */}
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-500">Logo</div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-500">Logo</div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-500">Logo</div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-500">Logo</div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-500">Logo</div>
            <span className="ml-2 font-medium">+250 sekolah lainnya</span>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-[500px]">
      <AppLogo className="mb-8" />
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Selamat datang kembali 👋</h2>
      <p className="text-gray-500 text-sm mb-8">Masuk ke akun Anda untuk melanjutkan</p>
      
      <form className="space-y-4">
        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Email atau username" 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="password" 
              placeholder="Kata sandi" 
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            />
            <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" size={18} />
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500" />
            <span className="text-gray-600">Ingat saya</span>
          </label>
          <a href="#" className="text-indigo-500 hover:underline font-medium">Lupa kata sandi?</a>
        </div>
        
        <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
          Masuk
        </button>
      </form>
      
      <div className="my-6 flex items-center gap-4">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-xs text-gray-400">atau masuk dengan</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button className="flex justify-center items-center gap-2 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
          <GoogleIcon /> Google
        </button>
        <button className="flex justify-center items-center gap-2 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
          <MicrosoftIcon /> Microsoft
        </button>
      </div>
      
      <p className="text-center text-sm text-gray-600 mt-8">
        Belum punya akun? <a href="#" className="text-indigo-500 font-semibold hover:underline">Daftar sekarang</a>
      </p>
    </div>
  );
};

const RegisterPage = () => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex w-full max-w-4xl">
      {/* Form Side */}
      <div className="w-1/2 p-10">
        <AppLogo className="mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Buat akun baru</h2>
        <p className="text-gray-500 text-sm mb-6">Daftar untuk mulai menggunakan AppGuru</p>
        
        <form className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Nama lengkap" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 text-sm" />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="email" placeholder="Email aktif" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 text-sm" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="password" placeholder="Kata sandi" className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 text-sm" />
             <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" size={18} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="password" placeholder="Konfirmasi kata sandi" className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 text-sm" />
             <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" size={18} />
          </div>
          
          <label className="flex items-start gap-2 cursor-pointer mt-2">
            <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-gray-300 text-indigo-500" />
            <span className="text-xs text-gray-500">
              Saya setuju dengan <a href="#" className="text-indigo-500 hover:underline">Syarat & Ketentuan</a> dan <a href="#" className="text-indigo-500 hover:underline">Kebijakan Privasi</a>
            </span>
          </label>
          
          <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
            Daftar Gratis
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600 mt-6">
          Sudah punya akun? <a href="#" className="text-indigo-500 font-semibold hover:underline">Masuk di sini</a>
        </p>
      </div>
      
      {/* Illustration Side */}
      <div className="w-1/2 bg-[#f8f9ff] p-10 flex flex-col justify-center relative overflow-hidden">
         {/* Background decorative elements */}
         <div className="absolute top-10 right-10 w-20 h-20 bg-indigo-100 rounded-full blur-2xl"></div>
         <div className="absolute bottom-10 left-10 w-32 h-32 bg-pink-100 rounded-full blur-3xl"></div>
         
         <div className="relative z-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">
              Bergabunglah dengan<br/>ribuan guru hebat!
            </h3>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500"><Check size={14} /></div>
                Kelola kelas & siswa dengan mudah
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500"><Check size={14} /></div>
                Absensi & penilaian otomatis
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500"><Check size={14} /></div>
                Agenda pembelajaran terorganisir
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500"><Check size={14} /></div>
                AI membantu catatan rapor
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500"><Check size={14} /></div>
                Data aman & tersimpan otomatis
              </li>
            </ul>
            
            {/* 3D Asset Mockup (Books & Backpack) */}
            <div className="absolute bottom-[-20px] right-[-20px] w-64 h-48 opacity-80 pointer-events-none">
               {/* Simplified representation of books and bag */}
               <div className="absolute bottom-0 right-10 w-32 h-8 bg-pink-400 rounded-lg transform -rotate-6 z-10 shadow-lg"></div>
               <div className="absolute bottom-6 right-12 w-28 h-8 bg-indigo-400 rounded-lg transform -rotate-2 z-20 shadow-lg"></div>
               <div className="absolute bottom-12 right-2 w-24 h-32 bg-red-400 rounded-2xl z-30 shadow-xl opacity-90 rounded-t-[40px]"></div>
            </div>
         </div>
      </div>
    </div>
  );
};

const MobileMockup = ({ children, title }: { children: React.ReactNode, title?: string }) => (
  <div className="w-[280px] h-[580px] bg-white rounded-[40px] border-[8px] border-gray-900 shadow-xl overflow-hidden relative flex flex-col">
    {/* StatusBar */}
    <div className="h-6 flex justify-between items-center px-5 pt-1 text-[10px] font-medium text-black bg-white z-20 relative">
      <span>9:41</span>
      <div className="flex gap-1 items-center">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 3 13.09 3 16s5.91 13.09 9.5 13.09c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
      </div>
    </div>
    {/* Dynamic Island Mock */}
    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-30"></div>
    
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white pb-8 relative">
      {children}
    </div>
  </div>
);

const FeaturesSection = () => {
  const features = [
    { icon: <UserIcon size={24} className="text-indigo-500" />, title: "Absensi Digital", desc: "Catat kehadiran siswa dengan cepat dan akurat.", bg: "bg-indigo-50" },
    { icon: <TrendingUp size={24} className="text-green-500" />, title: "Penilaian Otomatis", desc: "Hitung nilai harian hingga rapor secara otomatis.", bg: "bg-green-50" },
    { icon: <Calendar size={24} className="text-orange-500" />, title: "Agenda Terstruktur", desc: "Rencanakan pembelajaran dengan kalender pintar.", bg: "bg-orange-50" },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pink-500" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>, title: "AI Catatan Rapor", desc: "Buat catatan rapor menarik dengan bantuan AI.", bg: "bg-pink-50" },
    { icon: <ShieldCheck size={24} className="text-blue-500" />, title: "Data Aman", desc: "Data tersimpan aman dan bisa diakses kapan saja.", bg: "bg-blue-50" },
  ];

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Semua yang guru butuhkan dalam satu aplikasi</h2>
      <div className="grid grid-cols-5 gap-4">
        {features.map((f, i) => (
          <div key={i} className={`p-6 rounded-2xl ${f.bg} flex flex-col items-center text-center transition-transform hover:-translate-y-1`}>
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
              {f.icon}
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-2">{f.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 lg:p-8 font-sans overflow-x-hidden flex flex-col items-center">
      
      {/* Top Row: Hero + Login */}
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1600px] mb-6">
        {/* Main Hero - takes up more space */}
        <div className="flex-1 min-w-0">
          <HeroSection />
        </div>
        
        {/* Right Column - Login + decorative image/other blocks from original design */}
        <div className="flex flex-col gap-6 w-full xl:w-[500px] shrink-0">
          <LoginPage />
          
          {/* A small mock of the desk illustration seen next to the login in the original image */}
          <div className="flex-1 bg-[#f8f9ff] rounded-3xl border border-gray-100 overflow-hidden relative min-h-[300px]">
             {/* Desk Illustration placeholder */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-50/50"></div>
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-white rounded-t-xl shadow-md flex items-end justify-center pb-4">
                 <div className="w-48 h-32 bg-gray-800 rounded-t-lg relative border-4 border-gray-200">
                    <div className="absolute inset-1 bg-white flex items-center justify-center">
                        <AppLogo className="scale-75" />
                    </div>
                 </div>
             </div>
             {/* Plants/Books mock */}
             <div className="absolute bottom-10 left-10 w-16 h-20 bg-green-200 rounded-t-full"></div>
             <div className="absolute bottom-10 right-10 w-12 h-16 bg-yellow-200 rounded-sm transform rotate-12"></div>
          </div>
        </div>
      </div>

      {/* Middle Row: Mobile Mockups + Register Form */}
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1600px]">
        
        {/* Mobile Phones Row */}
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar flex-1 items-center justify-center xl:justify-start">
          
          {/* Mobile 1: Landing */}
          <MobileMockup>
            <div className="p-4 pt-8">
              <div className="flex justify-between items-center mb-8">
                <AppLogo className="scale-90 origin-left" />
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4 text-center">
                Mengajar lebih fokus,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">Administrasi jadi mudah</span>
              </h1>
              <p className="text-sm text-gray-500 text-center mb-6">AppGuru membantu guru mengelola absensi, penilaian, agenda, dan data siswa...</p>
              
              <div className="w-full h-48 bg-indigo-50 rounded-2xl mb-6 relative overflow-hidden flex justify-center items-end">
                  {/* Mini Teacher avatar mock */}
                  <div className="w-24 h-32 bg-indigo-800 rounded-t-full relative z-10">
                     <div className="absolute -left-4 bottom-4 w-32 h-20 bg-gray-800 rounded-lg transform -rotate-6"></div>
                  </div>
              </div>

              <button className="w-full bg-indigo-500 text-white font-semibold py-3 rounded-full mb-3 text-sm">Mulai Gratis</button>
              <button className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-full flex justify-center items-center gap-2 text-sm">
                <PlayCircle size={16} /> Lihat Demo
              </button>
            </div>
          </MobileMockup>

          {/* Mobile 2: Login */}
          <MobileMockup>
             <div className="p-5 pt-12 flex flex-col items-center">
                <AppLogo className="mb-6 scale-90" />
                <h2 className="text-lg font-bold text-gray-900 mb-1">Selamat datang kembali👋</h2>
                <p className="text-xs text-gray-500 mb-6">Masuk ke akun Anda</p>
                
                <div className="w-full space-y-3 mb-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Email atau username" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-xs" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="password" placeholder="Kata sandi" className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 text-xs" />
                     <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  </div>
                </div>
                
                <div className="w-full flex justify-between items-center text-[10px] mb-6">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" className="rounded border-gray-300" /> Ingat saya
                  </label>
                  <span className="text-indigo-500 font-medium">Lupa sandi?</span>
                </div>
                
                <button className="w-full bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-sm mb-4">Masuk</button>
                
                <div className="w-full flex items-center gap-2 mb-4 text-[10px] text-gray-400">
                  <div className="h-px bg-gray-200 flex-1"></div>atau masuk dengan<div className="h-px bg-gray-200 flex-1"></div>
                </div>
                
                <div className="w-full flex gap-3 mb-8">
                  <button className="flex-1 flex justify-center border border-gray-200 py-2 rounded-lg"><GoogleIcon /></button>
                  <button className="flex-1 flex justify-center border border-gray-200 py-2 rounded-lg"><MicrosoftIcon /></button>
                </div>
                
                <p className="text-[10px] text-gray-600">Belum punya akun? <span className="text-indigo-500 font-semibold">Daftar sekarang</span></p>
             </div>
          </MobileMockup>

          {/* Mobile 3: Register */}
          <MobileMockup>
            <div className="p-5 pt-12 flex flex-col items-center">
                <AppLogo className="mb-6 scale-90" />
                <h2 className="text-lg font-bold text-gray-900 mb-1">Buat akun baru</h2>
                <p className="text-xs text-gray-500 mb-6 text-center">Daftar untuk mulai<br/>menggunakan AppGuru</p>
                
                <div className="w-full space-y-3 mb-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Nama lengkap" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-xs" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="email" placeholder="Email aktif" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-xs" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="password" placeholder="Kata sandi" className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 text-xs" />
                     <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="password" placeholder="Konfirmasi kata sandi" className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 text-xs" />
                     <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  </div>
                </div>
                
                <label className="w-full flex items-start gap-2 text-[8px] text-gray-500 mb-6 leading-tight">
                    <input type="checkbox" className="mt-0.5 rounded border-gray-300" />
                    <span>Saya setuju dengan <span className="text-indigo-500">Syarat & Ketentuan</span> dan <span className="text-indigo-500">Kebijakan Privasi</span></span>
                </label>
                
                <button className="w-full bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-sm mb-6">Daftar Gratis</button>
                
                <p className="text-[10px] text-gray-600">Sudah punya akun? <span className="text-indigo-500 font-semibold">Masuk di sini</span></p>
            </div>
          </MobileMockup>

          {/* Mobile 4: Verify Email */}
          <MobileMockup>
             <div className="p-5 pt-20 flex flex-col items-center h-full">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative">
                   <div className="w-16 h-12 bg-blue-500 rounded-md relative flex items-center justify-center z-10">
                      <div className="absolute top-0 w-0 h-0 border-l-[32px] border-r-[32px] border-t-[20px] border-l-transparent border-r-transparent border-t-blue-400"></div>
                      <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white absolute -bottom-2 -right-2 flex items-center justify-center z-20">
                         <Check size={14} className="text-white" strokeWidth={3}/>
                      </div>
                   </div>
                   {/* Sparkles mock */}
                   <span className="absolute top-2 left-2 text-green-400">✨</span>
                   <span className="absolute bottom-4 left-4 text-blue-300 text-xl">✦</span>
                </div>
                
                <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">Verifikasi email Anda</h2>
                <p className="text-xs text-gray-500 text-center mb-10 px-4">Kami telah mengirimkan link verifikasi ke email Anda.</p>
                
                <p className="text-xs text-gray-600 mb-4 font-medium">Belum menerima email?</p>
                <button className="w-full border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg text-sm mb-4">Kirim ulang email</button>
                
                <button className="text-indigo-500 font-medium text-xs mb-auto">Ganti email</button>
                
                <button className="text-indigo-500 font-medium text-xs mt-10">Kembali ke masuk</button>
             </div>
          </MobileMockup>

        </div>

        {/* Register Form Section (Right side of middle row) */}
        <div className="flex-1 xl:max-w-4xl shrink-0">
           <RegisterPage />
        </div>

      </div>

      {/* Bottom Row: Features */}
      <div className="w-full max-w-[1600px] pb-10">
         <FeaturesSection />
      </div>

    </div>
  );
}