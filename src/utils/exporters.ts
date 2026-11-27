import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import {
  AppSettings,
  COGNITIVE_LABELS,
  DIFFICULTY_SHORT_LABELS,
  ExamPackage,
  QUESTION_TYPE_LABELS,
} from '../types/exam';
import {
  generateKisiKisiRows,
  getExamMatchingColumns,
} from './questionLogic';

function sanitizeFileName(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 64);
}

function renderSchoolHeaderPdf(
  doc: jsPDF,
  examPackage: ExamPackage,
  settings: AppSettings,
  subtitle: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const { identity } = examPackage;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(identity.namaSekolah.toUpperCase(), pageWidth / 2, 16, {
    align: 'center',
  });

  let y = 21;
  if (identity.alamatSekolah.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(identity.alamatSekolah, pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    `${subtitle.toUpperCase()} – ${identity.jenisPenilaian.toUpperCase()} (${examPackage.paketLabel.toUpperCase()})`,
    pageWidth / 2,
    y + 1,
    { align: 'center' }
  );
  y += 4;

  // Double official Indonesian kop line
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.25);
  doc.line(margin, y + 1.2, pageWidth - margin, y + 1.2);
  y += 6;

  // Exam metadata & student identity table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [148, 163, 184],
      lineWidth: 0.2,
    },
    body: [
      [
        `Mata Pelajaran : ${identity.mataPelajaran}`,
        `Nama Siswa : ........................................`,
      ],
      [
        `Kelas / Semester : ${identity.kelas} / ${identity.semester}`,
        `Nomor Absen : ........................................`,
      ],
      [
        `Tahun Pelajaran : ${identity.tahunPelajaran}`,
        `Hari / Tanggal : ........................................`,
      ],
      [
        `Guru Pengampu : ${identity.namaGuru}${settings.tampilkanNipDiKop && identity.nip ? ` (NIP. ${identity.nip})` : ''}`,
        `Alokasi Waktu : ${settings.alokasiWaktuMenit} Menit   |   Nilai : [          ]`,
      ],
    ],
  });

  const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable?.finalY;
  return (lastY ?? y + 26) + 6;
}

export function exportExamToPdf(
  examPackage: ExamPackage,
  settings: AppSettings
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;

  let y = renderSchoolHeaderPdf(doc, examPackage, settings, 'Lembar Soal');

  if (settings.tampilkanPetunjukUmum) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Petunjuk Umum:', margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const petunjuk = [
      '1. Tulislah nama lengkap, nomor absen, dan hari/tanggal pada kolom yang tersedia.',
      '2. Bacalah setiap butir soal dengan teliti sebelum menjawab.',
      '3. Kerjakan soal yang dianggap paling mudah terlebih dahulu dan periksa kembali jawaban sebelum dikumpulkan.',
    ];
    petunjuk.forEach((line) => {
      doc.text(line, margin + 2, y);
      y += 4;
    });
    y += 3;
  }

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };

  examPackage.questions.forEach((q, idx) => {
    const num = q.nomor || idx + 1;
    const typeLabel = QUESTION_TYPE_LABELS[q.type];
    const headerLines = doc.splitTextToSize(
      `${num}. [${typeLabel}] ${q.pertanyaan}`,
      maxWidth
    );

    ensureSpace(headerLines.length * 4.8 + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(headerLines, margin, y);
    y += headerLines.length * 4.8 + 1.5;

    if (
      (q.type === 'pilihan_ganda' || q.type === 'pilihan_ganda_kompleks') &&
      q.options
    ) {
      q.options.forEach((opt) => {
        const optLines = doc.splitTextToSize(
          `${opt.label}. ${opt.text}`,
          maxWidth - 8
        );
        ensureSpace(optLines.length * 4.5 + 2);
        doc.text(optLines, margin + 6, y);
        y += optLines.length * 4.5 + 0.8;
      });
    } else if (q.type === 'benar_salah') {
      ensureSpace(8);
      doc.text('   [   ] Benar        [   ] Salah', margin + 4, y);
      y += 6;
    } else if (q.type === 'menjodohkan' && q.matchingPairs) {
      const display = getExamMatchingColumns(q.matchingPairs);
      ensureSpace(q.matchingPairs.length * 7 + 8);
      autoTable(doc, {
        startY: y,
        margin: { left: margin + 4, right: margin },
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2 },
        head: [['No', 'Pernyataan (Kolom A)', 'Jawaban', 'Pilihan (Kolom B)']],
        body: display.leftItems.map((leftItem, pIdx) => {
          const rightItem = display.rightItems[pIdx];
          return [
            String(leftItem.number),
            leftItem.text,
            '( ...... )',
            `${rightItem.letter}. ${rightItem.text}`,
          ];
        }),
      });
      const tableEnd = (doc as unknown as { lastAutoTable?: { finalY: number } })
        .lastAutoTable?.finalY;
      y = (tableEnd ?? y + 20) + 4;
    } else if (q.type === 'isian_singkat') {
      ensureSpace(10);
      doc.text(
        '   Jawaban: ....................................................................................',
        margin + 4,
        y
      );
      y += 7;
    } else if (q.type === 'uraian') {
      ensureSpace(20);
      doc.text('   Jawaban:', margin + 4, y);
      y += 5;
      for (let line = 0; line < 3; line++) {
        doc.setDrawColor(203, 213, 225);
        doc.line(margin + 6, y, pageWidth - margin, y);
        y += 5.5;
      }
    }

    y += 3;
  });

  const filename = `Soal_${sanitizeFileName(examPackage.identity.mataPelajaran)}_Kelas_${sanitizeFileName(examPackage.identity.kelas)}_${sanitizeFileName(examPackage.paketLabel)}.pdf`;
  doc.save(filename);
}

