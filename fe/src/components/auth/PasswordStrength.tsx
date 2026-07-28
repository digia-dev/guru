import clsx from 'clsx';

interface Props {
  password: string;
}

function scorePassword(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Lemah', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Cukup', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Baik', color: 'bg-yellow-500' };
  return { score, label: 'Kuat', color: 'bg-emerald-500' };
}

export default function PasswordStrength({ password }: Props) {
  if (!password) return null;
  const { score, label, color } = scorePassword(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={clsx('h-1 flex-1 rounded-full', i <= score ? color : 'bg-black/[0.06]')} />
        ))}
      </div>
      <p className="text-xs text-text-tertiary">
        Kekuatan password: <span className="font-medium" style={{ color: score >= 4 ? '#10b981' : score >= 2 ? '#f59e0b' : '#ef4444' }}>{label}</span>
      </p>
    </div>
  );
}
