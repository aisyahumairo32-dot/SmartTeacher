import React from 'react';
import {
  ArrowRight,
  BookOpen,
  FilePlus2,
  Printer,
  School,
  Table2,
} from 'lucide-react';
import {
  BankQuestion,
  ExamPackage,
  NavTab,
  SchoolIdentity,
} from '../types/exam';
import { CURRICULUM_TEMPLATES, CurriculumTemplate } from '../data/seedData';
import { summarizeQuestionDistribution } from '../utils/questionLogic';

interface BerandaViewProps {
  identity: SchoolIdentity;
  packages: ExamPackage[];
  bankQuestions: BankQuestion[];
  onNavigate: (tab: NavTab) => void;
  onOpenPackage: (pkgId: string, destination: 'buat_soal' | 'kisi_kisi' | 'cetak') => void;
  onApplyTemplate: (template: CurriculumTemplate) => void;
}

export const BerandaView: React.FC<BerandaViewProps> = ({
  identity,
  packages,
  bankQuestions,
  onNavigate,
  onOpenPackage,
  onApplyTemplate,
}) => {
  const totalQuestionsGenerated = packages.reduce(
    (sum, p) => sum + p.questions.length,
    0
  );
  const uniqueSubjects = new Set(
    packages.map((p) => p.identity.mataPelajaran.trim()).filter(Boolean)
  ).size;

  const recentPackages = packages.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero section — balanced 2-column split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-emerald-700">
              Kurikulum Merdeka · SD, SMP, dan SMA
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Susun Soal Latihan, Ulangan, dan Kisi-Kisi Lebih Cepat dan Terstruktur
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              Masukkan identitas sekolah, tujuan pembelajaran, materi pokok, dan
              komposisi tingkat kesukaran. SMART TEACHER menyusun soal, kunci
              jawaban, pembahasan, hingga kisi-kisi siap cetak dalam format PDF
              dan Word.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('buat_soal')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Buat Soal Otomatis
            </button>
            <button
              type="button"
              onClick={() => onNavigate('identitas')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <School className="h-4 w-4 text-blue-700" aria-hidden="true" />
              Atur Identitas Sekolah
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-blue-50 border-t lg:border-t-0 lg:border-l border-slate-200">
          <img
            src="/src/assets/images/hero_classroom_desk_1795761873900.jpg"
            alt="Ilustrasi meja kerja guru modern dengan buku kurikulum, kisi-kisi soal, dan perangkat digital"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* 4-column KPI strip */}
      <section aria-label="Ringkasan Statistik Soal">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Total Paket Soal</p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
              {packages.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Tersimpan di Riwayat Soal
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Butir di Bank Soal
            </p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-blue-700">
              {bankQuestions.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Siap dipakai ulang kapan saja
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Total Soal Dihasilkan
            </p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {totalQuestionsGenerated}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Mencakup {uniqueSubjects} mata pelajaran
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Profil Aktif Saat Ini
            </p>
            <p className="mt-2 text-base font-bold text-slate-900 truncate">
              {identity.mataPelajaran || 'Belum diatur'}
            </p>
            <p className="mt-1 text-xs text-slate-500 truncate">
              {identity.jenjang} · Kelas {identity.kelas} · {identity.jenisPenilaian}
            </p>
          </div>
        </div>
      </section>

      {/* Quick-start Kurikulum Merdeka Templates */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Template Cepat Kurikulum Merdeka
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Pilih contoh jenjang SD, SMP, atau SMA untuk langsung mengisi
              formulir Capaian dan Tujuan Pembelajaran.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CURRICULUM_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-blue-300 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">
                    Jenjang {tpl.jenjang}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{tpl.identityPatch.jenisPenilaian}</span>
                </div>
                <h3 className="mt-2 text-base font-bold text-slate-900">
                  {tpl.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  {tpl.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onApplyTemplate(tpl)}
                className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-sm font-semibold text-blue-700 transition-colors"
              >
                <span>Gunakan Template Ini</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Exam Packages Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Paket Soal Terbaru
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Lanjutkan pengeditan, buka kisi-kisi, atau cetak lembar soal Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('riwayat')}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
          >
            Lihat Semua Riwayat
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {recentPackages.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                Belum ada paket soal tersimpan
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Mulai buat paket soal otomatis pertama Anda sekarang.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('buat_soal')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
              >
                <FilePlus2 className="h-4 w-4" />
                Buat Soal Sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Judul Paket</th>
                    <th className="py-3 px-4">Mata Pelajaran & Kelas</th>
                    <th className="py-3 px-4">Distribusi Kesukaran</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                    <th className="py-3 px-4 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentPackages.map((pkg) => {
                    const dist = summarizeQuestionDistribution(pkg.questions);
                    return (
                      <tr
                        key={pkg.id}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">
                            {pkg.judul}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {pkg.identity.jenisPenilaian} · {pkg.paketLabel} ·{' '}
                            {pkg.identity.namaSekolah}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <p className="font-medium">
                            {pkg.identity.mataPelajaran}
                          </p>
                          <p className="text-xs text-slate-500">
                            Kelas {pkg.identity.kelas} · Semester{' '}
                            {pkg.identity.semester}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 font-mono tabular-nums">
                          Mudah {dist.byDifficulty.mudah} · Sedang{' '}
                          {dist.byDifficulty.sedang} · Sulit{' '}
                          {dist.byDifficulty.sulit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {pkg.questions.length} soal
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenPackage(pkg.id, 'buat_soal')}
                              className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenPackage(pkg.id, 'kisi_kisi')}
                              aria-label={`Buka kisi-kisi ${pkg.judul}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                            >
                              <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Kisi-Kisi
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenPackage(pkg.id, 'cetak')}
                              aria-label={`Cetak dan unduh ${pkg.judul}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-emerald-700 hover:bg-emerald-50 whitespace-nowrap"
                            >
                              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                              Cetak
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
