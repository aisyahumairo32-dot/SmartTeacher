import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Save } from 'lucide-react';
import {
  AssessmentType,
  EducationLevel,
  SchoolIdentity,
  SemesterType,
} from '../types/exam';

interface IdentitasViewProps {
  identity: SchoolIdentity;
  onSaveIdentity: (next: SchoolIdentity) => void;
  onGoToBuatSoal: () => void;
}

const JENJANG_OPTIONS: EducationLevel[] = ['SD', 'SMP', 'SMA'];
const SEMESTER_OPTIONS: SemesterType[] = ['Ganjil', 'Genap'];
const ASSESSMENT_OPTIONS: AssessmentType[] = [
  'Latihan',
  'Ulangan Harian',
  'PTS',
  'PAS',
  'Asesmen',
];

const KELAS_SUGGESTIONS: Record<EducationLevel, string[]> = {
  SD: ['I', 'II', 'III', 'IV', 'V', 'VI'],
  SMP: ['VII', 'VIII', 'IX'],
  SMA: ['X', 'XI', 'XII'],
};

export const IdentitasView: React.FC<IdentitasViewProps> = ({
  identity,
  onSaveIdentity,
  onGoToBuatSoal,
}) => {
  const [form, setForm] = useState<SchoolIdentity>(identity);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleChange = <K extends keyof SchoolIdentity>(
    key: K,
    value: SchoolIdentity[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedNotice(false);
  };

  const handleJenjangChange = (jenjang: EducationLevel) => {
    const validKelas = KELAS_SUGGESTIONS[jenjang];
    setForm((prev) => ({
      ...prev,
      jenjang,
      kelas: validKelas.includes(prev.kelas) ? prev.kelas : validKelas[0],
    }));
    setSavedNotice(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIdentity(form);
    setSavedNotice(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Identitas Sekolah dan Guru
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Data identitas ini otomatis digunakan pada kop lembar soal, kisi-kisi,
            kunci jawaban, serta penyesuaian tingkat bahasa soal oleh AI.
          </p>
        </div>
        {savedNotice && (
          <div
            role="status"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Identitas berhasil disimpan</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          {/* Jenjang Pendidikan selector */}
          <div>
            <span className="block text-sm font-semibold text-slate-800 mb-2">
              Jenjang Pendidikan
            </span>
            <div className="inline-flex p-1 bg-slate-100 rounded-lg gap-1">
              {JENJANG_OPTIONS.map((jenjang) => (
                <button
                  key={jenjang}
                  type="button"
                  onClick={() => handleJenjangChange(jenjang)}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors whitespace-nowrap ${
                    form.jenjang === jenjang
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {jenjang}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="namaSekolah"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                1. Nama Sekolah <span className="text-red-600">*</span>
              </label>
              <input
                id="namaSekolah"
                type="text"
                required
                value={form.namaSekolah}
                onChange={(e) => handleChange('namaSekolah', e.target.value)}
                placeholder="Contoh: SMP Negeri 1 Nusantara"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="alamatSekolah"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Alamat Sekolah (Opsional, untuk Kop Lembar Soal)
              </label>
              <input
                id="alamatSekolah"
                type="text"
                value={form.alamatSekolah}
                onChange={(e) => handleChange('alamatSekolah', e.target.value)}
                placeholder="Contoh: Jl. Merdeka Belajar No. 45, Bandung"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="namaGuru"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                2. Nama Guru <span className="text-red-600">*</span>
              </label>
              <input
                id="namaGuru"
                type="text"
                required
                value={form.namaGuru}
                onChange={(e) => handleChange('namaGuru', e.target.value)}
                placeholder="Contoh: Siti Rahmawati, S.Pd."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="nip"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                3. NIP (Opsional)
              </label>
              <input
                id="nip"
                type="text"
                value={form.nip}
                onChange={(e) => handleChange('nip', e.target.value)}
                placeholder="Contoh: 19880415 201503 2 004"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="mataPelajaran"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                4. Bidang Studi / Mata Pelajaran{' '}
                <span className="text-red-600">*</span>
              </label>
              <input
                id="mataPelajaran"
                type="text"
                required
                value={form.mataPelajaran}
                onChange={(e) => handleChange('mataPelajaran', e.target.value)}
                placeholder="Contoh: Ilmu Pengetahuan Alam (IPA)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="kelas"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                5. Kelas <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="kelas"
                  type="text"
                  required
                  value={form.kelas}
                  onChange={(e) => handleChange('kelas', e.target.value)}
                  placeholder="Contoh: VIII atau VIII-A"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                <select
                  aria-label="Pilih cepat tingkat kelas"
                  value={
                    KELAS_SUGGESTIONS[form.jenjang].includes(form.kelas)
                      ? form.kelas
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) handleChange('kelas', e.target.value);
                  }}
                  className="px-2.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Pilih</option>
                  {KELAS_SUGGESTIONS[form.jenjang].map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="semester"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                6. Semester
              </label>
              <select
                id="semester"
                value={form.semester}
                onChange={(e) =>
                  handleChange('semester', e.target.value as SemesterType)
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                {SEMESTER_OPTIONS.map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tahunPelajaran"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                7. Tahun Pelajaran
              </label>
              <input
                id="tahunPelajaran"
                type="text"
                required
                value={form.tahunPelajaran}
                onChange={(e) => handleChange('tahunPelajaran', e.target.value)}
                placeholder="Contoh: 2026/2027"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="jenisPenilaian"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                8. Jenis Penilaian
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ASSESSMENT_OPTIONS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange('jenisPenilaian', type)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                      form.jenisPenilaian === type
                        ? 'border-blue-700 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Simpan Identitas
            </button>

            <button
              type="button"
              onClick={() => {
                onSaveIdentity(form);
                onGoToBuatSoal();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              <span>Lanjut ke Buat Soal</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>

        {/* Live Kop Lembar Soal preview */}
        <aside className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pratinjau Kop Lembar Soal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tampilan otomatis di bagian atas dokumen PDF, Word, dan cetak langsung.
            </p>
          </div>

          <div className="border border-slate-300 rounded-lg p-5 bg-white text-slate-900">
            <div className="text-center pb-3 border-b-2 border-slate-900">
              <p className="text-sm font-extrabold tracking-wide uppercase">
                {form.namaSekolah || 'NAMA SEKOLAH'}
              </p>
              {form.alamatSekolah && (
                <p className="text-xs text-slate-600 mt-0.5">
                  {form.alamatSekolah}
                </p>
              )}
              <p className="text-xs font-bold uppercase mt-1.5 text-blue-900">
                LEMBAR SOAL {form.jenisPenilaian}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-3">
              <p>
                <span className="text-slate-500">Mata Pelajaran:</span>{' '}
                <strong className="text-slate-900">
                  {form.mataPelajaran || '-'}
                </strong>
              </p>
              <p>
                <span className="text-slate-500">Nama Siswa:</span>{' '}
                <span>............................</span>
              </p>
              <p>
                <span className="text-slate-500">Kelas / Sem.:</span>{' '}
                <strong className="text-slate-900">
                  {form.kelas || '-'} / {form.semester}
                </strong>
              </p>
              <p>
                <span className="text-slate-500">Nomor Absen:</span>{' '}
                <span>............................</span>
              </p>
              <p>
                <span className="text-slate-500">Tahun Pelajaran:</span>{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {form.tahunPelajaran || '-'}
                </strong>
              </p>
              <p>
                <span className="text-slate-500">Hari / Tanggal:</span>{' '}
                <span>............................</span>
              </p>
              <p className="sm:col-span-2 pt-1 border-t border-slate-200 mt-1 flex items-center justify-between gap-2">
                <span>
                  <span className="text-slate-500">Guru:</span>{' '}
                  <strong className="text-slate-900">
                    {form.namaGuru || '-'}
                  </strong>
                  {form.nip ? ` (NIP. ${form.nip})` : ''}
                </span>
                <span className="font-semibold text-slate-700 whitespace-nowrap">
                  Nilai: [ &nbsp;&nbsp;&nbsp;&nbsp; ]
                </span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