export function exportAnswerKeyToPdf(examPackage: ExamPackage): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const { identity } = examPackage;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KUNCI JAWABAN DAN PEMBAHASAN SOAL', pageWidth / 2, 16, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    `${identity.namaSekolah} | ${identity.mataPelajaran} | Kelas ${identity.kelas} (${identity.semester}) | ${examPackage.paketLabel}`,
    pageWidth / 2,
    22,
    { align: 'center' }
  );
  doc.text(
    `Jenis Penilaian: ${identity.jenisPenilaian} | Guru: ${identity.namaGuru} | Tahun Pelajaran: ${identity.tahunPelajaran}`,
    pageWidth / 2,
    27,
    { align: 'center' }
  );

  autoTable(doc, {
    startY: 33,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [29, 78, 216], textColor: 255, fontSize: 8.5 },
    styles: { font: 'helvetica', fontSize: 8.2, cellPadding: 2.5, valign: 'top' },
    columnStyles: {
      0: { cellWidth: 11, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 24 },
      3: { cellWidth: 34 },
      4: { cellWidth: 'auto' },
    },
    head: [['No', 'Bentuk', 'Kesukaran / Level', 'Kunci Jawaban', 'Pembahasan']],
    body: examPackage.questions.map((q, idx) => [
      String(q.nomor || idx + 1),
      QUESTION_TYPE_LABELS[q.type],
      `${DIFFICULTY_SHORT_LABELS[q.difficulty]} (${q.cognitiveLevel})`,
      q.kunciJawaban,
      q.pembahasan,
    ]),
  });

  const filename = `Kunci_Jawaban_${sanitizeFileName(identity.mataPelajaran)}_${sanitizeFileName(examPackage.paketLabel)}.pdf`;
  doc.save(filename);
}

export function exportKisiKisiToPdf(examPackage: ExamPackage): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const { identity } = examPackage;
  const rows = generateKisiKisiRows(examPackage);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KISI-KISI PENULISAN SOAL', pageWidth / 2, 15, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    `${identity.namaSekolah}  •  ${identity.jenisPenilaian}  •  ${identity.mataPelajaran}  •  Kelas ${identity.kelas} / Semester ${identity.semester}  •  ${identity.tahunPelajaran}`,
    pageWidth / 2,
    21,
    { align: 'center' }
  );
  doc.text(
    `Guru Pengampu: ${identity.namaGuru}${identity.nip ? ` (NIP. ${identity.nip})` : ''}  •  ${examPackage.paketLabel}  •  Total: ${rows.length} Soal`,
    pageWidth / 2,
    26,
    { align: 'center' }
  );

  autoTable(doc, {
    startY: 31,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [29, 78, 216], textColor: 255, fontSize: 8.5 },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, valign: 'top' },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 58 },
      2: { cellWidth: 40 },
      3: { cellWidth: 68 },
      4: { cellWidth: 30 },
      5: { cellWidth: 26, halign: 'center' },
      6: { cellWidth: 32, halign: 'center' },
    },
    head: [
      [
        'No',
        'Tujuan Pembelajaran',
        'Materi',
        'Indikator Soal',
        'Bentuk Soal',
        'Tingkat Kesukaran',
        'Level Kognitif',
      ],
    ],
    body: rows.map((r) => [
      String(r.nomorSoal),
      r.tujuanPembelajaran,
      r.materi,
      r.indikatorSoal,
      r.bentukSoal,
      r.tingkatKesukaran,
      r.levelKognitif,
    ]),
  });

  const filename = `Kisi_Kisi_${sanitizeFileName(identity.mataPelajaran)}_${sanitizeFileName(examPackage.paketLabel)}.pdf`;
  doc.save(filename);
}

