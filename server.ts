import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  buildQuestionBlueprintSlots,
  normalizeGeneratedQuestions,
  validateGeneratorForm,
  type RawAIQuestion,
} from './src/utils/questionLogic';
import {
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  type BlueprintSlot,
  type DifficultyCounts,
  type LearningObjectives,
  type QuestionItem,
  type QuestionType,
  type SchoolIdentity,
} from './src/types/exam';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const PRIMARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY belum terkonfigurasi di lingkungan server. Silakan periksa pengaturan Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const QUESTION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nomor: { type: Type.INTEGER },
          type: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          cognitiveLevel: {
            type: Type.STRING,
            description: 'Salah satu dari: C1, C2, C3, C4, C5, C6',
          },
          indikator: { type: Type.STRING },
          tujuanPembelajaran: { type: Type.STRING },
          materi: { type: Type.STRING },
          pertanyaan: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ['label', 'text'],
            },
          },
          matchingPairs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                left: { type: Type.STRING },
                right: { type: Type.STRING },
              },
              required: ['left', 'right'],
            },
          },
          kunciJawaban: { type: Type.STRING },
          correctOptionLabels: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          pembahasan: { type: Type.STRING },
        },
        required: [
          'nomor',
          'type',
          'difficulty',
          'cognitiveLevel',
          'indikator',
          'pertanyaan',
          'kunciJawaban',
          'pembahasan',
        ],
      },
    },
  },
  required: ['questions'],
};

const SYSTEM_INSTRUCTION = `Anda adalah pakar penyusunan instrumen asesmen pendidikan Indonesia yang sangat menguasai Kurikulum Merdeka untuk jenjang SD, SMP, dan SMA.

Aturan wajib penyusunan soal:
1. Semua teks harus dalam Bahasa Indonesia baku yang komunikatif, jelas, dan sesuai usia perkembangan kognitif peserta didik pada jenjang dan kelas yang diminta.
2. Setiap butir soal WAJIB relevan langsung dengan Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), Materi Pokok, Indikator Soal, dan Kompetensi yang diberikan guru. Jangan keluar dari materi.
3. Soal harus bervariasi, kontekstual, tidak berulang, dan tidak ambigu.
4. Kriteria tingkat kesukaran:
   - mudah (Tingkat Rendah): C1/C2 — mengukur mengingat, memahami konsep dasar, mengenali istilah/pengertian, soal sederhana dan langsung.
   - sedang (Tingkat Sedang): C2/C3 — mengukur memahami, menerapkan konsep, menghubungkan informasi, menganalisis contoh sederhana.
   - sulit (Tingkat Sulit/Tinggi): C4/C5/C6 — mengukur menganalisis, mengevaluasi informasi, memecahkan masalah kontekstual, menyusun kesimpulan dan memberikan alasan.
5. Aturan per bentuk soal:
   - pilihan_ganda: Sediakan pilihan jawaban yang masuk akal dan homogen (A-D atau A-E sesuai instruksi), tentukan TEPAT SATU jawaban benar. Isi correctOptionLabels dengan 1 huruf (misal ["B"]) dan kunciJawaban dengan huruf yang sama ("B").
   - pilihan_ganda_kompleks: Sediakan pilihan jawaban (A-D atau A-E) dan sebutkan di pertanyaan bahwa peserta didik memilih lebih dari satu jawaban benar (biasanya 2 jawaban benar). Isi correctOptionLabels dengan array huruf benar (misal ["A", "C"]) dan kunciJawaban "A, C".
   - benar_salah: Buat pernyataan yang jelas untuk dinilai Benar atau Salah. Isi kunciJawaban tepat "Benar" atau "Salah".
   - menjodohkan: Sediakan 3-4 pasangan pada matchingPairs (left = premis/pernyataan, right = pasangan yang benar). Isi kunciJawaban ringkasan pasangan yang tepat.
   - isian_singkat: Pertanyaan menuntut jawaban ringkas, pasti, dan objektif (1-4 kata atau angka).
   - uraian: Pertanyaan terbuka/analitis yang menuntut penjelasan, alasan, atau langkah pemecahan masalah. Sertakan pedoman jawaban lengkap di kunciJawaban dan rubrik/alasan di pembahasan.
6. Selalu sertakan indikator soal spesifik per butir, level kognitif (C1-C6), kunci jawaban yang akurat berdasarkan soal yang dihasilkan, serta pembahasan yang edukatif dan jelas.`;

