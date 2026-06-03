'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { faultsData } from '@/data/protection-data';

interface DiagramState {
  status: 'normal' | 'gangguan' | 'terputus';
  cbStatus: 'ON' | 'TRIP';
  relayAktif: string;
  jenisGangguan: string;
  aksiSistem: string;
  statusSistem: string;
  flowColor: 'cyan' | 'red';
  alarmActive: boolean;
}

const defaultDiagramState: DiagramState = {
  status: 'normal',
  cbStatus: 'ON',
  relayAktif: '-',
  jenisGangguan: '-',
  aksiSistem: 'Monitoring',
  statusSistem: 'Aman',
  flowColor: 'cyan',
  alarmActive: false,
};

const svgComponentInfo: Record<string, { name: string; desc: string }> = {
  generator: {
    name: 'Generator Sinkron',
    desc: 'Mengubah energi mekanik menjadi energi listrik AC. Komponen utama yang diproteksi.',
  },
  ct: {
    name: 'CT (Current Transformer)',
    desc: 'Menurunkan arus besar menjadi arus kecil (5A/1A) untuk dibaca relay proteksi.',
  },
  pt: {
    name: 'PT (Potential Transformer)',
    desc: 'Menurunkan tegangan tinggi menjadi tegangan rendah (110V) untuk dibaca relay.',
  },
  relay: {
    name: 'Relay Proteksi',
    desc: 'Mendeteksi gangguan berdasarkan sinyal CT/PT dan mengirim perintah alarm/trip.',
  },
  tripcoil: {
    name: 'Trip Coil',
    desc: 'Kumparan elektromagnetik yang menerima sinyal trip dari relay untuk membuka CB.',
  },
  cb: {
    name: 'Circuit Breaker',
    desc: 'Memutus hubungan generator dengan sistem tenaga listrik saat menerima sinyal trip.',
  },
  busbar: {
    name: 'Busbar / Beban',
    desc: 'Rel penghubung distribusi daya listrik ke beban atau sistem jaringan.',
  },
};

