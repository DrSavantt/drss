import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [_attempts, setAttempts] = useState(0);
  const [lockout, setLockout] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Check lockout state from localStorage on mount
  useEffect(() => {
    const lockTS = +(localStorage.getItem('PIN_LOCKOUT') || 0);
    if (Date.now() < lockTS) setLockout(lockTS);
  }, []);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  // Timer for lockout
  useEffect(() => {
    if (!lockout) return;
    const timer = setInterval(() => {
      if (Date.now() >= (lockout || 0)) { setLockout(null); localStorage.removeItem('PIN_LOCKOUT'); setAttempts(0); setError(''); }
    }, 500);
    return () => clearInterval(timer);
  }, [lockout]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (lockout) return;
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(val);
    setError('');
    if (val.length === 6) verify(val);
  };

  const verify = async (value: string) => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/verify-pin', { method: 'POST', body: JSON.stringify({ pin: value }), headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    setLoading(false);
    if (data.success) { setPin(''); onClose(); router.push('/dashboard'); }
    else {
      setAttempts(a => {
        const next = a + 1;
        if (next >= 3) {
          const until = Date.now() + 15 * 60 * 1000;
          setLockout(until); localStorage.setItem('PIN_LOCKOUT', String(until));
          setError('Too many failures. Locked for 15 minutes.');
        } else {
          setError('Incorrect PIN. Please try again.');
        }
        return next;
      });
      setPin('');
    }
  };

  if (!open) return null;

  const remaining = lockout ? Math.max(0, Math.floor((lockout - Date.now())/1000)) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
      aria-modal="true" role="dialog" tabIndex={-1}
      onClick={onClose}
    >
      <div className="bg-charcoal rounded-xl p-8 w-full max-w-xs mx-auto text-center relative" onClick={e => e.stopPropagation()} style={{ transition: 'opacity .3s' }}>
        <h2 className="font-bold text-xl mb-4 text-foreground">Admin PIN</h2>
        {lockout ? (
          <div className="text-error mb-2 font-semibold">Locked for {Math.ceil(remaining/60)}m {remaining%60}s</div>
        ) : null}
        <div>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={loading || !!lockout}
            value={pin}
            onChange={handleInput}
            autoFocus
            className="mb-3 block w-full text-center text-2xl tracking-widest px-4 py-2 rounded-lg border border-mid-gray bg-dark-gray text-foreground"
            placeholder="••••••"
            maxLength={6}
          />
          {loading && (
            <div className="text-sm text-silver mb-3">Checking...</div>
          )}
        </div>
        <div className="mt-3 text-sm min-h-[20px] text-error">{error}</div>
        <button onClick={onClose} className="absolute top-2 right-2 text-silver hover:text-red-primary text-lg">×</button>
      </div>
    </div>
  );
}
