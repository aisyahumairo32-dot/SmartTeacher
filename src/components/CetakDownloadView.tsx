import React, { useState } from 'react';
import {
  Archive,
  Download,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Printer,
} from 'lucide-react';
import {
  AppSettings,
  COGNITIVE_LABELS,
  DIFFICULTY_SHORT_LABELS,
  ExamPackage,
  QUESTION_TYPE_LABELS,
} from '../types/exam';
import {
  generateKisiKisiRows,
  getExamMatchingColumns,
} from '../utils/questionLogic';
import {
  exportAnswerKeyToPdf,
  exportAnswerKeyToWord,
  exportExamToPdf,
  exportExamToWord,
  exportKisiKisiToPdf,
  exportKisiKisiToWord,
} from '../utils/exporters';

interface CetakDownloadViewProps {
  packages: ExamPackage[];
  activePackage: ExamPackage | null;
  settings: AppSettings;
  onSelectActivePackage: (pkgId: string) => void;
  onSavePackageToBank: (pkg: ExamPackage) => void;
  onNotify: (message: string, tone?: 'success' | 'info' | 'error') => void;
}

type PreviewDocTab = 'lembar_soal' | 'kunci_jawaban' | 'kisi_kisi';

export const CetakDownloadView: React.FC<CetakDownloadViewProps> = ({
  packages,
  activePackage,
  settings,
  onSelectActivePackage,
  onSavePackageToBank,
  onNotify,
}) => {
  const [previewTab, setPreviewTab] = useState<PreviewDocTab>('lembar_soal');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  if (!activePackage) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
        <Printer className="h-8 w-8 text-slate-400 mx-auto" />
        <p className="text-base font-bold text-slate-900">
          Belum ada paket soal untuk dicetak atau diunduh
        </p>
        <p className="text-sm text-slate-500">
          Buat atau pilih paket soal terlebih dahulu.
        </p>
      </div>
    );
  }

  const { identity } = activePackage;
  const kisiRows = generateKisiKisiRows(activePackage);

  const runExport = async (key: string, fn: () => void | Promise<void>, successMsg: string) => {
    setBusyAction(key);
    try {
      await fn();
      onNotify(successMsg, 'success');
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Gagal mengekspor dokumen.',
        'error'
      );
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Package Selector */}
      <div className="no-print flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cetak dan Download Dokumen Soal
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Unduh lembar soal, kunci jawaban terpisah, dan kisi-kisi dalam format
            PDF atau Microsoft Word (.docx) yang siap dibagikan ke siswa.
          </p>
        </div>

        <select
          aria-label="Pilih paket soal yang akan dicetak atau diunduh"
          value={activePackage.id}
          onChange={(e) => onSelectActivePackage(e.target.value)}
          className="px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 bg-white max-w-md"
        >
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.judul} ({p.questions.length} soal)
            </option>
          ))}
        </select>
      </div>

      {/* 6 Required Action Buttons (Section H) */}
      <section
        aria-label="Aksi Ekspor dan Cetak"
        className="no-print bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() =>
              runExport(
                'soal-pdf',
                () => exportExamToPdf(activePackage, settings),
                'Lembar soal (PDF) berhasil diunduh.'
              )
            }
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors text-left"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>1. Download Soal dalam PDF</span>
          </button>

          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() =>
              runExport(
                'soal-word',
                () => exportExamToWord(activePackage, settings),
                'Lembar soal (Word .docx) berhasil diunduh.'
              )
            }
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 text-sm font-semibold hover:bg-blue-100 transition-colors text-left"
          >
            <FileText className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
            <span>2. Download Soal dalam Word</span>
          </button>

          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() =>
              runExport(
                'kunci-pdf',
                () => exportAnswerKeyToPdf(activePackage),
                'Kunci jawaban & pembahasan terpisah (PDF) berhasil diunduh.'
              )
            }
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors text-left"
          >
            <KeyRound className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>3. Download Kunci Jawaban Terpisah</span>
          </button>

          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() =>
              runExport(
                'kisi-pdf',
                () => exportKisiKisiToPdf(activePackage),
                'Kisi-kisi soal (PDF) berhasil diunduh.'
              )
            }
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors text-left"
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
            <span>4. Download Kisi-Kisi Soal</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors text-left"
          >
            <Printer className="h-4 w-4 shrink-0 text-slate-700" aria-hidden="true" />
            <span>5. Cetak Langsung</span>
          </button>

          <button
            type="button"
            onClick={() => onSavePackageToBank(activePackage)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors text-left"
          >
            <Archive className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>6. Simpan sebagai Bank Soal</span>
          </button>
        </div>

        {/* Extra Word downloads for Kunci & Kisi-Kisi */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg gap-1" role="tablist">
            {(
              [
                { id: 'lembar_soal', label: 'Pratinjau Lembar Soal' },
                { id: 'kunci_jawaban', label: 'Pratinjau Kunci Jawaban' },
                { id: 'kisi_kisi', label: 'Pratinjau Kisi-Kisi' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={previewTab === tab.id}
                onClick={() => setPreviewTab(tab.id)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  previewTab === tab.id
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            <button
              type="button"
              onClick={() =>
                runExport(
                  'kunci-word',
                  () => exportAnswerKeyToWord(activePackage),
                  'Kunci jawaban (Word .docx) berhasil diunduh.'
                )
              }
              className="font-semibold text-blue-700 hover:underline"
            >
              Unduh Kunci Jawaban (.docx)
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() =>
                runExport(
                  'kisi-word',
                  () => exportKisiKisiToWord(activePackage),
                  'Kisi-kisi soal (Word .docx) berhasil diunduh.'
                )
              }
              className="font-semibold text-blue-700 hover:underline"
            >
              Unduh Kisi-Kisi (.docx)
            </button>
          </div>
        </div>
      </section>

      {/* Printable A4 Paper Preview */}
      <section className="print-surface bg-white border border-slate-200 rounded-xl p-6 sm:p-10 max-w-4xl mx-auto text-slate-900">
        {previewTab === 'lembar_soal' && (
          <div className="space-y-6">
            {/* Official Indonesian Kop Identitas Sekolah */}
            <header className="text-center pb-4 border-b-[3px] border-double border-slate-900">
              <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide">
                {identity.namaSekolah}
              </h2>
              {identity.alamatSekolah && (
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  {identity.alamatSekolah}
                </p>
              )}
              <p className="text-sm sm:text-base font-bold uppercase mt-2">
                LEMBAR SOAL {identity.jenisPenilaian} ({activePackage.paketLabel})
              </p>
            </header>

            {/* Complete Student & Subject Identity Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs sm:text-sm border border-slate-300 rounded-lg p-4">
              <div className="space-y-1.5">
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-slate-600">Mata Pelajaran</span>
                  <span className="col-span-7 font-semibold">
                    : {identity.mataPelajaran}
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-slate-600">Kelas / Semester</span>
                  <span className="col-span-7 font-semibold">
                    : {identity.kelas} / {identity.semester}
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-slate-600">Tahun Pelajaran</span>
                  <span className="col-span-7 font-semibold">
                    : <span className="font-mono tabular-nums">{identity.tahunPelajaran}</span>
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-slate-600">Nama Guru</span>
                  <span className="col-span-7 font-semibold">
                    : {identity.namaGuru}
                    {settings.tampilkanNipDiKop && identity.nip
                      ? ` (NIP. ${identity.nip})`
                      : ''}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-6">
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-slate-600">Nama Siswa</span>
                  <span className="col-span-7">
                    : ..........................................
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-slate-600">Nomor Absen</span>
                  <span className="col-span-7">
                    : ..........................................
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-slate-600">Hari / Tanggal</span>
                  <span className="col-span-7">
                    : ..........................................
                  </span>
                </div>
                <div className="grid grid-cols-12 items-center">
                  <span className="col-span-5 text-slate-600">
                    Waktu / Nilai
                  </span>
                  <span className="col-span-7 flex items-center justify-between gap-2">
                    <span>
                      : <span className="font-mono tabular-nums">{settings.alokasiWaktuMenit} Menit</span>
                    </span>
                    <span className="inline-flex items-center border border-slate-400 rounded px-2.5 py-0.5 text-xs font-semibold min-w-[86px]">
                      Nilai:
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {settings.tampilkanPetunjukUmum && (
              <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
                <p className="font-bold text-slate-900">Petunjuk Umum:</p>
                <ol className="list-decimal pl-5 space-y-0.5">
                  <li>
                    Tulislah nama lengkap, nomor absen, dan hari/tanggal pada
                    kolom yang tersedia di atas.
                  </li>
                  <li>
                    Bacalah setiap soal dengan teliti sebelum menentukan jawaban.
                  </li>
                  <li>
                    Periksa kembali seluruh jawaban Anda sebelum diserahkan
                    kepada guru.
                  </li>
                </ol>
              </div>
            )}

            {/* Questions Body */}
            <ol className="space-y-5 pt-2">
              {activePackage.questions.map((q, idx) => (
                <li
                  key={q.id}
                  className="print-break-avoid text-sm leading-relaxed space-y-2"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono font-bold tabular-nums shrink-0 w-6">
                      {q.nomor || idx + 1}.
                    </span>
                    <div className="flex-1 space-y-2">
                      <p className="whitespace-pre-line">
                        <span className="text-xs font-semibold text-slate-500 mr-1.5">
                          [{QUESTION_TYPE_LABELS[q.type]}]
                        </span>
                        {q.pertanyaan}
                      </p>

                      {(q.type === 'pilihan_ganda' ||
                        q.type === 'pilihan_ganda_kompleks') &&
                        q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pl-1">
                            {q.options.map((opt) => (
                              <p key={opt.label} className="text-sm">
                                <span className="font-semibold mr-1.5">
                                  {opt.label}.
                                </span>
                                {opt.text}
                              </p>
                            ))}
                          </div>
                        )}

                      {q.type === 'benar_salah' && (
                        <p className="text-xs text-slate-600 pl-1">
                          Jawaban: [ &nbsp; ] Benar &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Salah
                        </p>
                      )}

                      {q.type === 'menjodohkan' && q.matchingPairs && (() => {
                        const display = getExamMatchingColumns(q.matchingPairs);
                        return (
                          <table className="w-full text-xs border border-slate-300 mt-1">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-300">
                                <th className="py-1.5 px-2 text-left border-r border-slate-300 w-8">
                                  No
                                </th>
                                <th className="py-1.5 px-2 text-left border-r border-slate-300">
                                  Pernyataan (Kolom A)
                                </th>
                                <th className="py-1.5 px-2 text-center border-r border-slate-300 w-20">
                                  Pasangan
                                </th>
                                <th className="py-1.5 px-2 text-left">
                                  Pilihan (Kolom B)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {display.leftItems.map((leftItem, pIdx) => {
                                const rightItem = display.rightItems[pIdx];
                                return (
                                  <tr key={leftItem.number}>
                                    <td className="py-1.5 px-2 border-r border-slate-300 font-mono">
                                      {leftItem.number}
                                    </td>
                                    <td className="py-1.5 px-2 border-r border-slate-300">
                                      {leftItem.text}
                                    </td>
                                    <td className="py-1.5 px-2 text-center border-r border-slate-300">
                                      ( ...... )
                                    </td>
                                    <td className="py-1.5 px-2">
                                      {rightItem.letter}. {rightItem.text}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        );
                      })()}

                      {q.type === 'isian_singkat' && (
                        <p className="text-xs text-slate-500 pt-1">
                          Jawaban: ................................................................................................
                        </p>
                      )}

                      {q.type === 'uraian' && (
                        <div className="space-y-4 pt-2">
                          <div className="border-b border-dotted border-slate-400" />
                          <div className="border-b border-dotted border-slate-400" />
                          <div className="border-b border-dotted border-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {/* Footer signature */}
            <footer className="pt-8 flex justify-end text-xs sm:text-sm">
              <div className="text-center space-y-14 min-w-[200px]">
                <div>
                  <p>{settings.kotaTanggalCetak}</p>
                  <p>Guru Mata Pelajaran,</p>
                </div>
                <div>
                  <p className="font-bold underline">{identity.namaGuru}</p>
                  {settings.tampilkanNipDiKop && identity.nip && (
                    <p className="text-xs font-mono">NIP. {identity.nip}</p>
                  )}
                </div>
              </div>
            </footer>
          </div>
        )}

        {previewTab === 'kunci_jawaban' && (
          <div className="space-y-5">
            <header className="text-center pb-3 border-b-2 border-slate-900">
              <h2 className="text-lg font-extrabold uppercase">
                KUNCI JAWABAN DAN PEMBAHASAN
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {identity.namaSekolah} · {identity.mataPelajaran} · Kelas{' '}
                {identity.kelas} ({identity.semester}) · {activePackage.paketLabel}
              </p>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-left border border-slate-300 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="py-2 px-3 border-r border-slate-300 text-center w-12">
                      No
                    </th>
                    <th className="py-2 px-3 border-r border-slate-300">
                      Bentuk &amp; Level
                    </th>
                    <th className="py-2 px-3 border-r border-slate-300">
                      Kunci Jawaban
                    </th>
                    <th className="py-2 px-3">Pembahasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 align-top">
                  {activePackage.questions.map((q, idx) => (
                    <tr key={q.id}>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono font-bold">
                        {q.nomor || idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 whitespace-nowrap">
                        <p className="font-medium">
                          {QUESTION_TYPE_LABELS[q.type]}
                        </p>
                        <p className="text-xs text-slate-500">
                          {DIFFICULTY_SHORT_LABELS[q.difficulty]} ·{' '}
                          {COGNITIVE_LABELS[q.cognitiveLevel]}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 font-semibold text-emerald-800">
                        {q.kunciJawaban}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 leading-relaxed">
                        {q.pembahasan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {previewTab === 'kisi_kisi' && (
          <div className="space-y-5">
            <header className="text-center pb-3 border-b-2 border-slate-900">
              <h2 className="text-lg font-extrabold uppercase">
                KISI-KISI PENULISAN SOAL
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {identity.namaSekolah} · {identity.jenisPenilaian} ·{' '}
                {identity.mataPelajaran} · Kelas {identity.kelas} ·{' '}
                {identity.tahunPelajaran}
              </p>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-left border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="py-2 px-2 border-r border-slate-300 text-center">
                      No
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300">
                      Tujuan Pembelajaran
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300">
                      Materi
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300">
                      Indikator Soal
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300">
                      Bentuk
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300">
                      Kesukaran
                    </th>
                    <th className="py-2 px-2">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 align-top">
                  {kisiRows.map((row) => (
                    <tr key={row.nomorSoal}>
                      <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-bold">
                        {row.nomorSoal}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-300">
                        {row.tujuanPembelajaran}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-300">
                        {row.materi}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-300">
                        {row.indikatorSoal}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-300 whitespace-nowrap">
                        {row.bentukSoal}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-300 whitespace-nowrap">
                        {row.tingkatKesukaran}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap font-mono">
                        {row.levelKognitif}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