function createBorderedCell(text: string, bold = false): TableCell {
  return new TableCell({
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 20, font: 'Calibri' })],
      }),
    ],
  });
}

export async function exportExamToWord(
  examPackage: ExamPackage,
  settings: AppSettings
): Promise<void> {
  const { identity } = examPackage;

  const headerParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: identity.namaSekolah.toUpperCase(),
          bold: true,
          size: 28,
          font: 'Calibri',
        }),
      ],
    }),
  ];

  if (identity.alamatSekolah.trim()) {
    headerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: identity.alamatSekolah,
            size: 18,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  headerParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      border: {
        bottom: {
          color: '1E3A8A',
          space: 6,
          style: BorderStyle.DOUBLE,
          size: 12,
        },
      },
      children: [
        new TextRun({
          text: `LEMBAR SOAL ${identity.jenisPenilaian.toUpperCase()} (${examPackage.paketLabel.toUpperCase()})`,
          bold: true,
          size: 24,
          font: 'Calibri',
        }),
      ],
    })
  );

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          createBorderedCell(`Mata Pelajaran : ${identity.mataPelajaran}`),
          createBorderedCell('Nama Siswa : ........................................'),
        ],
      }),
      new TableRow({
        children: [
          createBorderedCell(`Kelas / Semester : ${identity.kelas} / ${identity.semester}`),
          createBorderedCell('Nomor Absen : ........................................'),
        ],
      }),
      new TableRow({
        children: [
          createBorderedCell(`Tahun Pelajaran : ${identity.tahunPelajaran}`),
          createBorderedCell('Hari / Tanggal : ........................................'),
        ],
      }),
      new TableRow({
        children: [
          createBorderedCell(
            `Nama Guru : ${identity.namaGuru}${settings.tampilkanNipDiKop && identity.nip ? ` (NIP. ${identity.nip})` : ''}`
          ),
          createBorderedCell(
            `Waktu : ${settings.alokasiWaktuMenit} Menit   |   Nilai : [        ]`
          ),
        ],
      }),
    ],
  });

  const questionParagraphs: Paragraph[] = [
    new Paragraph({ text: '', spacing: { after: 120 } }),
  ];

  if (settings.tampilkanPetunjukUmum) {
    questionParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Petunjuk Umum:',
            bold: true,
            size: 20,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '1. Tulislah nama lengkap, nomor absen, dan hari/tanggal dengan jelas.',
            size: 19,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: '2. Bacalah setiap pertanyaan secara cermat sebelum menuliskan jawaban.',
            size: 19,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  examPackage.questions.forEach((q, idx) => {
    const num = q.nomor || idx + 1;
    questionParagraphs.push(
      new Paragraph({
        spacing: { before: 140, after: 60 },
        children: [
          new TextRun({
            text: `${num}. `,
            bold: true,
            size: 21,
            font: 'Calibri',
          }),
          new TextRun({
            text: `[${QUESTION_TYPE_LABELS[q.type]}] `,
            bold: true,
            size: 19,
            color: '1D4ED8',
            font: 'Calibri',
          }),
          new TextRun({
            text: q.pertanyaan,
            size: 21,
            font: 'Calibri',
          }),
        ],
      })
    );

    if (
      (q.type === 'pilihan_ganda' || q.type === 'pilihan_ganda_kompleks') &&
      q.options
    ) {
      q.options.forEach((opt) => {
        questionParagraphs.push(
          new Paragraph({
            indent: { left: 420 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `${opt.label}. ${opt.text}`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          })
        );
      });
    } else if (q.type === 'benar_salah') {
      questionParagraphs.push(
        new Paragraph({
          indent: { left: 420 },
          children: [
            new TextRun({
              text: '[   ] Benar        [   ] Salah',
              size: 20,
              font: 'Calibri',
            }),
          ],
        })
      );
    } else if (q.type === 'menjodohkan' && q.matchingPairs) {
      const display = getExamMatchingColumns(q.matchingPairs);
      display.leftItems.forEach((leftItem, pIdx) => {
        const rightItem = display.rightItems[pIdx];
        questionParagraphs.push(
          new Paragraph({
            indent: { left: 420 },
            children: [
              new TextRun({
                text: `${leftItem.number}. ${leftItem.text}   ( ...... )   ${rightItem.letter}. ${rightItem.text}`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          })
        );
      });
    } else if (q.type === 'isian_singkat') {
      questionParagraphs.push(
        new Paragraph({
          indent: { left: 420 },
          children: [
            new TextRun({
              text: 'Jawaban: ........................................................................',
              size: 20,
              font: 'Calibri',
            }),
          ],
        })
      );
    } else if (q.type === 'uraian') {
      questionParagraphs.push(
        new Paragraph({
          indent: { left: 420 },
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'Jawaban: ____________________________________________________________________',
              size: 20,
              font: 'Calibri',
            }),
          ],
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        children: [...headerParagraphs, metaTable, ...questionParagraphs],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Soal_${sanitizeFileName(identity.mataPelajaran)}_Kelas_${sanitizeFileName(identity.kelas)}_${sanitizeFileName(examPackage.paketLabel)}.docx`;
  saveAs(blob, filename);
}

export async function exportAnswerKeyToWord(
  examPackage: ExamPackage
): Promise<void> {
  const { identity } = examPackage;
  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        createBorderedCell('No', true),
        createBorderedCell('Bentuk Soal', true),
        createBorderedCell('Tingkat & Level', true),
        createBorderedCell('Kunci Jawaban', true),
        createBorderedCell('Pembahasan', true),
      ],
    }),
    ...examPackage.questions.map(
      (q, idx) =>
        new TableRow({
          children: [
            createBorderedCell(String(q.nomor || idx + 1)),
            createBorderedCell(QUESTION_TYPE_LABELS[q.type]),
            createBorderedCell(
              `${DIFFICULTY_SHORT_LABELS[q.difficulty]} / ${COGNITIVE_LABELS[q.cognitiveLevel]}`
            ),
            createBorderedCell(q.kunciJawaban, true),
            createBorderedCell(q.pembahasan),
          ],
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'KUNCI JAWABAN DAN PEMBAHASAN',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${identity.namaSekolah} | ${identity.mataPelajaran} Kelas ${identity.kelas} | ${identity.jenisPenilaian} (${examPackage.paketLabel})`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Kunci_Jawaban_${sanitizeFileName(identity.mataPelajaran)}_${sanitizeFileName(examPackage.paketLabel)}.docx`;
  saveAs(blob, filename);
}

export async function exportKisiKisiToWord(
  examPackage: ExamPackage
): Promise<void> {
  const { identity } = examPackage;
  const kisiRows = generateKisiKisiRows(examPackage);

  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        createBorderedCell('No', true),
        createBorderedCell('Tujuan Pembelajaran', true),
        createBorderedCell('Materi', true),
        createBorderedCell('Indikator Soal', true),
        createBorderedCell('Bentuk Soal', true),
        createBorderedCell('Tingkat Kesukaran', true),
        createBorderedCell('Level Kognitif', true),
      ],
    }),
    ...kisiRows.map(
      (r) =>
        new TableRow({
          children: [
            createBorderedCell(String(r.nomorSoal)),
            createBorderedCell(r.tujuanPembelajaran),
            createBorderedCell(r.materi),
            createBorderedCell(r.indikatorSoal),
            createBorderedCell(r.bentukSoal),
            createBorderedCell(r.tingkatKesukaran),
            createBorderedCell(r.levelKognitif),
          ],
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'KISI-KISI PENULISAN SOAL',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${identity.namaSekolah} | ${identity.mataPelajaran} | Kelas ${identity.kelas} / Semester ${identity.semester} | ${identity.tahunPelajaran}`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Kisi_Kisi_${sanitizeFileName(identity.mataPelajaran)}_${sanitizeFileName(examPackage.paketLabel)}.docx`;
  saveAs(blob, filename);
}
