import {
  AppSettings,
  BankQuestion,
  ExamPackage,
  LearningObjectives,
  SchoolIdentity,
} from '../types/exam';

export const DEFAULT_IDENTITY: SchoolIdentity = {
  namaSekolah: 'SMP Negeri 1 Nusantara',
  alamatSekolah: 'Jl. Merdeka Belajar No. 45, Kota Bandung',
  jenjang: 'SMP',
  namaGuru: 'Siti Rahmawati, S.Pd.',
  nip: '19880415 201503 2 004',
  mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
  kelas: 'VIII',
  semester: 'Ganjil',
  tahunPelajaran: '2026/2027',
  jenisPenilaian: 'Ulangan Harian',
};

export const DEFAULT_OBJECTIVES: LearningObjectives = {
  capaianPembelajaran:
    'Pada akhir Fase D, peserta didik mampu melakukan analisis untuk menemukan keterkaitan sistem organ dengan fungsinya serta kelainan atau gangguan yang muncul pada sistem organ tertentu (sistem pencernaan, sistem peredaran darah, sistem pernapasan, dan sistem reproduksi).',
  tujuanPembelajaran:
    'Peserta didik mampu menjelaskan organ-organ penyusun sistem pencernaan manusia, menganalisis peran enzim pencernaan, serta mengevaluasi pola makan sehat untuk mencegah gangguan pencernaan.',
  materiPokok: 'Sistem Pencernaan Manusia, Enzim Pencernaan, dan Gangguan Pencernaan',
  indikatorSoal:
    'Mengidentifikasi organ pencernaan dan fungsinya; menghubungkan enzim dengan zat makanan yang dipecah; menganalisis kasus gangguan sistem pencernaan dalam kehidupan sehari-hari.',
  kompetensi:
    'Pemahaman konsep biologi dasar, penerapan pola gizi seimbang, dan penalaran kritis terhadap permasalahan kesehatan.',
};

export const DEFAULT_SETTINGS: AppSettings = {
  jumlahPilihanPG: 4,
  tampilkanNipDiKop: true,
  tampilkanPetunjukUmum: true,
  alokasiWaktuMenit: 60,
  kotaTanggalCetak: 'Bandung, November 2026',
};

export interface CurriculumTemplate {
  id: string;
  title: string;
  jenjang: 'SD' | 'SMP' | 'SMA';
  subtitle: string;
  identityPatch: Partial<SchoolIdentity>;
  objectives: LearningObjectives;
}

