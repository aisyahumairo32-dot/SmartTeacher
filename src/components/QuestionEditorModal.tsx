import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  COGNITIVE_LABELS,
  CognitiveLevel,
  DIFFICULTY_LABELS,
  DifficultyLevel,
  MatchingPair,
  QUESTION_TYPE_LABELS,
  QuestionItem,
  QuestionOption,
  QuestionType,
} from '../types/exam';
import { defaultScoreForQuestionType } from '../utils/questionLogic';

interface QuestionEditorModalProps {
  initialQuestion?: QuestionItem | null;
  defaultMateri: string;
  defaultTP: string;
  defaultOptionCount: 4 | 5;
  nextNomor: number;
  onSave: (question: QuestionItem) => void;
  onClose: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
const ALL_TYPES: QuestionType[] = [
  'pilihan_ganda',
  'pilihan_ganda_kompleks',
  'benar_salah',
  'menjodohkan',
  'isian_singkat',
  'uraian',
];
const ALL_DIFFICULTIES: DifficultyLevel[] = ['mudah', 'sedang', 'sulit'];
const ALL_COGNITIVE: CognitiveLevel[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

function buildInitialOptions(count: 4 | 5): QuestionOption[] {
  return Array.from({ length: count }, (_, idx) => ({
    label: OPTION_LETTERS[idx],
    text: '',
  }));
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  initialQuestion,
  defaultMateri,
  defaultTP,
  defaultOptionCount,
  nextNomor,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialQuestion);
  const [type, setType] = useState<QuestionType>(
    initialQuestion?.type ?? 'pilihan_ganda'
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialQuestion?.difficulty ?? 'sedang'
  );
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(
    initialQuestion?.cognitiveLevel ?? 'C2'
  );
  const [pertanyaan, setPertanyaan] = useState(
    initialQuestion?.pertanyaan ?? ''
  );
  const [indikator, setIndikator] = useState(initialQuestion?.indikator ?? '');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState(
    initialQuestion?.tujuanPembelajaran ?? defaultTP
  );
  const [materi, setMateri] = useState(
    initialQuestion?.materi ?? defaultMateri
  );
  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options && initialQuestion.options.length > 0
      ? initialQuestion.options
      : buildInitialOptions(defaultOptionCount)
  );
  const [correctLabels, setCorrectLabels] = useState<string[]>(
    initialQuestion?.correctOptionLabels &&
      initialQuestion.correctOptionLabels.length > 0
      ? initialQuestion.correctOptionLabels
      : ['A']
  );
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>(
    initialQuestion?.matchingPairs && initialQuestion.matchingPairs.length > 0
      ? initialQuestion.matchingPairs
      : [
          { id: 'pair-1', left: '', right: '' },
          { id: 'pair-2', left: '', right: '' },
          { id: 'pair-3', left: '', right: '' },
        ]
  );
  const [kunciJawaban, setKunciJawaban] = useState(
    initialQuestion?.kunciJawaban ?? 'Benar'
  );
  const [pembahasan, setPembahasan] = useState(
    initialQuestion?.pembahasan ?? ''
  );
  const [skor, setSkor] = useState<number>(
    initialQuestion?.skor ?? defaultScoreForQuestionType(type)
  );
  const [error, setError] = useState('');

  const handleTypeChange = (nextType: QuestionType) => {
    setType(nextType);
    setSkor(defaultScoreForQuestionType(nextType));
    if (nextType === 'benar_salah') {
      setKunciJawaban('Benar');
    } else if (nextType === 'pilihan_ganda') {
      setCorrectLabels([options[0]?.label || 'A']);
    } else if (nextType === 'pilihan_ganda_kompleks') {
      setCorrectLabels([options[0]?.label || 'A', options[1]?.label || 'B']);
    }
  };

