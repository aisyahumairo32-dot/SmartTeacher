import React, { useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  CopyPlus,
  Edit3,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Trash2,
} from 'lucide-react';
import {
  AppSettings,
  COGNITIVE_LABELS,
  DIFFICULTY_SHORT_LABELS,
  DifficultyCounts,
  ExamPackage,
  LearningObjectives,
  QUESTION_TYPE_LABELS,
  QuestionItem,
  QuestionType,
  SchoolIdentity,
} from '../types/exam';
import {
  calculateTotalQuestions,
  renumberQuestions,
  shuffleAllPackageOptions,
  shuffleQuestions,
  validateGeneratorForm,
} from '../utils/questionLogic';
import { CURRICULUM_TEMPLATES, CurriculumTemplate } from '../data/seedData';
import { QuestionEditorModal } from './QuestionEditorModal';

interface BuatSoalViewProps {
  identity: SchoolIdentity;
  objectives: LearningObjectives;
  settings: AppSettings;
  activePackage: ExamPackage | null;
  allPackages: ExamPackage[];
  subView: 'form' | 'editor';
  onChangeSubView: (view: 'form' | 'editor') => void;
  onChangeObjectives: (next: LearningObjectives) => void;
  onSelectActivePackage: (pkgId: string) => void;
  onPackageCreated: (pkg: ExamPackage) => void;
  onUpdateActivePackage: (pkg: ExamPackage) => void;
  onCreateVariantPackage: (sourcePkg: ExamPackage) => void;
  onSavePackageToBank: (pkg: ExamPackage) => void;
  onApplyTemplate: (tpl: CurriculumTemplate) => void;
  onNavigateTo: (tab: 'identitas' | 'kisi_kisi' | 'cetak') => void;
  onNotify: (message: string, tone?: 'success' | 'info' | 'error') => void;
}

const QUESTION_TYPES: Array<{
  id: QuestionType;
  label: string;
  desc: string;
}> = [
  {
    id: 'pilihan_ganda',
    label: 'Pilihan Ganda',
    desc: 'Satu jawaban benar dari beberapa opsi.',
  },
  {
    id: 'pilihan_ganda_kompleks',
    label: 'Pilihan Ganda Kompleks',
    desc: 'Lebih dari satu jawaban benar.',
  },
  {
    id: 'benar_salah',
    label: 'Benar atau Salah',
    desc: 'Menilai kebenaran pernyataan.',
  },
  {
    id: 'menjodohkan',
    label: 'Menjodohkan',
    desc: 'Memasangkan premis dengan pasangan tepat.',
  },
  {
    id: 'isian_singkat',
    label: 'Isian Singkat',
    desc: 'Jawaban singkat, objektif, dan pasti.',
  },
  {
    id: 'uraian',
    label: 'Uraian / Essay',
    desc: 'Jawaban terbuka dengan analisis & alasan.',
  },
];

