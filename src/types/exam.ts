export type EducationLevel = 'SD' | 'SMP' | 'SMA';

export type AssessmentType =
  | 'Latihan'
  | 'Ulangan Harian'
  | 'PTS'
  | 'PAS'
  | 'Asesmen';

export type SemesterType = 'Ganjil' | 'Genap';

export type QuestionType =
  | 'pilihan_ganda'
  | 'pilihan_ganda_kompleks'
  | 'benar_salah'
  | 'menjodohkan'
  | 'isian_singkat'
  | 'uraian';

export type DifficultyLevel = 'mudah' | 'sedang' | 'sulit';

export type CognitiveLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export type NavTab =
  | 'beranda'
  | 'identitas'
  | 'buat_soal'
  | 'bank_soal'
  | 'kisi_kisi'
  | 'riwayat'
  | 'cetak'
  | 'pengaturan';

export interface SchoolIdentity {
  namaSekolah: string;
  alamatSekolah: string;
  jenjang: EducationLevel;
  namaGuru: string;
  nip: string;
  mataPelajaran: string;
  kelas: string;
  semester: SemesterType;
  tahunPelajaran: string;
  jenisPenilaian: AssessmentType;
}

export interface LearningObjectives {
  capaianPembelajaran: string;
  tujuanPembelajaran: string;
  materiPokok: string;
  indikatorSoal: string;
  kompetensi: string;
}

export interface DifficultyCounts {
  mudah: number;
  sedang: number;
  sulit: number;
}

export interface QuestionOption {
  label: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface QuestionItem {
  id: string;
  nomor: number;
  type: QuestionType;
  difficulty: DifficultyLevel;
  cognitiveLevel: CognitiveLevel;
  indikator: string;
  tujuanPembelajaran: string;
  materi: string;
  pertanyaan: string;
  options?: QuestionOption[];
  matchingPairs?: MatchingPair[];
  kunciJawaban: string; // e.g., "A", "A, C", "Benar", "1-B, 2-A, 3-C", short text, or rubric answer
  correctOptionLabels?: string[]; // for pilihan_ganda / pilihan_ganda_kompleks
  pembahasan: string;
  skor: number;
}

export interface ExamPackage {
  id: string;
  judul: string;
  paketLabel: string; // "Paket A", "Paket B", etc.
  createdAt: string;
  updatedAt: string;
  identity: SchoolIdentity;
  objectives: LearningObjectives;
  questions: QuestionItem[];
}

export interface BankQuestion extends QuestionItem {
  bankId: string;
  mataPelajaran: string;
  kelas: string;
  jenjang: EducationLevel;
  savedAt: string;
  sourcePackageTitle?: string;
}

export interface KisiKisiRow {
  nomorSoal: number;
  tujuanPembelajaran: string;
  materi: string;
  indikatorSoal: string;
  bentukSoal: string;
  tingkatKesukaran: string;
  levelKognitif: string;
}

export interface AppSettings {
  jumlahPilihanPG: 4 | 5;
  tampilkanNipDiKop: boolean;
  tampilkanPetunjukUmum: boolean;
  alokasiWaktuMenit: number;
  kotaTanggalCetak: string;
}

export interface BlueprintSlot {
  nomor: number;
  type: QuestionType;
  difficulty: DifficultyLevel;
  suggestedCognitiveLevel: CognitiveLevel;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  pilihan_ganda: 'Pilihan Ganda',
  pilihan_ganda_kompleks: 'Pilihan Ganda Kompleks',
  benar_salah: 'Benar atau Salah',
  menjodohkan: 'Menjodohkan',
  isian_singkat: 'Isian Singkat',
  uraian: 'Uraian / Essay',
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  mudah: 'Tingkat Rendah (Mudah)',
  sedang: 'Tingkat Sedang',
  sulit: 'Tingkat Sulit (Tinggi)',
};

export const DIFFICULTY_SHORT_LABELS: Record<DifficultyLevel, string> = {
  mudah: 'Mudah',
  sedang: 'Sedang',
  sulit: 'Sulit',
};

export const COGNITIVE_LABELS: Record<CognitiveLevel, string> = {
  C1: 'C1 – Mengingat',
  C2: 'C2 – Memahami',
  C3: 'C3 – Menerapkan',
  C4: 'C4 – Menganalisis',
  C5: 'C5 – Mengevaluasi',
  C6: 'C6 – Mencipta',
};
