import React from 'react';
import {
  Archive,
  BookOpenCheck,
  Clock,
  FilePlus2,
  GraduationCap,
  Home,
  Printer,
  School,
  Settings,
  Table2,
  X,
} from 'lucide-react';
import { NavTab, SchoolIdentity } from '../types/exam';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  identity: SchoolIdentity;
  bankCount: number;
  historyCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'beranda', label: 'Beranda', icon: Home },
  { id: 'identitas', label: 'Identitas Sekolah', icon: School },
  { id: 'buat_soal', label: 'Buat Soal', icon: FilePlus2 },
  { id: 'bank_soal', label: 'Bank Soal', icon: Archive },
  { id: 'kisi_kisi', label: 'Kisi-Kisi', icon: Table2 },
  { id: 'riwayat', label: 'Riwayat Soal', icon: Clock },
  { id: 'cetak', label: 'Cetak dan Download', icon: Printer },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  identity,
  bankCount,
  historyCount,
  mobileOpen,
  onCloseMobile,
}) => {
  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Brand header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => handleNavClick('beranda')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white shrink-0">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
            SMART TEACHER
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup menu navigasi"
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Primary navigation */}
      <nav
        aria-label="Menu Utama SMART TEACHER"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const count =
            item.id === 'bank_soal'
              ? bankCount
              : item.id === 'riwayat'
                ? historyCount
                : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-700 hover:bg-blue-50/70 hover:text-blue-800'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </span>
              {count !== null && (
                <span
                  className={`text-xs font-mono tabular-nums shrink-0 ${
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active school profile footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 shrink-0">
        <div className="flex items-start gap-2.5">
          <BookOpenCheck
            className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {identity.namaSekolah || 'Belum diisi'}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {identity.namaGuru || 'Nama Guru'} · Kelas {identity.kelas || '-'}
            </p>
            <p className="text-xs text-emerald-700 font-medium truncate mt-0.5">
              Kurikulum Merdeka · {identity.jenjang}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="no-print hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {navContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div
          className="no-print fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi Mobile"
        >
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