function buildSlotInstructionText(slots: BlueprintSlot[], optionCount: 4 | 5): string {
  return slots
    .map(
      (s) =>
        `Soal #${s.nomor}: bentuk="${s.type}" (${QUESTION_TYPE_LABELS[s.type]}), tingkat_kesukaran="${s.difficulty}" (${DIFFICULTY_LABELS[s.difficulty]}), target_level_kognitif="${s.suggestedCognitiveLevel}"${
          s.type === 'pilihan_ganda' || s.type === 'pilihan_ganda_kompleks'
            ? `, jumlah_pilihan=${optionCount} (A-${optionCount === 5 ? 'E' : 'D'})`
            : ''
        }`
    )
    .join('\n');
}

function parseJsonResponse(rawText: string | undefined): { questions?: RawAIQuestion[] } {
  const cleaned = (rawText ?? '').trim();
  if (!cleaned) {
    throw new Error('Respons AI kosong. Silakan coba lagi.');
  }
  const withoutFences = cleaned
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(withoutFences) as { questions?: RawAIQuestion[] };
}

function mapGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    return {
      status: 403,
      message:
        'Akses API AI ditolak. Periksa kembali konfigurasi GEMINI_API_KEY pada panel Settings > Secrets.',
    };
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return {
      status: 429,
      message:
        'Kuota permintaan AI sedang penuh. Tunggu beberapa saat lalu coba generate kembali.',
    };
  }
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
    return {
      status: 503,
      message:
        'Server AI sedang mengalami lonjakan trafik sementara. Silakan klik tombol BUAT SOAL OTOMATIS kembali dalam beberapa detik.',
    };
  }
  if (msg.includes('GEMINI_API_KEY belum terkonfigurasi')) {
    return { status: 500, message: msg };
  }
  return {
    status: 500,
    message: `Gagal menghasilkan soal otomatis: ${msg.slice(0, 220)}`,
  };
}

