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

            <svg
              viewBox="0 0 1100 320"
              className="w-full h-auto"
              style={{ maxHeight: '400px' }}
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
              </defs>

              {/* Background grid */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,200,255,0.05)" strokeWidth="0.5" />
              </pattern>
              <rect width="1100" height="320" fill="url(#grid)" />

              {/* ===== CONNECTION LINES ===== */}
              {/* Generator to CT */}
              <line
                x1="130" y1="160" x2="200" y2="160"
                stroke={flowStroke}
                strokeWidth="3"
                strokeDasharray="8 6"
                className={isFlowStopped ? '' : 'electricity-flow'}
                style={isFlowStopped ? { opacity: 0.3 } : undefined}
                filter={isFlowStopped ? undefined : `url(#glow${diagramState.flowColor === 'red' ? 'Red' : 'Cyan'})`}
              />

              {/* CT to PT branch */}
              <line
                x1="270" y1="160" x2="340" y2="160"
                stroke={flowStroke}
                strokeWidth="3"
                strokeDasharray="8 6"
                className={isFlowStopped ? '' : 'electricity-flow'}
                style={isFlowStopped ? { opacity: 0.3 } : undefined}
                filter={isFlowStopped ? undefined : `url(#glow${diagramState.flowColor === 'red' ? 'Red' : 'Cyan'})`}
              />

              {/* PT branch up */}
              <line
                x1="305" y1="130" x2="305" y2="80"
                stroke="#00d4ff"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="electricity-flow"
                opacity="0.5"
              />

              {/* PT to Relay */}
              <line
                x1="305" y1="80" x2="500" y2="80"
                stroke="#00d4ff"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="electricity-flow"
                opacity="0.5"
              />
              <line
                x1="500" y1="80" x2="500" y2="120"
                stroke="#00d4ff"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="electricity-flow"
                opacity="0.5"
              />

              {/* Main line to Relay */}
              <line
                x1="340" y1="160" x2="460" y2="160"
                stroke={flowStroke}
                strokeWidth="3"
                strokeDasharray="8 6"
                className={isFlowStopped ? '' : 'electricity-flow'}
                style={isFlowStopped ? { opacity: 0.3 } : undefined}
                filter={isFlowStopped ? undefined : `url(#glow${diagramState.flowColor === 'red' ? 'Red' : 'Cyan'})`}
              />

              {/* Relay to Trip Coil */}
              <line
                x1="560" y1="160" x2="640" y2="160"
                stroke={diagramState.cbStatus === 'TRIP' ? '#ff4466' : '#00d4ff'}
                strokeWidth="3"
                strokeDasharray="8 6"
                className={diagramState.cbStatus === 'TRIP' ? 'electricity-flow' : isFlowStopped ? '' : 'electricity-flow'}
                style={isFlowStopped && diagramState.cbStatus !== 'TRIP' ? { opacity: 0.3 } : undefined}
                filter={diagramState.cbStatus === 'TRIP' ? 'url(#glowRed)' : isFlowStopped ? undefined : 'url(#glowCyan)'}
              />

              {/* Trip Coil to CB */}
              <line
                x1="710" y1="160" x2="790" y2="160"
                stroke={diagramState.cbStatus === 'TRIP' ? '#ff4466' : flowStroke}
                strokeWidth="3"
                strokeDasharray="8 6"
                className={isFlowStopped ? '' : 'electricity-flow'}
                style={isFlowStopped ? { opacity: 0.3 } : undefined}
                filter={`url(#glow${diagramState.cbStatus === 'TRIP' ? 'Red' : diagramState.flowColor === 'red' ? 'Red' : 'Cyan'})`}
              />

              {/* CB to Busbar */}
              <line
                x1="870" y1="160" x2="960" y2="160"
                stroke={diagramState.cbStatus === 'TRIP' ? 'rgba(100,100,100,0.4)' : flowStroke}
                strokeWidth="3"
                strokeDasharray="8 6"
                className={diagramState.cbStatus === 'TRIP' ? '' : isFlowStopped ? '' : 'electricity-flow'}
                style={{ opacity: diagramState.cbStatus === 'TRIP' ? 0.3 : isFlowStopped ? 0.3 : 1 }}
                filter={diagramState.cbStatus === 'TRIP' || isFlowStopped ? undefined : `url(#glow${diagramState.flowColor === 'red' ? 'Red' : 'Cyan'})`}
              />

              {/* ===== GENERATOR ===== */}
              <g
                onClick={(e) => handleSvgClick('generator', e)}
                className="cursor-pointer"
              >
                <circle
                  cx="80" cy="160" r="50"
                  fill="rgba(0,20,50,0.6)"
                  stroke={diagramState.status === 'terputus' ? '#ff4466' : '#00d4ff'}
                  strokeWidth="2.5"
                  filter="url(#componentGlow)"
                />
                {/* Rotor indicator */}
                <g transform={`rotate(${rotorAngle}, 80, 160)`}>
                  <line x1="80" y1="125" x2="80" y2="195" stroke={diagramState.status === 'terputus' ? '#ff4466' : '#00ff88'} strokeWidth="2" opacity="0.8" />
                  <line x1="45" y1="160" x2="115" y2="160" stroke={diagramState.status === 'terputus' ? '#ff4466' : '#00ff88'} strokeWidth="2" opacity="0.8" />
                </g>
                <text x="80" y="165" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">G</text>
                <text x="80" y="225" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11">Generator</text>
                {/* Status indicator */}
                <circle
                  cx="80" cy="110"
                  r="6"
                  fill={diagramState.status === 'normal' ? '#00ff88' : '#ff4466'}
                  className={diagramState.alarmActive ? 'alarm-blink' : ''}
                  filter={diagramState.status === 'normal' ? 'url(#glowGreen)' : 'url(#glowRed)'}
                />
              </g>

              {/* ===== CT ===== */}
              <g
                onClick={(e) => handleSvgClick('ct', e)}
                className="cursor-pointer"
              >
                <circle cx="235" cy="140" r="18" fill="rgba(0,20,50,0.6)" stroke="#00d4ff" strokeWidth="2" filter="url(#componentGlow)" />
                <circle cx="235" cy="180" r="18" fill="rgba(0,20,50,0.6)" stroke="#00d4ff" strokeWidth="2" filter="url(#componentGlow)" />
                <text x="235" y="144" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">CT</text>
                <text x="235" y="184" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">CT</text>
                <text x="235" y="218" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">CT</text>
              </g>

              {/* ===== PT ===== */}
              <g
                onClick={(e) => handleSvgClick('pt', e)}
                className="cursor-pointer"
              >
                <circle cx="305" cy="55" r="14" fill="rgba(0,20,50,0.6)" stroke="#8844ff" strokeWidth="2" filter="url(#componentGlow)" />
                <circle cx="305" cy="35" r="14" fill="rgba(0,20,50,0.6)" stroke="#8844ff" strokeWidth="2" filter="url(#componentGlow)" />
                <text x="305" y="59" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">PT</text>
                <text x="305" y="39" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">PT</text>
                <text x="305" y="15" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">PT</text>
              </g>

              {/* ===== RELAY ===== */}
              <g
                onClick={(e) => handleSvgClick('relay', e)}
                className="cursor-pointer"
              >
                <rect
                  x="460" y="120" width="100" height="80" rx="8"
                  fill={diagramState.relayAktif !== '-' ? 'rgba(255,68,102,0.15)' : 'rgba(0,20,50,0.6)'}
                  stroke={diagramState.relayAktif !== '-' ? '#ff4466' : '#00d4ff'}
                  strokeWidth="2.5"
                  filter="url(#componentGlow)"
                  className={diagramState.relayAktif !== '-' ? 'glow-pulse' : ''}
                />
                <text x="510" y="152" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">RELAY</text>
                <text x="510" y="172" textAnchor="middle" fill={diagramState.relayAktif !== '-' ? '#ff4466' : '#00d4ff'} fontSize="11" fontWeight="bold">
                  {diagramState.relayAktif !== '-' ? diagramState.relayAktif : 'STANDBY'}
                </text>
                <text x="510" y="218" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Relay Proteksi</text>
                {/* Active relay indicator */}
                {diagramState.relayAktif !== '-' && (
                  <circle cx="550" cy="130" r="5" fill="#ff4466" className="alarm-blink" />
                )}
              </g>

              {/* ===== TRIP COIL ===== */}
              <g
                onClick={(e) => handleSvgClick('tripcoil', e)}
                className="cursor-pointer"
              >
                <rect
                  x="640" y="130" width="70" height="60" rx="6"
                  fill={diagramState.cbStatus === 'TRIP' ? 'rgba(255,68,102,0.15)' : 'rgba(0,20,50,0.6)'}
                  stroke={diagramState.cbStatus === 'TRIP' ? '#ff4466' : '#00d4ff'}
                  strokeWidth="2"
                  filter="url(#componentGlow)"
                />
                <text x="675" y="157" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">TC</text>
                <text x="675" y="175" textAnchor="middle" fill={diagramState.cbStatus === 'TRIP' ? '#ff4466' : '#00d4ff'} fontSize="9">
                  {diagramState.cbStatus === 'TRIP' ? 'AKTIF' : 'STANDBY'}
                </text>
                <text x="675" y="210" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Trip Coil</text>
              </g>

              {/* ===== CIRCUIT BREAKER ===== */}
              <g
                onClick={(e) => handleSvgClick('cb', e)}
                className="cursor-pointer"
              >
                <rect
                  x="790" y="110" width="80" height="100" rx="8"
                  fill={diagramState.cbStatus === 'TRIP' ? 'rgba(255,68,102,0.2)' : 'rgba(0,200,100,0.1)'}
                  stroke={diagramState.cbStatus === 'TRIP' ? '#ff4466' : '#00ff88'}
                  strokeWidth="2.5"
                  filter="url(#componentGlow)"
                />
                {/* Switch symbol */}
                {diagramState.cbStatus === 'ON' ? (
                  <line x1="810" y1="160" x2="850" y2="140" stroke="#00ff88" strokeWidth="3" />
                ) : (
                  <>
                    <line x1="810" y1="160" x2="840" y2="125" stroke="#ff4466" strokeWidth="3" />
                    <circle cx="850" cy="140" r="4" fill="#ff4466" />
                  </>
                )}
                <circle cx="810" cy="160" r="5" fill={diagramState.cbStatus === 'ON' ? '#00ff88' : '#ff4466'} />
                <text x="830" y="185" textAnchor="middle" fill={diagramState.cbStatus === 'ON' ? '#00ff88' : '#ff4466'} fontSize="14" fontWeight="bold">
                  {diagramState.cbStatus}
                </text>
                <text x="830" y="230" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Circuit Breaker</text>
              </g>

              {/* ===== BUSBAR ===== */}
              <g
                onClick={(e) => handleSvgClick('busbar', e)}
                className="cursor-pointer"
              >
                <line x1="960" y1="110" x2="960" y2="210" stroke="#8844ff" strokeWidth="5" filter="url(#componentGlow)" />
                <line x1="960" y1="110" x2="1070" y2="110" stroke="#8844ff" strokeWidth="3" />
                <line x1="960" y1="160" x2="1070" y2="160" stroke="#8844ff" strokeWidth="3" />
                <line x1="960" y1="210" x2="1070" y2="210" stroke="#8844ff" strokeWidth="3" />
                <text x="1030" y="105" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Beban 1</text>
                <text x="1030" y="155" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Beban 2</text>
                <text x="1030" y="205" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Beban 3</text>
                <text x="960" y="245" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11" fontWeight="bold">BUSBAR</text>
              </g>

              {/* ===== ALARM INDICATOR ===== */}
              {diagramState.alarmActive && (
                <g>
                  <circle cx="510" cy="105" r="8" fill="#ff4466" className="alarm-blink" filter="url(#glowRed)" />
                  <text x="510" y="109" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">!</text>
                </g>
              )}

              {/* Flow direction arrows */}
              {!isFlowStopped && (
                <g opacity="0.5">
                  <polygon points="170,155 180,160 170,165" fill={flowStroke} />
                  <polygon points="310,155 320,160 310,165" fill={flowStroke} />
                  <polygon points="440,155 450,160 440,165" fill={flowStroke} />
                  <polygon points="620,155 630,160 620,165" fill={flowStroke} />
                  <polygon points="770,155 780,160 770,165" fill={flowStroke} />
                </g>
              )}
            </svg>

            {/* Tooltip */}
            {tooltipInfo && svgComponentInfo[tooltipInfo.key] && (
              <div
                className="svg-tooltip"
                style={{
                  left: `${tooltipInfo.x}px`,
                  top: `${tooltipInfo.y - 80}px`,
                }}
              >
                <div className="font-bold text-cyan-300 mb-1">{svgComponentInfo[tooltipInfo.key].name}</div>
                <div className="text-white/80 text-xs">{svgComponentInfo[tooltipInfo.key].desc}</div>
              </div>
            )}

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
