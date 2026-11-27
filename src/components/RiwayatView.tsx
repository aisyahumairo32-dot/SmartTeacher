import React, { useMemo, useState } from 'react';
import {
  Clock,
  CopyPlus,
  Edit3,
  Printer,
  Search,
  Table2,
  Trash2,
} from 'lucide-react';
import { ExamPackage } from '../types/exam';
import { summarizeQuestionDistribution } from '../utils/questionLogic';

interface RiwayatViewProps {
  packages: ExamPackage[];
  activePackageId: string | null;
  onOpenPackage: (
    pkgId: string,
    destination: 'buat_soal' | 'kisi_kisi' | 'cetak'
  ) => void;
  onCreateVariantPackage: (pkg: ExamPackage) => void;
  onDeletePackage: (pkgId: string) => void;
}

function formatDateId(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const RiwayatView: React.FC<RiwayatViewProps> = ({
  packages,
  activePackageId,
  onOpenPackage,
  onCreateVariantPackage,
  onDeletePackage,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter(
      (p) =>
        p.judul.toLowerCase().includes(q) ||
        p.identity.mataPelajaran.toLowerCase().includes(q) ||
        p.identity.namaSekolah.toLowerCase().includes(q) ||
        p.objectives.materiPokok.toLowerCase().includes(q)
    );
  }, [packages, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Riwayat Paket Soal
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Seluruh paket soal yang telah dibuat dan variasi paket (Paket A, B,
            C) tersimpan otomatis di sini.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Cari riwayat paket soal"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, mapel, atau materi..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <Clock className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-base font-bold text-slate-900">
            Belum ada riwayat paket soal
          </p>
          <p className="text-sm text-slate-500">
            Paket soal yang Anda buat akan muncul secara otomatis di daftar ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pkg) => {
            const dist = summarizeQuestionDistribution(pkg.questions);
            const isActive = pkg.id === activePackageId;
            return (
              <article
                key={pkg.id}
                className={`bg-white border rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isActive ? 'border-blue-600' : 'border-slate-200'
                }`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-blue-700">
                      {pkg.paketLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{pkg.identity.jenisPenilaian}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {pkg.identity.jenjang} Kelas {pkg.identity.kelas}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatDateId(pkg.updatedAt)}
                    </span>
                    {isActive && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-emerald-700">
                          Sedang Aktif
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="text-base font-bold text-slate-900">
                    {pkg.judul}
                  </h2>

                  <p className="text-xs text-slate-600">
                    {pkg.identity.namaSekolah} · {pkg.identity.mataPelajaran} ·
                    Materi: {pkg.objectives.materiPokok}
                  </p>

                  <p className="text-xs font-mono tabular-nums text-slate-500">
                    Total {pkg.questions.length} soal (Mudah{' '}
                    {dist.byDifficulty.mudah} · Sedang{' '}
                    {dist.byDifficulty.sedang} · Sulit {dist.byDifficulty.sulit}
                    )
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenPackage(pkg.id, 'buat_soal')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 whitespace-nowrap"
                  >
                    <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                    Buka &amp; Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateVariantPackage(pkg)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap"
                  >
                    <CopyPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    Buat Variasi
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPackage(pkg.id, 'kisi_kisi')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Kisi-Kisi
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPackage(pkg.id, 'cetak')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 whitespace-nowrap"
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                    Cetak
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePackage(pkg.id)}
                    aria-label={`Hapus paket ${pkg.judul}`}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