export default function DiagramAndSimulation() {
  const [diagramState, setDiagramState] = useState<DiagramState>(defaultDiagramState);
  const [selectedFault, setSelectedFault] = useState<string | null>(null);
  const [simulationPhase, setSimulationPhase] = useState(0);
  const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number; key: string } | null>(null);
  const [rotorAngle, setRotorAngle] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear all pending timers
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  // Rotor animation
  useEffect(() => {
    if (diagramState.status === 'normal') {
      const interval = setInterval(() => {
        setRotorAngle((prev) => (prev + 3) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [diagramState.status]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const selectFault = useCallback((faultId: string) => {
    // Clear any existing animation timers
    clearAllTimers();

    // Reset to normal state first
    setDiagramState(defaultDiagramState);
    setSimulationPhase(0);
    setSelectedFault(null);

    const fault = faultsData.find((f) => f.id === faultId);
    if (!fault) return;

    // Start simulation after short delay
    const t0 = setTimeout(() => {
      setSelectedFault(faultId);
      setSimulationPhase(1);

      // Phase 1: Fault detected - flow turns red, alarm starts (immediate)
      setDiagramState((prev) => ({
        ...prev,
        status: 'gangguan',
        flowColor: 'red',
        alarmActive: true,
        jenisGangguan: fault.name,
        statusSistem: 'Warning',
        aksiSistem: 'Alarm',
      }));

      // Phase 2: After 1s - Relay activates
      const t1 = setTimeout(() => {
        setSimulationPhase(2);
        setDiagramState((prev) => ({
          ...prev,
          relayAktif: fault.ansiCode,
          statusSistem: 'Gangguan',
          aksiSistem: 'Proteksi Aktif',
        }));

        // Phase 3: After 2s - CB trips
        const t2 = setTimeout(() => {
          setSimulationPhase(3);
          setDiagramState((prev) => ({
            ...prev,
            cbStatus: 'TRIP',
          }));

          // Phase 4: After 3s - Generator disconnected
          const t3 = setTimeout(() => {
            setSimulationPhase(4);
            setDiagramState((prev) => ({
              ...prev,
              status: 'terputus',
              flowColor: 'cyan',
              alarmActive: false,
            }));
          }, 1000);
          timersRef.current.push(t3);
        }, 1000);
        timersRef.current.push(t2);
      }, 1000);
      timersRef.current.push(t1);
    }, 100);
    timersRef.current.push(t0);
  }, [clearAllTimers]);

  const resetSimulation = useCallback(() => {
    clearAllTimers();
    setSelectedFault(null);
    setSimulationPhase(0);
    setDiagramState(defaultDiagramState);
  }, [clearAllTimers]);

  const handleSvgClick = (key: string, e: React.MouseEvent<SVGGElement>) => {
    const svgRect = (e.currentTarget.closest('svg') as SVGSVGElement)?.getBoundingClientRect();
    if (svgRect) {
      setTooltipInfo({
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top,
        key,
      });
      const t = setTimeout(() => setTooltipInfo(null), 3000);
      timersRef.current.push(t);
    }
  };

  const selectedFaultData = faultsData.find((f) => f.id === selectedFault);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aman':
        return 'text-green-400';
      case 'Warning':
        return 'text-yellow-400';
      case 'Gangguan':
        return 'text-red-400';
      case 'Proteksi Aktif':
        return 'text-cyan-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Aman':
        return 'bg-green-500/20 border-green-500/40';
      case 'Warning':
        return 'bg-yellow-500/20 border-yellow-500/40';
      case 'Gangguan':
        return 'bg-red-500/20 border-red-500/40';
      case 'Proteksi Aktif':
        return 'bg-cyan-500/20 border-cyan-500/40';
      default:
        return 'bg-gray-500/20 border-gray-500/40';
    }
  };

  const flowStroke = diagramState.flowColor === 'red' ? '#ff4466' : '#00d4ff';
  const isFlowStopped = diagramState.status === 'terputus';

  return (
    <>
      {/* ====================== SECTION 9: DIAGRAM PROTEKSI INTERAKTIF ====================== */}
      <section id="diagram-proteksi" className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">Diagram Proteksi Interaktif</h2>
          <p className="section-subtitle text-center">
            Klik setiap komponen untuk melihat deskripsi fungsinya. Simulasi gangguan akan mengubah state diagram.
          </p>

          {/* SVG Single-Line Diagram */}
          <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${diagramState.alarmActive ? 'bg-red-500 alarm-blink' : diagramState.status === 'normal' ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-sm text-white/70 font-mono">
                {diagramState.status === 'normal' ? 'SISTEM NORMAL' : diagramState.status === 'gangguan' ? 'GANGGUAN TERDETEKSI' : 'GENERATOR TERPUTUS'}
              </span>
            </div>

            {(() => {
              /* Relay definitions for the modular diagram */
              const relays = [
                { ansi: '87G', name: 'Differential', monitors: 'Arus diferensial masuk/keluar stator', curve: 'Persentase arus (slope)', matchCodes: ['87G'] },
                { ansi: '50/51', name: 'Overcurrent', monitors: 'Arus lebih pada stator generator', curve: 'Waktu terbalik (IDMT)', matchCodes: ['50/51'] },
                { ansi: '59/27', name: 'Over/Undervoltage', monitors: 'Tegangan lebih/kurang terminal', curve: 'Tegangan tetap (definite)', matchCodes: ['59', '27'] },
                { ansi: '32', name: 'Reverse Power', monitors: 'Arah daya aktif (daya balik)', curve: 'Daya tetap (definite time)', matchCodes: ['32'] },
                { ansi: '40', name: 'Loss of Excitation', monitors: 'Arus eksitasi & impedansi', curve: 'Impedansi (mho circle)', matchCodes: ['40'] },
                { ansi: '51N/64G', name: 'Ground Fault', monitors: 'Arus bocor tanah / tegangan netral', curve: 'Waktu terbalik (IDMT)', matchCodes: ['51N', '64G', '51N / 64G'] },
              ];

              const isRelayActive = (matchCodes: string[]) => {
                const active = diagramState.relayAktif;
                if (active === '-') return false;
                return matchCodes.some(code => active.includes(code) || code.includes(active));
              };

              const cbIsTrip = diagramState.cbStatus === 'TRIP';
              const busbarColor = cbIsTrip ? 'rgba(100,100,100,0.5)' : '#8844ff';
              const loadOpacity = cbIsTrip ? 0.35 : 1;
              const loadIndicatorColor = cbIsTrip ? '#666' : '#00ff88';
              const relayBoxW = 120;
              const relayBoxH = 52;
              const relayGap = 8;
              const relayStartY = 68;
              const relayX = 410;

              return (
              <svg
                viewBox="0 0 1200 500"
                className="w-full h-auto"
                style={{ maxHeight: '480px' }}
              >
                <defs>
                  <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor="#00d4ff" floodOpacity="0.6" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor="#ff4466" floodOpacity="0.6" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feFlood floodColor="#00ff88" floodOpacity="0.5" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="componentGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feFlood floodColor="#00d4ff" floodOpacity="0.15" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowPurple" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feFlood floodColor="#8844ff" floodOpacity="0.5" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background grid */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,200,255,0.05)" strokeWidth="0.5" />
                </pattern>
                <rect width="1200" height="500" fill="url(#grid)" />

                {/* ===== CONNECTION LINES ===== */}

                {/* Generator → CT/PT: main power line */}
                <line
                  x1="130" y1="250" x2="215" y2="250"
                  stroke={flowStroke}
                  strokeWidth="3.5"
                  strokeDasharray="10 6"
                  className={isFlowStopped ? '' : 'electricity-flow'}
                  style={isFlowStopped ? { opacity: 0.3 } : undefined}
                  filter={isFlowStopped ? undefined : `url(#glow${diagramState.flowColor === 'red' ? 'Red' : 'Cyan'})`}
                />

                {/* CT/PT → Relay Group: CT signal lines (cyan, thinner) */}
                <line x1="295" y1="185" x2="345" y2="185" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="4 4" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.3 : 0.6} />
                <line x1="345" y1="185" x2="345" y2="250" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="4 4" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.3 : 0.6} />
                <line x1="345" y1="250" x2="410" y2="250" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="4 4" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.3 : 0.6} />

                {/* CT signal vertical bus to each relay */}
                <line x1="345" y1={relayStartY + relayBoxH / 2} x2="345" y2={relayStartY + 5 * (relayBoxH + relayGap) + relayBoxH / 2} stroke="#00d4ff" strokeWidth="1" strokeDasharray="3 3" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.2 : 0.4} />
                {relays.map((_, i) => (
                  <line key={`ct-sig-${i}`} x1="345" y1={relayStartY + i * (relayBoxH + relayGap) + relayBoxH / 2} x2="410" y2={relayStartY + i * (relayBoxH + relayGap) + relayBoxH / 2} stroke="#00d4ff" strokeWidth="1" strokeDasharray="3 3" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.2 : 0.4} />
                ))}

                {/* PT signal lines (purple tint, dashed) */}
                <line x1="295" y1="320" x2="370" y2="320" stroke="#9966ff" strokeWidth="1.5" strokeDasharray="5 4" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.3 : 0.5} />
                <line x1="370" y1="320" x2="370" y2="250" stroke="#9966ff" strokeWidth="1.5" strokeDasharray="5 4" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.3 : 0.5} />

                {/* PT signal vertical bus to each relay */}
                <line x1="370" y1={relayStartY + relayBoxH / 2} x2="370" y2={relayStartY + 5 * (relayBoxH + relayGap) + relayBoxH / 2} stroke="#9966ff" strokeWidth="1" strokeDasharray="3 3" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.2 : 0.35} />
                {relays.map((_, i) => (
                  <line key={`pt-sig-${i}`} x1="370" y1={relayStartY + i * (relayBoxH + relayGap) + relayBoxH / 2} x2="410" y2={relayStartY + i * (relayBoxH + relayGap) + relayBoxH / 2} stroke="#9966ff" strokeWidth="1" strokeDasharray="3 3" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.2 : 0.35} />
                ))}

                {/* Active Relay → Trip Coil: trip signal line */}
                <line
                  x1={relayX + relayBoxW} y1="250" x2="640" y2="250"
                  stroke={diagramState.relayAktif !== '-' ? '#ff4466' : '#00d4ff'}
                  strokeWidth={diagramState.relayAktif !== '-' ? '3' : '2'}
                  strokeDasharray="8 6"
                  className={diagramState.relayAktif !== '-' ? 'electricity-flow' : isFlowStopped ? '' : 'electricity-flow'}
                  style={isFlowStopped && diagramState.relayAktif === '-' ? { opacity: 0.3 } : undefined}
                  filter={diagramState.relayAktif !== '-' ? 'url(#glowRed)' : isFlowStopped ? undefined : 'url(#glowCyan)'}
                />

                {/* Trip Coil → CB: mechanical connection */}
                <line
                  x1="710" y1="250" x2="770" y2="250"
                  stroke={cbIsTrip ? '#ff4466' : flowStroke}
                  strokeWidth="3"
                  strokeDasharray="8 6"
                  className={isFlowStopped ? '' : 'electricity-flow'}
                  style={isFlowStopped ? { opacity: 0.3 } : undefined}
                  filter={`url(#glow${cbIsTrip ? 'Red' : diagramState.flowColor === 'red' ? 'Red' : 'Cyan'})`}
                />

                {/* CB → Busbar: power line */}
                <line
                  x1="860" y1="250" x2="940" y2="250"
                  stroke={cbIsTrip ? 'rgba(100,100,100,0.4)' : flowStroke}
                  strokeWidth="3.5"
                  strokeDasharray="8 6"
                  className={cbIsTrip ? '' : isFlowStopped ? '' : 'electricity-flow'}
                  style={{ opacity: cbIsTrip ? 0.3 : isFlowStopped ? 0.3 : 1 }}
                  filter={cbIsTrip || isFlowStopped ? undefined : `url(#glow${diagramState.flowColor === 'red' ? 'Red' : 'Cyan'})`}
                />

                {/* Busbar → Load branches */}
                {[120, 250, 380].map((y, i) => (
                  <line
                    key={`load-line-${i}`}
                    x1="960" y1={y} x2="1100" y2={y}
                    stroke={busbarColor}
                    strokeWidth="2.5"
                    strokeDasharray={cbIsTrip ? '4 6' : '6 4'}
                    className={cbIsTrip ? '' : 'electricity-flow'}
                    opacity={loadOpacity}
                  />
                ))}

                {/* ===== GENERATOR ===== */}
                <g
                  onClick={(e) => handleSvgClick('generator', e)}
                  className="cursor-pointer"
                >
                  <circle
                    cx="80" cy="250" r="55"
                    fill="rgba(0,20,50,0.6)"
                    stroke={diagramState.status === 'terputus' ? '#ff4466' : '#00d4ff'}
                    strokeWidth="2.5"
                    filter="url(#componentGlow)"
                  />
                  {/* Outer ring decoration */}
                  <circle cx="80" cy="250" r="62" fill="none" stroke={diagramState.status === 'terputus' ? 'rgba(255,68,102,0.2)' : 'rgba(0,212,255,0.2)'} strokeWidth="1" strokeDasharray="4 4" />
                  {/* Rotor indicator */}
                  <g transform={`rotate(${rotorAngle}, 80, 250)`}>
                    <line x1="80" y1="210" x2="80" y2="290" stroke={diagramState.status === 'terputus' ? '#ff4466' : '#00ff88'} strokeWidth="2.5" opacity="0.8" />
                    <line x1="40" y1="250" x2="120" y2="250" stroke={diagramState.status === 'terputus' ? '#ff4466' : '#00ff88'} strokeWidth="2.5" opacity="0.8" />
                  </g>
                  <text x="80" y="255" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">G</text>
                  <text x="80" y="320" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11">Generator</text>
                  {/* Status indicator */}
                  <circle
                    cx="80" cy="188"
                    r="6"
                    fill={diagramState.status === 'normal' ? '#00ff88' : '#ff4466'}
                    className={diagramState.alarmActive ? 'alarm-blink' : ''}
                    filter={diagramState.status === 'normal' ? 'url(#glowGreen)' : 'url(#glowRed)'}
                  />
                </g>

                {/* ===== CT (Current Transformer) - Concentric circles ===== */}
                <g
                  onClick={(e) => handleSvgClick('ct', e)}
                  className="cursor-pointer"
                >
                  {/* Outer circle */}
                  <circle cx="255" cy="185" r="26" fill="rgba(0,20,50,0.6)" stroke="#00d4ff" strokeWidth="2" filter="url(#componentGlow)" />
                  {/* Inner circle */}
                  <circle cx="255" cy="185" r="16" fill="rgba(0,10,30,0.8)" stroke="#00d4ff" strokeWidth="1.5" />
                  {/* Core symbol */}
                  <line x1="243" y1="185" x2="267" y2="185" stroke="#00d4ff" strokeWidth="1.5" opacity="0.6" />
                  <text x="255" y="189" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">CT</text>
                  <text x="255" y="228" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">CT</text>
                </g>

                {/* ===== PT (Potential Transformer) - Concentric circles ===== */}
                <g
                  onClick={(e) => handleSvgClick('pt', e)}
                  className="cursor-pointer"
                >
                  {/* Outer circle */}
                  <circle cx="255" cy="320" r="26" fill="rgba(0,20,50,0.6)" stroke="#8844ff" strokeWidth="2" filter="url(#componentGlow)" />
                  {/* Inner circle */}
                  <circle cx="255" cy="320" r="16" fill="rgba(0,10,30,0.8)" stroke="#8844ff" strokeWidth="1.5" />
                  {/* Core symbol */}
                  <line x1="243" y1="320" x2="267" y2="320" stroke="#8844ff" strokeWidth="1.5" opacity="0.6" />
                  <text x="255" y="324" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">PT</text>
                  <text x="255" y="363" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">PT</text>
                </g>

                {/* CT-PT connecting vertical line */}
                <line x1="255" y1="211" x2="255" y2="294" stroke="rgba(0,212,255,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* ===== RELAY GROUP (6 individual relays) ===== */}
                <g>
                  {/* Group label */}
                  <text x={relayX + relayBoxW / 2} y="55" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="bold">RELAY PROTEKSI</text>
                  {/* Group border (subtle) */}
                  <rect
                    x={relayX - 8} y="58"
                    width={relayBoxW + 16} height={5 * (relayBoxH + relayGap) + relayBoxH + 16}
                    rx="10" ry="10"
                    fill="none"
                    stroke="rgba(0,212,255,0.12)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />

                  {relays.map((relay, i) => {
                    const active = isRelayActive(relay.matchCodes);
                    const ry = relayStartY + i * (relayBoxH + relayGap);

                    return (
                      <g
                        key={relay.ansi}
                        onClick={(e) => handleSvgClick('relay', e)}
                        className="cursor-pointer"
                      >
                        {/* Relay box */}
                        <rect
                          x={relayX} y={ry}
                          width={relayBoxW} height={relayBoxH}
                          rx="8" ry="8"
                          fill={active ? 'rgba(255,68,102,0.18)' : 'rgba(0,20,50,0.5)'}
                          stroke={active ? '#ff4466' : 'rgba(0,212,255,0.4)'}
                          strokeWidth={active ? '2.5' : '1.5'}
                          filter={active ? 'url(#glowRed)' : 'url(#componentGlow)'}
                          className={active ? 'glow-pulse' : ''}
                        />
                        {/* Glass-like top highlight */}
                        <rect
                          x={relayX + 2} y={ry + 2}
                          width={relayBoxW - 4} height={relayBoxH / 3}
                          rx="6" ry="6"
                          fill="rgba(255,255,255,0.04)"
                        />
                        {/* Status indicator dot */}
                        <circle
                          cx={relayX + 16} cy={ry + relayBoxH / 2}
                          r="5"
                          fill={active ? '#ff4466' : diagramState.status === 'normal' ? '#00ff88' : '#00d4ff'}
                          className={active ? 'alarm-blink' : ''}
                          filter={active ? 'url(#glowRed)' : diagramState.status === 'normal' ? 'url(#glowGreen)' : 'url(#glowCyan)'}
                        />
                        {/* ANSI code */}
                        <text
                          x={relayX + 30} y={ry + relayBoxH / 2 - 4}
                          fill={active ? '#ff4466' : '#00d4ff'}
                          fontSize="13"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {relay.ansi}
                        </text>
                        {/* Relay name */}
                        <text
                          x={relayX + 30} y={ry + relayBoxH / 2 + 12}
                          fill="rgba(255,255,255,0.65)"
                          fontSize="9"
                        >
                          {relay.name}
                        </text>
                        {/* Active label */}
                        {active && (
                          <text
                            x={relayX + relayBoxW - 8} y={ry + 14}
                            textAnchor="end"
                            fill="#ff4466"
                            fontSize="7"
                            fontWeight="bold"
                            className="alarm-blink"
                          >
                            TRIP
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* ===== TRIP COIL ===== */}
                <g
                  onClick={(e) => handleSvgClick('tripcoil', e)}
                  className="cursor-pointer"
                >
                  <rect
                    x="640" y="220" width="70" height="60" rx="8"
                    fill={cbIsTrip ? 'rgba(255,68,102,0.15)' : 'rgba(0,20,50,0.6)'}
                    stroke={cbIsTrip ? '#ff4466' : '#00d4ff'}
                    strokeWidth="2"
                    filter="url(#componentGlow)"
                  />
                  {/* Coil symbol (zigzag) */}
                  <path
                    d="M655,240 L660,235 L670,245 L680,235 L690,245 L695,240"
                    fill="none"
                    stroke={cbIsTrip ? '#ff4466' : '#00d4ff'}
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                  <text x="675" y="262" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">TC</text>
                  <text x="675" y="280" textAnchor="middle" fill={cbIsTrip ? '#ff4466' : '#00d4ff'} fontSize="9">
                    {cbIsTrip ? 'AKTIF' : 'STANDBY'}
                  </text>
                  <text x="675" y="300" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Trip Coil</text>
                </g>

                {/* ===== CIRCUIT BREAKER ===== */}
                <g
                  onClick={(e) => handleSvgClick('cb', e)}
                  className="cursor-pointer"
                >
                  <rect
                    x="770" y="200" width="90" height="100" rx="8"
                    fill={cbIsTrip ? 'rgba(255,68,102,0.2)' : 'rgba(0,200,100,0.1)'}
                    stroke={cbIsTrip ? '#ff4466' : '#00ff88'}
                    strokeWidth="2.5"
                    filter="url(#componentGlow)"
                  />
                  {/* Switch symbol - closed (ON) */}
                  {diagramState.cbStatus === 'ON' ? (
                    <>
                      <circle cx="795" cy="250" r="5" fill="#00ff88" />
                      <line x1="800" y1="248" x2="835" y2="238" stroke="#00ff88" strokeWidth="3" />
                      <circle cx="835" cy="238" r="5" fill="#00ff88" />
                    </>
                  ) : (
                    <>
                      <circle cx="795" cy="250" r="5" fill="#ff4466" />
                      <line x1="800" y1="248" x2="830" y2="218" stroke="#ff4466" strokeWidth="3" />
                      <circle cx="835" cy="238" r="5" fill="#ff4466" filter="url(#glowRed)" />
                    </>
                  )}
                  <text x="815" y="280" textAnchor="middle" fill={cbIsTrip ? '#ff4466' : '#00ff88'} fontSize="14" fontWeight="bold">
                    {diagramState.cbStatus}
                  </text>
                  <text x="815" y="320" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Circuit Breaker</text>
                </g>

                {/* ===== BUSBAR ===== */}
                <g
                  onClick={(e) => handleSvgClick('busbar', e)}
                  className="cursor-pointer"
                >
                  {/* Vertical busbar */}
                  <line x1="960" y1="100" x2="960" y2="400" stroke={busbarColor} strokeWidth="6" filter={cbIsTrip ? undefined : 'url(#glowPurple)'} />
                  {/* Busbar label */}
                  <text x="960" y="430" textAnchor="middle" fill={cbIsTrip ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)'} fontSize="11" fontWeight="bold">BUSBAR</text>

                  {/* Load branches */}
                  {[{ y: 120, label: 'Beban 1' }, { y: 250, label: 'Beban 2' }, { y: 380, label: 'Beban 3' }].map((load) => (
                    <g key={load.label} opacity={loadOpacity}>
                      {/* Branch connector dot */}
                      <circle cx="960" cy={load.y} r="4" fill={loadIndicatorColor} filter={cbIsTrip ? undefined : 'url(#glowGreen)'} />
                      {/* Load box */}
                      <rect
                        x="1050" y={load.y - 16} width="100" height="32" rx="6"
                        fill={cbIsTrip ? 'rgba(60,60,60,0.3)' : 'rgba(0,200,100,0.08)'}
                        stroke={cbIsTrip ? 'rgba(100,100,100,0.4)' : 'rgba(0,255,136,0.3)'}
                        strokeWidth="1.5"
                      />
                      {/* Load indicator */}
                      <circle
                        cx="1062" cy={load.y}
                        r="4"
                        fill={loadIndicatorColor}
                        className={cbIsTrip ? '' : 'glow-pulse'}
                      />
                      <text x="1100" y={load.y + 4} textAnchor="middle" fill={cbIsTrip ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)'} fontSize="10">{load.label}</text>
                    </g>
                  ))}
                </g>

                {/* ===== ALARM INDICATOR ===== */}
                {diagramState.alarmActive && (
                  <g>
                    <circle cx={relayX + relayBoxW / 2} cy="58" r="10" fill="#ff4466" className="alarm-blink" filter="url(#glowRed)" />
                    <text x={relayX + relayBoxW / 2} y="62" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">!</text>
                  </g>
                )}

                {/* Flow direction arrows */}
                {!isFlowStopped && (
                  <g opacity="0.5">
                    <polygon points="170,245 180,250 170,255" fill={flowStroke} />
                    <polygon points="620,245 630,250 620,255" fill={diagramState.relayAktif !== '-' ? '#ff4466' : flowStroke} />
                    <polygon points="750,245 760,250 750,255" fill={cbIsTrip ? '#ff4466' : flowStroke} />
                    <polygon points="910,245 920,250 910,255" fill={cbIsTrip ? '#666' : flowStroke} opacity={cbIsTrip ? 0.4 : 1} />
                  </g>
                )}

                {/* Section labels at top */}
                <text x="80" y="20" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">GENERATOR</text>
                <text x="255" y="20" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">CT / PT</text>
                <text x="675" y="20" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">TRIP COIL</text>
                <text x="815" y="20" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">CB</text>
                <text x="960" y="20" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">BUSBAR</text>
              </svg>
              );
            })()}

            {/* Tooltip */}
            {tooltipInfo && (() => {
              const relayTooltipData: Record<string, { name: string; desc: string }> = {
                'relay-87G': { name: '87G - Differential Relay', desc: 'Memantau arus diferensial masuk/keluar stator. Karakteristik: Persentase arus (slope).' },
                'relay-50/51': { name: '50/51 - Overcurrent Relay', desc: 'Memantau arus lebih stator. Karakteristik: Waktu terbalik (IDMT) & sesaat.' },
                'relay-59/27': { name: '59/27 - Over/Undervoltage Relay', desc: 'Memantau tegangan lebih/kurang. Karakteristik: Tegangan tetap (definite).' },
                'relay-32': { name: '32 - Reverse Power Relay', desc: 'Memantau arah daya aktif. Karakteristik: Daya tetap (definite time).' },
                'relay-40': { name: '40 - Loss of Excitation Relay', desc: 'Memantau arus eksitasi & impedansi. Karakteristik: Impedansi (mho circle).' },
                'relay-51N/64G': { name: '51N/64G - Ground Fault Relay', desc: 'Memantau arus bocor tanah/tegangan netral. Karakteristik: Waktu terbalik (IDMT).' },
              };
              const key = tooltipInfo.key;
              if (key.startsWith('relay-') && relayTooltipData[key]) {
                return (
                  <div
                    className="svg-tooltip"
                    style={{
                      left: `${tooltipInfo.x}px`,
                      top: `${tooltipInfo.y - 90}px`,
                    }}
                  >
                    <div className="font-bold text-red-400 mb-1">{relayTooltipData[key].name}</div>
                    <div className="text-white/80 text-xs">{relayTooltipData[key].desc}</div>
                  </div>
                );
              }
              if (svgComponentInfo[key]) {
                return (
                  <div
                    className="svg-tooltip"
                    style={{
                      left: `${tooltipInfo.x}px`,
                      top: `${tooltipInfo.y - 80}px`,
                    }}
                  >
                    <div className="font-bold text-cyan-300 mb-1">{svgComponentInfo[key].name}</div>
                    <div className="text-white/80 text-xs">{svgComponentInfo[key].desc}</div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Dashboard Status */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Status Generator', value: diagramState.status === 'normal' ? 'NORMAL' : diagramState.status === 'gangguan' ? 'GANGGUAN' : 'TERPUTUS', color: diagramState.status === 'normal' ? 'text-green-400' : 'text-red-400', bg: diagramState.status === 'normal' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30' },
                { label: 'Status CB', value: diagramState.cbStatus, color: diagramState.cbStatus === 'ON' ? 'text-green-400' : 'text-red-400', bg: diagramState.cbStatus === 'ON' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30' },
                { label: 'Relay Aktif', value: diagramState.relayAktif, color: diagramState.relayAktif !== '-' ? 'text-red-400' : 'text-cyan-400', bg: diagramState.relayAktif !== '-' ? 'bg-red-500/10 border-red-500/30' : 'bg-cyan-500/10 border-cyan-500/30' },
                { label: 'Jenis Gangguan', value: diagramState.jenisGangguan, color: diagramState.jenisGangguan !== '-' ? 'text-yellow-400' : 'text-gray-400', bg: diagramState.jenisGangguan !== '-' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-500/10 border-gray-500/30' },
                { label: 'Aksi Sistem', value: diagramState.aksiSistem, color: getStatusColor(diagramState.statusSistem), bg: getStatusBg(diagramState.statusSistem) },
                { label: 'Status Sistem', value: diagramState.statusSistem, color: getStatusColor(diagramState.statusSistem), bg: getStatusBg(diagramState.statusSistem) },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} border rounded-xl p-3 text-center`}>
                  <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-1">{item.label}</div>
                  <div className={`text-sm sm:text-base font-bold font-mono ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================== SECTION 10: LOGIKA TRIP ====================== */}
      <section id="logika-trip" className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">Logika Trip</h2>
          <p className="section-subtitle text-center">
            Alur logika proteksi dari deteksi gangguan hingga circuit breaker trip
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trip Logic 1: Arus Lebih */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_50_51.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">I_generator</span> {'>'} <span className="string">I_setting</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">50/51</span> aktif<br />
                <span className="keyword">{'→'}</span> Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi arus lebih (overcurrent)'}</span>
              </div>
            </div>

            {/* Trip Logic 2: Daya Balik */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_32.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">arah_daya</span> {'<'} <span className="string">0</span> <span className="comment">{'// daya balik'}</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">32</span> aktif<br />
                <span className="keyword">{'→'}</span> Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi daya balik (reverse power)'}</span>
              </div>
            </div>

            {/* Trip Logic 3: Kehilangan Eksitasi */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_40.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">arus_eksitasi</span> == <span className="string">0</span> <span className="comment">{'// loss of excitation'}</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">40</span> aktif<br />
                <span className="keyword">{'→'}</span> Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi kehilangan eksitasi'}</span>
              </div>
            </div>

            {/* Trip Logic 4: Gangguan Tanah */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_51N_64G.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">arus_bocor_tanah</span> {'>'} <span className="string">I_setting</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">51N/64G</span> aktif<br />
                <span className="keyword">{'→'}</span> Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi gangguan tanah (ground fault)'}</span>
              </div>
            </div>

            {/* Trip Logic 5: Tegangan Lebih */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_59.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">V_generator</span> {'>'} <span className="string">V_setting</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">59</span> aktif<br />
                <span className="keyword">{'→'}</span> Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi tegangan lebih (overvoltage)'}</span>
              </div>
            </div>

            {/* Trip Logic 6: Frekuensi Kurang */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_81U.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">f_sistem</span> {'<'} <span className="string">f_setting</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">81U</span> aktif<br />
                <span className="keyword">{'→'}</span> Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi frekuensi kurang (underfrequency)'}</span>
              </div>
            </div>
          </div>

          {/* Summary flow */}
          <div className="mt-8 glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Alur Kerja Sistem Proteksi</h3>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              {[
                { label: 'Gangguan', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
                { label: '→', color: 'text-cyan-400' },
                { label: 'CT/PT Deteksi', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
                { label: '→', color: 'text-cyan-400' },
                { label: 'Relai Aktif', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
                { label: '→', color: 'text-cyan-400' },
                { label: 'Trip Coil', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
                { label: '→', color: 'text-cyan-400' },
                { label: 'CB Trip', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
                { label: '→', color: 'text-cyan-400' },
                { label: 'Generator Terputus', color: 'bg-gray-500/20 text-gray-400 border-gray-500/40' },
              ].map((item, i) => (
                <span
                  key={i}
                  className={`${item.color} ${item.label === '→' ? 'text-lg font-bold' : 'border rounded-lg px-3 py-1.5 font-mono'}`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================== SECTION 11: SIMULASI GANGGUAN ====================== */}
      <section id="simulasi" className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">Simulasi Gangguan</h2>
          <p className="section-subtitle text-center">
            Pilih jenis gangguan untuk melihat bagaimana sistem proteksi bekerja secara real-time
          </p>

          {/* Fault Selection Buttons */}
          <div className="glass-card p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Pilih Gangguan</h3>
              <button
                onClick={resetSimulation}
                className="glow-btn-green text-sm px-4 py-2 rounded-lg"
              >
                ↻ Reset Simulasi
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {faultsData.map((fault) => (
                <button
                  key={fault.id}
                  onClick={() => selectFault(fault.id)}
                  className={`
                    relative text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border
                    ${selectedFault === fault.id
                      ? fault.severity === 'critical'
                        ? 'bg-red-500/20 border-red-500/60 text-red-300 shadow-lg shadow-red-500/20'
                        : fault.severity === 'warning'
                        ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300 shadow-lg shadow-yellow-500/20'
                        : 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <span className="mr-1">{fault.icon}</span>
                  <span className="text-xs sm:text-sm">{fault.name}</span>
                  <div className="mt-1">
                    <span className="badge-ansi text-[10px]">{fault.ansiCode}</span>
                  </div>
                  {selectedFault === fault.id && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Phase Indicator */}
          {selectedFault && (
            <div className="glass-card p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Fase Simulasi</h3>
                <span className="text-xs font-mono text-cyan-400">
                  {simulationPhase === 1 && 'FASE 1: Deteksi Gangguan'}
                  {simulationPhase === 2 && 'FASE 2: Relay Aktif'}
                  {simulationPhase === 3 && 'FASE 3: CB Trip'}
                  {simulationPhase === 4 && 'FASE 4: Generator Terputus'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Normal', phase: 0, color: 'bg-green-500' },
                  { label: 'Gangguan', phase: 1, color: 'bg-red-500' },
                  { label: 'Relay', phase: 2, color: 'bg-yellow-500' },
                  { label: 'CB Trip', phase: 3, color: 'bg-orange-500' },
                  { label: 'Terputus', phase: 4, color: 'bg-gray-500' },
                ].map((step) => (
                  <div key={step.label} className="flex-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        simulationPhase >= step.phase ? step.color : 'bg-white/10'
                      } ${simulationPhase === step.phase ? 'animate-pulse' : ''}`}
                    />
                    <div className={`text-[10px] mt-1 text-center ${
                      simulationPhase >= step.phase ? 'text-white/70' : 'text-white/30'
                    }`}>
                      {step.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simulation Results */}
          {selectedFaultData && simulationPhase === 4 && (
            <div className="glass-card p-4 sm:p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{selectedFaultData.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedFaultData.name}</h3>
                  <span className="badge-ansi">{selectedFaultData.ansiCode}</span>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedFaultData.severity === 'critical'
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : selectedFaultData.severity === 'warning'
                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                }`}>
                  {selectedFaultData.severity === 'critical' ? 'KRITIS' : selectedFaultData.severity === 'warning' ? 'PERINGATAN' : 'INFO'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Penyebab */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-cyan-400 text-lg">⚡</span>
                    <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">Penyebab</h4>
                  </div>
                  <p className="text-white/80 text-sm">{selectedFaultData.cause}</p>
                </div>

                {/* Dampak */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-400 text-lg">💥</span>
                    <h4 className="text-sm font-bold text-red-300 uppercase tracking-wider">Dampak</h4>
                  </div>
                  <p className="text-white/80 text-sm">{selectedFaultData.impact}</p>
                </div>

                {/* Relay Aktif */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400 text-lg">🔧</span>
                    <h4 className="text-sm font-bold text-yellow-300 uppercase tracking-wider">Relay Aktif</h4>
                  </div>
                  <p className="text-white/80 text-sm">{selectedFaultData.protection}</p>
                  <span className="badge-ansi mt-2 inline-block">{selectedFaultData.ansiCode}</span>
                </div>

                {/* Aksi Proteksi */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-400 text-lg">🛡️</span>
                    <h4 className="text-sm font-bold text-orange-300 uppercase tracking-wider">Aksi Proteksi</h4>
                  </div>
                  <p className="text-white/80 text-sm">{selectedFaultData.action}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-white/50">Status CB:</span>
                    <span className="text-xs font-bold text-red-400 font-mono">{selectedFaultData.cbStatus}</span>
                  </div>
                </div>
              </div>

              {/* Conclusion */}
              <div className="mt-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 text-lg">✅</span>
                  <h4 className="text-sm font-bold text-green-300 uppercase tracking-wider">Kesimpulan</h4>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">{selectedFaultData.conclusion}</p>
              </div>
            </div>
          )}

          {/* All Faults Quick Reference Table */}
          {!selectedFault && (
            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-lg font-bold text-white mb-4">Referensi Cepat Gangguan</h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="table-glass">
                  <thead>
                    <tr>
                      <th>Gangguan</th>
                      <th>Kode ANSI</th>
                      <th>Relay</th>
                      <th>Aksi</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faultsData.map((fault) => (
                      <tr
                        key={fault.id}
                        onClick={() => selectFault(fault.id)}
                        className="cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <td>
                          <span className="mr-2">{fault.icon}</span>
                          <span>{fault.name}</span>
                        </td>
                        <td><span className="badge-ansi">{fault.ansiCode}</span></td>
                        <td className="text-white/70 text-xs">{fault.protection}</td>
                        <td className="text-white/70 text-xs">{fault.action}</td>
                        <td>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            fault.severity === 'critical'
                              ? 'bg-red-500/20 border-red-500/30 text-red-400'
                              : fault.severity === 'warning'
                              ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                              : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                          }`}>
                            {fault.severity === 'critical' ? 'Kritis' : fault.severity === 'warning' ? 'Peringatan' : 'Info'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
