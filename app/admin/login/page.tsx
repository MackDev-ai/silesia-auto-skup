import { LockKeyhole, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const errors: Record<string, string> = {
  invalid: 'Sprawdź format adresu e-mail i hasło.',
  credentials: 'Nieprawidłowe dane logowania.',
  rate: 'Zbyt wiele prób. Spróbuj ponownie za kilkanaście minut.',
  database: 'Baza danych nie jest jeszcze skonfigurowana.',
  infrastructure: 'Nie można bezpiecznie ustalić adresu IP. Sprawdź konfigurację zaufanego proxy.',
};

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#10120f] px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#181a17] p-7 shadow-2xl sm:p-9">
        <div className="flex items-center justify-between">
          <span className="grid size-12 place-items-center rounded-full bg-amber-400 text-black"><LockKeyhole className="size-5" /></span>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">Panel prywatny</span>
        </div>
        <h1 className="mt-10 text-4xl font-black uppercase leading-none tracking-[-0.055em]">Logowanie<br />administratora</h1>
        <p className="mt-4 text-sm leading-6 text-white/45">Dostęp jest rejestrowany i przeznaczony wyłącznie dla uprawnionego administratora.</p>
        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
            {errors[error] ?? 'Logowanie nie powiodło się.'}
          </p>
        )}
        <form method="post" action="/api/admin/login" className="mt-7 space-y-4">
          <label className="block text-sm font-bold">
            E-mail administratora
            <input name="email" type="email" required autoComplete="username" className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 font-normal outline-none transition focus:border-amber-400" />
          </label>
          <label className="block text-sm font-bold">
            Hasło
            <input name="password" type="password" required autoComplete="current-password" className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 font-normal outline-none transition focus:border-amber-400" />
          </label>
          <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 font-black text-black transition hover:bg-amber-300">
            Zaloguj bezpiecznie <ShieldCheck className="size-4" />
          </button>
        </form>
      </section>
    </main>
  );
}
