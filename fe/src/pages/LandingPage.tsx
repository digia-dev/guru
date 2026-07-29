import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AppLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
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
      <span className="font-bold text-xl tracking-tight">AppGuru</span>
    </div>
  );
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function ParallaxSection({ children, img }: { children: React.ReactNode; img: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const speed = 0.3;
      const y = (rect.top * speed);
      ref.current.style.backgroundPosition = `50% ${y}px`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${img})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useReveal();

  if (user) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <AppLogo />
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="btn-ghost text-sm">
              Masuk
            </button>
            <button onClick={() => navigate('/register')} className="btn-primary text-sm">
              Daftar Gratis
            </button>
          </div>
        </div>
      </header>

      {/* Hero — full bleed image */}
      <ParallaxSection img="https://images.unsplash.com/photo-1588072432836-e10032774350?w=1600&q=80">
        <div className="min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white/90 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Aplikasi untuk Guru, dibuat untuk Guru
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6">
                Mengajar lebih fokus,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-300">
                  administrasi jadi mudah
                </span>
              </h1>
              <p className="text-lg text-white/70 max-w-xl mb-10 leading-relaxed">
                AppGuru membantu guru mengelola absensi, penilaian, agenda, dan data siswa
                dalam satu aplikasi yang modern, cepat, dan menyenangkan.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <button onClick={() => navigate('/register')} className="bg-white text-violet-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all duration-200 shadow-xl shadow-black/10 text-base">
                  Mulai Gratis Sekarang
                  <svg className="w-4 h-4 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </button>
                <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 active:scale-[0.97] transition-all duration-200 text-base">
                  <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Lihat Demo
                </button>
              </div>
              <div className="flex items-center gap-6 sm:gap-8 mt-12 text-sm text-white/50 flex-wrap">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Mudah Digunakan
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  Aman & Terpercaya
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Auto Sync
                </span>
              </div>
            </div>
          </div>
        </div>
      </ParallaxSection>

      {/* Stats strip */}
      <div className="bg-white border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: '250+', l: 'Sekolah Pengguna' },
              { n: '5.000+', l: 'Guru Aktif' },
              { n: '50.000+', l: 'Siswa Terdata' },
              { n: '4.9', l: 'Rating Pengguna' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl sm:text-3xl font-bold text-violet-600">{s.n}</div>
                <div className="text-sm text-gray-500 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center mb-16" data-reveal style={{ opacity: 0, transform: 'translateY(24px)', transition: 'all 0.7s ease-out' }}>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Semua yang guru butuhkan
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto text-lg">
              Fitur lengkap untuk mendukung kegiatan mengajar sehari-hari
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {[
              {
                img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
                title: 'Data & Absensi Siswa',
                desc: 'Kelola biodata siswa, catat kehadiran harian, dan lihat rekap kehadiran per semester dengan visual yang jelas.',
              },
              {
                img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80',
                title: 'Penilaian Otomatis',
                desc: 'Input nilai harian, STS, dan SAS. Rata-rata, ranking, dan nilai rapor terhitung otomatis tanpa ribet.',
              },
              {
                img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
                title: 'Agenda & Kalender',
                desc: 'Atur jadwal pembelajaran, acara sekolah, dan bagikan ke siswa dalam satu kalender terpadu.',
              },
              {
                img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80',
                title: 'Materi & Analisis',
                desc: 'Simpan materi ajar, unggah file, dan pantau perkembangan siswa lewat dashboard analitik.',
              },
            ].map((f, i) => (
              <div
                key={i}
                data-reveal
                style={{
                  opacity: 0,
                  transform: 'translateY(24px)',
                  transition: `all 0.7s ease-out ${i * 0.15}s`,
                }}
                className="group bg-white rounded-2xl overflow-hidden border border-black/[0.04] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-52 overflow-hidden">
                  <img
                    src={f.img}
                    alt={f.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA with parallax image */}
      <ParallaxSection img="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80">
        <div className="py-24 lg:py-32">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-reveal style={{ opacity: 0, transform: 'translateY(24px)', transition: 'all 0.7s ease-out' }}>
              Siap untuk mencoba AppGuru?
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-lg mx-auto" data-reveal style={{ opacity: 0, transform: 'translateY(24px)', transition: 'all 0.7s ease-out 0.1s' }}>
              Daftar sekarang dan rasakan kemudahan mengelola administrasi sekolah.
            </p>
            <div data-reveal style={{ opacity: 0, transform: 'translateY(24px)', transition: 'all 0.7s ease-out 0.2s' }}>
              <button onClick={() => navigate('/register')} className="bg-white text-violet-700 font-semibold px-10 py-4 rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all duration-200 shadow-2xl shadow-black/20 text-lg">
                Daftar Gratis
                <svg className="w-5 h-5 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </ParallaxSection>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
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
              <span className="font-bold text-lg text-white">AppGuru</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} AppGuru. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
