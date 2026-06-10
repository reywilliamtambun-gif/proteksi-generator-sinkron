'use client';
import { useState } from 'react';
import { protectionComponents, generatorComponents } from '@/data/protection-data';

/* ─────────────── tiny inline SVG icons ─────────────── */
function GeneratorIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="26" stroke="#00d4ff" strokeWidth="2.5" fill="rgba(0,212,255,0.08)" />
      <text x="32" y="37" textAnchor="middle" fill="#00d4ff" fontSize="18" fontWeight="700" fontFamily="monospace">G</text>
      <line x1="6" y1="32" x2="14" y2="32" stroke="#00d4ff" strokeWidth="2" />
      <line x1="50" y1="32" x2="58" y2="32" stroke="#00d4ff" strokeWidth="2" />
    </svg>
  );
}

function CTPRIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="18" width="48" height="28" rx="6" stroke="#ffaa00" strokeWidth="2" fill="rgba(255,170,0,0.08)" />
      <text x="22" y="37" fill="#ffaa00" fontSize="11" fontWeight="600" fontFamily="monospace">CT</text>
      <text x="40" y="37" fill="#ffaa00" fontSize="8" fontFamily="monospace">PT</text>
      <line x1="8" y1="32" x2="2" y2="32" stroke="#ffaa00" strokeWidth="2" />
      <line x1="56" y1="32" x2="62" y2="32" stroke="#ffaa00" strokeWidth="2" />
    </svg>
  );
}

function RelayIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="44" height="36" rx="5" stroke="#00d4ff" strokeWidth="2" fill="rgba(0,212,255,0.08)" />
      <circle cx="24" cy="32" r="6" stroke="#00d4ff" strokeWidth="1.5" fill="none" />
      <circle cx="40" cy="32" r="6" stroke="#00d4ff" strokeWidth="1.5" fill="none" />
      <line x1="30" y1="32" x2="34" y2="32" stroke="#00d4ff" strokeWidth="1.5" />
    </svg>
  );
}

function CircuitBreakerIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="8" width="36" height="48" rx="4" stroke="#00ff88" strokeWidth="2" fill="rgba(0,255,136,0.08)" />
      <line x1="32" y1="14" x2="32" y2="26" stroke="#00ff88" strokeWidth="2.5" />
      <line x1="32" y1="26" x2="22" y2="42" stroke="#00ff88" strokeWidth="2.5" />
      <line x1="32" y1="42" x2="32" y2="50" stroke="#00ff88" strokeWidth="2.5" />
      <circle cx="32" cy="26" r="3" fill="#00ff88" />
    </svg>
  );
}

function WavePattern({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 60" className={className} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 30 Q25 0 50 30 Q75 60 100 30 Q125 0 150 30 Q175 60 200 30 Q225 0 250 30 Q275 60 300 30 Q325 0 350 30 Q375 60 400 30"
        stroke="rgba(0,212,255,0.25)"
        strokeWidth="2"
        fill="none"
        className="electricity-flow"
      />
      <path
        d="M0 30 Q25 60 50 30 Q75 0 100 30 Q125 60 150 30 Q175 0 200 30 Q225 60 250 30 Q275 0 300 30 Q325 60 350 30 Q375 0 400 30"
        stroke="rgba(136,68,255,0.2)"
        strokeWidth="1.5"
        fill="none"
        className="electricity-flow"
      />
    </svg>
  );
}

/* ─────────────── mini dashboard row ─────────────── */
interface DashboardItem {
  label: string;
  value: string;
  status: 'normal' | 'trip' | 'warning' | 'fault';
}

const dashboardItems: DashboardItem[] = [
  { label: 'Status Generator', value: 'NORMAL', status: 'normal' },
  { label: 'Circuit Breaker', value: 'ON', status: 'normal' },
  { label: 'Relay Aktif', value: 'STANDBY', status: 'trip' },
  { label: 'Gangguan Terdeteksi', value: 'Tidak Ada', status: 'normal' },
  { label: 'Aksi Sistem', value: 'Monitoring', status: 'trip' },
  { label: 'Status Sistem', value: 'Aman', status: 'normal' },
];

const statusClass = (s: DashboardItem['status']) => {
  switch (s) {
    case 'normal': return 'status-normal';
    case 'trip': return 'status-trip';
    case 'warning': return 'status-warning';
    case 'fault': return 'status-fault';
  }
};