export const BuatSoalView: React.FC<BuatSoalViewProps> = ({
  identity,
  objectives,
  settings,
  activePackage,
  allPackages,
  subView,
  onChangeSubView,
  onChangeObjectives,
  onSelectActivePackage,
  onPackageCreated,
  onUpdateActivePackage,
  onCreateVariantPackage,
  onSavePackageToBank,
  onApplyTemplate,
  onNavigateTo,
  onNotify,
}) => {
  const setSubView = onChangeSubView;
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'pilihan_ganda',
    'benar_salah',
    'uraian',
  ]);
  const [counts, setCounts] = useState<DifficultyCounts>({
    mudah: 2,
    sedang: 2,
    sulit: 1,
  });
  const [optionCount, setOptionCount] = useState<4 | 5>(
    settings.jumlahPilihanPG
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(
    null
  );
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [showPembahasan, setShowPembahasan] = useState(true);

  const totalQuestions = calculateTotalQuestions(counts);

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setFormErrors([]);
  };

  const updateDifficultyCount = (
    key: keyof DifficultyCounts,
    rawVal: string
  ) => {
    const parsed = Math.max(0, Math.min(30, parseInt(rawVal || '0', 10) || 0));
    setCounts((prev) => ({ ...prev, [key]: parsed }));
    setFormErrors([]);
  };

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validation = validateGeneratorForm(
      identity,
      objectives,
      selectedTypes,
      counts
    );
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setFormErrors([]);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity,
          objectives,
          selectedTypes,
          counts,
          optionCount,
        }),
      });

      const data = (await response.json()) as {
        questions?: QuestionItem[];
        error?: string;
      };

      if (!response.ok || !Array.isArray(data.questions)) {
        throw new Error(
          data.error || 'Terjadi kesalahan saat menghasilkan soal otomatis.'
        );
      }

      const now = new Date().toISOString();
      const newPackage: ExamPackage = {
        id: `pkg-${Date.now()}`,
        judul: `${identity.jenisPenilaian} ${identity.mataPelajaran} Kelas ${identity.kelas} – Paket A`,
        paketLabel: 'Paket A',
        createdAt: now,
        updatedAt: now,
        identity: { ...identity },
        objectives: { ...objectives },
        questions: renumberQuestions(data.questions),
      };

      onPackageCreated(newPackage);
      setSubView('editor');
      onNotify(
        `${newPackage.questions.length} soal berhasil dibuat lengkap dengan kunci jawaban, pembahasan, dan kisi-kisi.`,
        'success'
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal terhubung ke layanan pembuat soal.';
      setApiError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSingle = async (target: QuestionItem) => {
    if (!activePackage) return;
    setRegeneratingId(target.id);
    setApiError(null);

    try {
      const response = await fetch('/api/questions/regenerate-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: activePackage.identity,
          objectives: activePackage.objectives,
          targetQuestion: target,
          existingPrompts: activePackage.questions.map((q) => q.pertanyaan),
          optionCount,
        }),
      });
      const data = (await response.json()) as {
        question?: QuestionItem;
        error?: string;
      };

      if (!response.ok || !data.question) {
        throw new Error(data.error || 'Gagal mengganti soal dengan AI.');
      }

      const updatedQuestions = activePackage.questions.map((q) =>
        q.id === target.id ? { ...data.question!, nomor: q.nomor } : q
      );

      onUpdateActivePackage({
        ...activePackage,
        updatedAt: new Date().toISOString(),
        questions: updatedQuestions,
      });
      onNotify(`Soal nomor ${target.nomor} berhasil diganti dengan soal baru.`, 'success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal mengganti soal.';
      onNotify(message, 'error');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!activePackage) return;
    const filtered = renumberQuestions(
      activePackage.questions.filter((q) => q.id !== questionId)
    );
    onUpdateActivePackage({
      ...activePackage,
      updatedAt: new Date().toISOString(),
      questions: filtered,
    });
    onNotify('Butir soal dihapus dan penomoran diperbarui.', 'info');
  };

  const handleSaveEditedOrNewQuestion = (saved: QuestionItem) => {
    if (!activePackage) return;
    const exists = activePackage.questions.some((q) => q.id === saved.id);
    const updatedList = exists
      ? activePackage.questions.map((q) => (q.id === saved.id ? saved : q))
      : [...activePackage.questions, saved];

    onUpdateActivePackage({
      ...activePackage,
      updatedAt: new Date().toISOString(),
      questions: renumberQuestions(updatedList),
    });
    setEditingQuestion(null);
    setIsAddingQuestion(false);
    onNotify(
      exists ? 'Perubahan soal berhasil disimpan.' : 'Soal baru berhasil ditambahkan.',
      'success'
    );
  };

  const handleShuffleOrder = () => {
    if (!activePackage || activePackage.questions.length < 2) return;
    const shuffled = shuffleQuestions(activePackage.questions);
    onUpdateActivePackage({
      ...activePackage,
      updatedAt: new Date().toISOString(),
      questions: shuffled,
    });
    onNotify('Urutan soal berhasil diacak dan dinomori ulang.', 'success');
  };

  const handleShuffleOptions = () => {
    if (!activePackage) return;
    const updated = shuffleAllPackageOptions(activePackage.questions);
    onUpdateActivePackage({
      ...activePackage,
      updatedAt: new Date().toISOString(),
      questions: updated,
    });
    onNotify(
      'Pilihan jawaban berhasil diacak dengan kunci jawaban yang tetap sinkron.',
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + Segmented View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Buat dan Kelola Soal Otomatis
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Lengkapi tujuan pembelajaran, jenis soal, dan pembagian kesukaran
            lalu kelola hasil soal secara langsung.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Mode Pembuatan Soal"
          className="inline-flex p-1 bg-slate-200/70 rounded-lg gap-1 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'form'}
            onClick={() => setSubView('form')}
            className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              subView === 'form'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            1. Pengaturan & Generate
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'editor'}
            onClick={() => setSubView('editor')}
            className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              subView === 'editor'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            2. Editor Hasil Soal (
            <span className="font-mono tabular-nums">
              {activePackage?.questions.length ?? 0}
            </span>
            )
          </button>
        </div>
      </div>

      {subView === 'form' ? (
        <form onSubmit={handleGenerateQuestions} className="space-y-6">
          {/* Active identity summary bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-slate-700 space-y-0.5">
              <p className="font-semibold text-slate-900">
                {identity.namaSekolah} · {identity.mataPelajaran}
              </p>
              <p className="text-xs text-slate-500">
                Guru: {identity.namaGuru} · Jenjang {identity.jenjang} Kelas{' '}
                {identity.kelas} · Semester {identity.semester} (
                {identity.tahunPelajaran}) · {identity.jenisPenilaian}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTo('identitas')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                Ubah Identitas
              </button>
              <select
                aria-label="Muat contoh materi Kurikulum Merdeka"
                defaultValue=""
                onChange={(e) => {
                  const found = CURRICULUM_TEMPLATES.find(
                    (t) => t.id === e.target.value
                  );
                  if (found) onApplyTemplate(found);
                  e.target.value = '';
                }}
                className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 text-xs font-semibold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="" disabled>
                  Isi Contoh Materi...
                </option>
                {CURRICULUM_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section B: Tujuan Pembelajaran */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tujuan Pembelajaran dan Materi (Kurikulum Merdeka)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                AI menyusun soal secara ketat berdasarkan CP, TP, materi pokok,
                dan indikator yang Anda masukkan di bawah ini.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <label
                  htmlFor="cp"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  1. Capaian Pembelajaran (CP)
                </label>
                <textarea
                  id="cp"
                  rows={2}
                  value={objectives.capaianPembelajaran}
                  onChange={(e) =>
                    onChangeObjectives({
                      ...objectives,
                      capaianPembelajaran: e.target.value,
                    })
                  }
                  placeholder="Tuliskan Capaian Pembelajaran sesuai fase (Fase A–F)..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="lg:col-span-2">
                <label
                  htmlFor="tp"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  2. Tujuan Pembelajaran (TP){' '}
                  <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="tp"
                  rows={2}
                  required
                  value={objectives.tujuanPembelajaran}
                  onChange={(e) =>
                    onChangeObjectives({
                      ...objectives,
                      tujuanPembelajaran: e.target.value,
                    })
                  }
                  placeholder="Contoh: Peserta didik mampu menjelaskan organ pencernaan manusia dan menganalisis peran enzim..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="lg:col-span-2">
                <label
                  htmlFor="materiPokok"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  3. Materi Pokok <span className="text-red-600">*</span>
                </label>
                <input
                  id="materiPokok"
                  type="text"
                  required
                  value={objectives.materiPokok}
                  onChange={(e) =>
                    onChangeObjectives({
                      ...objectives,
                      materiPokok: e.target.value,
                    })
                  }
                  placeholder="Contoh: Sistem Pencernaan Manusia dan Enzim Pencernaan"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="indikatorSoal"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  4. Indikator Soal
                </label>
                <textarea
                  id="indikatorSoal"
                  rows={2}
                  value={objectives.indikatorSoal}
                  onChange={(e) =>
                    onChangeObjectives({
                      ...objectives,
                      indikatorSoal: e.target.value,
                    })
                  }
                  placeholder="Contoh: Mengidentifikasi fungsi organ pencernaan; menghubungkan enzim dengan zat makanan..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="kompetensi"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  5. Kompetensi yang Ingin Diukur
                </label>
                <textarea
                  id="kompetensi"
                  rows={2}
                  value={objectives.kompetensi}
                  onChange={(e) =>
                    onChangeObjectives({
                      ...objectives,
                      kompetensi: e.target.value,
                    })
                  }
                  placeholder="Contoh: Pemahaman konsep, penerapan, dan penalaran kritis"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </section>

          {/* Section C: Pengaturan Jenis Soal */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Pengaturan Jenis Soal
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih satu atau beberapa jenis soal sekaligus. Jumlah soal akan
                  didistribusikan merata ke seluruh jenis yang dipilih.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 shrink-0">
                <span className="font-semibold">Opsi Pilihan Ganda:</span>
                <div className="inline-flex p-0.5 bg-slate-100 rounded-md">
                  {([4, 5] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setOptionCount(n)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        optionCount === n
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      {n} Pilihan ({n === 4 ? 'A–D' : 'A–E'})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {QUESTION_TYPES.map((item) => {
                const checked = selectedTypes.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleQuestionType(item.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    />
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">
                        {item.label}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Section D: Pembagian Tingkat Kesukaran */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Pembagian Tingkat Kesukaran Soal
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur jumlah butir untuk setiap tingkat kesukaran. Total soal
                  dihitung otomatis.
                </p>
              </div>
              <div
                data-testid="total-questions-display"
                className="text-sm font-semibold text-slate-800 whitespace-nowrap"
              >
                Total Keseluruhan:{' '}
                <span className="text-lg font-extrabold font-mono tabular-nums text-blue-700">
                  {totalQuestions}
                </span>{' '}
                Soal
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rendah / Mudah */}
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4 bg-slate-50/40">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-800">
                      1. Tingkat Rendah (Mudah)
                    </h3>
                    <span className="text-xs font-mono text-emerald-700 font-semibold">
                      C1–C2
                    </span>
                  </div>
                  <ul className="mt-2.5 space-y-1 text-xs text-slate-600 list-disc pl-4">
                    <li>Mengukur kemampuan mengingat</li>
                    <li>Memahami konsep dasar</li>
                    <li>Mengenali istilah dan pengertian</li>
                    <li>Soal sederhana dan langsung</li>
                  </ul>
                </div>
                <div>
                  <label
                    htmlFor="count-mudah"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Jumlah Soal Mudah
                  </label>
                  <input
                    id="count-mudah"
                    type="number"
                    min={0}
                    max={30}
                    value={counts.mudah}
                    onChange={(e) =>
                      updateDifficultyCount('mudah', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-base font-bold font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Sedang */}
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4 bg-slate-50/40">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-800">
                      2. Tingkat Sedang
                    </h3>
                    <span className="text-xs font-mono text-blue-700 font-semibold">
                      C2–C3
                    </span>
                  </div>
                  <ul className="mt-2.5 space-y-1 text-xs text-slate-600 list-disc pl-4">
                    <li>Mengukur kemampuan memahami</li>
                    <li>Menerapkan konsep</li>
                    <li>Menghubungkan informasi</li>
                    <li>Menganalisis contoh sederhana</li>
                  </ul>
                </div>
                <div>
                  <label
                    htmlFor="count-sedang"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Jumlah Soal Sedang
                  </label>
                  <input
                    id="count-sedang"
                    type="number"
                    min={0}
                    max={30}
                    value={counts.sedang}
                    onChange={(e) =>
                      updateDifficultyCount('sedang', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-base font-bold font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Sulit */}
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4 bg-slate-50/40">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      3. Tingkat Sulit (Tinggi)
                    </h3>
                    <span className="text-xs font-mono text-amber-700 font-semibold">
                      C4–C6
                    </span>
                  </div>
                  <ul className="mt-2.5 space-y-1 text-xs text-slate-600 list-disc pl-4">
                    <li>Mengukur kemampuan menganalisis</li>
                    <li>Mengevaluasi informasi</li>
                    <li>Memecahkan masalah</li>
                    <li>Menyusun kesimpulan &amp; alasan</li>
                  </ul>
                </div>
                <div>
                  <label
                    htmlFor="count-sulit"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Jumlah Soal Sulit
                  </label>
                  <input
                    id="count-sulit"
                    type="number"
                    min={0}
                    max={30}
                    value={counts.sulit}
                    onChange={(e) =>
                      updateDifficultyCount('sulit', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-base font-bold font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Proportion visual bar */}
            {totalQuestions > 0 && (
              <div className="space-y-1.5">
                <div className="h-2.5 w-full rounded-full overflow-hidden bg-slate-100 flex">
                  <div
                    style={{ width: `${(counts.mudah / totalQuestions) * 100}%` }}
                    className="bg-emerald-500 transition-all"
                  />
                  <div
                    style={{
                      width: `${(counts.sedang / totalQuestions) * 100}%`,
                    }}
                    className="bg-blue-600 transition-all"
                  />
                  <div
                    style={{ width: `${(counts.sulit / totalQuestions) * 100}%` }}
                    className="bg-amber-500 transition-all"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 font-mono tabular-nums">
                  <span>
                    Mudah: {Math.round((counts.mudah / totalQuestions) * 100)}% (
                    {counts.mudah})
                  </span>
                  <span>
                    Sedang: {Math.round((counts.sedang / totalQuestions) * 100)}
                    % ({counts.sedang})
                  </span>
                  <span>
                    Sulit: {Math.round((counts.sulit / totalQuestions) * 100)}% (
                    {counts.sulit})
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Validation & API Errors */}
          {(formErrors.length > 0 || apiError) && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 space-y-1.5"
            >
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {formErrors.length > 0
                    ? 'Periksa kembali data sebelum membuat soal:'
                    : 'Kendala saat menghubungi layanan AI:'}
                </span>
              </div>
              {formErrors.length > 0 && (
                <ul className="list-disc pl-6 space-y-0.5 text-xs">
                  {formErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
              {apiError && <p className="text-xs pl-6">{apiError}</p>}
            </div>
          )}

          {/* Primary Generate Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs sm:text-sm text-slate-600">
              AI akan menghasilkan{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {totalQuestions} butir soal
              </strong>{' '}
              pada{' '}
              <strong className="text-slate-900">
                {selectedTypes.length} jenis soal
              </strong>{' '}
              lengkap dengan kunci jawaban, pembahasan, indikator, dan level
              kognitif.
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {isGenerating ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Menyusun Soal Otomatis...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  BUAT SOAL OTOMATIS
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Editor & Pengelolaan Soal (Section F) */
        <div className="space-y-5">
          {!activePackage ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <SlidersHorizontal className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-slate-900">
                Belum ada paket soal aktif
              </p>
              <p className="text-sm text-slate-600">
                Gunakan tab Pengaturan &amp; Generate untuk membuat paket soal
                otomatis baru.
              </p>
              <button
                type="button"
                onClick={() => setSubView('form')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
              >
                Kembali ke Formulir Buat Soal
              </button>
            </div>
          ) : (
            <>
              {/* Package selector & management toolbar */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="active-pkg-select"
                        className="text-xs font-semibold text-slate-500"
                      >
                        Paket Aktif:
                      </label>
                      <select
                        id="active-pkg-select"
                        value={activePackage.id}
                        onChange={(e) => onSelectActivePackage(e.target.value)}
                        className="max-w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {allPackages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.judul} ({p.questions.length} soal)
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-slate-500">
                      {activePackage.identity.mataPelajaran} · Kelas{' '}
                      {activePackage.identity.kelas} ·{' '}
                      {activePackage.identity.jenisPenilaian} ·{' '}
                      {activePackage.paketLabel}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingQuestion(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 whitespace-nowrap"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Tambah Soal
                    </button>
                    <button
                      type="button"
                      onClick={handleShuffleOrder}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap"
                    >
                      <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                      Acak Urutan Soal
                    </button>
                    <button
                      type="button"
                      onClick={handleShuffleOptions}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      Acak Pilihan Jawaban
                    </button>
                    <button
                      type="button"
                      onClick={() => onCreateVariantPackage(activePackage)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 whitespace-nowrap"
                    >
                      <CopyPlus className="h-3.5 w-3.5" aria-hidden="true" />
                      Buat Paket Variasi
                    </button>
                    <button
                      type="button"
                      onClick={() => onSavePackageToBank(activePackage)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 whitespace-nowrap"
                    >
                      <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                      Simpan ke Bank Soal
                    </button>
                  </div>
                </div>

                {/* Secondary quick actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <label className="inline-flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPembahasan}
                      onChange={(e) => setShowPembahasan(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-700"
                    />
                    Tampilkan kunci jawaban &amp; pembahasan
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateActivePackage({
                          ...activePackage,
                          updatedAt: new Date().toISOString(),
                        });
                        onNotify('Kumpulan soal telah disimpan di Riwayat Soal.', 'success');
                      }}
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-700"
                    >
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      Simpan Paket
                    </button>
                    <span className="text-slate-300" aria-hidden="true">
                      |
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateTo('kisi_kisi')}
                      className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800"
                    >
                      <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Lihat Kisi-Kisi
                    </button>
                    <span className="text-slate-300" aria-hidden="true">
                      |
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateTo('cetak')}
                      className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                      Cetak &amp; Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Question cards list */}
              <div className="space-y-4">
                {activePackage.questions.map((q) => {
                  const isReplacing = regeneratingId === q.id;
                  return (
                    <article
                      key={q.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                    >
                      {/* Clean unboxed metadata header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                          <span className="font-mono font-bold text-sm text-blue-700 tabular-nums">
                            Soal #{q.nomor}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-semibold text-slate-800">
                            {QUESTION_TYPE_LABELS[q.type]}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span
                            className={`font-semibold ${
                              q.difficulty === 'mudah'
                                ? 'text-emerald-700'
                                : q.difficulty === 'sedang'
                                  ? 'text-blue-700'
                                  : 'text-amber-700'
                            }`}
                          >
                            {DIFFICULTY_SHORT_LABELS[q.difficulty]}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono text-slate-600">
                            {COGNITIVE_LABELS[q.cognitiveLevel]}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono text-slate-500 tabular-nums">
                            Skor {q.skor}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingQuestion(q)}
                            aria-label={`Edit soal nomor ${q.nomor}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isReplacing}
                            onClick={() => handleRegenerateSingle(q)}
                            aria-label={`Ganti soal nomor ${q.nomor} dengan AI`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
                          >
                            {isReplacing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Ganti Soal (AI)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            aria-label={`Hapus soal nomor ${q.nomor}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50 whitespace-nowrap"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Hapus
                          </button>
                        </div>
                      </div>

                      {/* Question prompt */}
                      <div className="space-y-3">
                        <p className="text-sm sm:text-base text-slate-900 leading-relaxed whitespace-pre-line">
                          {q.pertanyaan}
                        </p>

                        {/* Options */}
                        {(q.type === 'pilihan_ganda' ||
                          q.type === 'pilihan_ganda_kompleks') &&
                          q.options && (
                            <ul className="space-y-1.5 pl-1">
                              {q.options.map((opt) => {
                                const isCorrect =
                                  showPembahasan &&
                                  (q.correctOptionLabels?.includes(opt.label) ||
                                    q.kunciJawaban === opt.label);
                                return (
                                  <li
                                    key={opt.label}
                                    className={`flex items-start gap-2.5 px-3 py-2 rounded-lg text-sm ${
                                      isCorrect
                                        ? 'bg-emerald-50 text-emerald-950 font-medium'
                                        : 'text-slate-700'
                                    }`}
                                  >
                                    <span className="font-mono font-bold text-slate-900 shrink-0">
                                      {opt.label}.
                                    </span>
                                    <span className="flex-1">{opt.text}</span>
                                    {isCorrect && (
                                      <CheckCircle2
                                        className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                                        aria-label="Jawaban Benar"
                                      />
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                        {/* Matching Pairs */}
                        {q.type === 'menjodohkan' && q.matchingPairs && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                                  <th className="py-2 px-3 text-left w-10">No</th>
                                  <th className="py-2 px-3 text-left">
                                    Pernyataan (Kolom A)
                                  </th>
                                  <th className="py-2 px-3 text-left">
                                    Pasangan Tepat (Kolom B)
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {q.matchingPairs.map((pair, idx) => (
                                  <tr key={pair.id}>
                                    <td className="py-2 px-3 font-mono text-slate-500">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2 px-3 text-slate-800">
                                      {pair.left}
                                    </td>
                                    <td className="py-2 px-3 text-emerald-800 font-medium">
                                      {pair.right}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Indicator + Kunci + Pembahasan */}
                      {showPembahasan && (
                        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs sm:text-sm bg-slate-50/70 -mx-5 -mb-5 px-5 py-4 rounded-b-xl">
                          <p className="text-slate-600">
                            <span className="font-semibold text-slate-800">
                              Indikator Soal:
                            </span>{' '}
                            {q.indikator}
                          </p>
                          <p className="text-emerald-800">
                            <span className="font-bold">Kunci Jawaban:</span>{' '}
                            <span className="font-semibold">
                              {q.kunciJawaban}
                            </span>
                          </p>
                          <p className="text-slate-700 leading-relaxed">
                            <span className="font-semibold text-slate-900">
                              Pembahasan:
                            </span>{' '}
                            {q.pembahasan}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {(editingQuestion || isAddingQuestion) && activePackage && (
        <QuestionEditorModal
          initialQuestion={editingQuestion}
          defaultMateri={activePackage.objectives.materiPokok}
          defaultTP={activePackage.objectives.tujuanPembelajaran}
          defaultOptionCount={optionCount}
          nextNomor={activePackage.questions.length + 1}
          onSave={handleSaveEditedOrNewQuestion}
          onClose={() => {
            setEditingQuestion(null);
            setIsAddingQuestion(false);
          }}
        />
      )}
    </div>
  );
};
