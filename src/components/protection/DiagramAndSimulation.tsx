'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  faultsData,
  relayDetails,
  faultSimulations,
  normalParameters,
  type EventLogEntry,
} from '@/data/protection-data';

/* ─── Diagram State ─── */
interface DiagramState {
  status: 'normal' | 'gangguan' | 'terputus';
  cbStatus: 'ON' | 'TRIP';
  relayAktif: string[];
  jenisGangguan: string;
  aksiSistem: string;
  statusSistem: string;
  flowColor: 'green' | 'red';
  alarmActive: boolean;
}

const defaultDiagramState: DiagramState = {
  status: 'normal',
  cbStatus: 'ON',
  relayAktif: [],
  jenisGangguan: '-',
  aksiSistem: 'Monitoring',
  statusSistem: 'Aman',
  flowColor: 'green',
  alarmActive: false,
};

/* ─── SVG component info for tooltips ─── */
const svgComponentInfo: Record<string, { name: string; desc: string }> = {
  generator: {
    name: 'Generator Sinkron',
    desc: 'Mengubah energi mekanik menjadi energi listrik AC. Komponen utama yang diproteksi.',
  },
  ct: {
    name: 'CT - Current Transformer',
    desc: 'Arus primer: 400A → Sekunder: 5A. Menurunkan arus besar untuk dibaca relay proteksi.',
  },
  pt: {
    name: 'PT - Potential Transformer',
    desc: 'Tegangan primer: 11.5kV → Sekunder: 110V. Menurunkan tegangan tinggi untuk relay.',
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

/* ─── Monitoring Data ─── */
interface MonitoringData {
  voltageR: number;
  voltageS: number;
  voltageT: number;
  current: number;
  frequency: number;
  activePower: number;
  reactivePower: number;
  powerFactor: number;
  load1: boolean;
  load2: boolean;
  load3: boolean;
}

const defaultMonitoring: MonitoringData = {
  voltageR: normalParameters.voltageR,
  voltageS: normalParameters.voltageS,
  voltageT: normalParameters.voltageT,
  current: normalParameters.current,
  frequency: normalParameters.frequency,
  activePower: normalParameters.activePower,
  reactivePower: normalParameters.reactivePower,
  powerFactor: normalParameters.powerFactor,
  load1: true,
  load2: true,
  load3: true,
};

/* ─── Audio helpers ─── */
function playRelayClick() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch { /* ignore */ }
}

function playTripSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* ignore */ }
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch { /* ignore */ }
}