/* ─────────────── Latar Belakang cards data ─────────────── */
const latarCards = [
  {
    title: 'Kerugian Ekonomi Besar',
    desc: 'Generator sinkron merupakan investasi besar dalam sistem tenaga listrik. Kerusakan akibat gangguan yang tidak terproteksi dapat menyebabkan kerugian finansial yang sangat signifikan.',
    icon: '💰',
  },
  {
    title: 'Kontinuitas Layanan Listrik',
    desc: 'Gangguan pada generator yang tidak ditangani dengan cepat dapat menyebabkan pemadaman luas dan mengganggu kontinuitas pasokan listrik ke konsumen.',
    icon: '⚡',
  },
  {
    title: 'Keselamatan Personel',
    desc: 'Gangguan seperti hubung singkat dan gangguan tanah dapat membahayakan keselamatan operator dan personel pembangkit jika tidak diproteksi dengan benar.',
    icon: '🛡️',
  },
  {
    title: 'Kestabilan Sistem Tenaga',
    desc: 'Generator yang mengalami gangguan tanpa proteksi dapat menyebabkan ketidakstabilan pada seluruh sistem tenaga listrik yang terhubung.',
    icon: '🔄',
  },
];

/* ─────────────── Capaian Pembelajaran data ─────────────── */
const capaianTable = [
  { no: 1, indicator: 'Mahasiswa mampu menjelaskan fungsi sistem proteksi pada generator sinkron' },
  { no: 2, indicator: 'Mahasiswa mampu mengidentifikasi jenis-jenis gangguan pada generator sinkron' },
  { no: 3, indicator: 'Mahasiswa mampu menjelaskan prinsip kerja relay proteksi dan kode ANSI' },
  { no: 4, indicator: 'Mahasiswa mampu menganalisis alur kerja sistem proteksi dari deteksi hingga trip' },
  { no: 5, indicator: 'Mahasiswa mampu menghitung kecepatan sinkron generator' },
  { no: 6, indicator: 'Mahasiswa mampu menjelaskan fungsi komponen proteksi (CT, PT, Relay, CB, Trip Coil)' },
];

