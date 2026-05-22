'use client';

import { useState } from 'react';
import { quizData, studyCases, glossaryData, commonMistakes, evaluationQuestions, references } from '@/data/protection-data';

export default function QuizAndRemaining() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [syncFreq, setSyncFreq] = useState('');
  const [syncPoles, setSyncPoles] = useState('');
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncError, setSyncError] = useState('');
  const [relayNominal, setRelayNominal] = useState('');
  const [relayFactor, setRelayFactor] = useState('');
  const [relayCtPrimary, setRelayCtPrimary] = useState('');
  const [relayCtSecondary, setRelayCtSecondary] = useState('');
  const [relayFaultCurrent, setRelayFaultCurrent] = useState('');
  const [relayResult, setRelayResult] = useState<{
    primary: string;
    secondary: string;
    psm: string;
    isTripped: boolean;
    statusMsg: string;
  } | null>(null);
  const [relayError, setRelayError] = useState('');

  // ======== CALCULATOR: Kecepatan Sinkron ========
  const calculateSyncSpeed = () => {
    setSyncResult(null);
    setSyncError('');

    if (!syncFreq.trim() || !syncPoles.trim()) {
      setSyncError('Semua input harus diisi.');
      return;
    }

    const f = parseFloat(syncFreq);
    const P = parseFloat(syncPoles);

    if (isNaN(f) || isNaN(P)) {
      setSyncError('Input harus berupa angka.');
      return;
    }

    if (f <= 0 || P <= 0) {
      setSyncError('Nilai frekuensi dan jumlah kutub harus lebih dari 0.');
      return;
    }

    const Ns = (120 * f) / P;
    setSyncResult(`Ns = 120 × ${f} / ${P} = ${Ns.toFixed(2)} rpm`);
  };

  // ======== CALCULATOR: Setting Overcurrent Relay ========
  const calculateRelaySetting = () => {
    setRelayResult(null);
    setRelayError('');

    if (!relayNominal.trim() || !relayFactor.trim() || !relayCtPrimary.trim() || !relayCtSecondary.trim() || !relayFaultCurrent.trim()) {
      setRelayError('Semua input harus diisi.');
      return;
    }

    const In = parseFloat(relayNominal);
    const factor = parseFloat(relayFactor);
    const ctPrimary = parseFloat(relayCtPrimary);
    const ctSecondary = parseFloat(relayCtSecondary);
    const faultCurrent = parseFloat(relayFaultCurrent);

    if (isNaN(In) || isNaN(factor) || isNaN(ctPrimary) || isNaN(ctSecondary) || isNaN(faultCurrent)) {
      setRelayError('Input harus berupa angka.');
      return;
    }

    if (In <= 0 || factor <= 0 || ctPrimary <= 0 || ctSecondary <= 0 || faultCurrent <= 0) {
      setRelayError('Semua nilai harus lebih dari 0 (tidak boleh nol atau negatif).');
      return;
    }

    const iPrimary = factor * In;
    const iSecondary = (iPrimary * ctSecondary) / ctPrimary;
    const psm = faultCurrent / iPrimary;
    const isTripped = faultCurrent > iPrimary;

    setRelayResult({
      primary: `I setting primer = ${factor} × ${In} = ${iPrimary.toFixed(2)} A`,
      secondary: `I setting sekunder = ${iPrimary.toFixed(2)} × ${ctSecondary} / ${ctPrimary} = ${iSecondary.toFixed(4)} A`,
      psm: `PSM = ${faultCurrent} / ${iPrimary.toFixed(2)} = ${psm.toFixed(4)}`,
      isTripped,
      statusMsg: isTripped
        ? 'Relay bekerja / trip karena arus gangguan melebihi arus setting.'
        : 'Relay belum bekerja karena arus gangguan belum melebihi arus setting.',
    });
  };

  // ======== QUIZ LOGIC ========
  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);
  };

  const handleResetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quizData.length;
  const allAnswered = answeredCount === totalQuestions;

  const score = submitted
    ? quizData.reduce((acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0), 0)
    : 0;

  const percentage = submitted ? Math.round((score / totalQuestions) * 100) : 0;

  const getScoreCategory = (pct: number) => {
    if (pct >= 80) return { label: 'Sangat Baik', color: 'text-green-400', bg: 'rgba(0,200,100,0.15)' };
    if (pct >= 60) return { label: 'Baik', color: 'text-cyan-400', bg: 'rgba(0,200,255,0.15)' };
    if (pct >= 40) return { label: 'Cukup', color: 'text-yellow-400', bg: 'rgba(255,170,0,0.15)' };
    return { label: 'Perlu Belajar Lagi', color: 'text-red-400', bg: 'rgba(255,50,80,0.15)' };
  };

  return (
    <>
      {/* ======== SECTION 12: Studi Kasus ======== */}
      <section id="studi-kasus" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Studi Kasus
          </h2>
          <p className="text-white/60 mb-8 text-lg">Analisis skenario gangguan pada generator sinkron</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studyCases.map((sc) => (
              <div key={sc.id} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-400 font-bold text-lg">
                    {sc.id}
                  </span>
                  <h3 className="text-xl font-bold text-white">{sc.title}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Kondisi</span>
                  <p className="text-white/80 mt-1">{sc.condition}</p>
                </div>

                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Langkah Analisis</span>
                  <ul className="mt-2 space-y-2">
                    {sc.analysis.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white/80">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== SECTION 13: Kalkulator Relay ======== */}
      <section id="kalkulator" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Kalkulator Relay
          </h2>
          <p className="text-white/60 mb-8 text-lg">Hitung parameter proteksi generator dengan cepat</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calculator A: Kecepatan Sinkron */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  A
                </div>
                <h3 className="text-xl font-bold text-white">Kalkulator Kecepatan Sinkron</h3>
              </div>

              <p className="text-white/50 text-sm mb-1">Rumus: Ns = 120f / P</p>
              <p className="text-white/40 text-xs mb-5">Menghitung kecepatan sinkron generator berdasarkan frekuensi dan jumlah kutub</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-1.5">Frekuensi (f) [Hz]</label>
                  <input
                    type="number"
                    value={syncFreq}
                    onChange={(e) => { setSyncFreq(e.target.value); setSyncError(''); setSyncResult(null); }}
                    placeholder="Contoh: 50"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-1.5">Jumlah Kutub (P)</label>
                  <input
                    type="number"
                    value={syncPoles}
                    onChange={(e) => { setSyncPoles(e.target.value); setSyncError(''); setSyncResult(null); }}
                    placeholder="Contoh: 4"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                  />
                </div>

                {syncError && (
                  <p className="text-red-400 text-sm flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {syncError}
                  </p>
                )}

                <button
                  onClick={calculateSyncSpeed}
                  className="glow-btn w-full text-sm py-2.5"
                >
                  Hitung Kecepatan Sinkron
                </button>

                {syncResult && (
                  <div className="mt-3 p-4 rounded-lg bg-cyan-400/10 border border-cyan-400/20">
                    <p className="text-cyan-400 font-mono text-sm font-semibold">{syncResult}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Calculator B: Setting Overcurrent Relay */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 font-bold text-sm">
                  B
                </div>
                <h3 className="text-xl font-bold text-white">Kalkulator Setting Overcurrent Relay</h3>
              </div>

              <div className="mb-5 space-y-1">
                <p className="text-white/50 text-sm font-mono">I setting primer = Faktor setting × In</p>
                <p className="text-white/50 text-sm font-mono">I setting sekunder = I setting primer × CT sekunder / CT primer</p>
                <p className="text-cyan-400/70 text-sm font-mono font-semibold">PSM = Arus gangguan (If) / I setting primer</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-1.5">Arus Nominal, In [A]</label>
                  <input
                    type="number"
                    value={relayNominal}
                    onChange={(e) => { setRelayNominal(e.target.value); setRelayError(''); setRelayResult(null); }}
                    placeholder="Contoh: 400"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-1.5">Faktor Setting</label>
                  <input
                    type="number"
                    value={relayFactor}
                    onChange={(e) => { setRelayFactor(e.target.value); setRelayError(''); setRelayResult(null); }}
                    placeholder="Contoh: 1.25"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-1.5">CT Primer [A]</label>
                    <input
                      type="number"
                      value={relayCtPrimary}
                      onChange={(e) => { setRelayCtPrimary(e.target.value); setRelayError(''); setRelayResult(null); }}
                      placeholder="Contoh: 500"
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-1.5">CT Sekunder [A]</label>
                    <input
                      type="number"
                      value={relayCtSecondary}
                      onChange={(e) => { setRelayCtSecondary(e.target.value); setRelayError(''); setRelayResult(null); }}
                      placeholder="1 atau 5"
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-1.5">Arus Gangguan, If [A]</label>
                  <input
                    type="number"
                    value={relayFaultCurrent}
                    onChange={(e) => { setRelayFaultCurrent(e.target.value); setRelayError(''); setRelayResult(null); }}
                    placeholder="Contoh: 2000"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition-all"
                  />
                </div>

                {relayError && (
                  <p className="text-red-400 text-sm flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {relayError}
                  </p>
                )}

                <button
                  onClick={calculateRelaySetting}
                  className="glow-btn w-full text-sm py-2.5"
                  style={{ background: 'linear-gradient(135deg, #8844ff, #cc44ff)' }}
                >
                  Hitung Setting Relay
                </button>

                {relayResult && (
                  <div className="mt-3 space-y-3">
                    {/* I setting primer */}
                    <div className="p-4 rounded-lg bg-purple-400/10 border border-purple-400/20">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">I Setting Primer</p>
                      <p className="text-purple-400 font-mono text-sm font-semibold">{relayResult.primary}</p>
                    </div>

                    {/* I setting sekunder */}
                    <div className="p-4 rounded-lg bg-purple-400/10 border border-purple-400/20">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">I Setting Sekunder</p>
                      <p className="text-purple-400 font-mono text-sm font-semibold">{relayResult.secondary}</p>
                    </div>

                    {/* PSM */}
                    <div className="p-4 rounded-lg bg-cyan-400/10 border border-cyan-400/30">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Plug Setting Multiplier (PSM)</p>
                      <p className="text-cyan-400 font-mono text-sm font-semibold">{relayResult.psm}</p>
                    </div>

                    {/* Status relay */}
                    <div className={`p-4 rounded-lg border ${relayResult.isTripped ? 'bg-red-400/10 border-red-400/30' : 'bg-green-400/10 border-green-400/30'}`}>
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Status Relay</p>
                      <div className="flex items-center gap-2">
                        {relayResult.isTripped ? (
                          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        ) : (
                          <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        )}
                        <p className={`font-semibold text-sm ${relayResult.isTripped ? 'text-red-400' : 'text-green-400'}`}>
                          {relayResult.isTripped ? 'RELAY BEKERJA / TRIP' : 'RELAY BELUM BEKERJA'}
                        </p>
                      </div>
                      <p className={`text-sm mt-2 ${relayResult.isTripped ? 'text-red-300/80' : 'text-green-300/80'}`}>
                        {relayResult.statusMsg}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======== SECTION 14: Glosarium ======== */}
      <section id="glosarium" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Glosarium
          </h2>
          <p className="text-white/60 mb-8 text-lg">Daftar istilah penting dalam proteksi generator</p>

          <div className="glass-card p-6 overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th className="w-1/3">Istilah</th>
                  <th>Arti / Penjelasan</th>
                </tr>
              </thead>
              <tbody>
                {glossaryData.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-cyan-300">{item.term}</td>
                    <td>{item.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ======== SECTION 15: Kesalahan Umum ======== */}
      <section id="kesalahan-umum" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Kesalahan Umum
          </h2>
          <p className="text-white/60 mb-8 text-lg">Kesalahan pemahaman yang sering terjadi dan penjelasan yang benar</p>

          <div className="glass-card p-6 overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th className="w-1/2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Kesalahan Pemahaman
                    </span>
                  </th>
                  <th className="w-1/2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Penjelasan yang Benar
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {commonMistakes.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="flex items-start gap-2">
                        <span className="mt-1 shrink-0 w-5 h-5 rounded-full bg-red-400/15 border border-red-400/30 flex items-center justify-center">
                          <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </span>
                        <span className="text-red-300/90">{item.mistake}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-start gap-2">
                        <span className="mt-1 shrink-0 w-5 h-5 rounded-full bg-green-400/15 border border-green-400/30 flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </span>
                        <span className="text-green-300/90">{item.correct}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ======== SECTION 16: Kuis Interaktif ======== */}
      <section id="kuis" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Kuis Interaktif
          </h2>
          <p className="text-white/60 mb-4 text-lg">Uji pemahaman Anda tentang sistem proteksi generator sinkron</p>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-white/50 mb-2">
              <span>Jawaban: {answeredCount} / {totalQuestions}</span>
              {!submitted && <span>{allAnswered ? 'Semua terjawab!' : `Belum ${totalQuestions - answeredCount} soal`}</span>}
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Score display after submission */}
          {submitted && (
            <div className="glass-card p-6 mb-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">Hasil Kuis</h3>
              <div className="text-5xl font-bold mb-2" style={{ color: getScoreCategory(percentage).color === 'text-green-400' ? '#4ade80' : getScoreCategory(percentage).color === 'text-cyan-400' ? '#22d3ee' : getScoreCategory(percentage).color === 'text-yellow-400' ? '#facc15' : '#f87171' }}>
                {percentage}%
              </div>
              <p className="text-white/70 text-lg mb-1">
                Skor: <span className="font-semibold text-white">{score}</span> / {totalQuestions} soal benar
              </p>
              <div
                className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mt-2"
                style={{
                  background: getScoreCategory(percentage).bg,
                  color: getScoreCategory(percentage).color === 'text-green-400' ? '#4ade80' : getScoreCategory(percentage).color === 'text-cyan-400' ? '#22d3ee' : getScoreCategory(percentage).color === 'text-yellow-400' ? '#facc15' : '#f87171',
                }}
              >
                {getScoreCategory(percentage).label}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleResetQuiz}
                  className="glow-btn-yellow text-sm px-6 py-2"
                >
                  Ulangi Kuis
                </button>
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-8">
            {quizData.map((q, qIdx) => {
              const selectedAnswer = answers[q.id];
              const isCorrect = submitted && selectedAnswer === q.correctIndex;
              const isIncorrect = submitted && selectedAnswer !== undefined && selectedAnswer !== q.correctIndex;

              return (
                <div key={q.id} className="glass-card p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-400 font-bold text-sm">
                      {qIdx + 1}
                    </span>
                    <h3 className="text-white font-medium leading-relaxed">{q.question}</h3>
                  </div>

                  <div className="space-y-3 ml-11">
                    {q.options.map((option, oIdx) => {
                      const isSelected = selectedAnswer === oIdx;
                      const isCorrectOption = submitted && oIdx === q.correctIndex;
                      const isWrongSelection = submitted && isSelected && oIdx !== q.correctIndex;

                      let optionClass = 'quiz-option';
                      if (submitted) {
                        if (isCorrectOption) optionClass += ' correct';
                        if (isWrongSelection) optionClass += ' incorrect';
                      } else if (isSelected) {
                        optionClass += ' selected';
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectAnswer(q.id, oIdx)}
                          disabled={submitted}
                          className={`${optionClass} w-full text-left flex items-start gap-3 ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold mt-0.5 ${
                            submitted && isCorrectOption
                              ? 'bg-green-500/20 border-green-400 text-green-400'
                              : submitted && isWrongSelection
                              ? 'bg-red-500/20 border-red-400 text-red-400'
                              : isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                              : 'border-white/20 text-white/50'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className={
                            submitted && isCorrectOption
                              ? 'text-green-300'
                              : submitted && isWrongSelection
                              ? 'text-red-300'
                              : 'text-white/80'
                          }>
                            {option}
                          </span>

                          {submitted && isCorrectOption && (
                            <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          )}
                          {submitted && isWrongSelection && (
                            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {submitted && (
                    <div className={`mt-4 ml-11 p-3 rounded-lg text-sm ${
                      isCorrect
                        ? 'bg-green-400/10 border border-green-400/20'
                        : 'bg-amber-400/10 border border-amber-400/20'
                    }`}>
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <svg className="w-4 h-4 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        <p className={isCorrect ? 'text-green-300/90' : 'text-amber-300/90'}>
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit button */}
          {!submitted && (
            <div className="mt-8 text-center">
              <button
                onClick={handleSubmitQuiz}
                disabled={!allAnswered}
                className={`glow-btn-green text-base px-8 py-3 ${!allAnswered ? 'opacity-40 cursor-not-allowed !shadow-none !transform-none' : ''}`}
              >
                Periksa Jawaban
              </button>
              {!allAnswered && (
                <p className="text-white/40 text-sm mt-3">
                  Jawab semua {totalQuestions} soal terlebih dahulu untuk memeriksa hasil
                </p>
              )}
            </div>
          )}

          {/* Score display after submission (bottom) */}
          {submitted && (
            <div className="mt-8 text-center">
              <button
                onClick={handleResetQuiz}
                className="glow-btn-yellow text-base px-8 py-3"
              >
                Ulangi Kuis
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ======== SECTION 17: Evaluasi ======== */}
      <section id="evaluasi" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Evaluasi
          </h2>
          <p className="text-white/60 mb-8 text-lg">Pertanyaan essay untuk evaluasi mandiri</p>

          <div className="glass-card p-6">
            <div className="space-y-4">
              {evaluationQuestions.map((question, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-400 font-bold text-sm">
                    {idx + 1}
                  </span>
                  <p className="text-white/85 leading-relaxed pt-1">{question}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-amber-300/80 text-sm">
                  Pertanyaan di atas ditujukan untuk evaluasi mandiri. Jawablah secara tertulis untuk mengukur pemahaman Anda tentang materi sistem proteksi generator sinkron.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======== SECTION 18: Kesimpulan ======== */}
      <section id="kesimpulan" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Kesimpulan
          </h2>
          <p className="text-white/60 mb-8 text-lg">Ringkasan penting tentang sistem proteksi generator sinkron</p>

          <div className="glass-card p-8 md:p-10">
            <div className="space-y-5 text-white/85 leading-relaxed text-base md:text-lg">
              <p>
                Sistem proteksi pada generator sinkron merupakan aspek kritis dalam operasi pembangkit listrik. Tanpa proteksi yang memadai, generator rentan terhadap berbagai gangguan yang dapat menyebabkan kerusakan peralatan, gangguan sistem tenaga listrik, dan bahaya keselamatan.
              </p>

              <p>
                Setiap jenis gangguan memerlukan relay proteksi khusus dengan kode ANSI yang sesuai. Relay 87G melindungi dari gangguan internal, relay 50/51 dari arus lebih, relay 64G/51N dari gangguan tanah, relay 32 dari daya balik, relay 40 dari kehilangan eksitasi, dan relay-relay lainnya bekerja secara koordinatif untuk memberikan proteksi yang komprehensif.
              </p>

              <p>
                Alur kerja sistem proteksi — dari deteksi gangguan oleh CT/PT, analisis oleh relay, pengiriman sinyal trip ke trip coil, hingga pembukaan circuit breaker — harus berjalan cepat dan andal. Pemahaman yang mendalam tentang setiap komponen dan mekanisme kerja sistem proteksi sangat penting bagi mahasiswa teknik elektro dan praktisi di lapangan.
              </p>

              <p>
                Perlu ditekankan bahwa proteksi generator bukan hanya tentang memasang relay, melainkan tentang memahami filosofi proteksi, memilih setting yang tepat, dan memastikan koordinasi antar relay bekerja secara harmonis. Dengan demikian, keandalan sistem tenaga listrik dapat dijaga dan kerusakan yang lebih besar dapat dicegah.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-cyan-400/10 via-blue-400/10 to-purple-400/10 border border-cyan-400/20">
              <svg className="w-6 h-6 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-cyan-300/80 text-sm font-medium">
                Proteksi yang baik adalah investasi untuk keandalan dan keamanan sistem tenaga listrik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======== SECTION 19: Referensi ======== */}
      <section id="referensi" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Referensi
          </h2>
          <p className="text-white/60 mb-8 text-lg">Sumber pustaka yang digunakan dalam materi ini</p>

          <div className="glass-card p-6">
            <ol className="space-y-3">
              {references.map((ref, idx) => (
                <li key={idx} className="flex items-start gap-3 text-white/80">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{ref}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