/* ─── Main Component ─── */
export default function DiagramAndSimulation() {
  const [diagramState, setDiagramState] = useState<DiagramState>(defaultDiagramState);
  const [selectedFault, setSelectedFault] = useState<string | null>(null);
  const [simulationPhase, setSimulationPhase] = useState(0);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [monitoringData, setMonitoringData] = useState<MonitoringData>(defaultMonitoring);
  const [audioMuted, setAudioMuted] = useState(true);
  const [hoveredRelay, setHoveredRelay] = useState<string | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [rotorAngle, setRotorAngle] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const eventLogRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll event log
  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
    }
  }, [eventLog]);

  // Add event helper
  const addEvent = useCallback((event: string, type: EventLogEntry['type']) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    setEventLog((prev) => [...prev, { timestamp: ts, event, type }]);
  }, []);

  // Select a fault simulation
  const selectFault = useCallback((faultSimId: string) => {
    clearAllTimers();

    // Reset state first
    setDiagramState(defaultDiagramState);
    setSimulationPhase(0);
    setSelectedFault(null);
    setMonitoringData(defaultMonitoring);
    setEventLog([]);

    const sim = faultSimulations.find((s) => s.faultId === faultSimId);
    if (!sim) return;

    // Start simulation
    const t0 = setTimeout(() => {
      setSelectedFault(faultSimId);
      setSimulationPhase(1);

      // Play notification sound
      if (!audioMuted) playNotificationSound();

      // Phase 1: Fault detected
      addEvent(`Gangguan terdeteksi: ${sim.name}`, 'fault');
      setDiagramState((prev) => ({
        ...prev,
        status: 'gangguan',
        flowColor: 'red',
        alarmActive: true,
        jenisGangguan: sim.name,
        statusSistem: 'Warning',
        aksiSistem: 'Alarm',
      }));

      // Update monitoring with fault values
      setMonitoringData((prev) => ({
        ...prev,
        voltageR: sim.affectedVoltages.R,
        voltageS: sim.affectedVoltages.S,
        voltageT: sim.affectedVoltages.T,
        current: sim.affectedCurrent,
        frequency: sim.affectedFrequency,
        activePower: sim.affectedPower,
        powerFactor: sim.affectedPowerFactor,
        reactivePower: sim.affectedReactive,
      }));

      // Phase 2: After 1.2s - Relay activates
      const t1 = setTimeout(() => {
        setSimulationPhase(2);
        if (!audioMuted) playRelayClick();
        addEvent(`Relay ${sim.affectedRelayAnsi.join(', ')} aktif`, 'warning');

        setDiagramState((prev) => ({
          ...prev,
          relayAktif: sim.affectedRelayAnsi,
          statusSistem: 'Gangguan',
          aksiSistem: 'Proteksi Aktif',
        }));

        // Phase 3: After 2.4s - CB trips
        const t2 = setTimeout(() => {
          setSimulationPhase(3);
          if (!audioMuted) playTripSound();
          addEvent('Sinyal trip dikirim — Circuit Breaker TRIP', 'trip');

          setDiagramState((prev) => ({
            ...prev,
            cbStatus: 'TRIP',
          }));

          // Update load status
          setMonitoringData((prev) => ({
            ...prev,
            load1: sim.loadStatus[0],
            load2: sim.loadStatus[1],
            load3: sim.loadStatus[2],
          }));

          // Phase 4: After 3.6s - Generator disconnected
          const t3 = setTimeout(() => {
            setSimulationPhase(4);
            addEvent('Generator terputus dari sistem — AMAN', 'safe');

            setDiagramState((prev) => ({
              ...prev,
              status: 'terputus',
              flowColor: 'green',
              alarmActive: false,
              aksiSistem: 'Generator Terputus',
              statusSistem: 'Aman',
            }));
          }, 1200);
          timersRef.current.push(t3);
        }, 1200);
        timersRef.current.push(t2);
      }, 1200);
      timersRef.current.push(t1);
    }, 100);
    timersRef.current.push(t0);
  }, [clearAllTimers, audioMuted, addEvent]);

  const resetSimulation = useCallback(() => {
    clearAllTimers();
    setSelectedFault(null);
    setSimulationPhase(0);
    setDiagramState(defaultDiagramState);
    setMonitoringData(defaultMonitoring);
    setEventLog([]);
    addEvent('Simulasi direset — Sistem kembali normal', 'info');
  }, [clearAllTimers, addEvent]);

  // CSV Export
  const exportEventLog = useCallback(() => {
    const headers = 'Timestamp,Event,Type\n';
    const rows = eventLog.map((e) => `"${e.timestamp}","${e.event}","${e.type}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [eventLog]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aman': return 'text-green-400';
      case 'Warning': return 'text-yellow-400';
      case 'Gangguan': return 'text-red-400';
      case 'Proteksi Aktif': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Aman': return 'bg-green-500/20 border-green-500/40';
      case 'Warning': return 'bg-yellow-500/20 border-yellow-500/40';
      case 'Gangguan': return 'bg-red-500/20 border-red-500/40';
      case 'Proteksi Aktif': return 'bg-cyan-500/20 border-cyan-500/40';
      default: return 'bg-gray-500/20 border-gray-500/40';
    }
  };

  const isRelayActive = (ansi: string) => {
    return diagramState.relayAktif.some((active) => active === ansi || ansi.includes(active) || active.includes(ansi));
  };

  const cbIsTrip = diagramState.cbStatus === 'TRIP';
  const flowStroke = diagramState.flowColor === 'red' ? '#ff4466' : '#00ff88';
  const isFlowStopped = diagramState.status === 'terputus';

  // Relay layout: 3 rows x 3 cols
  const relayBoxW = 110;
  const relayBoxH = 48;
  const relayGapX = 12;
  const relayGapY = 10;
  const relayStartX = 380;
  const relayStartY = 100;

  const getRelayPos = (idx: number) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    return {
      x: relayStartX + col * (relayBoxW + relayGapX),
      y: relayStartY + row * (relayBoxH + relayGapY),
    };
  };

  // Monitoring value color
  const monColor = (value: number, normal: number, threshold: number) => {
    if (simulationPhase === 0 || simulationPhase === 4) return 'text-green-400';
    const diff = Math.abs(value - normal) / normal;
    if (diff > threshold) return 'text-red-400';
    if (diff > threshold * 0.5) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Event type styling
  const eventStyle = (type: EventLogEntry['type']) => {
    switch (type) {
      case 'info': return 'border-l-cyan-400 text-cyan-300';
      case 'warning': return 'border-l-yellow-400 text-yellow-300';
      case 'fault': return 'border-l-red-400 text-red-300';
      case 'trip': return 'border-l-orange-400 text-orange-300';
      case 'safe': return 'border-l-green-400 text-green-300';
      default: return 'border-l-gray-400 text-gray-300';
    }
  };

  // Hover tooltip for relay
  const handleRelayMouseEnter = (ansi: string, e: React.MouseEvent<SVGGElement>) => {
    setHoveredRelay(ansi);
    const svgRect = (e.currentTarget.closest('svg') as SVGSVGElement)?.getBoundingClientRect();
    if (svgRect) {
      setTooltipPos({
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top,
      });
    }
  };

  const handleRelayMouseLeave = () => {
    setHoveredRelay(null);
    setTooltipPos(null);
  };

  const handleComponentHover = (key: string, e: React.MouseEvent<SVGGElement>) => {
    setHoveredComponent(key);
    const svgRect = (e.currentTarget.closest('svg') as SVGSVGElement)?.getBoundingClientRect();
    if (svgRect) {
      setTooltipPos({
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top,
      });
    }
  };

  const handleComponentLeave = () => {
    setHoveredComponent(null);
    setTooltipPos(null);
  };

  const selectedSim = faultSimulations.find((s) => s.faultId === selectedFault);

  return (
    <>
      {/* ====================== SECTION 9: DIAGRAM PROTEKSI INTERAKTIF ====================== */}
      <section id="diagram-proteksi" className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">Diagram Proteksi Interaktif</h2>
          <p className="section-subtitle text-center">
            Hover pada relay untuk detail. Klik relay untuk melihat yang aktif saat gangguan. Simulasi gangguan akan mengubah state diagram.
          </p>

          {/* SVG Single-Line Diagram */}
          <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${diagramState.alarmActive ? 'bg-red-500 alarm-blink' : diagramState.status === 'normal' ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-sm text-white/70 font-mono">
                {diagramState.status === 'normal' ? 'SISTEM NORMAL' : diagramState.status === 'gangguan' ? 'GANGGUAN TERDETEKSI' : 'GENERATOR TERPUTUS'}
              </span>
            </div>

            <svg
              viewBox="0 0 1200 600"
              className="w-full h-auto"
              style={{ maxHeight: '560px' }}
            >
              <defs>
                <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feFlood floodColor="#00d4ff" floodOpacity="0.6" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feFlood floodColor="#ff4466" floodOpacity="0.6" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feFlood floodColor="#00ff88" floodOpacity="0.5" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="componentGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feFlood floodColor="#00d4ff" floodOpacity="0.15" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glowPurple" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feFlood floodColor="#8844ff" floodOpacity="0.5" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Background grid */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,200,255,0.05)" strokeWidth="0.5" />
              </pattern>
              <rect width="1200" height="600" fill="url(#grid)" />

              {/* ===== COLOR LEGEND ===== */}
              <g transform="translate(20, 560)">
                <line x1="0" y1="8" x2="30" y2="8" stroke="#00ff88" strokeWidth="3" />
                <text x="35" y="12" fill="rgba(255,255,255,0.5)" fontSize="9">Power Flow</text>
                <line x1="120" y1="8" x2="150" y2="8" stroke="#ffaa00" strokeWidth="2" strokeDasharray="4 3" />
                <text x="155" y="12" fill="rgba(255,255,255,0.5)" fontSize="9">Signal (CT/PT)</text>
                <line x1="280" y1="8" x2="310" y2="8" stroke="#00d4ff" strokeWidth="2" strokeDasharray="6 4" />
                <text x="315" y="12" fill="rgba(255,255,255,0.5)" fontSize="9">Trip Signal</text>
                <line x1="420" y1="8" x2="450" y2="8" stroke="#ff4466" strokeWidth="3" />
                <text x="455" y="12" fill="rgba(255,255,255,0.5)" fontSize="9">Fault</text>
              </g>

              {/* ===== CONNECTION LINES ===== */}

              {/* Generator → CT/PT: main power line (green=normal, red=fault) */}
              <line
                x1="130" y1="300" x2="195" y2="300"
                stroke={flowStroke}
                strokeWidth="3.5"
                strokeDasharray="10 6"
                className={isFlowStopped ? '' : 'electricity-flow'}
                style={isFlowStopped ? { opacity: 0.3 } : undefined}
                filter={isFlowStopped ? undefined : `url(#glow${diagramState.flowColor === 'red' ? 'Red' : 'Green'})`}
              />

              {/* CT/PT → Relay Group: CT signal lines (orange) */}
              {/* CT vertical bus */}
              <line x1="290" y1="220" x2="290" y2="400" stroke="#ffaa00" strokeWidth="1.5" strokeDasharray="4 4" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.2 : 0.5} />
              {/* CT signal horizontal taps to relays */}
              {relayDetails.filter(r => r.ctInput).map((relay, i) => {
                const pos = getRelayPos(relayDetails.indexOf(relay));
                const midY = pos.y + relayBoxH / 2;
                return (
                  <line key={`ct-sig-${relay.ansi}`}
                    x1="290" y1={midY} x2={pos.x} y2={midY}
                    stroke="#ffaa00" strokeWidth="1" strokeDasharray="3 3"
                    className={isFlowStopped ? '' : 'electricity-flow'}
                    opacity={isFlowStopped ? 0.2 : 0.4}
                  />
                );
              })}

              {/* PT vertical bus */}
              <line x1="310" y1="340" x2="310" y2="400" stroke="#ffaa00" strokeWidth="1.5" strokeDasharray="4 4" className={isFlowStopped ? '' : 'electricity-flow'} opacity={isFlowStopped ? 0.2 : 0.4} />
              {/* PT signal horizontal taps to relays */}
              {relayDetails.filter(r => r.ptInput).map((relay) => {
                const pos = getRelayPos(relayDetails.indexOf(relay));
                const midY = pos.y + relayBoxH / 2;
                return (
                  <line key={`pt-sig-${relay.ansi}`}
                    x1="310" y1={midY} x2={pos.x} y2={midY}
                    stroke="#9966ff" strokeWidth="1" strokeDasharray="3 3"
                    className={isFlowStopped ? '' : 'electricity-flow'}
                    opacity={isFlowStopped ? 0.2 : 0.35}
                  />
                );
              })}

              {/* Active Relay → Trip Coil: trip signal line (blue) */}
              <line
                x1={relayStartX + 3 * (relayBoxW + relayGapX) - relayGapX + 10} y1="300" x2="740" y2="300"
                stroke={diagramState.relayAktif.length > 0 ? '#00d4ff' : 'rgba(0,212,255,0.3)'}
                strokeWidth={diagramState.relayAktif.length > 0 ? '3' : '1.5'}
                strokeDasharray="8 6"
                className={diagramState.relayAktif.length > 0 ? 'electricity-flow' : isFlowStopped ? '' : 'electricity-flow'}
                style={isFlowStopped && diagramState.relayAktif.length === 0 ? { opacity: 0.2 } : undefined}
                filter={diagramState.relayAktif.length > 0 ? 'url(#glowCyan)' : undefined}
              />

              {/* Trip Coil → CB: mechanical connection */}
              <line
                x1="810" y1="300" x2="870" y2="300"
                stroke={cbIsTrip ? '#ff4466' : flowStroke}
                strokeWidth="3"
                strokeDasharray="8 6"
                className={isFlowStopped ? '' : 'electricity-flow'}
                style={isFlowStopped ? { opacity: 0.3 } : undefined}
                filter={`url(#glow${cbIsTrip ? 'Red' : diagramState.flowColor === 'red' ? 'Red' : 'Green'})`}
              />

              {/* CB → Busbar: power line */}
              <line
                x1="960" y1="300" x2="1030" y2="300"
                stroke={cbIsTrip ? 'rgba(100,100,100,0.4)' : flowStroke}
                strokeWidth="3.5"
                strokeDasharray="8 6"
                className={cbIsTrip ? '' : isFlowStopped ? '' : 'electricity-flow'}
                style={{ opacity: cbIsTrip ? 0.3 : isFlowStopped ? 0.3 : 1 }}
                filter={cbIsTrip || isFlowStopped ? undefined : `url(#glow${diagramState.flowColor === 'red' ? 'Red' : 'Green'})`}
              />

              {/* Busbar → Load branches */}
              {[170, 300, 430].map((y, i) => (
                <line
                  key={`load-line-${i}`}
                  x1="1050" y1={y} x2="1150" y2={y}
                  stroke={cbIsTrip ? 'rgba(100,100,100,0.4)' : '#8844ff'}
                  strokeWidth="2.5"
                  strokeDasharray={cbIsTrip ? '4 6' : '6 4'}
                  className={cbIsTrip ? '' : 'electricity-flow'}
                  opacity={cbIsTrip ? 0.3 : 1}
                />
              ))}

              {/* ===== GENERATOR ===== */}
              <g
                onMouseEnter={(e) => handleComponentHover('generator', e)}
                onMouseLeave={handleComponentLeave}
                className="cursor-pointer"
              >
                <circle
                  cx="80" cy="300" r="55"
                  fill="rgba(0,20,50,0.6)"
                  stroke={diagramState.status === 'terputus' ? '#ff4466' : '#00d4ff'}
                  strokeWidth="2.5"
                  filter="url(#componentGlow)"
                />
                <circle cx="80" cy="300" r="62" fill="none" stroke={diagramState.status === 'terputus' ? 'rgba(255,68,102,0.2)' : 'rgba(0,212,255,0.2)'} strokeWidth="1" strokeDasharray="4 4" />
                {/* Rotor indicator */}
                <g transform={`rotate(${rotorAngle}, 80, 300)`}>
                  <line x1="80" y1="260" x2="80" y2="340" stroke={diagramState.status === 'terputus' ? '#ff4466' : '#00ff88'} strokeWidth="2.5" opacity="0.8" />
                  <line x1="40" y1="300" x2="120" y2="300" stroke={diagramState.status === 'terputus' ? '#ff4466' : '#00ff88'} strokeWidth="2.5" opacity="0.8" />
                </g>
                <text x="80" y="305" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">G</text>
                <text x="80" y="370" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11">Generator</text>
                {/* Status indicator */}
                <circle
                  cx="80" cy="238" r="6"
                  fill={diagramState.status === 'normal' ? '#00ff88' : '#ff4466'}
                  className={diagramState.alarmActive ? 'alarm-blink' : ''}
                  filter={diagramState.status === 'normal' ? 'url(#glowGreen)' : 'url(#glowRed)'}
                />
              </g>

              {/* ===== CT (Current Transformer) ===== */}
              <g
                onMouseEnter={(e) => handleComponentHover('ct', e)}
                onMouseLeave={handleComponentLeave}
                className="cursor-pointer"
              >
                <circle cx="255" cy="220" r="24" fill="rgba(0,20,50,0.6)" stroke="#00d4ff" strokeWidth="2" filter="url(#componentGlow)" />
                <circle cx="255" cy="220" r="15" fill="rgba(0,10,30,0.8)" stroke="#00d4ff" strokeWidth="1.5" />
                <line x1="244" y1="220" x2="266" y2="220" stroke="#00d4ff" strokeWidth="1.5" opacity="0.6" />
                <text x="255" y="224" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">CT</text>
                <text x="255" y="258" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">CT</text>
              </g>

              {/* ===== PT (Potential Transformer) ===== */}
              <g
                onMouseEnter={(e) => handleComponentHover('pt', e)}
                onMouseLeave={handleComponentLeave}
                className="cursor-pointer"
              >
                <circle cx="255" cy="370" r="24" fill="rgba(0,20,50,0.6)" stroke="#8844ff" strokeWidth="2" filter="url(#componentGlow)" />
                <circle cx="255" cy="370" r="15" fill="rgba(0,10,30,0.8)" stroke="#8844ff" strokeWidth="1.5" />
                <line x1="244" y1="370" x2="266" y2="370" stroke="#8844ff" strokeWidth="1.5" opacity="0.6" />
                <text x="255" y="374" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">PT</text>
                <text x="255" y="408" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">PT</text>
              </g>

              {/* CT-PT connecting line */}
              <line x1="255" y1="244" x2="255" y2="346" stroke="rgba(0,212,255,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* CT/PT labels */}
              <text x="255" y="200" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">CT / PT</text>

              {/* ===== RELAY GROUP (9 relays in 3x3 grid) ===== */}
              <g>
                {/* Group label */}
                <text x={relayStartX + (3 * (relayBoxW + relayGapX) - relayGapX) / 2} y="80" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="bold">RELAY PROTEKSI</text>

                {/* Group border */}
                <rect
                  x={relayStartX - 10} y="88"
                  width={3 * (relayBoxW + relayGapX) - relayGapX + 20}
                  height={3 * (relayBoxH + relayGapY) - relayGapY + 20}
                  rx="10" ry="10"
                  fill="none"
                  stroke="rgba(0,212,255,0.12)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {relayDetails.map((relay, i) => {
                  const active = isRelayActive(relay.ansi);
                  const pos = getRelayPos(i);

                  return (
                    <g
                      key={relay.ansi}
                      onMouseEnter={(e) => handleRelayMouseEnter(relay.ansi, e)}
                      onMouseLeave={handleRelayMouseLeave}
                      className="cursor-pointer"
                    >
                      {/* Relay box */}
                      <rect
                        x={pos.x} y={pos.y}
                        width={relayBoxW} height={relayBoxH}
                        rx="8" ry="8"
                        fill={active ? 'rgba(255,68,102,0.18)' : 'rgba(0,20,50,0.5)'}
                        stroke={active ? '#ff4466' : hoveredRelay === relay.ansi ? '#00d4ff' : 'rgba(0,212,255,0.4)'}
                        strokeWidth={active ? '2.5' : hoveredRelay === relay.ansi ? '2' : '1.5'}
                        filter={active ? 'url(#glowRed)' : 'url(#componentGlow)'}
                        className={active ? 'glow-pulse' : ''}
                      />
                      {/* Glass-like top highlight */}
                      <rect
                        x={pos.x + 2} y={pos.y + 2}
                        width={relayBoxW - 4} height={relayBoxH / 3}
                        rx="6" ry="6"
                        fill="rgba(255,255,255,0.04)"
                      />
                      {/* Status indicator dot */}
                      <circle
                        cx={pos.x + 14} cy={pos.y + relayBoxH / 2}
                        r="4"
                        fill={active ? '#ff4466' : diagramState.status === 'normal' ? '#00ff88' : '#00d4ff'}
                        className={active ? 'alarm-blink' : ''}
                        filter={active ? 'url(#glowRed)' : diagramState.status === 'normal' ? 'url(#glowGreen)' : 'url(#glowCyan)'}
                      />
                      {/* ANSI code */}
                      <text
                        x={pos.x + 26} y={pos.y + relayBoxH / 2 - 3}
                        fill={active ? '#ff4466' : '#00d4ff'}
                        fontSize="12"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {relay.ansi}
                      </text>
                      {/* Relay name */}
                      <text
                        x={pos.x + 26} y={pos.y + relayBoxH / 2 + 11}
                        fill="rgba(255,255,255,0.6)"
                        fontSize="8"
                      >
                        {relay.name}
                      </text>
                      {/* Active label */}
                      {active && (
                        <text
                          x={pos.x + relayBoxW - 6} y={pos.y + 12}
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
                onMouseEnter={(e) => handleComponentHover('tripcoil', e)}
                onMouseLeave={handleComponentLeave}
                className="cursor-pointer"
              >
                <rect
                  x="740" y="270" width="70" height="60" rx="8"
                  fill={cbIsTrip ? 'rgba(255,68,102,0.15)' : 'rgba(0,20,50,0.6)'}
                  stroke={cbIsTrip ? '#ff4466' : '#00d4ff'}
                  strokeWidth="2"
                  filter="url(#componentGlow)"
                />
                <path
                  d="M755,290 L760,285 L770,295 L780,285 L790,295 L795,290"
                  fill="none"
                  stroke={cbIsTrip ? '#ff4466' : '#00d4ff'}
                  strokeWidth="1.5"
                  opacity="0.5"
                />
                <text x="775" y="312" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">TC</text>
                <text x="775" y="328" textAnchor="middle" fill={cbIsTrip ? '#ff4466' : '#00d4ff'} fontSize="9">
                  {cbIsTrip ? 'AKTIF' : 'STANDBY'}
                </text>
                <text x="775" y="348" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Trip Coil</text>
              </g>

              {/* ===== CIRCUIT BREAKER ===== */}
              <g
                onMouseEnter={(e) => handleComponentHover('cb', e)}
                onMouseLeave={handleComponentLeave}
                className="cursor-pointer"
              >
                <rect
                  x="870" y="250" width="90" height="100" rx="8"
                  fill={cbIsTrip ? 'rgba(255,68,102,0.2)' : 'rgba(0,200,100,0.1)'}
                  stroke={cbIsTrip ? '#ff4466' : '#00ff88'}
                  strokeWidth="2.5"
                  filter="url(#componentGlow)"
                />
                {diagramState.cbStatus === 'ON' ? (
                  <>
                    <circle cx="895" cy="300" r="5" fill="#00ff88" />
                    <line x1="900" y1="298" x2="935" y2="288" stroke="#00ff88" strokeWidth="3" />
                    <circle cx="935" cy="288" r="5" fill="#00ff88" />
                  </>
                ) : (
                  <>
                    <circle cx="895" cy="300" r="5" fill="#ff4466" />
                    <line x1="900" y1="298" x2="930" y2="268" stroke="#ff4466" strokeWidth="3" />
                    <circle cx="935" cy="288" r="5" fill="#ff4466" filter="url(#glowRed)" />
                  </>
                )}
                <text x="915" y="330" textAnchor="middle" fill={cbIsTrip ? '#ff4466' : '#00ff88'} fontSize="14" fontWeight="bold">
                  {diagramState.cbStatus}
                </text>
                <text x="915" y="370" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">Circuit Breaker</text>
              </g>

              {/* ===== BUSBAR ===== */}
              <g
                onMouseEnter={(e) => handleComponentHover('busbar', e)}
                onMouseLeave={handleComponentLeave}
                className="cursor-pointer"
              >
                {/* Vertical busbar */}
                <line x1="1050" y1="150" x2="1050" y2="450" stroke={cbIsTrip ? 'rgba(100,100,100,0.5)' : '#8844ff'} strokeWidth="6" filter={cbIsTrip ? undefined : 'url(#glowPurple)'} />
                <text x="1050" y="480" textAnchor="middle" fill={cbIsTrip ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)'} fontSize="11" fontWeight="bold">BUSBAR</text>

                {/* Load branches */}
                {[
                  { y: 170, label: 'Beban 1', active: monitoringData.load1 },
                  { y: 300, label: 'Beban 2', active: monitoringData.load2 },
                  { y: 430, label: 'Beban 3', active: monitoringData.load3 },
                ].map((load) => {
                  const loadActive = cbIsTrip ? false : load.active;
                  return (
                    <g key={load.label} opacity={loadActive ? 1 : 0.35}>
                      <circle cx="1050" cy={load.y} r="4" fill={loadActive ? '#00ff88' : '#666'} filter={loadActive ? 'url(#glowGreen)' : undefined} />
                      <rect
                        x="1100" y={load.y - 14} width="80" height="28" rx="6"
                        fill={loadActive ? 'rgba(0,200,100,0.08)' : 'rgba(60,60,60,0.3)'}
                        stroke={loadActive ? 'rgba(0,255,136,0.3)' : 'rgba(100,100,100,0.4)'}
                        strokeWidth="1.5"
                      />
                      <circle cx="1112" cy={load.y} r="3" fill={loadActive ? '#00ff88' : '#666'} className={loadActive ? 'glow-pulse' : ''} />
                      <text x="1145" y={load.y + 4} textAnchor="middle" fill={loadActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'} fontSize="9">{load.label}</text>
                    </g>
                  );
                })}
              </g>

              {/* ===== ALARM INDICATOR ===== */}
              {diagramState.alarmActive && (
                <g>
                  <circle cx={relayStartX + (3 * (relayBoxW + relayGapX) - relayGapX) / 2} cy="88" r="10" fill="#ff4466" className="alarm-blink" filter="url(#glowRed)" />
                  <text x={relayStartX + (3 * (relayBoxW + relayGapX) - relayGapX) / 2} y="92" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">!</text>
                </g>
              )}

              {/* Flow direction arrows */}
              {!isFlowStopped && (
                <g opacity="0.5">
                  <polygon points="170,295 180,300 170,305" fill={flowStroke} />
                  <polygon points="720,295 730,300 720,305" fill={diagramState.relayAktif.length > 0 ? '#00d4ff' : flowStroke} />
                  <polygon points="850,295 860,300 850,305" fill={cbIsTrip ? '#ff4466' : flowStroke} />
                  <polygon points="1000,295 1010,300 1000,305" fill={cbIsTrip ? '#666' : flowStroke} opacity={cbIsTrip ? 0.4 : 1} />
                </g>
              )}

              {/* Section labels at top */}
              <text x="80" y="20" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">GENERATOR</text>
              <text x="255" y="190" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">CT / PT</text>
              <text x="775" y="260" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">TRIP COIL</text>
              <text x="915" y="240" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">CB</text>
              <text x="1050" y="140" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="bold">BUSBAR</text>
            </svg>

            {/* Tooltip for relays */}
            {hoveredRelay && tooltipPos && (() => {
              const relay = relayDetails.find((r) => r.ansi === hoveredRelay);
              if (!relay) return null;
              return (
                <div
                  className="svg-tooltip"
                  style={{
                    left: `${Math.min(tooltipPos.x, 700)}px`,
                    top: `${tooltipPos.y - 120}px`,
                    maxWidth: '280px',
                  }}
                >
                  <div className="font-bold text-cyan-300 mb-1">{relay.ansi} — {relay.name}</div>
                  <div className="text-white/80 text-xs mb-1">Memantau: {relay.monitors}</div>
                  <div className="text-white/60 text-xs mb-1">Kurva: {relay.curve}</div>
                  <div className="text-green-400 text-xs">Normal: {relay.normalValue} {relay.unit}</div>
                  <div className="text-red-400 text-xs">Trip: {relay.tripValue} {relay.unit}</div>
                </div>
              );
            })()}

            {/* Tooltip for components */}
            {hoveredComponent && tooltipPos && svgComponentInfo[hoveredComponent] && (
              <div
                className="svg-tooltip"
                style={{
                  left: `${Math.min(tooltipPos.x, 700)}px`,
                  top: `${tooltipPos.y - 80}px`,
                }}
              >
                <div className="font-bold text-cyan-300 mb-1">{svgComponentInfo[hoveredComponent].name}</div>
                <div className="text-white/80 text-xs">{svgComponentInfo[hoveredComponent].desc}</div>
              </div>
            )}

            {/* Dashboard Status */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Status Generator', value: diagramState.status === 'normal' ? 'NORMAL' : diagramState.status === 'gangguan' ? 'GANGGUAN' : 'TERPUTUS', color: diagramState.status === 'normal' ? 'text-green-400' : 'text-red-400', bg: diagramState.status === 'normal' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30' },
                { label: 'Status CB', value: diagramState.cbStatus, color: diagramState.cbStatus === 'ON' ? 'text-green-400' : 'text-red-400', bg: diagramState.cbStatus === 'ON' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30' },
                { label: 'Relay Aktif', value: diagramState.relayAktif.length > 0 ? diagramState.relayAktif.join(', ') : '-', color: diagramState.relayAktif.length > 0 ? 'text-red-400' : 'text-cyan-400', bg: diagramState.relayAktif.length > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-cyan-500/10 border-cyan-500/30' },
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Trip Logic 1: Arus Lebih (50/51) */}
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

            {/* Trip Logic 2: Daya Balik (32) */}
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

            {/* Trip Logic 3: Kehilangan Eksitasi (40) */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_40.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">Z_ropa</span> {'<'} <span className="string">Z_mho</span> <span className="comment">{'// zona mho'}</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">40</span> aktif<br />
                <span className="keyword">{'→'}</span> Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi kehilangan eksitasi'}</span>
              </div>
            </div>

            {/* Trip Logic 4: Beban Tidak Seimbang (46) */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_46.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">I_neg_seq</span> {'>'} <span className="string">I_setting</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">46</span> aktif<br />
                <span className="keyword">{'→'}</span> Alarm / Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi arus urutan negatif'}</span>
              </div>
            </div>

            {/* Trip Logic 5: Tegangan Lebih (59) / Kurang (27) */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_59_27.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">V_generator</span> {'>'} <span className="string">V_over</span> <span className="keyword">OR</span> <span className="string">{'<'}</span> <span className="string">V_under</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">59</span> / <span className="string">27</span> aktif<br />
                <span className="keyword">{'→'}</span> Alarm / Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="comment">{'// Proteksi tegangan lebih/kurang'}</span>
              </div>
            </div>

            {/* Trip Logic 6: Frekuensi (81U/O) */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_81UO.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">f_sistem</span> {'<'} <span className="string">f_under</span> <span className="keyword">OR</span> {'>'} <span className="string">f_over</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">81U</span> / <span className="string">81O</span> aktif<br />
                <span className="keyword">{'→'}</span> Load shedding / Trip<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="comment">{'// Proteksi frekuensi tidak normal'}</span>
              </div>
            </div>

            {/* Trip Logic 7: Out of Step (78) */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_78.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">impedansi_ayunan</span> melintasi <span className="string">zona_blinder</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">78</span> aktif<br />
                <span className="keyword">{'→'}</span> Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi out of step (loss of sync)'}</span>
              </div>
            </div>

            {/* Trip Logic 8: Differential (87G) */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_87G.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> |<span className="string">I_masuk</span> − <span className="string">I_keluar</span>| {'>'} <span className="string">slope</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">87G</span> aktif<br />
                <span className="keyword">{'→'}</span> Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi diferensial (gangguan internal)'}</span>
              </div>
            </div>

            {/* Trip Logic 9: Gangguan Tanah */}
            <div className="terminal-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-lg">{'>'}</span>
                <span className="text-xs text-gray-400">relay_gnd.logic</span>
              </div>
              <div className="text-sm leading-relaxed">
                <span className="keyword">IF</span> <span className="string">I_bocor_tanah</span> {'>'} <span className="string">I_setting</span><br />
                <span className="keyword">THEN</span> Relay <span className="string">51N/64G</span> aktif<br />
                <span className="keyword">{'→'}</span> Alarm / Trip coil energized<br />
                <span className="keyword">{'→'}</span> CB <span className="string">TRIP</span><br />
                <span className="keyword">{'→'}</span> Generator <span className="string">TERPUTUS</span><br />
                <span className="comment">{'// Proteksi gangguan tanah (ground fault)'}</span>
              </div>
            </div>
          </div>

          {/* Summary Flow */}
          <div className="mt-6 glass-card p-4 text-center">
            <p className="text-white/60 text-sm font-mono">
              <span className="text-red-400">Gangguan</span> {' → '} 
              <span className="text-cyan-400">CT/PT</span> {' → '} 
              <span className="text-yellow-400">Relai Aktif</span> {' → '} 
              <span className="text-purple-400">Trip Coil</span> {' → '} 
              <span className="text-orange-400">CB Trip</span> {' → '} 
              <span className="text-green-400">Generator Terputus</span>
            </p>
          </div>
        </div>
      </section>

      {/* ====================== SECTION 11: SIMULASI GANGGUAN OTOMATIS ====================== */}
      <section id="simulasi" className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="section-title">Simulasi Gangguan Otomatis</h2>
              <p className="section-subtitle">
                Pilih jenis gangguan untuk menjalankan simulasi proteksi otomatis
              </p>
            </div>
            {/* Audio mute toggle */}
            <button
              onClick={() => setAudioMuted((prev) => !prev)}
              className={`glow-btn flex items-center gap-2 text-sm ${audioMuted ? 'opacity-60' : ''}`}
              aria-label={audioMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {audioMuted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
              )}
              {audioMuted ? 'Unmute' : 'Audio On'}
            </button>
          </div>

          {/* Fault type selector */}
          <div className="flex flex-wrap gap-3 mt-6">
            {faultSimulations.map((sim) => (
              <button
                key={sim.faultId}
                onClick={() => selectFault(sim.faultId)}
                className={`glow-btn text-sm ${
                  selectedFault === sim.faultId
                    ? 'glow-btn-red border-red-500/60 bg-red-500/20'
                    : 'hover:bg-white/10'
                }`}
              >
                {sim.name}
              </button>
            ))}
            <button
              onClick={resetSimulation}
              className="glow-btn-green text-sm"
            >
              Reset Simulasi
            </button>
          </div>

          {/* Phase indicator */}
          {simulationPhase > 0 && (
            <div className="mt-6 glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-xs font-mono">Fase Simulasi</span>
                <span className="text-cyan-400 text-xs font-mono">
                  {simulationPhase === 1 ? 'FASE 1: Gangguan Terdeteksi' :
                   simulationPhase === 2 ? 'FASE 2: Relay Aktif' :
                   simulationPhase === 3 ? 'FASE 3: CB Trip' :
                   'FASE 4: Generator Terputus'}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    simulationPhase === 1 ? 'bg-red-500 w-1/4' :
                    simulationPhase === 2 ? 'bg-yellow-500 w-2/4' :
                    simulationPhase === 3 ? 'bg-orange-500 w-3/4' :
                    'bg-green-500 w-full'
                  }`}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Real-time Monitoring Panel */}
            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">Real-time Monitoring</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Tegangan Fasa R */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Tegangan R</div>
                  <div className={`text-base font-bold font-mono ${monColor(monitoringData.voltageR, normalParameters.voltageR, 0.15)}`}>
                    {monitoringData.voltageR.toFixed(1)} <span className="text-xs text-white/40">kV</span>
                  </div>
                </div>
                {/* Tegangan Fasa S */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Tegangan S</div>
                  <div className={`text-base font-bold font-mono ${monColor(monitoringData.voltageS, normalParameters.voltageS, 0.15)}`}>
                    {monitoringData.voltageS.toFixed(1)} <span className="text-xs text-white/40">kV</span>
                  </div>
                </div>
                {/* Tegangan Fasa T */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Tegangan T</div>
                  <div className={`text-base font-bold font-mono ${monColor(monitoringData.voltageT, normalParameters.voltageT, 0.15)}`}>
                    {monitoringData.voltageT.toFixed(1)} <span className="text-xs text-white/40">kV</span>
                  </div>
                </div>
                {/* Arus */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Arus</div>
                  <div className={`text-base font-bold font-mono ${monColor(monitoringData.current, normalParameters.current, 0.3)}`}>
                    {monitoringData.current.toFixed(0)} <span className="text-xs text-white/40">A</span>
                  </div>
                </div>
                {/* Frekuensi */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Frekuensi</div>
                  <div className={`text-base font-bold font-mono ${monColor(monitoringData.frequency, normalParameters.frequency, 0.05)}`}>
                    {monitoringData.frequency.toFixed(1)} <span className="text-xs text-white/40">Hz</span>
                  </div>
                </div>
                {/* Daya Aktif */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Daya Aktif</div>
                  <div className={`text-base font-bold font-mono ${monitoringData.activePower < 0 ? 'text-red-400' : monColor(monitoringData.activePower, normalParameters.activePower, 0.3)}`}>
                    {monitoringData.activePower.toFixed(1)} <span className="text-xs text-white/40">MW</span>
                  </div>
                </div>
                {/* Daya Reaktif */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Daya Reaktif</div>
                  <div className={`text-base font-bold font-mono ${monitoringData.reactivePower < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {monitoringData.reactivePower.toFixed(1)} <span className="text-xs text-white/40">MVAr</span>
                  </div>
                </div>
                {/* Faktor Daya */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Faktor Daya</div>
                  <div className={`text-base font-bold font-mono ${Math.abs(monitoringData.powerFactor) < 0.7 ? 'text-red-400' : Math.abs(monitoringData.powerFactor) < 0.85 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {monitoringData.powerFactor.toFixed(2)} <span className="text-xs text-white/40">cos φ</span>
                  </div>
                </div>
                {/* Load Status */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2 text-center">Status Beban</div>
                  <div className="space-y-1">
                    {[
                      { label: 'Beban 1', active: monitoringData.load1 },
                      { label: 'Beban 2', active: monitoringData.load2 },
                      { label: 'Beban 3', active: monitoringData.load3 },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${l.active ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className={l.active ? 'text-green-400' : 'text-red-400'}>{l.active ? 'Aktif' : 'Padam'}</span>
                        <span className="text-white/40">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Log */}
            <div className="glass-card p-4 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-cyan-400">Event Log</h3>
                <button
                  onClick={exportEventLog}
                  disabled={eventLog.length === 0}
                  className="glow-btn-yellow text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Export CSV
                </button>
              </div>
              <div
                ref={eventLogRef}
                className="flex-1 max-h-96 overflow-y-auto space-y-1 pr-2"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,212,255,0.3) transparent' }}
              >
                {eventLog.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-8">Belum ada event. Pilih gangguan untuk memulai simulasi.</p>
                ) : (
                  eventLog.map((entry, i) => (
                    <div
                      key={i}
                      className={`border-l-2 pl-3 py-1.5 ${eventStyle(entry.type)}`}
                    >
                      <span className="text-white/40 text-xs font-mono mr-2">[{entry.timestamp}]</span>
                      <span className="text-sm">{entry.event}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Trip sequence detail (when simulation complete) */}
          {selectedSim && simulationPhase === 4 && (
            <div className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Penyebab */}
                <div className="glass-card p-4 border-t-2 border-t-cyan-500">
                  <h4 className="text-cyan-400 font-bold text-sm mb-2">Penyebab</h4>
                  <p className="text-white/70 text-xs">{selectedSim.name}</p>
                  <p className="text-white/50 text-xs mt-1">
                    Relay aktif: {selectedSim.affectedRelayAnsi.join(', ')}
                  </p>
                </div>
                {/* Dampak */}
                <div className="glass-card p-4 border-t-2 border-t-red-500">
                  <h4 className="text-red-400 font-bold text-sm mb-2">Dampak</h4>
                  <p className="text-white/70 text-xs">Arus: {selectedSim.affectedCurrent}A</p>
                  <p className="text-white/50 text-xs mt-1">
                    Tegangan: {selectedSim.affectedVoltages.R}/{selectedSim.affectedVoltages.S}/{selectedSim.affectedVoltages.T} kV
                  </p>
                </div>
                {/* Relay Aktif */}
                <div className="glass-card p-4 border-t-2 border-t-yellow-500">
                  <h4 className="text-yellow-400 font-bold text-sm mb-2">Relay Aktif</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSim.affectedRelayAnsi.map((ansi) => (
                      <span key={ansi} className="badge-ansi text-xs">{ansi}</span>
                    ))}
                  </div>
                </div>
                {/* Aksi Proteksi */}
                <div className="glass-card p-4 border-t-2 border-t-orange-500">
                  <h4 className="text-orange-400 font-bold text-sm mb-2">Aksi Proteksi</h4>
                  <p className="text-white/70 text-xs">CB TRIP → Generator terputus dari sistem</p>
                  <p className="text-green-400 text-xs mt-1 font-bold">SISTEM AMAN</p>
                </div>
              </div>

              {/* Trip Sequence */}
              <div className="mt-4 glass-card p-4">
                <h4 className="text-white font-bold text-sm mb-3">Urutan Trip</h4>
                <div className="space-y-2">
                  {selectedSim.tripSequence.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === selectedSim.tripSequence.length - 1
                          ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}>
                        {i + 1}
                      </div>
                      <p className={`text-sm ${i === selectedSim.tripSequence.length - 1 ? 'text-green-400 font-bold' : 'text-white/70'}`}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusion */}
              <div className="mt-4 glass-card p-4 bg-gradient-to-r from-green-500/10 via-cyan-500/10 to-blue-500/10 border border-green-500/30">
                <p className="text-white/80 text-sm text-center">
                  Simulasi selesai. Sistem proteksi bekerja dengan benar — Generator berhasil diputus dari sistem untuk mencegah kerusakan lebih lanjut.
                </p>
              </div>
            </div>
          )}

          {/* Quick reference table (when no fault selected) */}
          {!selectedFault && (
            <div className="mt-6 glass-card p-4 sm:p-6 overflow-x-auto">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">Tabel Referensi Gangguan</h3>
              <table className="table-glass w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Gangguan</th>
                    <th className="text-center">Kode ANSI</th>
                    <th className="text-center">Relay</th>
                    <th className="text-center">Aksi</th>
                    <th className="text-center">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {faultsData.map((fault) => (
                    <tr key={fault.id}>
                      <td className="text-white/80">{fault.name}</td>
                      <td className="text-center"><span className="badge-ansi text-xs">{fault.ansiCode}</span></td>
                      <td className="text-center text-white/60">{fault.protection}</td>
                      <td className="text-center text-white/60">{fault.action}</td>
                      <td className="text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          fault.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          fault.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {fault.severity === 'critical' ? 'Kritis' : fault.severity === 'warning' ? 'Peringatan' : 'Info'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