/* ─────────────── Sistem Proteksi objectives ─────────────── */
const protectionObjectives = [
  'Mendeteksi gangguan internal dan eksternal pada generator',
  'Memisahkan generator dari sistem secara cepat saat terjadi gangguan',
  'Mencegah kerusakan lebih lanjut pada kumparan, isolasi, dan komponen generator',
  'Melindungi keselamatan personel dari bahaya sengatan listrik',
  'Menjaga kestabilan sistem tenaga listrik secara keseluruhan',
  'Memberikan alarm dan informasi gangguan kepada operator',
  'Mengkoordinasikan kerja relay proteksi secara selektif dan sensitif',
  'Meminimalkan waktu pemadaman dan kerugian ekonomi',
];

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function HeroAndEarlySections() {
  /* calculator state */
  const [freq, setFreq] = useState<string>('');
  const [poles, setPoles] = useState<string>('');
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  /* component cards state */
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  /* calculator handler */
  const calculateSyncSpeed = () => {
    setSyncResult(null);
    setCalcError(null);

    if (!freq.trim() || !poles.trim()) {
      setCalcError('Frekuensi dan jumlah kutub harus diisi!');
      return;
    }

    const f = parseFloat(freq);
    const p = parseFloat(poles);

    if (isNaN(f) || isNaN(p)) {
      setCalcError('Input harus berupa angka!');
      return;
    }

    if (f < 0 || p < 0) {
      setCalcError('Nilai tidak boleh negatif!');
      return;
    }

    if (p === 0) {
      setCalcError('Jumlah kutub (P) tidak boleh nol!');
      return;
    }

    const ns = (120 * f) / p;
    setSyncResult(ns.toFixed(2));
  };

  /* reset calculator */
  const resetCalc = () => {
    setFreq('');
    setPoles('');
    setSyncResult(null);
    setCalcError(null);
  };

  return (
    <>
      {/* ═══════════════ SECTION 1: BERANDA (HERO) ═══════════════ */}
      <section id="beranda" className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        {/* background wave decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-0 w-full opacity-30">
            <WavePattern className="w-full h-16" />
          </div>
          <div className="absolute bottom-20 left-0 w-full opacity-20">
            <WavePattern className="w-full h-12" />
          </div>
        </div>

        {/* floating icons */}
        <div className="absolute top-20 left-[5%] opacity-20 hidden lg:block">
          <GeneratorIcon className="w-20 h-20" />
        </div>
        <div className="absolute top-32 right-[8%] opacity-15 hidden lg:block">
          <CTPRIcon className="w-20 h-20" />
        </div>
        <div className="absolute bottom-40 left-[8%] opacity-15 hidden lg:block">
          <RelayIcon className="w-20 h-20" />
        </div>
        <div className="absolute bottom-28 right-[5%] opacity-20 hidden lg:block">
          <CircuitBreakerIcon className="w-20 h-20" />
        </div>

        {/* main content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* badge */}
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6 text-sm" style={{ borderRadius: '50px' }}>
            <span className="status-normal text-xs font-semibold">● ONLINE</span>
            <span className="text-white/60">|</span>
            <span className="text-white/70 text-xs">Proteksi Sistem Tenaga Listrik</span>
          </div>

          {/* title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Sistem Proteksi pada
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Generator Sinkron
            </span>
          </h1>

          {/* subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-cyan-300/80 font-medium mb-3">
            Media Pembelajaran Interaktif Proteksi Sistem Tenaga Listrik
          </p>
          <p className="text-sm sm:text-base text-cyan-300/50 font-light mb-2">
            Berbasis Liquid Glass Dashboard
          </p>

          {/* description */}
          <p className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto mb-6 leading-relaxed">
            Pelajari bagaimana sistem proteksi bekerja menjaga generator sinkron dari berbagai jenis gangguan — mulai dari hubung singkat, arus lebih, gangguan tanah, hingga kehilangan eksitasi — melalui simulasi interaktif dan visualisasi real-time.
          </p>

          {/* Tim Penyusun */}
          <div className="glass-card p-4 sm:p-5 max-w-2xl mx-auto mb-8" style={{ borderRadius: '16px' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-cyan-300 font-semibold text-sm">Tim Penyusun</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {[
                'Rey William Tambun',
                'Intan Sari Panggabean',
                'Sesilia H Br Samura',
                'Dimas D Kurniawan',
              ].map((name, idx) => (
                <div key={name} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/8">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-white/80 text-sm">{name}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-purple-400/10 rounded-lg px-3 py-2 border border-purple-400/15">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span className="text-purple-300/80 text-xs sm:text-sm font-medium">Program Studi Pendidikan Teknik Elektro, Universitas Negeri Medan</span>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={() => document.getElementById('latar-belakang')?.scrollIntoView({ behavior: 'smooth' })}
              className="glow-btn text-sm sm:text-base"
            >
              Mulai Belajar →
            </button>
            <button
              onClick={() => document.getElementById('simulasi')?.scrollIntoView({ behavior: 'smooth' })}
              className="glow-btn-green text-sm sm:text-base"
            >
              Buka Simulasi Proteksi
            </button>
          </div>

          {/* mini dashboard */}
          <div className="glass-card p-4 sm:p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Live Dashboard — Normal Operation</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dashboardItems.map((item) => (
                <div
                  key={item.label}
                  className="bg-white/5 rounded-xl p-3 border border-white/10 text-center"
                >
                  <p className="text-[10px] sm:text-xs text-white/40 mb-1">{item.label}</p>
                  <p className={`text-sm sm:text-base font-bold ${statusClass(item.status)}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ═══════════════ SECTION 2: LATAR BELAKANG ═══════════════ */}
      <section id="latar-belakang" className="relative px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center">Latar Belakang</h2>
          <p className="section-subtitle text-center">
            Mengapa Sistem Proteksi pada Generator Sinkron Sangat Penting?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latarCards.map((card) => (
              <div key={card.title} className="glass-card p-6 flex flex-col items-start">
                <span className="text-3xl mb-3">{card.icon}</span>
                <h3 className="text-white font-semibold text-base mb-2">{card.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* additional context */}
          <div className="glass-card p-6 mt-8">
            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
              Generator sinkron merupakan komponen vital dalam sistem pembangkit tenaga listrik. 
              Dengan kapasitas daya yang besar dan tegangan kerja yang tinggi, generator memerlukan 
              sistem proteksi yang andal untuk mendeteksi berbagai jenis gangguan secara cepat dan tepat. 
              Tanpa proteksi yang memadai, gangguan kecil dapat berkembang menjadi kerusakan mayor yang 
              berdampak pada keselamatan, keandalan sistem, dan kerugian ekonomi yang signifikan.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 3: CAPAIAN PEMBELAJARAN ═══════════════ */}
      <section id="capaian" className="relative px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title text-center">Capaian Pembelajaran</h2>
          <p className="section-subtitle text-center">
            Kompetensi yang akan dikuasai setelah menyelesaikan modul pembelajaran ini
          </p>

          {/* main objective */}
          <div className="glass-card p-6 mb-8 text-center">
            <p className="text-cyan-300 font-semibold text-lg mb-2">Capaian Pembelajaran Utama</p>
            <p className="text-white/80 text-base leading-relaxed">
              Mahasiswa mampu menganalisis dan menjelaskan sistem proteksi pada generator sinkron, 
              termasuk jenis gangguan, prinsip kerja relay, komponen proteksi, serta alur kerja 
              dari deteksi gangguan hingga tindakan trip circuit breaker.
            </p>
          </div>

          {/* indicators table */}
          <div className="glass-card p-4 sm:p-6 overflow-x-auto">
            <h3 className="text-cyan-300 font-semibold text-base mb-4">Indikator Capaian Pembelajaran</h3>
            <table className="table-glass">
              <thead>
                <tr>
                  <th className="w-16 text-center">No</th>
                  <th>Indikator</th>
                </tr>
              </thead>
              <tbody>
                {capaianTable.map((row) => (
                  <tr key={row.no}>
                    <td className="text-center font-semibold text-cyan-300">{row.no}</td>
                    <td>{row.indicator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION: PENGERTIAN GENERATOR SINKRON ═══════════════ */}
      <section id="pengertian-generator" className="relative px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center">Pengertian Generator Sinkron</h2>
          <p className="section-subtitle text-center">
            Memahami definisi, prinsip kerja, dan komponen utama generator sinkron
          </p>

          {/* ──── Definisi with animated border glow ──── */}
          <div className="glass-card p-6 mb-8 border-glow-cyan relative overflow-hidden">
            {/* animated border glow overlay */}
            <div className="absolute inset-0 rounded-[20px] pointer-events-none border-glow-anim" />
            <div className="flex items-center gap-2 mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <h3 className="text-cyan-300 font-semibold text-base">Definisi</h3>
            </div>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Generator sinkron adalah mesin listrik yang mengubah energi mekanik menjadi listrik AC
              dengan rotor yang berputar secara sinkron terhadap frekuensi jaringan. Kecepatan putaran
              rotor selalu tetap dan terkait secara langsung dengan frekuensi sistem serta jumlah kutub
              magnet pada mesin. Generator ini banyak digunakan di pembangkit listrik karena mampu
              menghasilkan daya besar dengan tegangan dan frekuensi yang stabil.
            </p>
          </div>

          {/* ──── Interactive Generator Cross-Section Diagram ──── */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="8" strokeDasharray="2 2" />
                <circle cx="12" cy="12" r="11" />
              </svg>
              <h3 className="text-cyan-300 font-semibold text-base">Diagram Penampang Generator</h3>
            </div>
            <div className="flex justify-center">
              <svg viewBox="0 0 500 320" className="w-full max-w-[500px]" xmlns="http://www.w3.org/2000/svg">
                {/* Background grid */}
                <defs>
                  <pattern id="grid-pengertian" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  </pattern>
                  <filter id="glowCyanP" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="glowPurpleP" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <rect width="500" height="320" fill="url(#grid-pengertian)" />

                {/* Housing / Frame (outermost) */}
                <circle cx="160" cy="160" r="140" fill="rgba(0,255,136,0.04)" stroke="#00ff88" strokeWidth="2" strokeDasharray="6 3" />
                <text x="160" y="310" textAnchor="middle" fill="#00ff88" fontSize="11" fontWeight="600" fontFamily="monospace">Housing / Frame</text>

                {/* Stator (outer ring with winding slots) */}
                <circle cx="160" cy="160" r="120" fill="rgba(168,85,247,0.08)" stroke="#a855f7" strokeWidth="2.5" />
                {/* Stator winding slots */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                  <line
                    key={`slot-${angle}`}
                    x1={160 + 95 * Math.cos((angle * Math.PI) / 180)}
                    y1={160 + 95 * Math.sin((angle * Math.PI) / 180)}
                    x2={160 + 118 * Math.cos((angle * Math.PI) / 180)}
                    y2={160 + 118 * Math.sin((angle * Math.PI) / 180)}
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                ))}
                {/* Stator label with leader line */}
                <line x1="282" y1="80" x2="240" y2="100" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx="240" cy="100" r="2.5" fill="#a855f7" />
                <text x="286" y="78" fill="#a855f7" fontSize="12" fontWeight="600" fontFamily="monospace">Stator</text>
                <text x="286" y="93" fill="rgba(168,85,247,0.6)" fontSize="9" fontFamily="monospace">(Armature)</text>

                {/* Cooling System indicator arrows */}
                <path d="M 100 40 Q 130 30 160 35 Q 190 30 220 40" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
                <text x="160" y="30" textAnchor="middle" fill="#3b82f6" fontSize="9" fontFamily="monospace" opacity="0.7">Cooling H₂/Air</text>

                {/* Rotor (inner circle with rotation animation) */}
                <g className="rotor-spin" style={{ transformOrigin: '160px 160px' }}>
                  {/* Rotor body */}
                  <circle cx="160" cy="160" r="65" fill="rgba(0,212,255,0.08)" stroke="#00d4ff" strokeWidth="2" />
                  {/* Rotor poles (N-S) */}
                  <rect x="150" y="100" width="20" height="25" rx="4" fill="rgba(0,212,255,0.2)" stroke="#00d4ff" strokeWidth="1" />
                  <text x="160" y="117" textAnchor="middle" fill="#00d4ff" fontSize="10" fontWeight="700" fontFamily="monospace">N</text>
                  <rect x="150" y="195" width="20" height="25" rx="4" fill="rgba(0,212,255,0.2)" stroke="#00d4ff" strokeWidth="1" />
                  <text x="160" y="212" textAnchor="middle" fill="#00d4ff" fontSize="10" fontWeight="700" fontFamily="monospace">S</text>
                  {/* Rotor shaft center */}
                  <circle cx="160" cy="160" r="12" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="1.5" />
                  <text x="160" y="164" textAnchor="middle" fill="#00d4ff" fontSize="8" fontWeight="700" fontFamily="monospace">G</text>
                  {/* Rotor rotation indicator */}
                  <path d="M 125 160 A 35 35 0 0 1 160 125" fill="none" stroke="#00d4ff" strokeWidth="1.5" className="electricity-flow" />
                </g>
                {/* Rotor label */}
                <line x1="282" y1="195" x2="225" y2="175" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx="225" cy="175" r="2.5" fill="#00d4ff" />
                <text x="286" y="193" fill="#00d4ff" fontSize="12" fontWeight="600" fontFamily="monospace">Rotor</text>
                <text x="286" y="208" fill="rgba(0,212,255,0.6)" fontSize="9" fontFamily="monospace">(Field Winding)</text>

                {/* Slip Rings / Brush label */}
                <line x1="282" y1="250" x2="200" y2="230" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx="200" cy="230" r="2.5" fill="#f97316" />
                <text x="286" y="248" fill="#f97316" fontSize="11" fontWeight="600" fontFamily="monospace">Slip Rings</text>
                <text x="286" y="263" fill="rgba(249,115,22,0.6)" fontSize="9" fontFamily="monospace">(Collector Rings)</text>
                {/* Slip ring graphic */}
                <circle cx="160" cy="160" r="72" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />

                {/* Bearing label */}
                <line x1="70" y1="250" x2="120" y2="230" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx="120" cy="230" r="2.5" fill="#eab308" />
                <text x="10" y="258" fill="#eab308" fontSize="11" fontWeight="600" fontFamily="monospace">Bearing</text>
                <text x="10" y="273" fill="rgba(234,179,8,0.6)" fontSize="9" fontFamily="monospace">(Journal)</text>
                {/* Bearing graphic - small circles at top/bottom */}
                <circle cx="160" cy="25" r="5" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.6" />
                <circle cx="160" cy="295" r="5" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.6" />

                {/* Air gap indicator */}
                <line x1="80" y1="160" x2="80" y2="140" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <line x1="80" y1="160" x2="80" y2="180" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <text x="60" y="164" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">Air Gap</text>

                {/* Legend */}
                <rect x="330" y="60" width="160" height="130" rx="8" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <text x="410" y="80" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontWeight="600" fontFamily="monospace">KOMPONEN</text>
                {[
                  { color: '#00d4ff', label: 'Rotor' },
                  { color: '#a855f7', label: 'Stator' },
                  { color: '#f97316', label: 'Slip Rings' },
                  { color: '#00ff88', label: 'Housing' },
                  { color: '#3b82f6', label: 'Cooling' },
                  { color: '#eab308', label: 'Bearing' },
                ].map((item, i) => (
                  <g key={item.label}>
                    <rect x="345" y={92 + i * 18} width="12" height="8" rx="2" fill={item.color} opacity="0.7" />
                    <text x="364" y={100 + i * 18} fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="monospace">{item.label}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* ──── Prinsip Kerja with animated arrows & hover technical terms ──── */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <h3 className="text-cyan-300 font-semibold text-base">Prinsip Kerja</h3>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
              {[
                { step: 1, label: 'Rotor Diputar', term: 'Mechanical Input', color: '#00d4ff', icon: '⚙️' },
                { step: 2, label: 'Medan Magnet Berputar', term: 'Rotating Magnetic Field', color: '#8844ff', icon: '🧲' },
                { step: 3, label: 'Arus Induksi di Stator', term: 'Electromagnetic Induction', color: '#ffaa00', icon: '⚡' },
                { step: 4, label: 'Frekuensi ditentukan oleh kecepatan rotor & jumlah kutub', term: 'Synchronous Speed', color: '#00ff88', icon: '📐' },
              ].map((item, idx, arr) => (
                <div key={item.step} className="flex items-center gap-2 sm:gap-0">
                  <div
                    className="group/step relative flex flex-col items-center gap-1 px-4 sm:px-5 py-3 rounded-xl border min-w-[140px] sm:min-w-[160px] transition-all duration-300 hover:scale-105"
                    style={{
                      borderColor: item.color + '44',
                      background: item.color + '11',
                    }}
                  >
                    <span className="text-xl sm:text-2xl">{item.icon}</span>
                    <span className="text-xs font-bold text-white/90 mb-0.5">Langkah {item.step}</span>
                    <span className="text-[10px] sm:text-xs text-white/70 text-center leading-tight">{item.label}</span>
                    {/* Hover technical term tooltip */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/step:opacity-100 transition-all duration-300 translate-y-2 group-hover/step:translate-y-0 pointer-events-none z-10 whitespace-nowrap">
                      <span className="badge-ansi text-[10px]">{item.term}</span>
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <svg width="36" height="18" viewBox="0 0 36 18" className="shrink-0 hidden sm:block mx-1">
                      <line x1="0" y1="9" x2="28" y2="9" stroke={item.color} strokeWidth="2" className="electricity-flow" />
                      <polygon points="28,4 36,9 28,14" fill={item.color} />
                    </svg>
                  )}
                  {idx < arr.length - 1 && (
                    <svg width="18" height="36" viewBox="0 0 18 36" className="shrink-0 sm:hidden my-1">
                      <line x1="9" y1="0" x2="9" y2="28" stroke={item.color} strokeWidth="2" className="electricity-flow" />
                      <polygon points="4,28 9,36 14,28" fill={item.color} />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ──── Komponen Utama with colored borders, icons & enhanced tooltips ──── */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="4" />
                <line x1="7" y1="7" x2="17" y2="7" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="7" y1="17" x2="12" y2="17" />
              </svg>
              <h3 className="text-cyan-300 font-semibold text-base">Komponen Utama</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatorComponents.map((comp, idx) => {
                const compMeta: Record<string, { borderColor: string; icon: string; bgColor: string }> = {
                  'Rotor': { borderColor: '#00d4ff', icon: '⚙️', bgColor: 'rgba(0,212,255,0.06)' },
                  'Stator': { borderColor: '#a855f7', icon: '🔌', bgColor: 'rgba(168,85,247,0.06)' },
                  'Slip Rings / Brush': { borderColor: '#f97316', icon: '🔗', bgColor: 'rgba(249,115,22,0.06)' },
                  'Housing / Frame': { borderColor: '#22c55e', icon: '🏗️', bgColor: 'rgba(34,197,94,0.06)' },
                  'Cooling System': { borderColor: '#3b82f6', icon: '❄️', bgColor: 'rgba(59,130,246,0.06)' },
                  'Bearing': { borderColor: '#eab308', icon: '🔩', bgColor: 'rgba(234,179,8,0.06)' },
                };
                const meta = compMeta[comp.name] || { borderColor: '#00d4ff', icon: '📦', bgColor: 'rgba(0,212,255,0.06)' };

                return (
                  <div
                    key={comp.name}
                    title={`Istilah Teknis: ${comp.term}`}
                    className="group relative bg-white/5 rounded-xl px-4 py-4 hover:bg-white/10 transition-all duration-300 cursor-default overflow-hidden"
                    style={{
                      borderLeft: `4px solid ${meta.borderColor}`,
                      borderRight: '1px solid rgba(255,255,255,0.1)',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {/* Hover glow background */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ background: meta.bgColor }}
                    />

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base sm:text-lg">{meta.icon}</span>
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center"
                          style={{
                            background: meta.borderColor + '22',
                            color: meta.borderColor,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <h4 className="text-white font-semibold text-sm">{comp.name}</h4>
                      </div>
                      <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-2">{comp.desc}</p>
                      {/* Enhanced hover tooltip with transition */}
                      <div className="h-6 overflow-hidden">
                        <div className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                            style={{
                              background: meta.borderColor + '22',
                              border: `1px solid ${meta.borderColor}44`,
                              color: meta.borderColor,
                            }}
                          >
                            {meta.icon} {comp.term}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ──── Enhanced Link to Diagram CTA ──── */}
          <div className="text-center">
            <div className="glass-card p-6 sm:p-8 max-w-xl mx-auto" style={{ borderRadius: '20px' }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2" className="glow-pulse">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
                <h3 className="text-white font-semibold text-base sm:text-lg">Diagram Proteksi Interaktif</h3>
              </div>
              <p className="text-white/50 text-xs sm:text-sm mb-5 leading-relaxed">
                Lihat bagaimana semua komponen bekerja bersama dalam sistem proteksi
              </p>
              <button
                onClick={() => document.getElementById('diagram-proteksi')?.scrollIntoView({ behavior: 'smooth' })}
                className="glow-btn-green text-sm sm:text-base px-8 py-3 glow-pulse text-base sm:text-lg font-semibold"
                style={{ borderRadius: '14px', minWidth: '240px' }}
              >
                Lihat Diagram Proteksi →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 4: DASAR GENERATOR SINKRON ═══════════════ */}
      <section id="dasar-generator" className="relative px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title text-center">Dasar Generator Sinkron</h2>
          <p className="section-subtitle text-center">
            Memahami prinsip dasar generator sinkron sebelum mempelajari sistem proteksinya
          </p>

          {/* intro text */}
          <div className="glass-card p-6 mb-8">
            <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-4">
              Generator sinkron adalah mesin listrik yang mengubah energi mekanik dari prime mover 
              (turbin uap, turbin air, mesin diesel) menjadi energi listrik AC. Generator disebut 
              &quot;sinkron&quot; karena kecepatan putar rotornya selalu tetap (sinkron) terhadap frekuensi 
              jaringan yang dihubungkan.
            </p>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Kecepatan sinkron generator ditentukan oleh frekuensi sistem dan jumlah kutub magnet 
              pada rotor. Hubungan ini dinyatakan dalam rumus fundamental:
            </p>
          </div>

          {/* formula card */}
          <div className="glass-card p-6 mb-8 text-center glow-pulse">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Rumus Kecepatan Sinkron</p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              <span className="text-cyan-300">N</span>
              <sub className="text-cyan-400 text-lg">s</sub>
              <span className="text-white/60 mx-2">=</span>
              <span className="text-yellow-300">120</span>
              <span className="text-white/40 mx-1">×</span>
              <span className="text-purple-300">f</span>
              <span className="text-white/40 mx-1">/</span>
              <span className="text-green-300">P</span>
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-white/50 mt-2">
              <span><span className="text-cyan-300">N<sub>s</sub></span> = Kecepatan sinkron (rpm)</span>
              <span><span className="text-purple-300">f</span> = Frekuensi (Hz)</span>
              <span><span className="text-green-300">P</span> = Jumlah kutub</span>
            </div>
          </div>

          {/* calculator */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="16" y2="10" />
                <line x1="8" y1="14" x2="12" y2="14" />
              </svg>
              <h3 className="text-cyan-300 font-semibold text-base">Kalkulator Kecepatan Sinkron</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* frequency input */}
              <div>
                <label className="block text-white/60 text-xs mb-1 font-medium">
                  Frekuensi, f (Hz)
                </label>
                <input
                  type="number"
                  value={freq}
                  onChange={(e) => setFreq(e.target.value)}
                  placeholder="Contoh: 50"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/25 transition-colors"
                  min="0"
                  step="any"
                />
              </div>
              {/* poles input */}
              <div>
                <label className="block text-white/60 text-xs mb-1 font-medium">
                  Jumlah Kutub, P
                </label>
                <input
                  type="number"
                  value={poles}
                  onChange={(e) => setPoles(e.target.value)}
                  placeholder="Contoh: 4"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/25 transition-colors"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            {/* buttons */}
            <div className="flex gap-3 mb-4">
              <button onClick={calculateSyncSpeed} className="glow-btn text-sm px-6 py-2">
                Hitung N<sub>s</sub>
              </button>
              <button onClick={resetCalc} className="glow-btn-yellow text-sm px-6 py-2">
                Reset
              </button>
            </div>

            {/* error */}
            {calcError && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 mb-4">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {calcError}
                </p>
              </div>
            )}

            {/* result */}
            {syncResult !== null && (
              <div className="bg-green-500/10 border border-green-400/30 rounded-xl px-4 py-4">
                <p className="text-white/60 text-xs mb-1">Kecepatan Sinkron:</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  <span className="status-normal">{syncResult}</span>
                  <span className="text-white/40 text-base ml-2">rpm</span>
                </p>
                <p className="text-white/40 text-xs mt-1">
                  N<sub>s</sub> = 120 × {freq} / {poles} = {syncResult} rpm
                </p>
              </div>
            )}

            {/* quick examples */}
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-white/40 text-xs mb-2">Contoh Cepat:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '50 Hz, 2 kutub', f: '50', p: '2' },
                  { label: '50 Hz, 4 kutub', f: '50', p: '4' },
                  { label: '60 Hz, 4 kutub', f: '60', p: '4' },
                  { label: '50 Hz, 6 kutub', f: '50', p: '6' },
                ].map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => {
                      setFreq(ex.f);
                      setPoles(ex.p);
                      setCalcError(null);
                      const fVal = parseFloat(ex.f);
                      const pVal = parseFloat(ex.p);
                      setSyncResult((120 * fVal / pVal).toFixed(2));
                    }}
                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/60 hover:bg-white/10 hover:text-white/80 transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 5: SISTEM PROTEKSI ═══════════════ */}
      <section id="sistem-proteksi" className="relative px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title text-center">Sistem Proteksi</h2>
          <p className="section-subtitle text-center">
            Prinsip dan tujuan sistem proteksi pada generator sinkron
          </p>

          {/* main explanation */}
          <div className="glass-card p-6 mb-8">
            <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-4">
              Sistem proteksi pada generator sinkron adalah kumpulan peralatan dan skema proteksi 
              yang dirancang untuk mendeteksi kondisi abnormal atau gangguan, dan mengambil tindakan 
              yang tepat untuk melindungi generator dan sistem tenaga listrik secara keseluruhan.
            </p>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Proteksi generator mencakup pendeteksian gangguan internal (hubung singkat stator, 
              gangguan tanah), gangguan eksternal (arus lebih, tegangan tidak normal), serta kondisi 
              abnormal operasi (kehilangan eksitasi, daya balik, out of step, suhu lebih).
            </p>
          </div>

          {/* flow diagram */}
          <div className="glass-card p-6 mb-8 overflow-x-auto">
            <h3 className="text-cyan-300 font-semibold text-base mb-4 text-center">Alur Kerja Sistem Proteksi</h3>
            <div className="flex items-center justify-center gap-2 sm:gap-4 min-w-max mx-auto">
              {[
                { label: 'Gangguan', color: '#ff4466', icon: '⚡' },
                { label: 'CT / PT', color: '#ffaa00', icon: '📡' },
                { label: 'Relay', color: '#00d4ff', icon: '🔌' },
                { label: 'Trip Coil', color: '#8844ff', icon: '⚙️' },
                { label: 'CB Trip', color: '#ff4466', icon: '🔴' },
              ].map((step, idx, arr) => (
                <div key={step.label} className="flex items-center gap-2 sm:gap-4">
                  <div
                    className="flex flex-col items-center gap-1 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border"
                    style={{
                      borderColor: step.color + '44',
                      background: step.color + '11',
                    }}
                  >
                    <span className="text-xl sm:text-2xl">{step.icon}</span>
                    <span className="text-xs text-white/70 whitespace-nowrap">{step.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <svg width="24" height="12" viewBox="0 0 24 12" className="shrink-0">
                      <line x1="0" y1="6" x2="20" y2="6" stroke={step.color} strokeWidth="2" className="electricity-flow" />
                      <polygon points="20,2 24,6 20,10" fill={step.color} />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 8 objectives */}
          <div className="glass-card p-6">
            <h3 className="text-cyan-300 font-semibold text-base mb-4">Tujuan Sistem Proteksi Generator</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {protectionObjectives.map((obj, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/8"
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-cyan-400/15 text-cyan-300 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="text-white/75 text-sm leading-relaxed">{obj}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 6: KOMPONEN PROTEKSI ═══════════════ */}
      <section id="komponen-proteksi" className="relative px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center">Komponen Proteksi</h2>
          <p className="section-subtitle text-center">
            Komponen utama dalam sistem proteksi generator sinkron — klik untuk melihat detail
          </p>

          {/* flow overview */}
          <div className="glass-card p-4 sm:p-6 mb-8 overflow-x-auto">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3 text-center">Alur Sinyal Proteksi</p>
            <div className="flex items-center justify-center gap-1 sm:gap-2 min-w-max mx-auto text-xs sm:text-sm">
              {['Generator', 'CT/PT', 'Relay', 'Trip Coil', 'Circuit Breaker', 'Busbar'].map((name, idx, arr) => (
                <div key={name} className="flex items-center gap-1 sm:gap-2">
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 whitespace-nowrap font-medium">
                    {name}
                  </span>
                  {idx < arr.length - 1 && (
                    <svg width="20" height="10" viewBox="0 0 20 10" className="shrink-0">
                      <line x1="0" y1="5" x2="16" y2="5" stroke="#00d4ff" strokeWidth="1.5" className="electricity-flow" />
                      <polygon points="16,2 20,5 16,8" fill="#00d4ff" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* component cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {protectionComponents.map((comp) => {
              const isExpanded = expandedCard === comp.id;

              return (
                <div
                  key={comp.id}
                  onClick={() => setExpandedCard(isExpanded ? null : comp.id)}
                  className={`glass-card p-5 cursor-pointer transition-all duration-300 ${
                    isExpanded ? 'sm:col-span-2 lg:col-span-3' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedCard(isExpanded ? null : comp.id);
                    }
                  }}
                >
                  {/* header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-cyan-400/15 text-cyan-300 text-sm font-bold flex items-center justify-center">
                        {comp.id}
                      </span>
                      <div>
                        <h4 className="text-white font-semibold text-sm sm:text-base">{comp.name}</h4>
                        <p className="text-white/40 text-xs mt-0.5">{comp.function}</p>
                      </div>
                    </div>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="2"
                      className={`transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>

                  {/* expanded detail */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in duration-300">
                      <p className="text-white/70 text-sm leading-relaxed mb-3">
                        {comp.description}
                      </p>

                      {/* component-specific visual */}
                      {comp.id === 1 && (
                        <div className="flex justify-center my-3">
                          <GeneratorIcon className="w-24 h-24" />
                        </div>
                      )}
                      {comp.id === 2 && (
                        <div className="flex justify-center my-3">
                          <CTPRIcon className="w-24 h-24" />
                        </div>
                      )}
                      {comp.id === 4 && (
                        <div className="flex justify-center my-3">
                          <RelayIcon className="w-24 h-24" />
                        </div>
                      )}
                      {comp.id === 5 && (
                        <div className="flex justify-center my-3">
                          <CircuitBreakerIcon className="w-24 h-24" />
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <span className="badge-ansi">#{comp.id}</span>
                        <span className="text-white/30 text-xs">Komponen Proteksi</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