export const CURRICULUM_TEMPLATES: CurriculumTemplate[] = [
  {
    id: 'tpl-sd-matematika',
    title: 'SD Kelas V · Matematika',
    jenjang: 'SD',
    subtitle: 'Operasi Hitung Pecahan & Desimal (Fase C)',
    identityPatch: {
      namaSekolah: 'SD Negeri 02 Harapan Bangsa',
      jenjang: 'SD',
      mataPelajaran: 'Matematika',
      kelas: 'V',
      jenisPenilaian: 'Latihan',
    },
    objectives: {
      capaianPembelajaran:
        'Pada akhir Fase C, peserta didik dapat membandingkan dan mengurutkan berbagai pecahan termasuk pecahan campuran, melakukan operasi penjumlahan dan pengurangan pecahan, serta melakukan operasi perkalian dan pembagian pecahan dengan bilangan asli.',
      tujuanPembelajaran:
        'Peserta didik mampu menghitung penjumlahan, pengurangan, serta menyelesaikan soal cerita sehari-hari yang melibatkan pecahan biasa dan pecahan campuran.',
      materiPokok: 'Operasi Hitung Pecahan Biasa dan Pecahan Campuran',
      indikatorSoal:
        'Menentukan hasil penjumlahan pecahan berpenyebut berbeda; mengubah pecahan campuran; memecahkan masalah kontekstual pembagian kue atau bahan makanan dalam bentuk pecahan.',
      kompetensi: 'Numerasi dasar, pemahaman konsep pecahan, dan pemecahan masalah sehari-hari.',
    },
  },
  {
    id: 'tpl-smp-ipa',
    title: 'SMP Kelas VIII · IPA',
    jenjang: 'SMP',
    subtitle: 'Sistem Pencernaan Manusia (Fase D)',
    identityPatch: {
      namaSekolah: 'SMP Negeri 1 Nusantara',
      jenjang: 'SMP',
      mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
      kelas: 'VIII',
      jenisPenilaian: 'Ulangan Harian',
    },
    objectives: DEFAULT_OBJECTIVES,
  },
  {
    id: 'tpl-sma-sejarah',
    title: 'SMA Kelas XI · Sejarah',
    jenjang: 'SMA',
    subtitle: 'Pergerakan Nasional Indonesia (Fase F)',
    identityPatch: {
      namaSekolah: 'SMA Negeri 3 Cendekia',
      jenjang: 'SMA',
      mataPelajaran: 'Sejarah Indonesia',
      kelas: 'XI',
      jenisPenilaian: 'PTS',
    },
    objectives: {
      capaianPembelajaran:
        'Pada akhir Fase F, peserta didik mampu menganalisis secara kritis dinamika pergerakan kebangsaan Indonesia dari masa organisasi modern hingga proklamasi kemerdekaan serta merefleksikan nilai persatuan dalam konteks kekinian.',
      tujuanPembelajaran:
        'Peserta didik mampu membedakan strategi perjuangan organisasi pergerakan nasional (kooperatif dan nonkooperatif), menganalisis makna Sumpah Pemuda 1928, serta mengevaluasi dampaknya terhadap integrasi bangsa.',
      materiPokok: 'Organisasi Pergerakan Nasional dan Sumpah Pemuda 1928',
      indikatorSoal:
        'Mengidentifikasi tokoh dan tujuan Budi Utomo serta Sarekat Islam; membandingkan taktik kooperatif dan nonkooperatif; menganalisis relevansi nilai Sumpah Pemuda terhadap persatuan modern.',
      kompetensi: 'Berpikir kronologis, analisis sumber sejarah, dan evaluasi kritis kebangsaan.',
    },
  },
];

