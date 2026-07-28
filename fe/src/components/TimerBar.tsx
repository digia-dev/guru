import { useImpersonation } from '../context/ImpersonationContext';

export default function TimerBar() {
  const { viewingAs, remainingSeconds, stopImpersonating } = useImpersonation();

  if (!viewingAs) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progress = (remainingSeconds / (10 * 60)) * 100;
  const isWarning = remainingSeconds < 60;
  const isCritical = remainingSeconds < 30;

  return (
    <div className={`sticky top-0 z-[60] transition-colors ${isCritical ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-indigo-600'}`}>
      <div className="max-w-screen-xl mx-auto px-4 py-1.5 flex items-center justify-between text-white text-xs">
        <div className="flex items-center gap-2">
          <i className="fas fa-eye text-[10px]"></i>
          <span className="font-medium">Melihat sebagai {viewingAs.teacherName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <button
            onClick={stopImpersonating}
            className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-lg transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
      <div className="h-0.5 bg-white/10">
        <div
          className="h-full bg-white/40 transition-all duration-1000 linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
