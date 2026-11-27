import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuestionBlueprintSlots,
  calculateTotalQuestions,
  createVariantPackage,
  generateKisiKisiRows,
  getExamMatchingColumns,
  normalizeGeneratedQuestions,
  shuffleQuestionOptions,
  shuffleQuestions,
  summarizeQuestionDistribution,
  validateGeneratorForm,
} from './questionLogic';
import { ExamPackage, QuestionItem } from '../types/exam';

function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

test('calculateTotalQuestions sums difficulty buckets accurately', () => {
  assert.equal(calculateTotalQuestions({ mudah: 4, sedang: 4, sulit: 2 }), 10);
  assert.equal(calculateTotalQuestions({ mudah: 0, sedang: 5, sulit: 0 }), 5);
  assert.equal(calculateTotalQuestions({ mudah: -2, sedang: 3, sulit: 1 }), 4);
});

test('buildQuestionBlueprintSlots matches exact difficulty and type counts', () => {
  const slots = buildQuestionBlueprintSlots(
    ['pilihan_ganda', 'benar_salah', 'uraian'],
    { mudah: 3, sedang: 4, sulit: 3 }
  );

  assert.equal(slots.length, 10);
  assert.equal(slots.filter((s) => s.difficulty === 'mudah').length, 3);
  assert.equal(slots.filter((s) => s.difficulty === 'sedang').length, 4);
  assert.equal(slots.filter((s) => s.difficulty === 'sulit').length, 3);

  // Even distribution across 3 types for 10 questions => 4, 3, 3
  assert.equal(slots.filter((s) => s.type === 'pilihan_ganda').length, 4);
  assert.equal(slots.filter((s) => s.type === 'benar_salah').length, 3);
  assert.equal(slots.filter((s) => s.type === 'uraian').length, 3);
  assert.deepEqual(
    slots.map((s) => s.nomor),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  );
});

test('shuffleQuestionOptions preserves exact correct option text for Pilihan Ganda', () => {
  const q: QuestionItem = {
    id: 'q1',
    nomor: 1,
    type: 'pilihan_ganda',
    difficulty: 'mudah',
    cognitiveLevel: 'C1',
    indikator: 'Mengidentifikasi organ pencernaan',
    tujuanPembelajaran: 'Memahami sistem pencernaan',
    materi: 'Sistem Pencernaan',
    pertanyaan: 'Enzim ptialin dihasilkan di...',
    options: [
      { label: 'A', text: 'Rongga mulut' },
      { label: 'B', text: 'Lambung' },
      { label: 'C', text: 'Usus halus' },
      { label: 'D', text: 'Usus besar' },
    ],
    kunciJawaban: 'A',
    correctOptionLabels: ['A'],
    pembahasan: 'Enzim ptialin dihasilkan oleh kelenjar ludah di rongga mulut.',
    skor: 2,
  };

  const shuffled = shuffleQuestionOptions(q, createSeededRng(42));
  assert.equal(shuffled.options?.length, 4);
  const winningOpt = shuffled.options?.find(
    (o) => o.label === shuffled.kunciJawaban
  );
  assert.equal(winningOpt?.text, 'Rongga mulut');
  assert.deepEqual(shuffled.correctOptionLabels, [shuffled.kunciJawaban]);
});

test('shuffleQuestionOptions preserves all correct options for Pilihan Ganda Kompleks', () => {
  const q: QuestionItem = {
    id: 'q2',
    nomor: 2,
    type: 'pilihan_ganda_kompleks',
    difficulty: 'sedang',
    cognitiveLevel: 'C3',
    indikator: 'Menentukan organ pencernaan kimiawi',
    tujuanPembelajaran: 'Memahami sistem pencernaan',
    materi: 'Sistem Pencernaan',
    pertanyaan: 'Pilih dua organ yang menghasilkan enzim pencernaan.',
    options: [
      { label: 'A', text: 'Lambung' },
      { label: 'B', text: 'Kerongkongan' },
      { label: 'C', text: 'Pankreas' },
      { label: 'D', text: 'Anus' },
    ],
    kunciJawaban: 'A, C',
    correctOptionLabels: ['A', 'C'],
    pembahasan: 'Lambung dan pankreas menghasilkan enzim.',
    skor: 4,
  };

  const shuffled = shuffleQuestionOptions(q, createSeededRng(99));
  const correctTexts = (shuffled.correctOptionLabels || [])
    .map((label) => shuffled.options?.find((o) => o.label === label)?.text)
    .sort();
  assert.deepEqual(correctTexts, ['Lambung', 'Pankreas']);
  assert.equal(
    shuffled.kunciJawaban,
    (shuffled.correctOptionLabels || []).join(', ')
  );
});

