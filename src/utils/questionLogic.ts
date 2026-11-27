import {
  BlueprintSlot,
  COGNITIVE_LABELS,
  CognitiveLevel,
  DIFFICULTY_SHORT_LABELS,
  DifficultyCounts,
  DifficultyLevel,
  ExamPackage,
  KisiKisiRow,
  LearningObjectives,
  MatchingPair,
  QUESTION_TYPE_LABELS,
  QuestionItem,
  QuestionOption,
  QuestionType,
  SchoolIdentity,
} from '../types/exam';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

export function calculateTotalQuestions(counts: DifficultyCounts): number {
  const mudah = Math.max(0, Math.floor(Number(counts.mudah) || 0));
  const sedang = Math.max(0, Math.floor(Number(counts.sedang) || 0));
  const sulit = Math.max(0, Math.floor(Number(counts.sulit) || 0));
  return mudah + sedang + sulit;
}

export function getSuggestedCognitiveLevel(
  difficulty: DifficultyLevel,
  indexWithinDifficulty: number
): CognitiveLevel {
  if (difficulty === 'mudah') {
    return indexWithinDifficulty % 2 === 0 ? 'C1' : 'C2';
  }
  if (difficulty === 'sedang') {
    return indexWithinDifficulty % 2 === 0 ? 'C2' : 'C3';
  }
  const highLevels: CognitiveLevel[] = ['C4', 'C5', 'C6'];
  return highLevels[indexWithinDifficulty % highLevels.length];
}

/**
 * Builds deterministic slot specifications matching exact difficulty counts
 * distributed evenly across all selected question types.
 */
