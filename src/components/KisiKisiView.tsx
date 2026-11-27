import React from 'react';
import { Download, FileText, Table2 } from 'lucide-react';
import { ExamPackage } from '../types/exam';
import {
  generateKisiKisiRows,
  summarizeQuestionDistribution,
} from '../utils/questionLogic';
import { exportKisiKisiToPdf, exportKisiKisiToWord } from '../utils/exporters';

interface KisiKisiViewProps {
  packages: ExamPackage[];
  activePackage: ExamPackage | null;
  onSelectActivePackage: (pkgId: string) => void;
  onNotify: (message: string, tone?: 'success' | 'info' | 'error') => void;
}

export const KisiKisiView: React.FC<KisiKisiViewProps> = ({
  packages,
  activePackage,
  onSelectActivePackage,
  onNotify,
}) => {
  if (!activePackage) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
        <Table2 className="h-8 w-8 text-slate-400 mx-auto" />
        <p className="text-base font-bold text-slate-900">
          Belum ada paket soal untuk ditampilkan kisi-kisinya
        </p>
        <p className="text-sm text-slate-500">
          Buat paket soal terlebih dahulu di menu Buat Soal.
        </p>
      </div>
    );
  }

  const rows = generateKisiKisiRows(activePackage);
  const summary = summarizeQuestionDistribution(activePackage.questions);

  const handleDownloadPdf = () => {
    exportKisiKisiToPdf(activePackage);
    onNotify('Kisi-kisi soal (PDF) berhasil diunduh.', 'success');
  };

  const handleDownloadWord = async () => {
    await exportKisiKisiToWord(activePackage);
    onNotify('Kisi-kisi soal (Word .docx) berhasil diunduh.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & Exports */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kisi-Kisi Penulisan Soal
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Dihasilkan otomatis dan selalu sinkron dengan setiap perubahan butir
            soal pada paket aktif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Pilih paket soal untuk kisi-kisi"
            value={activePackage.id}
            onChange={(e) => onSelectActivePackage(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 bg-white max-w-xs"
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.judul} ({p.questions.length} soal)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 whitespace-nowrap"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </button>

          <button
            type="button"
            onClick={handleDownloadWord}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 whitespace-nowrap"
          >
            <FileText className="h-4 w-4 text-blue-700" aria-hidden="true" />
            Download Word
          </button>
        </div>
      </div>

      {/* Distribution overview strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Total Butir Soal</p>
          <p className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900">
            {summary.total} soal
          </p>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            Total bobot skor: {summary.totalScore}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">
            Tingkat Rendah (Mudah)
          </p>
          <p className="mt-1 text-xl font-bold font-mono tabular-nums text-emerald-700">
            {summary.byDifficulty.mudah} soal
          </p>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            {summary.total > 0
              ? Math.round((summary.byDifficulty.mudah / summary.total) * 100)
              : 0}
            % dari total
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Tingkat Sedang</p>
          <p className="mt-1 text-xl font-bold font-mono tabular-nums text-blue-700">
            {summary.byDifficulty.sedang} soal
          </p>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            {summary.total > 0
              ? Math.round((summary.byDifficulty.sedang / summary.total) * 100)
              : 0}
            % dari total
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">
            Tingkat Sulit (Tinggi)
          </p>
          <p className="mt-1 text-xl font-bold font-mono tabular-nums text-amber-700">
            {summary.byDifficulty.sulit} soal
          </p>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            {summary.total > 0
              ? Math.round((summary.byDifficulty.sulit / summary.total) * 100)
              : 0}
            % dari total
          </p>
        </div>
      </div>

      {/* Identity metadata strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-slate-500 block">Satuan Pendidikan</span>
          <strong className="text-slate-900">
            {activePackage.identity.namaSekolah}
          </strong>
        </div>
        <div>
          <span className="text-slate-500 block">Mata Pelajaran</span>
          <strong className="text-slate-900">
            {activePackage.identity.mataPelajaran}
          </strong>
        </div>
        <div>
          <span className="text-slate-500 block">Kelas / Semester</span>
          <strong className="text-slate-900">
            Kelas {activePackage.identity.kelas} /{' '}
            {activePackage.identity.semester} (
            {activePackage.identity.tahunPelajaran})
          </strong>
        </div>
        <div>
          <span className="text-slate-500 block">Guru Penyusun</span>
          <strong className="text-slate-900">
            {activePackage.identity.namaGuru}
          </strong>
        </div>
      </div>

      {/* Structured Kisi-Kisi Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-700 text-white text-xs font-semibold">
                <th className="py-3 px-3 text-center w-14">No. Soal</th>
                <th className="py-3 px-4 min-w-[200px]">Tujuan Pembelajaran</th>
                <th className="py-3 px-4 min-w-[150px]">Materi</th>
                <th className="py-3 px-4 min-w-[220px]">Indikator Soal</th>
                <th className="py-3 px-4 whitespace-nowrap">Bentuk Soal</th>
                <th className="py-3 px-4 whitespace-nowrap">
                  Tingkat Kesukaran
                </th>
                <th className="py-3 px-4 whitespace-nowrap">Level Kognitif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {rows.map((row) => (
                <tr key={row.nomorSoal} className="hover:bg-blue-50/30 align-top">
                  <td className="py-3.5 px-3 text-center font-mono font-bold tabular-nums text-blue-700">
                    {row.nomorSoal}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 leading-relaxed">
                    {row.tujuanPembelajaran}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {row.materi}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 leading-relaxed">
                    {row.indikatorSoal}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 whitespace-nowrap">
                    {row.bentukSoal}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold">
                    <span
                      className={
                        row.tingkatKesukaran === 'Mudah'
                          ? 'text-emerald-700'
                          : row.tingkatKesukaran === 'Sedang'
                            ? 'text-blue-700'
                            : 'text-amber-700'
                      }
                    >
                      {row.tingkatKesukaran}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                    {row.levelKognitif}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
