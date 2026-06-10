'use client';

import { useState, useEffect, useCallback } from 'react';
import HeroAndEarlySections from '@/components/protection/HeroAndEarlySections';
import ANSIAndFaults from '@/components/protection/ANSIAndFaults';
import DiagramAndSimulation from '@/components/protection/DiagramAndSimulation';
import QuizAndRemaining from '@/components/protection/QuizAndRemaining';

const navItems = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'latar-belakang', label: 'Latar Belakang' },
  { id: 'capaian', label: 'Capaian Pembelajaran' },
  { id: 'pengertian-generator', label: 'Pengertian Generator' },
  { id: 'dasar-generator', label: 'Dasar Generator' },
  { id: 'sistem-proteksi', label: 'Sistem Proteksi' },
  { id: 'komponen-proteksi', label: 'Komponen Proteksi' },
  { id: 'kode-ansi', label: 'Kode ANSI Relay' },
  { id: 'gangguan-generator', label: 'Gangguan Generator' },
  { id: 'diagram-proteksi', label: 'Diagram Proteksi' },
  { id: 'logika-trip', label: 'Logika Trip' },
  { id: 'simulasi', label: 'Simulasi Gangguan' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'studi-kasus', label: 'Studi Kasus' },
  { id: 'kalkulator', label: 'Kalkulator Relay' },
  { id: 'glosarium', label: 'Glosarium' },
  { id: 'kesalahan-umum', label: 'Kesalahan Umum' },
  { id: 'kuis', label: 'Kuis' },
  { id: 'evaluasi', label: 'Evaluasi' },
  { id: 'kesimpulan', label: 'Kesimpulan' },
  { id: 'referensi', label: 'Referensi' },
];

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');

  // Scroll progress and back-to-top visibility
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    navItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll handler
  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  }, []);

  // Back to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    setIsLightMode((prev) => !prev);
  }, []);

  return (
    <div className={isLightMode ? 'light-mode' : ''}>
      {/* Background */}
      <div className="protection-bg">
        {/* Scroll Progress Bar */}
        <div
          className="scroll-progress"
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Navbar */}
        <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2v10l7 4" />
                  </svg>
                </div>
                <span className="text-white font-bold text-sm md:text-base hidden sm:block">
                  Proteksi Generator
                </span>
              </div>

              {/* Desktop Nav */}
              <div className="nav-desktop hidden md:flex items-center gap-1 overflow-x-auto max-w-[calc(100%-120px)] scrollbar-hide">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      activeSection === item.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Toggle theme"
                >
                  {isLightMode ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  )}
                </button>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="nav-mobile-menu w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all md:hidden"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[rgba(10,14,39,0.95)] backdrop-blur-xl border-t border-white/10 max-h-[70vh] overflow-y-auto">
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 ${
                      activeSection === item.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-xs font-mono text-white/40">
                      {idx + 1}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="pt-16 relative z-10">
          {/* Progress indicator */}
          <div className="fixed top-16 right-4 z-40 hidden lg:block">
            <div className="glass-card p-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-white/50 text-xs font-mono">
                {Math.round(scrollProgress)}%
              </span>
            </div>
          </div>

          {/* All Sections */}
          <HeroAndEarlySections />
          <ANSIAndFaults />
          <DiagramAndSimulation />
          <QuizAndRemaining />
        </main>

        {/* Footer */}
        <footer className="relative z-10 mt-auto border-t border-white/10 bg-[rgba(10,14,39,0.6)] backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-white font-bold mb-3">Sistem Proteksi Generator Sinkron</h3>
                <p className="text-white/50 text-sm">
                  Media Pembelajaran Interaktif untuk mata kuliah Proteksi Sistem Tenaga Listrik.
                </p>
              </div>
              <div>
                <h4 className="text-cyan-400 font-semibold mb-3 text-sm">Navigasi Cepat</h4>
                <div className="grid grid-cols-2 gap-1">
                  {navItems.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className="text-left text-white/40 hover:text-cyan-400 text-xs py-1 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-cyan-400 font-semibold mb-3 text-sm">Fitur Interaktif</h4>
                <div className="space-y-1">
                  {['Simulasi Gangguan', 'Diagram Proteksi Interaktif', 'Panel Monitoring', 'Kuis Interaktif', 'Kalkulator Relay', 'Audio Efek'].map((f) => (
                    <p key={f} className="text-white/40 text-xs">{f}</p>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-cyan-400 font-semibold mb-3 text-sm">Tim Penyusun</h4>
                <div className="space-y-1">
                  <p className="text-white/60 text-xs">Rey William Tambun</p>
                  <p className="text-white/60 text-xs">Intan Sari Panggabean</p>
                  <p className="text-white/60 text-xs">Sesilia H Br Samura</p>
                  <p className="text-white/60 text-xs">Dimas D Kurniawan</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-white/30 text-xs">
                  © {new Date().getFullYear()} Media Pembelajaran Proteksi Sistem Tenaga Listrik | Projek Akhir
                </p>
                <p className="text-purple-300/60 text-xs font-medium">
                  Program Studi Pendidikan Teknik Elektro, Universitas Negeri Medan
                </p>
              </div>
            </div>
          </div>
        </footer>

        {/* Back to Top Button */}
        <button
          onClick={scrollToTop}
          className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
          aria-label="Kembali ke atas"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