export const SEED_PACKAGES: ExamPackage[] = [
  {
    id: 'pkg-seed-ipa-8',
    judul: 'Ulangan Harian IPA Kelas VIII – Paket A',
    paketLabel: 'Paket A',
    createdAt: '2026-11-24T08:30:00.000Z',
    updatedAt: '2026-11-24T08:30:00.000Z',
    identity: DEFAULT_IDENTITY,
    objectives: DEFAULT_OBJECTIVES,
    questions: [
      {
        id: 'seed-q-1',
        nomor: 1,
        type: 'pilihan_ganda',
        difficulty: 'mudah',
        cognitiveLevel: 'C1',
        indikator: 'Mengidentifikasi enzim pencernaan yang bekerja di rongga mulut beserta substratnya.',
        tujuanPembelajaran: DEFAULT_OBJECTIVES.tujuanPembelajaran,
        materi: 'Organ dan Enzim Pencernaan',
        pertanyaan:
          'Pencernaan kimiawi pertama kali terjadi di rongga mulut dengan bantuan air liur. Enzim yang berfungsi mengubah amilum menjadi maltosa di rongga mulut adalah...',
        options: [
          { label: 'A', text: 'Enzim pepsin' },
          { label: 'B', text: 'Enzim ptialin (amilase)' },
          { label: 'C', text: 'Enzim lipase' },
          { label: 'D', text: 'Enzim tripsin' },
        ],
        kunciJawaban: 'B',
        correctOptionLabels: ['B'],
        pembahasan:
          'Kelenjar ludah di rongga mulut menghasilkan enzim ptialin (amilase ludah) yang memecah karbohidrat kompleks (amilum) menjadi gula yang lebih sederhana (maltosa).',
        skor: 2,
      },
      {
        id: 'seed-q-2',
        nomor: 2,
        type: 'pilihan_ganda',
        difficulty: 'sedang',
        cognitiveLevel: 'C3',
        indikator: 'Menerapkan fungsi asam klorida (HCl) pada proses pencernaan di lambung.',
        tujuanPembelajaran: DEFAULT_OBJECTIVES.tujuanPembelajaran,
        materi: 'Pencernaan di Lambung',
        pertanyaan:
          'Saat seseorang mengonsumsi makanan yang kurang bersih, banyak bakteri ikut tertelan. Bagian lambung membantu membunuh kuman tersebut sekaligus mengaktifkan pepsinogen menjadi pepsin melalui sekresi...',
        options: [
          { label: 'A', text: 'Cairan empedu' },
          { label: 'B', text: 'Asam klorida (HCl)' },
          { label: 'C', text: 'Natrium bikarbonat' },
          { label: 'D', text: 'Enzim erepsin' },
        ],
        kunciJawaban: 'B',
        correctOptionLabels: ['B'],
        pembahasan:
          'Asam klorida (HCl) di lambung menciptakan suasana asam (pH ~2) yang efektif membunuh patogen serta mengubah pepsinogen inaktif menjadi enzim pepsin aktif.',
        skor: 2,
      },
      {
        id: 'seed-q-3',
        nomor: 3,
        type: 'pilihan_ganda_kompleks',
        difficulty: 'sedang',
        cognitiveLevel: 'C3',
        indikator: 'Menentukan dua organ yang berperan langsung dalam pencernaan kimiawi lemak dan protein.',
        tujuanPembelajaran: DEFAULT_OBJECTIVES.tujuanPembelajaran,
        materi: 'Kelenjar Pencernaan',
        pertanyaan:
          'Pilih DUA jawaban yang benar! Organ berikut yang menghasilkan cairan atau enzim penting untuk membantu penguraian lemak di usus dua belas jari (duodenum) adalah...',
        options: [
          { label: 'A', text: 'Hati (menghasilkan empedu untuk mengemulsikan lemak)' },
          { label: 'B', text: 'Kerongkongan (melakukan gerak peristaltik)' },
          { label: 'C', text: 'Pankreas (menghasilkan enzim lipase)' },
          { label: 'D', text: 'Usus besar (menyerap kembali air)' },
        ],
        kunciJawaban: 'A, C',
        correctOptionLabels: ['A', 'C'],
        pembahasan:
          'Hati memproduksi empedu untuk mengemulsikan lemak menjadi butiran halus, kemudian enzim lipase dari pankreas memecah lemak menjadi asam lemak dan gliserol.',
        skor: 4,
      },
      {
        id: 'seed-q-4',
        nomor: 4,
        type: 'benar_salah',
        difficulty: 'mudah',
        cognitiveLevel: 'C2',
        indikator: 'Memahami fungsi utama usus besar dalam pengaturan kadar air sisa makanan.',
        tujuanPembelajaran: DEFAULT_OBJECTIVES.tujuanPembelajaran,
        materi: 'Usus Besar',
        pertanyaan:
          'Tentukan apakah pernyataan berikut BENAR atau SALAH: "Usus besar berfungsi utama menyerap kembali air dari sisa makanan dan membantu pembusukan sisa makanan dengan bantuan bakteri Escherichia coli."',
        kunciJawaban: 'Benar',
        pembahasan:
          'Pernyataan tersebut BENAR. Usus besar (kolon) mengatur kadar air pada feses dan menjadi tempat simbiosis bakteri E. coli yang juga membantu sintesis vitamin K.',
        skor: 2,
      },
      {
        id: 'seed-q-5',
        nomor: 5,
        type: 'menjodohkan',
        difficulty: 'sedang',
        cognitiveLevel: 'C2',
        indikator: 'Menghubungkan organ pencernaan dengan proses utama yang terjadi di dalamnya.',
        tujuanPembelajaran: DEFAULT_OBJECTIVES.tujuanPembelajaran,
        materi: 'Organ Pencernaan dan Fungsinya',
        pertanyaan:
          'Pasangkan organ pencernaan pada kolom kiri dengan fungsi utamanya yang tepat pada kolom kanan.',
        matchingPairs: [
          { id: 'mp-1', left: 'Kerongkongan (Esofagus)', right: 'Mendorong bolus makanan dengan gerak peristaltik' },
          { id: 'mp-2', left: 'Usus Halus (Vili)', right: 'Menyerap sari-sari makanan ke aliran darah' },
          { id: 'mp-3', left: 'Lambung', right: 'Memecah protein menjadi pepton dengan enzim pepsin' },
        ],
        kunciJawaban:
          '1 → Mendorong bolus makanan dengan gerak peristaltik; 2 → Menyerap sari-sari makanan ke aliran darah; 3 → Memecah protein menjadi pepton dengan enzim pepsin',
        pembahasan:
          'Setiap organ pencernaan memiliki peran spesifik: esofagus menyalurkan makanan secara peristaltik, lambung mencerna protein secara kimiawi, dan jonjot usus halus (vili) menyerap nutrisi.',
        skor: 5,
      },
      {
        id: 'seed-q-6',
        nomor: 6,
        type: 'isian_singkat',
        difficulty: 'mudah',
        cognitiveLevel: 'C1',
        indikator: 'Menyebutkan istilah gangguan pencernaan akibat kekurangan serat dan cairan.',
        tujuanPembelajaran: DEFAULT_OBJECTIVES.tujuanPembelajaran,
        materi: 'Gangguan Sistem Pencernaan',
        pertanyaan:
          'Gangguan pencernaan yang ditandai dengan sulit buang air besar karena feses terlalu keras akibat kurang mengonsumsi serat dan air disebut...',
        kunciJawaban: 'Konstipasi (Sembelit)',
        pembahasan:
          'Konstipasi atau sembelit terjadi ketika penyerapan air di usus besar berlangsung berlebihan sehingga feses menjadi kering dan keras.',
        skor: 3,
      },
      {
        id: 'seed-q-7',
        nomor: 7,
        type: 'uraian',
        difficulty: 'sulit',
        cognitiveLevel: 'C5',
        indikator: 'Mengevaluasi kebiasaan makan tidak teratur dan menyusun solusi pencegahan gastritis (maag).',
        tujuanPembelajaran: DEFAULT_OBJECTIVES.tujuanPembelajaran,
        materi: 'Gangguan Pencernaan dan Pola Makan Sehat',
        pertanyaan:
          'Raka sering melewatkan sarapan, gemar mengonsumsi makanan sangat pedas saat perut kosong, dan jarang minum air putih. Akhir-akhir ini ia sering mengeluh nyeri perih di ulu hati. Analisislah gangguan pencernaan yang kemungkinan dialami Raka serta berikan tiga rekomendasi pola makan sehat disertai alasannya!',
        kunciJawaban:
          'Gangguan yang dialami Raka adalah gastritis (maag). Rekomendasi: (1) Makan teratur 3 kali sehari agar asam lambung tidak mengiritasi dinding lambung kosong; (2) Mengurangi makanan pedas/asam berlebih yang memicu iritasi mukosa lambung; (3) Mencukupi minum air putih dan konsumsi makanan bergizi seimbang untuk menjaga kesehatan saluran cerna.',
        pembahasan:
          'Skor penuh diberikan apabila siswa mampu mengidentifikasi gastritis/maag secara tepat (skor 3), menjelaskan mekanisme iritasi HCl pada dinding lambung (skor 3), dan menuliskan 3 langkah pencegahan logis beserta alasannya (skor 4).',
        skor: 10,
      },
    ],
  },
];

export const SEED_BANK_QUESTIONS: BankQuestion[] = SEED_PACKAGES[0].questions.map(
  (q, idx) => ({
    ...q,
    bankId: `bank-seed-${idx + 1}`,
    mataPelajaran: DEFAULT_IDENTITY.mataPelajaran,
    kelas: DEFAULT_IDENTITY.kelas,
    jenjang: DEFAULT_IDENTITY.jenjang,
    savedAt: '2026-11-24T08:35:00.000Z',
    sourcePackageTitle: SEED_PACKAGES[0].judul,
  })
);
