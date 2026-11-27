import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FilePlus2,
  Info,
  Menu,
  X,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import {
  AppSettings,
  BankQuestion,
  ExamPackage,
  LearningObjectives,
  NavTab,
  SchoolIdentity,
} from './types/exam';
import { CurriculumTemplate } from './data/seedData';
import {
  BackupPayload,
  exportAllDataAsJson,
  loadBankQuestions,
  loadIdentity,
  loadObjectives,
  loadPackages,
  loadSettings,
  resetAllStorageToDefaults,
  saveBankQuestions,
  saveIdentity,
  saveObjectives,
  savePackages,
  saveSettings,
} from './utils/storage';
import {
  createVariantPackage,
  getNextPaketLabel,
  renumberQuestions,
} from './utils/questionLogic';
import { Sidebar } from './components/Sidebar';
import { BerandaView } from './components/BerandaView';
import { IdentitasView } from './components/IdentitasView';
import { BuatSoalView } from './components/BuatSoalView';
import { BankSoalView } from './components/BankSoalView';
import { KisiKisiView } from './components/KisiKisiView';
import { RiwayatView } from './components/RiwayatView';
import { CetakDownloadView } from './components/CetakDownloadView';
import { PengaturanView } from './components/PengaturanView';

const TAB_TITLES: Record<NavTab, string> = {
  beranda: 'Beranda',
  identitas: 'Identitas Sekolah',
  buat_soal: 'Buat Soal',
  bank_soal: 'Bank Soal',
  kisi_kisi: 'Kisi-Kisi',
  riwayat: 'Riwayat Soal',
  cetak: 'Cetak dan Download',
  pengaturan: 'Pengaturan',
};

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'error';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('beranda');
  const [buatSoalSubView, setBuatSoalSubView] = useState<'form' | 'editor'>(
    'form'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [identity, setIdentity] = useState<SchoolIdentity>(() => loadIdentity());
  const [objectives, setObjectives] = useState<LearningObjectives>(() =>
    loadObjectives()
  );
  const [packages, setPackages] = useState<ExamPackage[]>(() => loadPackages());
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>(() =>
    loadBankQuestions()
  );
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const [activePackageId, setActivePackageId] = useState<string | null>(() => {
    const initial = loadPackages();
    return initial[0]?.id ?? null;
  });

  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = (
    message: string,
    tone: 'success' | 'info' | 'error' = 'info'
  ) => {
    setToast({ id: Date.now(), message, tone });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activePackage = useMemo(
    () =>
      packages.find((p) => p.id === activePackageId) ?? packages[0] ?? null,
    [packages, activePackageId]
  );

  const handleSaveIdentity = (next: SchoolIdentity) => {
    setIdentity(next);
    saveIdentity(next);
    notify('Identitas sekolah dan guru berhasil disimpan.', 'success');
  };

  const handleChangeObjectives = (next: LearningObjectives) => {
    setObjectives(next);
    saveObjectives(next);
  };

  const handlePackageCreated = (newPkg: ExamPackage) => {
    setPackages((prev) => {
      const updated = [newPkg, ...prev];
      savePackages(updated);
      return updated;
    });
    setActivePackageId(newPkg.id);
  };

  const handleUpdateActivePackage = (updatedPkg: ExamPackage) => {
    setPackages((prev) => {
      const updated = prev.map((p) =>
        p.id === updatedPkg.id ? updatedPkg : p
      );
      savePackages(updated);
      return updated;
    });
  };

  const handleCreateVariantPackage = (sourcePkg: ExamPackage) => {
    const existingLabels = packages
      .filter(
        (p) =>
          p.identity.mataPelajaran === sourcePkg.identity.mataPelajaran &&
          p.identity.kelas === sourcePkg.identity.kelas
      )
      .map((p) => p.paketLabel);
    const nextLabel = getNextPaketLabel(existingLabels);
    const variant = createVariantPackage(sourcePkg, nextLabel);

    setPackages((prev) => {
      const updated = [variant, ...prev];
      savePackages(updated);
      return updated;
    });
    setActivePackageId(variant.id);
    setBuatSoalSubView('editor');
    setActiveTab('buat_soal');
    notify(
      `${nextLabel} berhasil dibuat dengan urutan soal dan pilihan jawaban yang diacak otomatis.`,
      'success'
    );
  };

  const handleDeletePackage = (pkgId: string) => {
    setPackages((prev) => {
      const remaining = prev.filter((p) => p.id !== pkgId);
      savePackages(remaining);
      if (activePackageId === pkgId) {
        setActivePackageId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
    notify('Paket soal telah dihapus dari riwayat.', 'info');
  };

  const handleSavePackageToBank = (pkg: ExamPackage) => {
    const now = new Date().toISOString();
    const existingPrompts = new Set(
      bankQuestions.map((b) => b.pertanyaan.trim().toLowerCase())
    );
    const newEntries: BankQuestion[] = [];

    pkg.questions.forEach((q, idx) => {
      const key = q.pertanyaan.trim().toLowerCase();
      if (!existingPrompts.has(key)) {
        existingPrompts.add(key);
        newEntries.push({
          ...q,
          bankId: `bank-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          mataPelajaran: pkg.identity.mataPelajaran,
          kelas: pkg.identity.kelas,
          jenjang: pkg.identity.jenjang,
          savedAt: now,
          sourcePackageTitle: pkg.judul,
        });
      }
    });

    if (newEntries.length === 0) {
      notify(
        'Seluruh butir soal pada paket ini sudah tersimpan di Bank Soal.',
        'info'
      );
      return;
    }

    setBankQuestions((prev) => {
      const updated = [...newEntries, ...prev];
      saveBankQuestions(updated);
      return updated;
    });
    notify(
      `${newEntries.length} butir soal berhasil disimpan ke Bank Soal.`,
      'success'
    );
  };

  const handleDeleteBankQuestion = (bankId: string) => {
    setBankQuestions((prev) => {
      const updated = prev.filter((b) => b.bankId !== bankId);
      saveBankQuestions(updated);
      return updated;
    });
    notify('Butir soal dihapus dari Bank Soal.', 'info');
  };

  const handleAssemblePackageFromBank = (selected: BankQuestion[]) => {
    const now = new Date().toISOString();
    const first = selected[0];
    const pkgIdentity: SchoolIdentity = {
      ...identity,
      mataPelajaran: first?.mataPelajaran || identity.mataPelajaran,
      kelas: first?.kelas || identity.kelas,
      jenjang: first?.jenjang || identity.jenjang,
    };

    const assembled: ExamPackage = {
      id: `pkg-bank-${Date.now()}`,
      judul: `${pkgIdentity.jenisPenilaian} ${pkgIdentity.mataPelajaran} (Bank Soal) – Paket A`,
      paketLabel: 'Paket A',
      createdAt: now,
      updatedAt: now,
      identity: pkgIdentity,
      objectives: {
        ...objectives,
        materiPokok:
          Array.from(new Set(selected.map((s) => s.materi)))
            .slice(0, 3)
            .join(', ') || objectives.materiPokok,
      },
      questions: renumberQuestions(
        selected.map((b, idx) => ({
          id: `q-from-bank-${Date.now()}-${idx}`,
          nomor: idx + 1,
          type: b.type,
          difficulty: b.difficulty,
          cognitiveLevel: b.cognitiveLevel,
          indikator: b.indikator,
          tujuanPembelajaran: b.tujuanPembelajaran,
          materi: b.materi,
          pertanyaan: b.pertanyaan,
          options: b.options,
          matchingPairs: b.matchingPairs,
          kunciJawaban: b.kunciJawaban,
          correctOptionLabels: b.correctOptionLabels,
          pembahasan: b.pembahasan,
          skor: b.skor,
        }))
      ),
    };

    handlePackageCreated(assembled);
    setBuatSoalSubView('editor');
    setActiveTab('buat_soal');
    notify(
      `Paket baru berisi ${assembled.questions.length} soal berhasil dirangkai dari Bank Soal.`,
      'success'
    );
  };

  const handleApplyTemplate = (tpl: CurriculumTemplate) => {
    const nextIdentity: SchoolIdentity = {
      ...identity,
      ...tpl.identityPatch,
    };
    setIdentity(nextIdentity);
    saveIdentity(nextIdentity);
    setObjectives(tpl.objectives);
    saveObjectives(tpl.objectives);
    setBuatSoalSubView('form');
    setActiveTab('buat_soal');
    notify(`Template ${tpl.title} berhasil diterapkan.`, 'success');
  };

  const handleOpenPackage = (
    pkgId: string,
    destination: 'buat_soal' | 'kisi_kisi' | 'cetak'
  ) => {
    setActivePackageId(pkgId);
    if (destination === 'buat_soal') {
      setBuatSoalSubView('editor');
    }
    setActiveTab(destination);
  };

  const handleSaveSettings = (next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
    notify('Pengaturan aplikasi berhasil disimpan.', 'success');
  };

  const handleExportBackup = () => {
    const json = exportAllDataAsJson({
      identity,
      objectives,
      packages,
      bank: bankQuestions,
      settings,
    });
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    saveAs(
      blob,
      `SMART_TEACHER_Backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    notify('Cadangan data (.json) berhasil diunduh.', 'success');
  };

  const handleImportBackup = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText) as Partial<BackupPayload>;
      if (parsed.identity) {
        setIdentity(parsed.identity);
        saveIdentity(parsed.identity);
      }
      if (parsed.objectives) {
        setObjectives(parsed.objectives);
        saveObjectives(parsed.objectives);
      }
      if (Array.isArray(parsed.packages)) {
        setPackages(parsed.packages);
        savePackages(parsed.packages);
        setActivePackageId(parsed.packages[0]?.id ?? null);
      }
      if (Array.isArray(parsed.bank)) {
        setBankQuestions(parsed.bank);
        saveBankQuestions(parsed.bank);
      }
      if (parsed.settings) {
        setSettings(parsed.settings);
        saveSettings(parsed.settings);
      }
      notify('Data cadangan berhasil dipulihkan.', 'success');
    } catch {
      notify(
        'Berkas cadangan tidak valid. Pastikan memilih file .json dari SMART TEACHER.',
        'error'
      );
    }
  };

  const handleResetDefaults = () => {
    const defaults = resetAllStorageToDefaults();
    setIdentity(defaults.identity);
    setObjectives(defaults.objectives);
    setPackages(defaults.packages);
    setBankQuestions(defaults.bank);
    setSettings(defaults.settings);
    setActivePackageId(defaults.packages[0]?.id ?? null);
    notify('Data aplikasi dikembalikan ke contoh bawaan Kurikulum Merdeka.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'buat_soal') {
            setBuatSoalSubView('form');
          }
        }}
        identity={identity}
        bankCount={bankQuestions.length}
        historyCount={packages.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Clean Contextual Top Bar (<= 64px height, <10% mobile sticky height) */}
        <header className="no-print sticky top-0 z-20 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400 font-medium whitespace-nowrap">
                SMART TEACHER
              </span>
              <span
                className="hidden sm:inline text-slate-300"
                aria-hidden="true"
              >
                /
              </span>
              <span className="font-bold text-slate-900 truncate">
                {TAB_TITLES[activeTab]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab !== 'buat_soal' && (
              <button
                type="button"
                onClick={() => {
                  setBuatSoalSubView('form');
                  setActiveTab('buat_soal');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs sm:text-sm font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                <span>Buat Soal</span>
              </button>
            )}
          </div>
        </header>

        {/* Main workspace viewport */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'beranda' && (
            <BerandaView
              identity={identity}
              packages={packages}
              bankQuestions={bankQuestions}
              onNavigate={(tab) => {
                if (tab === 'buat_soal') setBuatSoalSubView('form');
                setActiveTab(tab);
              }}
              onOpenPackage={handleOpenPackage}
              onApplyTemplate={handleApplyTemplate}
            />
          )}

          {activeTab === 'identitas' && (
            <IdentitasView
              identity={identity}
              onSaveIdentity={handleSaveIdentity}
              onGoToBuatSoal={() => {
                setBuatSoalSubView('form');
                setActiveTab('buat_soal');
              }}
            />
          )}

          {activeTab === 'buat_soal' && (
            <BuatSoalView
              identity={identity}
              objectives={objectives}
              settings={settings}
              activePackage={activePackage}
              allPackages={packages}
              subView={buatSoalSubView}
              onChangeSubView={setBuatSoalSubView}
              onChangeObjectives={handleChangeObjectives}
              onSelectActivePackage={setActivePackageId}
              onPackageCreated={handlePackageCreated}
              onUpdateActivePackage={handleUpdateActivePackage}
              onCreateVariantPackage={handleCreateVariantPackage}
              onSavePackageToBank={handleSavePackageToBank}
              onApplyTemplate={handleApplyTemplate}
              onNavigateTo={(dest) => setActiveTab(dest)}
              onNotify={notify}
            />
          )}

          {activeTab === 'bank_soal' && (
            <BankSoalView
              bankQuestions={bankQuestions}
              onDeleteBankQuestion={handleDeleteBankQuestion}
              onAssemblePackageFromBank={handleAssemblePackageFromBank}
              onGoToBuatSoal={() => {
                setBuatSoalSubView('form');
                setActiveTab('buat_soal');
              }}
            />
          )}

          {activeTab === 'kisi_kisi' && (
            <KisiKisiView
              packages={packages}
              activePackage={activePackage}
              onSelectActivePackage={setActivePackageId}
              onNotify={notify}
            />
          )}

          {activeTab === 'riwayat' && (
            <RiwayatView
              packages={packages}
              activePackageId={activePackage?.id ?? null}
              onOpenPackage={handleOpenPackage}
              onCreateVariantPackage={handleCreateVariantPackage}
              onDeletePackage={handleDeletePackage}
            />
          )}

          {activeTab === 'cetak' && (
            <CetakDownloadView
              packages={packages}
              activePackage={activePackage}
              settings={settings}
              onSelectActivePackage={setActivePackageId}
              onSavePackageToBank={handleSavePackageToBank}
              onNotify={notify}
            />
          )}

          {activeTab === 'pengaturan' && (
            <PengaturanView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetDefaults={handleResetDefaults}
            />
          )}
        </main>
      </div>

      {/* Accessible floating toast feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 text-sm"
        >
          {toast.tone === 'success' && (
            <CheckCircle2
              className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          {toast.tone === 'error' && (
            <AlertCircle
              className="h-5 w-5 text-red-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          {toast.tone === 'info' && (
            <Info
              className="h-5 w-5 text-blue-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="text-slate-400 hover:text-white shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
