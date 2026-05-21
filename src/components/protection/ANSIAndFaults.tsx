'use client';

import { useState } from 'react';
import { faultsData, ansiCodes } from '@/data/protection-data';
import {
  Shield,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Thermometer,
  Activity,
  Gauge,
  ArrowDownUp,
  RotateCcw,
  Magnet,
  Scale,
  Waves,
} from 'lucide-react';

const severityConfig = {
  critical: {
    borderClass: 'border-l-4 border-l-red-500',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    label: 'Kritis',
    dotColor: 'bg-red-500',
  },
  warning: {
    borderClass: 'border-l-4 border-l-yellow-500',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    label: 'Peringatan',
    dotColor: 'bg-yellow-500',
  },
  info: {
    borderClass: 'border-l-4 border-l-cyan-500',
    badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    label: 'Informasi',
    dotColor: 'bg-cyan-500',
  },
};

const faultIconMap: Record<string, React.ReactNode> = {
  '⚡': <Zap className="w-5 h-5" />,
  '🔥': <Activity className="w-5 h-5" />,
  '⏚': <Shield className="w-5 h-5" />,
  '📈': <Gauge className="w-5 h-5" />,
  '📉': <ArrowDownUp className="w-5 h-5" />,
  '⏱️': <Waves className="w-5 h-5" />,
  '🔄': <RotateCcw className="w-5 h-5" />,
  '🧲': <Magnet className="w-5 h-5" />,
  '⚖️': <Scale className="w-5 h-5" />,
  '🌡️': <Thermometer className="w-5 h-5" />,
  '🔔': <AlertTriangle className="w-5 h-5" />,
};

function getFaultIcon(iconStr: string): React.ReactNode {
  return faultIconMap[iconStr] || <AlertTriangle className="w-5 h-5" />;
}

export default function ANSIAndFaults() {
  const [expandedFault, setExpandedFault] = useState<string | null>(null);

  const toggleFault = (id: string) => {
    setExpandedFault(prev => (prev === id ? null : id));
  };

  return (
    <>
      {/* ===== Section 7: Kode ANSI Relay ===== */}
      <section id="kode-ansi" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Kode ANSI Relay
          </h2>
          <p className="text-white/60">
            Standar penomoran fungsi relay proteksi berdasarkan ANSI/IEEE
          </p>
        </div>

        {/* Explanation paragraph */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Apa itu Kode ANSI?
              </h3>
              <p className="text-white/75 leading-relaxed">
                Kode ANSI (American National Standards Institute) adalah sistem penomoran standar yang
                digunakan untuk mengidentifikasi fungsi relay proteksi dalam sistem tenaga listrik.
                Setiap nomor ANSI mewakili fungsi proteksi tertentu, sehingga memudahkan insinyur
                listrik di seluruh dunia dalam memahami dan mengkomunikasikan konfigurasi proteksi
                secara konsisten. Standar ini ditetapkan oleh IEEE C37.2 dan telah digunakan secara
                luas dalam perancangan dan operasi sistem proteksi generator, transformator, dan
                jaringan listrik.
              </p>
            </div>
          </div>
        </div>

        {/* ANSI Codes Table */}
        <div className="glass-card p-6 overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th className="w-1/5">Kode ANSI</th>
                <th className="w-2/5">Nama Proteksi</th>
                <th className="w-2/5">Fungsi</th>
              </tr>
            </thead>
            <tbody>
              {ansiCodes.map((item, index) => (
                <tr key={item.code} className={index % 2 === 0 ? '' : ''}>
                  <td>
                    <span className="badge-ansi">{item.code}</span>
                  </td>
                  <td className="font-medium text-white/90">{item.name}</td>
                  <td className="text-white/70">{item.function}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Section 8: Gangguan Generator ===== */}
      <section id="gangguan-generator" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Gangguan Generator
          </h2>
          <p className="text-white/60">
            Jenis gangguan yang dapat terjadi pada generator sinkron dan sistem proteksinya
          </p>
        </div>

        {/* Severity legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-red-400 text-sm font-medium">Kritis</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-yellow-400 text-sm font-medium">Peringatan</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span className="text-cyan-400 text-sm font-medium">Informasi</span>
          </div>
        </div>

        {/* Fault cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faultsData.map(fault => {
            const config = severityConfig[fault.severity];
            const isExpanded = expandedFault === fault.id;

            return (
              <div
                key={fault.id}
                className={`glass-card ${config.borderClass} cursor-pointer transition-all duration-300 ${
                  isExpanded ? 'ring-1 ring-white/20' : ''
                }`}
                onClick={() => toggleFault(fault.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFault(fault.id);
                  }
                }}
              >
                {/* Card header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                          fault.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : fault.severity === 'warning'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-cyan-500/20 text-cyan-400'
                        }`}
                      >
                        {getFaultIcon(fault.icon)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm leading-tight">
                          {fault.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge-ansi text-xs">{fault.ansiCode}</span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-white/40 mt-1">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Brief summary (always visible) */}
                  <p className="text-white/60 text-sm line-clamp-2">{fault.cause}</p>

                  {/* Expanded details */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="border-t border-white/10 pt-4 space-y-3">
                      {/* Penyebab */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Activity className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                            Penyebab
                          </span>
                        </div>
                        <p className="text-white/80 text-sm pl-5">{fault.cause}</p>
                      </div>

                      {/* Dampak */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                            Dampak
                          </span>
                        </div>
                        <p className="text-white/80 text-sm pl-5">{fault.impact}</p>
                      </div>

                      {/* Proteksi */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Shield className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                            Proteksi
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pl-5">
                          <p className="text-white/80 text-sm">{fault.protection}</p>
                          <span className="badge-ansi">{fault.ansiCode}</span>
                        </div>
                      </div>

                      {/* Tindakan */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Zap className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                            Tindakan
                          </span>
                        </div>
                        <p className="text-white/80 text-sm pl-5">{fault.action}</p>
                      </div>

                      {/* CB Status */}
                      <div className="flex items-center gap-2 pl-5 pt-1">
                        <span className="text-xs text-white/40">Status CB:</span>
                        <span className="text-xs font-mono font-semibold status-trip">
                          {fault.cbStatus}
                        </span>
                      </div>

                      {/* Conclusion */}
                      <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white/70 text-sm italic leading-relaxed">
                          💡 {fault.conclusion}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