test('shuffleQuestions renumbers sequentially and createVariantPackage creates distinct Paket B', () => {
  const samplePkg: ExamPackage = {
    id: 'pkg-1',
    judul: 'Ulangan Harian IPA',
    paketLabel: 'Paket A',
    createdAt: '2026-11-26T00:00:00.000Z',
    updatedAt: '2026-11-26T00:00:00.000Z',
    identity: {
      namaSekolah: 'SMPN 1 Nusantara',
      alamatSekolah: 'Jl. Pendidikan No. 10',
      jenjang: 'SMP',
      namaGuru: 'Siti Rahmawati',
      nip: '198705122014022001',
      mataPelajaran: 'IPA',
      kelas: 'VIII',
      semester: 'Ganjil',
      tahunPelajaran: '2026/2027',
      jenisPenilaian: 'Ulangan Harian',
    },
    objectives: {
      capaianPembelajaran: 'CP IPA Fase D',
      tujuanPembelajaran: 'Menganalisis sistem pencernaan manusia',
      materiPokok: 'Sistem Pencernaan Manusia',
      indikatorSoal: 'Mengidentifikasi organ dan enzim pencernaan',
      kompetensi: 'Pemahaman konsep dan analisis',
    },
    questions: [
      {
        id: 'q1',
        nomor: 1,
        type: 'pilihan_ganda',
        difficulty: 'mudah',
        cognitiveLevel: 'C1',
        indikator: 'Indikator 1',
        tujuanPembelajaran: 'TP 1',
        materi: 'Materi 1',
        pertanyaan: 'Soal 1',
        options: [
          { label: 'A', text: 'Benar 1' },
          { label: 'B', text: 'Salah 1' },
          { label: 'C', text: 'Salah 2' },
          { label: 'D', text: 'Salah 3' },
        ],
        kunciJawaban: 'A',
        correctOptionLabels: ['A'],
        pembahasan: 'Pembahasan 1',
        skor: 2,
      },
      {
        id: 'q2',
        nomor: 2,
        type: 'uraian',
        difficulty: 'sulit',
        cognitiveLevel: 'C5',
        indikator: 'Indikator 2',
        tujuanPembelajaran: 'TP 2',
        materi: 'Materi 2',
        pertanyaan: 'Soal 2',
        kunciJawaban: 'Jawaban uraian 2',
        pembahasan: 'Pembahasan 2',
        skor: 10,
      },
    ],
  };

  const shuffled = shuffleQuestions(samplePkg.questions, createSeededRng(7));
  assert.deepEqual(
    shuffled.map((q) => q.nomor),
    [1, 2]
  );

  const variantB = createVariantPackage(samplePkg, 'Paket B', createSeededRng(12));
  assert.equal(variantB.paketLabel, 'Paket B');
  assert.equal(variantB.questions.length, 2);
  assert.notEqual(variantB.id, samplePkg.id);

  const kisiRows = generateKisiKisiRows(variantB);
  assert.equal(kisiRows.length, 2);
  assert.equal(kisiRows[0].nomorSoal, 1);
  assert.equal(kisiRows[1].nomorSoal, 2);

  const summary = summarizeQuestionDistribution(variantB.questions);
  assert.equal(summary.total, 2);
  assert.equal(summary.totalScore, 12);
  assert.equal(summary.byDifficulty.mudah, 1);
  assert.equal(summary.byDifficulty.sulit, 1);
});

test('validateGeneratorForm catches missing required fields cleanly', () => {
  const result = validateGeneratorForm(
    {
      namaSekolah: '',
      alamatSekolah: '',
      jenjang: 'SD',
      namaGuru: '',
      nip: '',
      mataPelajaran: '',
      kelas: '',
      semester: 'Ganjil',
      tahunPelajaran: '2026/2027',
      jenisPenilaian: 'Latihan',
    },
    {
      capaianPembelajaran: '',
      tujuanPembelajaran: '',
      materiPokok: '',
      indikatorSoal: '',
      kompetensi: '',
    },
    [],
    { mudah: 0, sedang: 0, sulit: 0 }
  );

  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 6);
});

test('normalizeGeneratedQuestions enforces exact slot types, labels, and fallback safety', () => {
  const slots = buildQuestionBlueprintSlots(['pilihan_ganda', 'benar_salah'], {
    mudah: 1,
    sedang: 1,
    sulit: 0,
  });

  const normalized = normalizeGeneratedQuestions(
    [
      {
        pertanyaan: 'Apa fungsi lambung?',
        options: [
          { label: 'A', text: 'Mencerna protein dengan pepsin' },
          { label: 'B', text: 'Menyerap air' },
          { label: 'C', text: 'Memompa darah' },
          { label: 'D', text: 'Menyaring udara' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Lambung menghasilkan enzim pepsin.',
      },
      {
        pertanyaan: 'Usus besar berfungsi menyerap air.',
        kunciJawaban: 'Benar',
        pembahasan: 'Benar, usus besar menyerap kembali air dari sisa makanan.',
      },
    ],
    slots,
    {
      capaianPembelajaran: 'CP',
      tujuanPembelajaran: 'Memahami organ pencernaan',
      materiPokok: 'Sistem Pencernaan',
      indikatorSoal: 'Mengidentifikasi fungsi organ',
      kompetensi: 'Pengetahuan faktual',
    },
    4
  );

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].type, 'pilihan_ganda');
  assert.equal(normalized[0].options?.length, 4);
  assert.equal(normalized[0].kunciJawaban, 'A');
  assert.equal(normalized[1].type, 'benar_salah');
  assert.equal(normalized[1].kunciJawaban, 'Benar');
});

test('getExamMatchingColumns shifts Column B so student sheets do not align 1-A directly', () => {
  const display = getExamMatchingColumns([
    { id: '1', left: 'Mulut', right: 'Ptialin' },
    { id: '2', left: 'Lambung', right: 'Pepsin' },
    { id: '3', left: 'Usus Halus', right: 'Penyerapan' },
  ]);

  assert.equal(display.rightItems[0].text, 'Pepsin');
  assert.equal(display.rightItems[1].text, 'Penyerapan');
  assert.equal(display.rightItems[2].text, 'Ptialin');
  assert.equal(display.answerKeySummary, '1→C, 2→A, 3→B');
});
