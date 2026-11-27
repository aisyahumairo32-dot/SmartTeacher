import React, { useRef, useState } from 'react';
import { Download, RotateCcw, Save, Upload } from 'lucide-react';
import { AppSettings } from '../types/exam';

interface PengaturanViewProps {
  settings: AppSettings;
  onSaveSettings: (next: AppSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonText: string) => void;
  onResetDefaults: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  settings,
  onSaveSettings,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportBackup(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan Aplikasi
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Atur standar format lembar soal, jumlah pilihan jawaban bawaan, serta
          cadangan data lokal Anda.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        <h2 className="text-base font-bold text-slate-900">
          Format Lembar Soal &amp; Standar Pilihan Ganda
        </h2>

        <div>
          <span className="block text-sm font-semibold text-slate-800 mb-2">
            Jumlah Pilihan Jawaban Pilihan Ganda Bawaan
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-lg gap-1">
            {([4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, jumlahPilihanPG: n }))
                }
                className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  form.jumlahPilihanPG === n
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {n} Pilihan ({n === 4 ? 'A–D · SD/SMP' : 'A–E · SMA'})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="alokasiWaktu"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Alokasi Waktu Pengerjaan (Menit)
            </label>
            <input
              id="alokasiWaktu"
              type="number"
              min={10}
              max={240}
              value={form.alokasiWaktuMenit}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  alokasiWaktuMenit: Math.max(
                    10,
                    parseInt(e.target.value || '60', 10) || 60
                  ),
                }))
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="kotaTanggal"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Kota &amp; Tanggal Tanda Tangan
            </label>
            <input
              id="kotaTanggal"
              type="text"
              value={form.kotaTanggalCetak}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  kotaTanggalCetak: e.target.value,
                }))
              }
              placeholder="Contoh: Bandung, November 2026"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex items-center gap-3 text-sm text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={form.tampilkanNipDiKop}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tampilkanNipDiKop: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-700"
            />
            <span>Tampilkan NIP guru pada kop lembar soal &amp; tanda tangan</span>
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={form.tampilkanPetunjukUmum}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tampilkanPetunjukUmum: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-700"
            />
            <span>Tampilkan kotak Petunjuk Umum pengerjaan di lembar soal</span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Simpan Pengaturan
          </button>
        </div>
      </form>

      {/* Data Backup & Reset */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Cadangan &amp; Pemulihan Data
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ekspor seluruh identitas, riwayat paket soal, dan bank soal ke berkas
            JSON untuk dipindahkan ke perangkat lain.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportBackup}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-blue-700" aria-hidden="true" />
            Unduh Cadangan (.json)
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50"
          >
            <Upload className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            Pulihkan dari Cadangan
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Kembalikan Data Contoh
            </button>
          ) : (
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetDefaults();
                  setConfirmReset(false);
                }}
                className="px-3.5 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Ya, Reset Sekarang
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
