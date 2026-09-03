import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  Ban,
  Download,
  LogOut,
  MousePointerClick,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  dashboardStats,
  listCampaigns,
  listVisits,
  type VisitFilters,
} from '@/lib/admin-repository';
import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/security/auth';
import { siteConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const safePage = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
};

function buildQuery(params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const current = one(value);
    if (current && key !== 'page') query.set(key, current);
  }
  query.set('page', String(page));
  return `/admin?${query.toString()}`;
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const session = verifyAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect('/admin/login');

  const filters: VisitFilters = {
    search: one(params.search),
    dateFrom: one(params.dateFrom),
    dateTo: one(params.dateTo),
    campaign: one(params.campaign),
    decision: one(params.decision) as VisitFilters['decision'],
    sort: one(params.sort) as VisitFilters['sort'],
    direction: one(params.direction) as VisitFilters['direction'],
    page: safePage(one(params.page)),
    pageSize: 25,
  };

  const [stats, visits, campaigns] = await Promise.all([
    dashboardStats(),
    listVisits(filters),
    listCampaigns(),
  ]);
  const returnTo = buildQuery(params, visits.page);

  const cards = [
    { label: 'Wizyty dzisiaj', value: stats.visitsToday, icon: MousePointerClick },
    { label: 'Unikalne IP', value: stats.uniqueIps, icon: Users },
    { label: 'Wejścia Google Ads', value: stats.googleAdsVisits, icon: Search },
    { label: 'Do sprawdzenia', value: stats.suspiciousVisits, icon: AlertTriangle },
    { label: 'Zablokowane', value: stats.blockedVisits, icon: Ban },
  ];

  return (
    <main className="min-h-screen bg-[#f0f2ec] text-[#171916]">
      <header className="border-b border-black/10 bg-[#111210] text-white">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-amber-400 text-xs font-black text-black">SAS</span>
            <div><p className="font-black uppercase leading-none">Panel ruchu</p><p className="mt-1 text-xs text-white/40">{siteConfig.name}</p></div>
          </div>
          <form method="post" action="/api/admin/logout">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/70 hover:text-white">Wyloguj <LogOut className="size-4" /></button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-[1540px] px-5 py-8 sm:px-8 lg:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#777d70]">Bezpieczeństwo i jakość ruchu</p><h1 className="mt-2 text-4xl font-black tracking-[-0.05em]">Przegląd ruchu</h1></div>
          <a href="/api/admin/export" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#171916] px-5 text-sm font-black text-white"><Download className="size-4" /> Eksport zatwierdzonych IP</a>
        </div>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Statystyki dzisiejsze">
          {cards.map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-[#72776c]">{label}</span><Icon className="size-4 text-[#8b9085]" /></div>
              <strong className="mt-5 block text-3xl font-black tracking-[-0.05em]">{value}</strong>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-2xl border border-black/10 bg-white p-5">
          <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <label className="text-xs font-bold text-[#666b61] xl:col-span-2">Szukaj IP
              <input name="search" defaultValue={filters.search} placeholder="np. 192.0.2.1" className="mt-1.5 h-10 w-full rounded-lg border border-black/10 px-3 text-sm text-black outline-none focus:border-amber-500" />
            </label>
            <label className="text-xs font-bold text-[#666b61]">Od daty
              <input name="dateFrom" type="date" defaultValue={filters.dateFrom} className="mt-1.5 h-10 w-full rounded-lg border border-black/10 px-3 text-sm text-black" />
            </label>
            <label className="text-xs font-bold text-[#666b61]">Do daty
              <input name="dateTo" type="date" defaultValue={filters.dateTo} className="mt-1.5 h-10 w-full rounded-lg border border-black/10 px-3 text-sm text-black" />
            </label>
            <label className="text-xs font-bold text-[#666b61]">Kampania
              <select name="campaign" defaultValue={filters.campaign ?? ''} className="mt-1.5 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-black">
                <option value="">Wszystkie</option>
                {campaigns.map((item) => <option key={item.utmCampaign} value={item.utmCampaign}>{item.utmCampaign}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-[#666b61]">Decyzja
              <select name="decision" defaultValue={filters.decision ?? ''} className="mt-1.5 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-black"><option value="">Wszystkie</option><option value="allow">allow</option><option value="review">review</option><option value="block">block</option></select>
            </label>
            <div className="flex items-end"><button className="h-10 w-full rounded-lg bg-amber-400 px-4 text-sm font-black">Filtruj</button></div>
            <label className="text-xs font-bold text-[#666b61]">Sortowanie
              <select name="sort" defaultValue={filters.sort ?? 'createdAt'} className="mt-1.5 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-black"><option value="createdAt">Czas wejścia</option><option value="riskScore">Ryzyko</option><option value="previousVisits">Liczba wizyt</option></select>
            </label>
            <label className="text-xs font-bold text-[#666b61]">Kierunek
              <select name="direction" defaultValue={filters.direction ?? 'desc'} className="mt-1.5 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-black"><option value="desc">Malejąco</option><option value="asc">Rosnąco</option></select>
            </label>
          </form>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-white">
          <div className="flex items-center justify-between border-b border-black/10 px-5 py-4"><h2 className="font-black">Ostatnie wizyty</h2><span className="text-xs text-[#72776c]">Łącznie: {visits.total}</span></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse text-left text-xs">
              <thead className="bg-[#f7f8f4] text-[#656a60]"><tr>{['Czas / IP', 'Źródło / kampania', 'GCLID', 'Wizyty', 'Ryzyko', 'Decyzja', 'Przyczyny', 'Status', 'Akcje'].map((heading) => <th key={heading} className="px-4 py-3 font-black uppercase tracking-[0.08em]">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-black/5">
                {visits.rows.map((visit) => (
                  <tr key={visit.id} className="align-top hover:bg-[#fafbf7]">
                    <td className="whitespace-nowrap px-4 py-4"><strong className="block font-mono text-[12px]">{visit.ip}</strong><span className="mt-1 block text-[#777d70]">{formatDate(visit.createdAt)}</span><span className="mt-1 block text-[#92978d]">{visit.deviceType}{visit.country ? ` · ${visit.country}` : ''}</span></td>
                    <td className="px-4 py-4"><strong className="block">{visit.source ?? 'direct'}</strong><span className="mt-1 block max-w-40 truncate text-[#777d70]">{visit.utmCampaign ?? '—'}</span></td>
                    <td className="max-w-48 px-4 py-4 font-mono text-[11px]"><span className="block truncate" title={visit.gclid ?? ''}>{visit.gclid ?? '—'}</span></td>
                    <td className="px-4 py-4 font-black">{visit.previousVisits + 1}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 font-black ${visit.riskScore >= 80 ? 'bg-red-100 text-red-700' : visit.riskScore >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{visit.riskScore}</span></td>
                    <td className="px-4 py-4"><span className={`font-black ${visit.decision === 'block' ? 'text-red-700' : visit.decision === 'review' ? 'text-amber-700' : 'text-emerald-700'}`}>{visit.decision}</span></td>
                    <td className="max-w-64 px-4 py-4 text-[#656a60]">{visit.riskReasons.join(', ')}</td>
                    <td className="px-4 py-4"><span className="block font-bold">{visit.blockStatus}</span><span className="mt-1 block text-[#777d70]">{visit.manualReviewStatus}</span></td>
                    <td className="px-4 py-4">
                      <details className="relative">
                        <summary className="cursor-pointer list-none rounded-lg border border-black/10 px-3 py-2 font-black">Zarządzaj</summary>
                        <form method="post" action="/api/admin/ip-rules" className="absolute right-0 z-20 mt-2 grid w-72 gap-2 rounded-xl border border-black/10 bg-white p-3 shadow-2xl">
                          <input type="hidden" name="ip" value={visit.ip} /><input type="hidden" name="returnTo" value={returnTo} />
                          <select name="action" className="h-9 rounded-lg border border-black/10 px-2"><option value="block_temporary">Zablokuj czasowo</option><option value="block_indefinite">Zablokuj bezterminowo</option><option value="unblock">Usuń blokadę</option><option value="allowlist">Dodaj do białej listy</option><option value="remove_allowlist">Usuń z białej listy</option><option value="approve_export">Zatwierdź do eksportu</option><option value="reject_export">Odrzuć z eksportu</option></select>
                          <input name="durationMinutes" type="number" min="5" max="43200" defaultValue="60" aria-label="Czas blokady w minutach" className="h-9 rounded-lg border border-black/10 px-2" />
                          <input name="reason" placeholder="Powód decyzji" className="h-9 rounded-lg border border-black/10 px-2" />
                          <button className="h-9 rounded-lg bg-[#171916] font-black text-white">Zapisz decyzję</button>
                        </form>
                      </details>
                    </td>
                  </tr>
                ))}
                {visits.rows.length === 0 && <tr><td colSpan={9} className="px-5 py-16 text-center text-[#777d70]">Brak wizyt pasujących do filtrów.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-black/10 px-5 py-4 text-sm">
            <a aria-disabled={visits.page <= 1} className={`rounded-lg border border-black/10 px-4 py-2 font-bold ${visits.page <= 1 ? 'pointer-events-none opacity-40' : ''}`} href={buildQuery(params, visits.page - 1)}>Poprzednia</a>
            <span>Strona {visits.page} z {visits.pages}</span>
            <a aria-disabled={visits.page >= visits.pages} className={`rounded-lg border border-black/10 px-4 py-2 font-bold ${visits.page >= visits.pages ? 'pointer-events-none opacity-40' : ''}`} href={buildQuery(params, visits.page + 1)}>Następna</a>
          </div>
        </section>

        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#696e64]"><ShieldCheck className="mt-0.5 size-4 shrink-0" /> Wynik ryzyka jest wskaźnikiem pomocniczym. Współdzielone adresy, NAT, sieci mobilne i zmienne IP mogą reprezentować wiele osób. Eksport obejmuje wyłącznie adresy ręcznie zatwierdzone.</p>
      </div>
    </main>
  );
}
