import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  sideTitle?: string;
  sideSubtitle?: string;
}

export default function AuthLayout({ children, title, subtitle, sideTitle, sideSubtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side — form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-12 py-8 max-w-xl mx-auto lg:mx-0 lg:ml-auto lg:mr-0">
        <div className="w-full">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <i className="fas fa-flask text-white text-sm"></i>
            </div>
            <span className="text-base font-bold tracking-tight">AppGuru</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-[32px] font-bold tracking-tight text-text-primary">{title}</h1>
            <p className="text-text-tertiary mt-1.5">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>

      {/* Right side — visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
            <i className="fas fa-flask text-white text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">{sideTitle || 'Manajemen Guru Modern'}</h2>
          <p className="text-white/80 text-lg leading-relaxed">{sideSubtitle || 'Platform administrasi sekolah yang dirancang khusus untuk kebutuhan guru Indonesia.'}</p>
        </div>
      </div>
    </div>
  );
}