async function generateStructuredQuestions(
  ai: GoogleGenAI,
  prompt: string,
  expectedCount: number
): Promise<RawAIQuestion[]> {
  const attempts: Array<{ model: string; useThinking: boolean }> = [
    { model: PRIMARY_MODEL, useThinking: true },
    { model: FALLBACK_MODEL, useThinking: false },
    { model: FALLBACK_MODEL, useThinking: false },
  ];

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const { model, useThinking } = attempts[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: QUESTION_RESPONSE_SCHEMA,
          ...(useThinking
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });
      const data = parseJsonResponse(response.text);
      if (!Array.isArray(data.questions) || data.questions.length < expectedCount) {
        throw new Error(
          `Jumlah soal dari AI (${data.questions?.length ?? 0}) tidak sesuai permintaan (${expectedCount}).`
        );
      }
      return data.questions;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('403') || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
        throw err;
      }
      if (i < attempts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (i + 1)));
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'smart-teacher-api' });
  });

  app.post('/api/questions/generate', async (req, res) => {
    try {
      const body = req.body as {
        identity?: SchoolIdentity;
        objectives?: LearningObjectives;
        selectedTypes?: QuestionType[];
        counts?: DifficultyCounts;
        optionCount?: 4 | 5;
      };

      if (!body.identity || !body.objectives || !body.selectedTypes || !body.counts) {
        res.status(400).json({
          error: 'Data permintaan tidak lengkap. Lengkapi identitas, tujuan pembelajaran, jenis soal, dan jumlah soal.',
        });
        return;
      }

      const validation = validateGeneratorForm(
        body.identity,
        body.objectives,
        body.selectedTypes,
        body.counts
      );
      if (!validation.valid) {
        res.status(400).json({
          error: validation.errors.join(' '),
          errors: validation.errors,
        });
        return;
      }

      const optionCount: 4 | 5 = body.optionCount === 5 ? 5 : 4;
      const slots = buildQuestionBlueprintSlots(body.selectedTypes, body.counts);

      const prompt = `Buatlah TEPAT ${slots.length} butir soal asesmen Kurikulum Merdeka berdasarkan rincian berikut:

IDENTITAS PEMBELAJARAN:
- Jenjang / Kelas: ${body.identity.jenjang} Kelas ${body.identity.kelas}
- Mata Pelajaran: ${body.identity.mataPelajaran}
- Semester / Tahun Pelajaran: ${body.identity.semester} / ${body.identity.tahunPelajaran}
- Jenis Penilaian: ${body.identity.jenisPenilaian}

TUJUAN & MATERI PEMBELAJARAN:
- Capaian Pembelajaran (CP): ${body.objectives.capaianPembelajaran || '-'}
- Tujuan Pembelajaran (TP): ${body.objectives.tujuanPembelajaran}
- Materi Pokok: ${body.objectives.materiPokok}
- Indikator Soal: ${body.objectives.indikatorSoal || '-'}
- Kompetensi yang Diukur: ${body.objectives.kompetensi || '-'}

DAFTAR SLOT SOAL WAJIB (HARUS BERURUTAN & SAMA PERSIS JUMLAHNYA = ${slots.length} SOAL):
${buildSlotInstructionText(slots, optionCount)}

Kembalikan JSON dengan properti "questions" yang berisi tepat ${slots.length} objek soal sesuai urutan nomor di atas.`;

      const ai = getGeminiClient();
      const parsed = await generateStructuredQuestions(ai, prompt, slots.length);

      const normalized = normalizeGeneratedQuestions(
        parsed,
        slots,
        body.objectives,
        optionCount
      );

      res.json({ questions: normalized });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post('/api/questions/regenerate-one', async (req, res) => {
    try {
      const body = req.body as {
        identity?: SchoolIdentity;
        objectives?: LearningObjectives;
        targetQuestion?: QuestionItem;
        existingPrompts?: string[];
        optionCount?: 4 | 5;
      };

      if (!body.identity || !body.objectives || !body.targetQuestion) {
        res.status(400).json({ error: 'Data soal yang akan diganti tidak lengkap.' });
        return;
      }

      const optionCount: 4 | 5 = body.optionCount === 5 ? 5 : 4;
      const target = body.targetQuestion;
      const singleSlot: BlueprintSlot = {
        nomor: target.nomor,
        type: target.type,
        difficulty: target.difficulty,
        suggestedCognitiveLevel: target.cognitiveLevel,
      };

      const avoidList = (body.existingPrompts ?? [])
        .slice(0, 15)
        .map((p, i) => `${i + 1}. ${p}`)
        .join('\n');

      const prompt = `Buatlah TEPAT 1 butir soal pengganti yang baru, segar, dan berbeda dari soal sebelumnya.

IDENTITAS:
- Jenjang / Kelas: ${body.identity.jenjang} Kelas ${body.identity.kelas}
- Mata Pelajaran: ${body.identity.mataPelajaran}
- Jenis Penilaian: ${body.identity.jenisPenilaian}

TUJUAN & MATERI:
- CP: ${body.objectives.capaianPembelajaran || '-'}
- TP: ${body.objectives.tujuanPembelajaran}
- Materi Pokok: ${body.objectives.materiPokok}
- Indikator Soal: ${body.objectives.indikatorSoal || '-'}
- Kompetensi: ${body.objectives.kompetensi || '-'}

SPESIFIKASI SOAL PENGGANTI:
${buildSlotInstructionText([singleSlot], optionCount)}

HINDARI MENGULANG PERTANYAAN BERIKUT:
${avoidList || '(belum ada)'}

Kembalikan JSON dengan properti "questions" berisi tepat 1 soal pengganti.`;

      const ai = getGeminiClient();
      const parsed = await generateStructuredQuestions(ai, prompt, 1);

      const normalized = normalizeGeneratedQuestions(
        parsed,
        [singleSlot],
        body.objectives,
        optionCount
      );

      res.json({ question: { ...normalized[0], nomor: target.nomor } });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SMART TEACHER server berjalan di http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Gagal memulai server SMART TEACHER:', err);
  process.exit(1);
});