  const toggleCorrectLabel = (label: string) => {
    if (type === 'pilihan_ganda') {
      setCorrectLabels([label]);
      return;
    }
    setCorrectLabels((prev) => {
      if (prev.includes(label)) {
        return prev.length > 1 ? prev.filter((l) => l !== label) : prev;
      }
      return [...prev, label].sort();
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pertanyaan.trim()) {
      setError('Teks pertanyaan wajib diisi.');
      return;
    }

    let finalKunci = kunciJawaban.trim();
    let finalOptions: QuestionOption[] | undefined;
    let finalCorrectLabels: string[] | undefined;
    let finalPairs: MatchingPair[] | undefined;

    if (type === 'pilihan_ganda' || type === 'pilihan_ganda_kompleks') {
      const hasEmpty = options.some((o) => !o.text.trim());
      if (hasEmpty) {
        setError('Semua pilihan jawaban wajib diisi.');
        return;
      }
      finalOptions = options;
      finalCorrectLabels =
        type === 'pilihan_ganda' ? [correctLabels[0] || 'A'] : correctLabels;
      finalKunci = finalCorrectLabels.join(', ');
    } else if (type === 'menjodohkan') {
      const validPairs = matchingPairs.filter(
        (p) => p.left.trim() && p.right.trim()
      );
      if (validPairs.length < 2) {
        setError('Isi minimal 2 pasangan pernyataan untuk soal menjodohkan.');
        return;
      }
      finalPairs = validPairs;
      finalKunci = validPairs
        .map((p, idx) => `${idx + 1} → ${p.right}`)
        .join('; ');
    } else if (type === 'benar_salah') {
      finalKunci = kunciJawaban === 'Salah' ? 'Salah' : 'Benar';
    } else if (!finalKunci) {
      setError('Kunci jawaban wajib diisi.');
      return;
    }

    const result: QuestionItem = {
      id:
        initialQuestion?.id ??
        `q-manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nomor: initialQuestion?.nomor ?? nextNomor,
      type,
      difficulty,
      cognitiveLevel,
      indikator:
        indikator.trim() || `Menyelesaikan soal materi ${materi || 'utama'}`,
      tujuanPembelajaran: tujuanPembelajaran.trim() || defaultTP,
      materi: materi.trim() || defaultMateri,
      pertanyaan: pertanyaan.trim(),
      options: finalOptions,
      matchingPairs: finalPairs,
      kunciJawaban: finalKunci,
      correctOptionLabels: finalCorrectLabels,
      pembahasan:
        pembahasan.trim() || 'Pembahasan sesuai materi pokok dan kunci jawaban.',
      skor: Math.max(1, Number(skor) || 2),
    };

    onSave(result);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2
            id="question-modal-title"
            className="text-lg font-bold text-slate-900"
          >
            {isEditing
              ? `Edit Soal Nomor ${initialQuestion?.nomor}`
              : 'Tambah Soal Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela editor soal"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-medium"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="modal-type"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Bentuk Soal
              </label>
              <select
                id="modal-type"
                value={type}
                onChange={(e) =>
                  handleTypeChange(e.target.value as QuestionType)
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {QUESTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="modal-diff"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Tingkat Kesukaran
              </label>
              <select
                id="modal-diff"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as DifficultyLevel)
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {ALL_DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="modal-cog"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Level Kognitif
              </label>
              <select
                id="modal-cog"
                value={cognitiveLevel}
                onChange={(e) =>
                  setCognitiveLevel(e.target.value as CognitiveLevel)
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {ALL_COGNITIVE.map((c) => (
                  <option key={c} value={c}>
                    {COGNITIVE_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-pertanyaan"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Pertanyaan / Pokok Soal <span className="text-red-600">*</span>
            </label>
            <textarea
              id="modal-pertanyaan"
              rows={3}
              required
              value={pertanyaan}
              onChange={(e) => {
                setPertanyaan(e.target.value);
                setError('');
              }}
              placeholder="Tuliskan pertanyaan yang jelas dan sesuai usia peserta didik..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Type-specific answer inputs */}
          {(type === 'pilihan_ganda' || type === 'pilihan_ganda_kompleks') && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Pilihan Jawaban (Centang kunci jawaban benar)
                </span>
                <span className="text-xs text-slate-500">
                  {type === 'pilihan_ganda'
                    ? 'Pilih 1 jawaban benar'
                    : 'Pilih 2 atau lebih jawaban benar'}
                </span>
              </div>
              {options.map((opt, idx) => {
                const isSelected = correctLabels.includes(opt.label);
                return (
                  <div key={opt.label} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleCorrectLabel(opt.label)}
                      aria-label={`Tandai pilihan ${opt.label} sebagai jawaban benar`}
                      className={`h-9 w-9 rounded-lg font-mono text-sm font-bold shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      aria-label={`Teks pilihan ${opt.label}`}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = { ...opt, text: e.target.value };
                        setOptions(next);
                      }}
                      placeholder={`Isi teks pilihan ${opt.label}...`}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {type === 'benar_salah' && (
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kunci Jawaban
              </span>
              <div className="inline-flex gap-2">
                {(['Benar', 'Salah'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setKunciJawaban(val)}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold ${
                      kunciJawaban === val
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'menjodohkan' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Pasangan Pernyataan (Kolom A → Kolom B)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setMatchingPairs((prev) => [
                      ...prev,
                      { id: `pair-${Date.now()}`, left: '', right: '' },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Pasangan
                </button>
              </div>
              {matchingPairs.map((pair, idx) => (
                <div
                  key={pair.id}
                  className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center"
                >
                  <input
                    type="text"
                    value={pair.left}
                    aria-label={`Pernyataan kiri ${idx + 1}`}
                    onChange={(e) => {
                      const next = [...matchingPairs];
                      next[idx] = { ...pair, left: e.target.value };
                      setMatchingPairs(next);
                    }}
                    placeholder={`Pernyataan ${idx + 1}`}
                    className="sm:col-span-5 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <input
                    type="text"
                    value={pair.right}
                    aria-label={`Pasangan kanan ${idx + 1}`}
                    onChange={(e) => {
                      const next = [...matchingPairs];
                      next[idx] = { ...pair, right: e.target.value };
                      setMatchingPairs(next);
                    }}
                    placeholder={`Pasangan benar ${idx + 1}`}
                    className="sm:col-span-5 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <button
                    type="button"
                    aria-label={`Hapus pasangan ${idx + 1}`}
                    onClick={() =>
                      setMatchingPairs((prev) =>
                        prev.length > 2
                          ? prev.filter((_, i) => i !== idx)
                          : prev
                      )
                    }
                    className="sm:col-span-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {(type === 'isian_singkat' || type === 'uraian') && (
            <div>
              <label
                htmlFor="modal-kunci"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Kunci Jawaban / Pedoman Jawaban{' '}
                <span className="text-red-600">*</span>
              </label>
              <textarea
                id="modal-kunci"
                rows={type === 'uraian' ? 3 : 2}
                value={kunciJawaban}
                onChange={(e) => setKunciJawaban(e.target.value)}
                placeholder="Tuliskan kunci jawaban atau poin penilaian..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="modal-pembahasan"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Pembahasan Soal
            </label>
            <textarea
              id="modal-pembahasan"
              rows={2}
              value={pembahasan}
              onChange={(e) => setPembahasan(e.target.value)}
              placeholder="Jelaskan langkah penyelesaian atau alasan jawaban benar..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="modal-indikator"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Indikator Soal (untuk Kisi-Kisi)
              </label>
              <input
                id="modal-indikator"
                type="text"
                value={indikator}
                onChange={(e) => setIndikator(e.target.value)}
                placeholder="Contoh: Peserta didik mampu menganalisis..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="modal-materi"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Sub-Materi & Bobot Skor
              </label>
              <div className="flex gap-2">
                <input
                  id="modal-materi"
                  type="text"
                  value={materi}
                  onChange={(e) => setMateri(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  aria-label="Bobot skor soal"
                  value={skor}
                  onChange={(e) => setSkor(Number(e.target.value))}
                  className="w-20 px-2.5 py-2 rounded-lg border border-slate-300 text-sm font-mono tabular-nums"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-tp"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Tujuan Pembelajaran Terkait
            </label>
            <input
              id="modal-tp"
              type="text"
              value={tujuanPembelajaran}
              onChange={(e) => setTujuanPembelajaran(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
            >
              {isEditing ? 'Simpan Perubahan' : 'Tambahkan Soal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
