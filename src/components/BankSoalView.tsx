import React, { useMemo, useState } from 'react';
import {
  Archive,
  CheckSquare,
  FilePlus2,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import {
  BankQuestion,
  COGNITIVE_LABELS,
  DIFFICULTY_SHORT_LABELS,
  DifficultyLevel,
  QUESTION_TYPE_LABELS,
  QuestionType,
} from '../types/exam';

interface BankSoalViewProps {
  bankQuestions: BankQuestion[];
  onDeleteBankQuestion: (bankId: string) => void;
  onAssemblePackageFromBank: (selected: BankQuestion[]) => void;
  onGoToBuatSoal: () => void;
}

export const BankSoalView: React.FC<BankSoalViewProps> = ({
  bankQuestions,
  onDeleteBankQuestion,
  onAssemblePackageFromBank,
  onGoToBuatSoal,
}) => {
  const [search, setSearch] = useState('');
  const [filterMapel, setFilterMapel] = useState('ALL');
  const [filterType, setFilterType] = useState<'ALL' | QuestionType>('ALL');
  const [filterDiff, setFilterDiff] = useState<'ALL' | DifficultyLevel>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const subjects = useMemo(() => {
    return Array.from(
      new Set(bankQuestions.map((b) => b.mataPelajaran).filter(Boolean))
    );
  }, [bankQuestions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bankQuestions.filter((item) => {
      if (filterMapel !== 'ALL' && item.mataPelajaran !== filterMapel) {
        return false;
      }
      if (filterType !== 'ALL' && item.type !== filterType) return false;
      if (filterDiff !== 'ALL' && item.difficulty !== filterDiff) return false;
      if (!q) return true;
      return (
        item.pertanyaan.toLowerCase().includes(q) ||
        item.materi.toLowerCase().includes(q) ||
        item.indikator.toLowerCase().includes(q) ||
        item.mataPelajaran.toLowerCase().includes(q)
      );
    });
  }, [bankQuestions, search, filterMapel, filterType, filterDiff]);

  const toggleSelect = (bankId: string) => {
    setSelectedIds((prev) =>
      prev.includes(bankId)
        ? prev.filter((id) => id !== bankId)
        : [...prev, bankId]
    );
  };

  const handleCreateFromSelected = () => {
    const picked = bankQuestions.filter((b) => selectedIds.includes(b.bankId));
    if (picked.length === 0) return;
    onAssemblePackageFromBank(picked);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bank Soal
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Koleksi butir soal tersimpan yang dapat dicari, disaring, dan
            dirangkai kembali menjadi paket ulangan baru.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={handleCreateFromSelected}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Jadikan Paket Soal ({selectedIds.length} butir)
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5 relative">
          <Search
            className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Cari pertanyaan atau materi di Bank Soal"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pertanyaan, materi, atau indikator..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          aria-label="Filter mata pelajaran"
          value={filterMapel}
          onChange={(e) => setFilterMapel(e.target.value)}
          className="lg:col-span-3 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="ALL">Semua Mata Pelajaran</option>
          {subjects.map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter bentuk soal"
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value as 'ALL' | QuestionType)
          }
          className="lg:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="ALL">Semua Bentuk</option>
          {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter tingkat kesukaran"
          value={filterDiff}
          onChange={(e) =>
            setFilterDiff(e.target.value as 'ALL' | DifficultyLevel)
          }
          className="lg:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="ALL">Semua Tingkat</option>
          <option value="mudah">Mudah</option>
          <option value="sedang">Sedang</option>
          <option value="sulit">Sulit</option>
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Menampilkan{' '}
          <strong className="font-mono tabular-nums text-slate-900">
            {filtered.length}
          </strong>{' '}
          dari{' '}
          <strong className="font-mono tabular-nums text-slate-900">
            {bankQuestions.length}
          </strong>{' '}
          butir soal tersimpan
        </span>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-blue-700 font-semibold hover:underline"
          >
            Batalkan Pilihan ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Bank items */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <Archive className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-base font-bold text-slate-900">
            {bankQuestions.length === 0
              ? 'Bank Soal masih kosong'
              : 'Tidak ada butir soal yang cocok dengan filter'}
          </p>
          <p className="text-sm text-slate-500">
            Simpan soal dari halaman Buat Soal atau Cetak &amp; Download agar
            bisa digunakan ulang.
          </p>
          {bankQuestions.length === 0 && (
            <button
              type="button"
              onClick={onGoToBuatSoal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
            >
              Buat Soal Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const checked = selectedIds.includes(item.bankId);
            return (
              <article
                key={item.bankId}
                className={`bg-white border rounded-xl p-5 space-y-3 transition-colors ${
                  checked ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.bankId)}
                      aria-label={`Pilih soal ${item.materi} untuk dirangkai ke paket baru`}
                      className="mt-0.5 text-blue-700 hover:text-blue-800 shrink-0"
                    >
                      {checked ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span className="font-semibold text-blue-700">
                          {item.mataPelajaran}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {item.jenjang} Kelas {item.kelas}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700">
                          {QUESTION_TYPE_LABELS[item.type]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            item.difficulty === 'mudah'
                              ? 'text-emerald-700'
                              : item.difficulty === 'sedang'
                                ? 'text-blue-700'
                                : 'text-amber-700'
                          }`}
                        >
                          {DIFFICULTY_SHORT_LABELS[item.difficulty]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">
                          {COGNITIVE_LABELS[item.cognitiveLevel]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 leading-relaxed">
                        {item.pertanyaan}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteBankQuestion(item.bankId)}
                    aria-label={`Hapus butir soal ${item.materi} dari Bank Soal`}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="pl-8 text-xs text-slate-600 space-y-1">
                  <p>
                    <strong className="text-emerald-800">Kunci:</strong>{' '}
                    {item.kunciJawaban}
                  </p>
                  <p>
                    <strong className="text-slate-800">Indikator:</strong>{' '}
                    {item.indikator}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