export function buildQuestionBlueprintSlots(
  selectedTypes: QuestionType[],
  counts: DifficultyCounts
): BlueprintSlot[] {
  if (selectedTypes.length === 0) return [];

  const mudah = Math.max(0, Math.floor(Number(counts.mudah) || 0));
  const sedang = Math.max(0, Math.floor(Number(counts.sedang) || 0));
  const sulit = Math.max(0, Math.floor(Number(counts.sulit) || 0));

  const difficultySequence: DifficultyLevel[] = [
    ...Array<DifficultyLevel>(mudah).fill('mudah'),
    ...Array<DifficultyLevel>(sedang).fill('sedang'),
    ...Array<DifficultyLevel>(sulit).fill('sulit'),
  ];

  const total = difficultySequence.length;
  if (total === 0) return [];

  // Order types consistently so similar types are grouped cleanly on the exam paper
  const typeOrder: QuestionType[] = [
    'pilihan_ganda',
    'pilihan_ganda_kompleks',
    'benar_salah',
    'menjodohkan',
    'isian_singkat',
    'uraian',
  ];
  const orderedTypes = typeOrder.filter((t) => selectedTypes.includes(t));

  // Distribute total count across selected types as evenly as possible
  const basePerType = Math.floor(total / orderedTypes.length);
  const remainder = total % orderedTypes.length;

  const typeSequence: QuestionType[] = [];
  orderedTypes.forEach((qType, idx) => {
    const countForType = basePerType + (idx < remainder ? 1 : 0);
    for (let i = 0; i < countForType; i++) {
      typeSequence.push(qType);
    }
  });

  // Interleave difficulty across types so each section has varied difficulty when possible,
  // while keeping exact counts of both types and difficulties.
  const difficultyCounters: Record<DifficultyLevel, number> = {
    mudah: 0,
    sedang: 0,
    sulit: 0,
  };

  return typeSequence.map((type, idx) => {
    const difficulty = difficultySequence[idx];
    const diffIdx = difficultyCounters[difficulty]++;
    return {
      nomor: idx + 1,
      type,
      difficulty,
      suggestedCognitiveLevel: getSuggestedCognitiveLevel(difficulty, diffIdx),
    };
  });
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGeneratorForm(
  identity: SchoolIdentity,
  objectives: LearningObjectives,
  selectedTypes: QuestionType[],
  counts: DifficultyCounts
): ValidationResult {
  const errors: string[] = [];

  if (!identity.namaSekolah.trim()) {
    errors.push('Nama Sekolah wajib diisi (buka menu Identitas Sekolah).');
  }
  if (!identity.namaGuru.trim()) {
    errors.push('Nama Guru wajib diisi (buka menu Identitas Sekolah).');
  }
  if (!identity.mataPelajaran.trim()) {
    errors.push('Bidang Studi / Mata Pelajaran wajib diisi.');
  }
  if (!identity.kelas.trim()) {
    errors.push('Kelas wajib diisi.');
  }
  if (!objectives.tujuanPembelajaran.trim()) {
    errors.push('Tujuan Pembelajaran (TP) wajib diisi.');
  }
  if (!objectives.materiPokok.trim()) {
    errors.push('Materi Pokok wajib diisi.');
  }
  if (selectedTypes.length === 0) {
    errors.push('Pilih minimal satu jenis soal.');
  }

  const total = calculateTotalQuestions(counts);
  if (total < 1) {
    errors.push('Jumlah soal minimal 1 butir pada salah satu tingkat kesukaran.');
  }
  if (total > 40) {
    errors.push('Jumlah soal maksimal 40 butir dalam satu kali generate.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Fisher-Yates shuffle helper supporting injectable RNG for deterministic unit tests.
 */
function fisherYates<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function renumberQuestions(questions: QuestionItem[]): QuestionItem[] {
  return questions.map((q, index) => ({
    ...q,
    nomor: index + 1,
  }));
}

export function shuffleQuestions(
  questions: QuestionItem[],
  rng: () => number = Math.random
): QuestionItem[] {
  return renumberQuestions(fisherYates(questions, rng));
}

/**
 * Shuffles options for Pilihan Ganda / Pilihan Ganda Kompleks and accurately
 * remaps kunciJawaban and correctOptionLabels so the answer key stays 100% valid.
 */
export function shuffleQuestionOptions(
  question: QuestionItem,
  rng: () => number = Math.random
): QuestionItem {
  if (
    (question.type !== 'pilihan_ganda' &&
      question.type !== 'pilihan_ganda_kompleks') ||
    !question.options ||
    question.options.length < 2
  ) {
    return question;
  }

  const originalCorrectLabels = new Set(
    (question.correctOptionLabels && question.correctOptionLabels.length > 0
      ? question.correctOptionLabels
      : extractOptionLabelsFromKey(question.kunciJawaban)
    ).map((l) => l.toUpperCase())
  );

  const taggedOptions = question.options.map((opt) => ({
    text: opt.text,
    isCorrect: originalCorrectLabels.has(opt.label.toUpperCase()),
  }));

  const shuffled = fisherYates(taggedOptions, rng);
  const newOptions: QuestionOption[] = shuffled.map((item, idx) => ({
    label: OPTION_LETTERS[idx] ?? String.fromCharCode(65 + idx),
    text: item.text,
  }));

  const newCorrectLabels: string[] = [];
  shuffled.forEach((item, idx) => {
    if (item.isCorrect) {
      newCorrectLabels.push(OPTION_LETTERS[idx] ?? String.fromCharCode(65 + idx));
    }
  });

  // Fallback safeguard if key wasn't matched
  const finalCorrectLabels =
    newCorrectLabels.length > 0
      ? newCorrectLabels
      : [newOptions[0].label];

  const kunciJawaban =
    question.type === 'pilihan_ganda'
      ? finalCorrectLabels[0]
      : finalCorrectLabels.join(', ');

  return {
    ...question,
    options: newOptions,
    correctOptionLabels: finalCorrectLabels,
    kunciJawaban,
  };
}

export function shuffleAllPackageOptions(
  questions: QuestionItem[],
  rng: () => number = Math.random
): QuestionItem[] {
  return questions.map((q) => shuffleQuestionOptions(q, rng));
}

export function extractOptionLabelsFromKey(keyText: string): string[] {
  if (!keyText) return [];
  const matches = keyText.toUpperCase().match(/\b[A-E]\b/g);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

export function getNextPaketLabel(existingLabels: string[]): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < letters.length; i++) {
    const candidate = `Paket ${letters[i]}`;
    if (!existingLabels.includes(candidate)) {
      return candidate;
    }
  }
  return `Paket ${existingLabels.length + 1}`;
}

export function createVariantPackage(
  sourcePackage: ExamPackage,
  variantLabel: string,
  rng: () => number = Math.random
): ExamPackage {
  const now = new Date().toISOString();
  const shuffledOpts = shuffleAllPackageOptions(sourcePackage.questions, rng);
  const shuffledAll = shuffleQuestions(shuffledOpts, rng).map((q, idx) => ({
    ...q,
    id: `${q.id}-var-${idx + 1}-${Math.floor(rng() * 10000)}`,
  }));

  return {
    ...sourcePackage,
    id: `pkg-${Date.now()}-${Math.floor(rng() * 10000)}`,
    paketLabel: variantLabel,
    judul: `${sourcePackage.identity.jenisPenilaian} ${sourcePackage.identity.mataPelajaran} – ${variantLabel}`,
    createdAt: now,
    updatedAt: now,
    questions: shuffledAll,
  };
}

export function generateKisiKisiRows(examPackage: ExamPackage): KisiKisiRow[] {
  return examPackage.questions.map((q, idx) => ({
    nomorSoal: q.nomor || idx + 1,
    tujuanPembelajaran:
      q.tujuanPembelajaran || examPackage.objectives.tujuanPembelajaran,
    materi: q.materi || examPackage.objectives.materiPokok,
    indikatorSoal: q.indikator,
    bentukSoal: QUESTION_TYPE_LABELS[q.type] || q.type,
    tingkatKesukaran: DIFFICULTY_SHORT_LABELS[q.difficulty] || q.difficulty,
    levelKognitif: COGNITIVE_LABELS[q.cognitiveLevel] || q.cognitiveLevel,
  }));
}

export interface ExamMatchingDisplay {
  leftItems: Array<{ number: number; text: string }>;
  rightItems: Array<{ letter: string; text: string }>;
  answerKeySummary: string;
}

/**
 * Rotates Column B deterministically for student exam sheets so matching pairs
 * do not align 1-A, 2-B, 3-C directly, while computing exact letter mapping.
 */
export function getExamMatchingColumns(
  pairs: MatchingPair[]
): ExamMatchingDisplay {
  const n = pairs.length;
  const shift = n > 1 ? 1 : 0;

  const rightOrder = pairs.map((_, idx) => pairs[(idx + shift) % n]);
  const rightItems = rightOrder.map((pair, idx) => ({
    letter: String.fromCharCode(65 + idx),
    text: pair.right,
  }));

  const leftItems = pairs.map((pair, idx) => ({
    number: idx + 1,
    text: pair.left,
  }));

  const keyParts = pairs.map((pair, idx) => {
    const matchedRightIndex = rightOrder.findIndex((r) => r.id === pair.id);
    const letter = String.fromCharCode(65 + Math.max(0, matchedRightIndex));
    return `${idx + 1}→${letter}`;
  });

  return {
    leftItems,
    rightItems,
    answerKeySummary: keyParts.join(', '),
  };
}

export function summarizeQuestionDistribution(questions: QuestionItem[]) {
  const byDifficulty: Record<DifficultyLevel, number> = {
    mudah: 0,
    sedang: 0,
    sulit: 0,
  };
  const byCognitive: Record<CognitiveLevel, number> = {
    C1: 0,
    C2: 0,
    C3: 0,
    C4: 0,
    C5: 0,
    C6: 0,
  };
  const byType: Record<QuestionType, number> = {
    pilihan_ganda: 0,
    pilihan_ganda_kompleks: 0,
    benar_salah: 0,
    menjodohkan: 0,
    isian_singkat: 0,
    uraian: 0,
  };

  let totalScore = 0;

  for (const q of questions) {
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
    byCognitive[q.cognitiveLevel] = (byCognitive[q.cognitiveLevel] || 0) + 1;
    byType[q.type] = (byType[q.type] || 0) + 1;
    totalScore += Number(q.skor) || 0;
  }

  return {
    total: questions.length,
    totalScore,
    byDifficulty,
    byCognitive,
    byType,
  };
}

export function defaultScoreForQuestionType(type: QuestionType): number {
  switch (type) {
    case 'pilihan_ganda':
      return 2;
    case 'benar_salah':
      return 2;
    case 'isian_singkat':
      return 3;
    case 'pilihan_ganda_kompleks':
      return 4;
    case 'menjodohkan':
      return 5;
    case 'uraian':
      return 10;
    default:
      return 2;
  }
}

export interface RawAIQuestion {
  type?: string;
  difficulty?: string;
  cognitiveLevel?: string;
  indikator?: string;
  tujuanPembelajaran?: string;
  materi?: string;
  pertanyaan?: string;
  options?: Array<{ label?: string; text?: string }>;
  matchingPairs?: Array<{ left?: string; right?: string }>;
  kunciJawaban?: string;
  correctOptionLabels?: string[];
  pembahasan?: string;
}

const VALID_COGNITIVE: CognitiveLevel[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

export function normalizeGeneratedQuestions(
  rawList: RawAIQuestion[],
  slots: BlueprintSlot[],
  objectives: LearningObjectives,
  optionCount: 4 | 5
): QuestionItem[] {
  return slots.map((slot, index) => {
    const raw = rawList[index] || {};
    const cog = VALID_COGNITIVE.includes(raw.cognitiveLevel as CognitiveLevel)
      ? (raw.cognitiveLevel as CognitiveLevel)
      : slot.suggestedCognitiveLevel;

    let options: QuestionOption[] | undefined;
    let correctOptionLabels: string[] | undefined;
    let matchingPairs: MatchingPair[] | undefined;
    let kunciJawaban = (raw.kunciJawaban || '').trim();

    if (
      slot.type === 'pilihan_ganda' ||
      slot.type === 'pilihan_ganda_kompleks'
    ) {
      const rawOptions = Array.isArray(raw.options) ? raw.options : [];
      options = Array.from({ length: optionCount }, (_, optIdx) => {
        const letter = OPTION_LETTERS[optIdx];
        const found = rawOptions[optIdx];
        return {
          label: letter,
          text:
            found?.text?.trim() ||
            `Pilihan jawaban ${letter} terkait ${objectives.materiPokok}`,
        };
      });

      const validLetters = new Set(options.map((o) => o.label));
      let extracted = Array.isArray(raw.correctOptionLabels)
        ? raw.correctOptionLabels
            .map((l) => l.trim().toUpperCase())
            .filter((l) => validLetters.has(l))
        : [];

      if (extracted.length === 0) {
        extracted = extractOptionLabelsFromKey(kunciJawaban).filter((l) =>
          validLetters.has(l)
        );
      }
      if (extracted.length === 0) {
        extracted = ['A'];
      }
      if (slot.type === 'pilihan_ganda') {
        extracted = [extracted[0]];
        kunciJawaban = extracted[0];
      } else {
        if (extracted.length < 2 && options.length >= 2) {
          const second = options.find((o) => o.label !== extracted[0])?.label;
          if (second) extracted.push(second);
        }
        kunciJawaban = extracted.join(', ');
      }
      correctOptionLabels = extracted;
    } else if (slot.type === 'benar_salah') {
      const lower = kunciJawaban.toLowerCase();
      kunciJawaban = lower.includes('salah') ? 'Salah' : 'Benar';
    } else if (slot.type === 'menjodohkan') {
      const rawPairs = Array.isArray(raw.matchingPairs)
        ? raw.matchingPairs
        : [];
      matchingPairs = rawPairs.slice(0, 5).map((pair, pIdx) => ({
        id: `pair-${index + 1}-${pIdx + 1}`,
        left: pair.left?.trim() || `Pernyataan ${pIdx + 1}`,
        right: pair.right?.trim() || `Pasangan ${pIdx + 1}`,
      }));
      if (!kunciJawaban && matchingPairs.length > 0) {
        kunciJawaban = matchingPairs
          .map((p, pIdx) => `${pIdx + 1} → ${p.right}`)
          .join('; ');
      }
    } else if (!kunciJawaban) {
      kunciJawaban = 'Lihat pembahasan sebagai pedoman penskoran.';
    }

    return {
      id: `q-${Date.now()}-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
      nomor: index + 1,
      type: slot.type,
      difficulty: slot.difficulty,
      cognitiveLevel: cog,
      indikator:
        raw.indikator?.trim() ||
        objectives.indikatorSoal.trim() ||
        `Peserta didik mampu menyelesaikan soal ${objectives.materiPokok}`,
      tujuanPembelajaran:
        raw.tujuanPembelajaran?.trim() || objectives.tujuanPembelajaran.trim(),
      materi: raw.materi?.trim() || objectives.materiPokok.trim(),
      pertanyaan:
        raw.pertanyaan?.trim() ||
        `Jelaskan konsep utama pada materi ${objectives.materiPokok}.`,
      options,
      matchingPairs,
      kunciJawaban,
      correctOptionLabels,
      pembahasan:
        raw.pembahasan?.trim() ||
        `Pembahasan mengacu pada materi ${objectives.materiPokok} sesuai tujuan pembelajaran.`,
      skor: defaultScoreForQuestionType(slot.type),
    };
  });
}
