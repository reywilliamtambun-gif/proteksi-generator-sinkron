'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  faultsData,
  relayDetails,
  faultSimulations,
  normalParameters,
  type EventLogEntry,
} from '@/data/protection-data';
import { tutorialStepsData, enhancedComponentInfo } from '@/data/protection-data';

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

/* ─── SVG component info for tooltips (basic) ─── */
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

/* ─── Audio helpers (with volume) ─── */
let audioVolume = 0.7;

function playRelayClick() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.15 * audioVolume, ctx.currentTime);
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
    gain.gain.setValueAtTime(0.15 * audioVolume, ctx.currentTime);
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
    gain.gain.setValueAtTime(0.12 * audioVolume, ctx.currentTime);
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
  const [volume, setVolume] = useState(70);
  const [hoveredRelay, setHoveredRelay] = useState<string | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [rotorAngle, setRotorAngle] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [clickedComponent, setClickedComponent] = useState<string | null>(null);
  const [clickedRelay, setClickedRelay] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const eventLogRef = useRef<HTMLDivElement>(null);

  // Sync volume to audio helper
  useEffect(() => {
    audioVolume = audioMuted ? 0 : volume / 100;
  }, [volume, audioMuted]);

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

  // Save simulation log to DB when simulation completes
  useEffect(() => {
    if (simulationPhase === 4 && selectedFault) {
      const sim = faultSimulations.find((s) => s.faultId === selectedFault);
      if (sim) {
        fetch('/api/simulation-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            faultType: sim.name,
            relayActivated: sim.affectedRelayAnsi.join(', '),
            cbStatus: 'TRIP',
            eventLog: eventLog,
            duration: 4800,
          }),
        }).catch(() => { /* silently fail */ });
      }
    }
  }, [simulationPhase, selectedFault]);

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
    setTutorialStep(0);

    const sim = faultSimulations.find((s) => s.faultId === faultSimId);
    if (!sim) return;

    // Get tutorial steps for this fault
    const tutSteps = tutorialStepsData[faultSimId];

    // Start simulation
    const t0 = setTimeout(() => {
      setSelectedFault(faultSimId);
      setSimulationPhase(1);
      setTutorialStep(0);

      // Play notification sound
      if (!audioMuted && audioVolume > 0) playNotificationSound();

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
        setTutorialStep(1);
        if (!audioMuted && audioVolume > 0) playRelayClick();
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
          setTutorialStep(2);
          if (!audioMuted && audioVolume > 0) playTripSound();
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
            setTutorialStep(3);
            addEvent('Generator terputus dari sistem — AMAN', 'safe');

            setDiagramState((prev) => ({
              ...prev,
              status: 'terputus',
              flowColor: 'green',
              alarmActive: false,
              aksiSistem: 'Generator Terputus',
              statusSistem: 'Aman',
            }));

            // Phase 5: After 4.8s - Tutorial complete
            const t4 = setTimeout(() => {
              setTutorialStep(4);
            }, 1200);
            timersRef.current.push(t4);
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
    setTutorialStep(0);
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

  // PDF Export
  const exportEventLogPDF = useCallback(() => {
    const sim = faultSimulations.find((s) => s.faultId === selectedFault);
    const printContent = `
      <html><head><title>Event Log - Proteksi Generator</title>
      <style>body{font-family:monospace;padding:20px;background:#1a1a2e;color:#eee}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:8px;text-align:left}th{background:#222}.fault{color:red}.warning{color:orange}.trip{color:#ff6600}.safe{color:green}.info{color:cyan}h1{color:#00d4ff}</style></head>
      <body><h1>Event Log - Simulasi Gangguan Generator</h1>
      <p>Fault: ${sim?.name || '-'}</p><p>Relay: ${diagramState.relayAktif.join(', ') || '-'}</p>
      <table><tr><th>Time</th><th>Event</th><th>Type</th></tr>
      ${eventLog.map(e => `<tr><td>${e.timestamp}</td><td>${e.event}</td><td class="${e.type}">${e.type}</td></tr>`).join('')}
      </table></body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  }, [eventLog, selectedFault, diagramState.relayAktif]);

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

  // Get tutorial data for current fault
  const currentTutorialSteps = selectedFault ? tutorialStepsData[selectedFault] : null;
  const currentTutorialStep = currentTutorialSteps ? currentTutorialSteps[tutorialStep] : null;

  // Get enhanced component info for tooltip
  const getEnhancedInfo = (key: string) => enhancedComponentInfo.find((c) => c.key === key);

  // Tutorial component highlight mapping
  const getTutorialHighlightId = (component: string) => {
    switch (component) {
      case 'generator': return 'svg-generator';
      case 'ctpt': return 'svg-ctpt';
      case 'relay': return 'svg-relay-group';
      case 'tripcoil': return 'svg-tripcoil';
      case 'cb': return 'svg-cb';
      case 'busbar': return 'svg-busbar';
      default: return '';
    }
  };

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
            {/* Status indicator + Audio controls */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${diagramState.alarmActive ? 'bg-red-500 alarm-blink' : diagramState.status === 'normal' ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className="text-sm text-white/70 font-mono">
                  {diagramState.status === 'normal' ? 'SISTEM NORMAL' : diagramState.status === 'gangguan' ? 'GANGGUAN TERDETEKSI' : 'GENERATOR TERPUTUS'}
                </span>
              </div>

              {/* Audio controls: mute + volume slider */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAudioMuted((prev) => !prev)}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label={audioMuted ? 'Unmute audio' : 'Mute audio'}
                >
                  {audioMuted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (v > 0 && audioMuted) setAudioMuted(false);
                    setVolume(v);
                  }}
                  className="w-20 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #00d4ff ${audioMuted ? 0 : volume}%, rgba(255,255,255,0.15) ${audioMuted ? 0 : volume}%)`,
                  }}
                  aria-label="Volume"
                />
                <span className="text-xs text-white/40 font-mono w-8">{audioMuted ? '0%' : `${volume}%`}</span>
              </div>
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
                {/* Tutorial highlight filter */}
                <filter id="tutorialHighlight" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feFlood floodColor="#ffaa00" floodOpacity="0.4" result="color" />
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

              {/* ===== R/S/T PHASE FLOW ARROWS ===== */}
              {/* Phase R: Red arrow at y=290 */}
              <line
                x1="140" y1="290" x2="190" y2="290"
                stroke="#ff4444" strokeWidth="2.5" strokeDasharray="8 5"
                className={isFlowStopped ? '' : 'electricity-flow'}
                opacity={isFlowStopped ? 0.2 : 0.8}
              />
              <polygon points="188,286 196,290 188,294" fill="#ff4444" opacity={isFlowStopped ? 0.2 : 0.8} />
              <text x="168" y="286" fill="#ff4444" fontSize="7" fontWeight="bold" opacity={isFlowStopped ? 0.2 : 0.7}>R</text>

              {/* Phase S: Yellow arrow at y=300 */}
              <line
                x1="140" y1="300" x2="190" y2="300"
                stroke="#ffaa00" strokeWidth="2.5" strokeDasharray="8 5"
                className={isFlowStopped ? '' : 'electricity-flow'}
                opacity={isFlowStopped ? 0.2 : 0.8}
              />
              <polygon points="188,296 196,300 188,304" fill="#ffaa00" opacity={isFlowStopped ? 0.2 : 0.8} />
              <text x="168" y="296" fill="#ffaa00" fontSize="7" fontWeight="bold" opacity={isFlowStopped ? 0.2 : 0.7}>S</text>

              {/* Phase T: Blue arrow at y=310 */}
              <line
                x1="140" y1="310" x2="190" y2="310"
                stroke="#4488ff" strokeWidth="2.5" strokeDasharray="8 5"
                className={isFlowStopped ? '' : 'electricity-flow'}
                opacity={isFlowStopped ? 0.2 : 0.8}
              />
              <polygon points="188,306 196,310 188,314" fill="#4488ff" opacity={isFlowStopped ? 0.2 : 0.8} />
              <text x="168" y="306" fill="#4488ff" fontSize="7" fontWeight="bold" opacity={isFlowStopped ? 0.2 : 0.7}>T</text>

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
              {relayDetails.filter(r => r.ctInput).map((relay) => {
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
                id="svg-generator"
                onMouseEnter={(e) => handleComponentHover('generator', e)}
                onMouseLeave={handleComponentLeave}
                onClick={() => setClickedComponent('generator')}
                className="cursor-pointer"
                filter={currentTutorialStep?.highlightComponent === 'generator' ? 'url(#tutorialHighlight)' : undefined}
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
                id="svg-ctpt"
                onMouseEnter={(e) => handleComponentHover('ct', e)}
                onMouseLeave={handleComponentLeave}
                onClick={() => setClickedComponent('ct')}
                className="cursor-pointer"
                filter={currentTutorialStep?.highlightComponent === 'ctpt' ? 'url(#tutorialHighlight)' : undefined}
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
                onClick={() => setClickedComponent('pt')}
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
              <g
                id="svg-relay-group"
                filter={currentTutorialStep?.highlightComponent === 'relay' ? 'url(#tutorialHighlight)' : undefined}
              >
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
                      onClick={() => setClickedRelay(relay.ansi)}
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
                id="svg-tripcoil"
                onMouseEnter={(e) => handleComponentHover('tripcoil', e)}
                onMouseLeave={handleComponentLeave}
                onClick={() => setClickedComponent('tripcoil')}
                className="cursor-pointer"
                filter={currentTutorialStep?.highlightComponent === 'tripcoil' ? 'url(#tutorialHighlight)' : undefined}
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
                id="svg-cb"
                onMouseEnter={(e) => handleComponentHover('cb', e)}
                onMouseLeave={handleComponentLeave}
                onClick={() => setClickedComponent('cb')}
                className="cursor-pointer"
                filter={currentTutorialStep?.highlightComponent === 'cb' ? 'url(#tutorialHighlight)' : undefined}
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
                id="svg-busbar"
                onMouseEnter={(e) => handleComponentHover('busbar', e)}
                onMouseLeave={handleComponentLeave}
                onClick={() => setClickedComponent('busbar')}
                className="cursor-pointer"
                filter={currentTutorialStep?.highlightComponent === 'busbar' ? 'url(#tutorialHighlight)' : undefined}
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

            {/* Persistent click pop-up for components */}
            {clickedComponent && (() => {
              const basic = svgComponentInfo[clickedComponent];
              const enhanced = getEnhancedInfo(clickedComponent);
              if (!basic) return null;
              return (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  onClick={() => setClickedComponent(null)}
                >
                  <div
                    className="glass-card p-6 max-w-md w-[90%] relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setClickedComponent(null)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
                    >
                      ✕
                    </button>
                    <div className="text-cyan-400 font-bold text-lg mb-2">{basic.name}</div>
                    <div className="text-white/80 text-sm mb-3">{enhanced?.description || basic.desc}</div>
                    {enhanced && enhanced.parameters.length > 0 && (
                      <div className="mb-3">
                        <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Parameters</div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <table className="w-full text-sm">
                            <tbody>
                              {enhanced.parameters.map((p, i) => (
                                <tr key={i} className="border-b border-white/5 last:border-0">
                                  <td className="text-white/60 py-1 pr-3">{p.label}</td>
                                  <td className="text-cyan-400 font-mono py-1 pr-2">{p.normalValue}</td>
                                  <td className="text-white/40 py-1">{p.unit}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {enhanced && (
                      <div className="flex gap-4 text-xs">
                        <span className="px-2 py-1 rounded bg-green-400/10 text-green-400">Normal: {enhanced.normalStatus}</span>
                        <span className="px-2 py-1 rounded bg-red-400/10 text-red-400">Fault: {enhanced.faultStatus}</span>
                      </div>
                    )}
                    <div className="mt-3 text-white/30 text-xs">Klik di luar untuk menutup</div>
                  </div>
                </div>
              );
            })()}

            {/* Persistent click pop-up for relays */}
            {clickedRelay && (() => {
              const relay = relayDetails.find((r) => r.ansi === clickedRelay);
              if (!relay) return null;
              return (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  onClick={() => setClickedRelay(null)}
                >
                  <div
                    className="glass-card p-6 max-w-md w-[90%] relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setClickedRelay(null)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
                    >
                      ✕
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="badge-ansi text-lg px-3 py-1">{relay.ansi}</span>
                      <span className="text-white font-bold text-lg">{relay.name}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-white/50">Memantau:</span> <span className="text-white/80">{relay.monitors}</span></div>
                      <div><span className="text-white/50">Kurva:</span> <span className="text-white/80">{relay.curve}</span></div>
                      <div><span className="text-white/50">Normal:</span> <span className="text-green-400">{relay.normalValue} {relay.unit}</span></div>
                      <div><span className="text-white/50">Trip:</span> <span className="text-red-400">{relay.tripValue} {relay.unit}</span></div>
                    </div>
                    <div className="mt-3 text-white/30 text-xs">Klik di luar untuk menutup</div>
                  </div>
                </div>
              );
            })()}

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

            {/* Enhanced tooltip for components */}
            {hoveredComponent && tooltipPos && (() => {
              const basic = svgComponentInfo[hoveredComponent];
              const enhanced = getEnhancedInfo(hoveredComponent);
              if (!basic) return null;

              return (
                <div
                  className="svg-tooltip"
                  style={{
                    left: `${Math.min(tooltipPos.x, 650)}px`,
                    top: `${Math.min(tooltipPos.y - 40, 100)}px`,
                    maxWidth: '320px',
                  }}
                >
                  <div className="font-bold text-cyan-300 mb-1">{basic.name}</div>
                  <div className="text-white/80 text-xs mb-2">{enhanced?.description || basic.desc}</div>

                  {/* Parameter table */}
                  {enhanced && enhanced.parameters.length > 0 && (
                    <div className="mb-2">
                      <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Parameters</div>
                      <table className="w-full text-xs">
                        <tbody>
                          {enhanced.parameters.map((p, i) => (
                            <tr key={i} className="border-b border-white/5">
                              <td className="text-white/60 py-0.5 pr-3">{p.label}</td>
                              <td className="text-cyan-400 font-mono py-0.5 pr-2">{p.normalValue}</td>
                              <td className="text-white/40 py-0.5">{p.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Normal vs Fault status */}
                  {enhanced && (
                    <div className="flex gap-2 text-[10px]">
                      <span className="text-green-400">Normal: {enhanced.normalStatus}</span>
                      <span className="text-red-400">Fault: {enhanced.faultStatus}</span>
                    </div>
                  )}
                </div>
              );
            })()}

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

          {/* Summary Flow - Visual Flowchart */}
          <div className="mt-6 glass-card p-6">
            <h4 className="text-white font-bold text-sm mb-4 text-center">Alur Kerja Sistem Proteksi</h4>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: 'Gangguan Terjadi', desc: 'Hubung singkat, arus lebih, dll.', color: '#ff4466', icon: '⚡' },
                { label: 'CT/PT Mendeteksi', desc: 'Arus & tegangan berubah', color: '#00d4ff', icon: '📡' },
                { label: 'Relay Menganalisis', desc: 'Membandingkan dengan setting', color: '#ffaa00', icon: '🧠' },
                { label: 'Relay Aktif', desc: 'Mengirim sinyal trip', color: '#ff8800', icon: '🔔' },
                { label: 'Trip Coil Bekerja', desc: 'Energize mekanisme CB', color: '#8844ff', icon: '⚡' },
                { label: 'CB TRIP', desc: 'Rangkaian terbuka', color: '#ff6600', icon: '🔓' },
                { label: 'Generator Aman', desc: 'Terputus dari sistem', color: '#00ff88', icon: '✅' },
              ].map((step, idx, arr) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div
                    className="flex flex-col items-center px-3 py-2 rounded-lg border min-w-[80px]"
                    style={{ borderColor: step.color + '44', background: step.color + '11' }}
                  >
                    <span className="text-lg">{step.icon}</span>
                    <span className="text-[9px] font-bold text-center" style={{ color: step.color }}>{step.label}</span>
                    <span className="text-[8px] text-white/40 text-center">{step.desc}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <svg width="24" height="12" viewBox="0 0 24 12" className="shrink-0 hidden sm:block">
                      <line x1="0" y1="6" x2="18" y2="6" stroke={step.color} strokeWidth="2" className="electricity-flow" />
                      <polygon points="18,2 24,6 18,10" fill={step.color} />
                    </svg>
                  )}
                </div>
              ))}
            </div>
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
            {selectedFault && simulationPhase >= 4 && (
              <button
                onClick={() => selectFault(selectedFault)}
                className="glow-btn text-sm"
                style={{ background: 'linear-gradient(135deg, #00aaff, #0066ff)' }}
              >
                ↻ Replay Simulasi
              </button>
            )}
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

          {/* Tutorial Panel (shown when simulation active) */}
          {currentTutorialSteps && simulationPhase > 0 && (
            <div className="mt-4 glass-card p-4 sm:p-6 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2 mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                <h4 className="text-amber-400 font-bold text-sm">Tutorial Langkah-langkah</h4>
              </div>

              {currentTutorialStep && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">
                      Langkah {currentTutorialStep.phase}/5
                    </span>
                    <span className="text-white font-bold text-sm">{currentTutorialStep.title}</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{currentTutorialStep.description}</p>
                  <p className="text-white/40 text-xs mt-2 font-mono">
                    Highlight: {currentTutorialStep.highlightComponent.toUpperCase()}
                  </p>
                </div>
              )}

              {/* Progress dots */}
              <div className="flex items-center gap-2">
                {currentTutorialSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i === tutorialStep
                        ? 'bg-amber-400 scale-125'
                        : i < tutorialStep
                          ? 'bg-amber-400/50'
                          : 'bg-white/20'
                    }`}
                  />
                ))}
                <span className="text-white/40 text-xs ml-2">
                  {tutorialStep + 1} / {currentTutorialSteps.length}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Real-time Monitoring Panel */}
            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">Parameter Operasi</h3>

              {/* Visual Gauges Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Voltage Gauge */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                  <svg viewBox="0 0 120 70" className="w-full">
                    {/* Gauge background arc */}
                    <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
                    {/* Green zone (9-12.5 kV) */}
                    <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke="rgba(0,255,136,0.25)" strokeWidth="8" strokeLinecap="round" strokeDasharray="0 141" />
                    {/* Yellow warning zone markers */}
                    <line x1="25" y1="55" x2="30" y2="48" stroke="rgba(255,170,0,0.4)" strokeWidth="1" />
                    <line x1="95" y1="55" x2="90" y2="48" stroke="rgba(255,170,0,0.4)" strokeWidth="1" />
                    {/* Needle */}
                    {(() => {
                      const avgV = (monitoringData.voltageR + monitoringData.voltageS + monitoringData.voltageT) / 3;
                      const minV = 0, maxV = 16;
                      const pct = Math.max(0, Math.min(1, (avgV - minV) / (maxV - minV)));
                      const angle = -90 + pct * 180;
                      const rad = (angle * Math.PI) / 180;
                      const nx = 60 + 38 * Math.cos(rad);
                      const ny = 60 + 38 * Math.sin(rad);
                      const vColor = avgV >= 9.5 && avgV <= 12.5 ? '#00ff88' : avgV >= 8 || avgV <= 13.5 ? '#ffaa00' : '#ff4466';
                      return (
                        <>
                          <line x1="60" y1="60" x2={nx} y2={ny} stroke={vColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.8s ease' }} />
                          <circle cx="60" cy="60" r="4" fill={vColor} />
                        </>
                      );
                    })()}
                    {/* Labels */}
                    <text x="12" y="68" fill="rgba(255,255,255,0.3)" fontSize="6">0</text>
                    <text x="56" y="18" fill="rgba(255,255,255,0.3)" fontSize="6">8</text>
                    <text x="100" y="68" fill="rgba(255,255,255,0.3)" fontSize="6">16</text>
                    <text x="60" y="68" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">kV</text>
                  </svg>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Tegangan</div>
                  <div className={`text-sm font-bold font-mono ${monColor((monitoringData.voltageR + monitoringData.voltageS + monitoringData.voltageT) / 3, normalParameters.voltageR, 0.15)}`}>
                    {((monitoringData.voltageR + monitoringData.voltageS + monitoringData.voltageT) / 3).toFixed(1)} kV
                  </div>
                </div>

                {/* Current Gauge */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                  <svg viewBox="0 0 120 70" className="w-full">
                    <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
                    <line x1="25" y1="55" x2="30" y2="48" stroke="rgba(255,170,0,0.4)" strokeWidth="1" />
                    <line x1="95" y1="55" x2="90" y2="48" stroke="rgba(255,170,0,0.4)" strokeWidth="1" />
                    {(() => {
                      const minI = 0, maxI = 3000;
                      const pct = Math.max(0, Math.min(1, (monitoringData.current - minI) / (maxI - minI)));
                      const angle = -90 + pct * 180;
                      const rad = (angle * Math.PI) / 180;
                      const nx = 60 + 38 * Math.cos(rad);
                      const ny = 60 + 38 * Math.sin(rad);
                      const iColor = monitoringData.current <= 500 ? '#00ff88' : monitoringData.current <= 800 ? '#ffaa00' : '#ff4466';
                      return (
                        <>
                          <line x1="60" y1="60" x2={nx} y2={ny} stroke={iColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.8s ease' }} />
                          <circle cx="60" cy="60" r="4" fill={iColor} />
                        </>
                      );
                    })()}
                    <text x="12" y="68" fill="rgba(255,255,255,0.3)" fontSize="6">0</text>
                    <text x="56" y="18" fill="rgba(255,255,255,0.3)" fontSize="6">1.5k</text>
                    <text x="100" y="68" fill="rgba(255,255,255,0.3)" fontSize="6">3k</text>
                    <text x="60" y="68" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">A</text>
                  </svg>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Arus</div>
                  <div className={`text-sm font-bold font-mono ${monColor(monitoringData.current, normalParameters.current, 0.3)}`}>
                    {monitoringData.current.toFixed(0)} A
                  </div>
                </div>

                {/* Frequency Gauge */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                  <svg viewBox="0 0 120 70" className="w-full">
                    <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
                    {/* Green zone markers (49-51 Hz) */}
                    <line x1="38" y1="52" x2="40" y2="45" stroke="rgba(0,255,136,0.4)" strokeWidth="1" />
                    <line x1="82" y1="52" x2="80" y2="45" stroke="rgba(0,255,136,0.4)" strokeWidth="1" />
                    {(() => {
                      const minF = 46, maxF = 54;
                      const pct = Math.max(0, Math.min(1, (monitoringData.frequency - minF) / (maxF - minF)));
                      const angle = -90 + pct * 180;
                      const rad = (angle * Math.PI) / 180;
                      const nx = 60 + 38 * Math.cos(rad);
                      const ny = 60 + 38 * Math.sin(rad);
                      const fColor = monitoringData.frequency >= 49 && monitoringData.frequency <= 51 ? '#00ff88' : monitoringData.frequency >= 47.5 && monitoringData.frequency <= 52.5 ? '#ffaa00' : '#ff4466';
                      return (
                        <>
                          <line x1="60" y1="60" x2={nx} y2={ny} stroke={fColor} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.8s ease' }} />
                          <circle cx="60" cy="60" r="4" fill={fColor} />
                        </>
                      );
                    })()}
                    <text x="12" y="68" fill="rgba(255,255,255,0.3)" fontSize="6">46</text>
                    <text x="56" y="18" fill="rgba(255,255,255,0.3)" fontSize="6">50</text>
                    <text x="98" y="68" fill="rgba(255,255,255,0.3)" fontSize="6">54</text>
                    <text x="60" y="68" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Hz</text>
                  </svg>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Frekuensi</div>
                  <div className={`text-sm font-bold font-mono ${monColor(monitoringData.frequency, normalParameters.frequency, 0.05)}`}>
                    {monitoringData.frequency.toFixed(1)} Hz
                  </div>
                </div>
              </div>

              {/* Power Factor Bar */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider">Faktor Daya (cos φ)</span>
                  <span className={`text-sm font-bold font-mono ${Math.abs(monitoringData.powerFactor) < 0.7 ? 'text-red-400' : Math.abs(monitoringData.powerFactor) < 0.85 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {monitoringData.powerFactor.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative">
                  {/* Color segments */}
                  <div className="absolute inset-0 flex">
                    <div className="h-full bg-red-500/30" style={{ width: '50%' }} />
                    <div className="h-full bg-yellow-500/30" style={{ width: '20%' }} />
                    <div className="h-full bg-green-500/30" style={{ width: '30%' }} />
                  </div>
                  {/* Indicator needle */}
                  <div
                    className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg"
                    style={{ left: `${Math.max(0, Math.min(100, Math.abs(monitoringData.powerFactor) * 100))}%`, transition: 'left 0.8s ease' }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-white/30 mt-0.5">
                  <span>0</span><span>0.5</span><span>0.7</span><span>0.85</span><span>1.0</span>
                </div>
              </div>

              {/* Phase Voltage Bar Chart */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2">Tegangan Fasa R / S / T</div>
                <div className="flex items-end gap-4 h-16">
                  {[
                    { label: 'R', value: monitoringData.voltageR, normal: normalParameters.voltageR, color: '#ff4444' },
                    { label: 'S', value: monitoringData.voltageS, normal: normalParameters.voltageS, color: '#ffaa00' },
                    { label: 'T', value: monitoringData.voltageT, normal: normalParameters.voltageT, color: '#4488ff' },
                  ].map((phase) => {
                    const pct = Math.max(5, Math.min(100, (phase.value / 16) * 100));
                    const isNormal = Math.abs(phase.value - phase.normal) / phase.normal < 0.15;
                    return (
                      <div key={phase.label} className="flex-1 flex flex-col items-center">
                        <span className="text-[9px] font-mono font-bold" style={{ color: isNormal ? '#00ff88' : '#ff4466' }}>
                          {phase.value.toFixed(1)}
                        </span>
                        <div className="w-full bg-white/10 rounded-sm overflow-hidden h-12 relative">
                          {/* Normal reference line */}
                          <div className="absolute bottom-0 w-full border-t border-dashed border-white/20" style={{ height: `${(phase.normal / 16) * 100}%` }} />
                          <div
                            className="absolute bottom-0 w-full rounded-sm transition-all duration-700"
                            style={{ height: `${pct}%`, background: isNormal ? `${phase.color}66` : `${phase.color}cc` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold mt-0.5" style={{ color: phase.color }}>{phase.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Number Grid */}
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
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-bold text-cyan-400">Event Log</h3>
                <div className="flex gap-2">
                  <button
                    onClick={exportEventLog}
                    disabled={eventLog.length === 0}
                    className="glow-btn-yellow text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={exportEventLogPDF}
                    disabled={eventLog.length === 0}
                    className="glow-btn text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Export PDF
                  </button>
                </div>
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

      {/* ====================== SECTION 11b: MONITORING REAL-TIME (DEDICATED) ====================== */}
      <section id="monitoring" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title">Panel Monitoring Real-Time</h2>
          <p className="section-subtitle">
            Pantau parameter operasi generator secara real-time — tegangan, arus, frekuensi, daya, dan faktor daya
          </p>

          {/* System Status Banner */}
          <div className={`mb-6 p-4 rounded-xl border ${
            diagramState.status === 'normal'
              ? 'bg-green-500/10 border-green-500/30'
              : diagramState.status === 'gangguan'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  diagramState.status === 'normal' ? 'bg-green-500' : diagramState.status === 'gangguan' ? 'bg-red-500 alarm-blink' : 'bg-yellow-500'
                }`} />
                <span className="text-white font-bold text-lg">
                  {diagramState.status === 'normal' ? 'SISTEM NORMAL' : diagramState.status === 'gangguan' ? 'GANGGUAN TERDETEKSI' : 'GENERATOR TERPUTUS'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-white/50">CB: <span className={diagramState.cbStatus === 'ON' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{diagramState.cbStatus}</span></span>
                <span className="text-white/50">Relay: <span className={diagramState.relayAktif.length > 0 ? 'text-red-400 font-bold' : 'text-cyan-400'}>{diagramState.relayAktif.length > 0 ? diagramState.relayAktif.join(', ') : 'Tidak Ada'}</span></span>
              </div>
            </div>
          </div>

          {/* Monitoring Gauge Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {/* Voltage R */}
            <div className="monitor-gauge">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Tegangan R</div>
              <div className={`text-2xl font-bold font-mono ${monColor(monitoringData.voltageR, normalParameters.voltageR, 0.15)}`}>
                {monitoringData.voltageR.toFixed(1)}
              </div>
              <div className="text-xs text-white/40">kV</div>
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    Math.abs(monitoringData.voltageR - normalParameters.voltageR) / normalParameters.voltageR > 0.15 ? 'bg-red-500' :
                    Math.abs(monitoringData.voltageR - normalParameters.voltageR) / normalParameters.voltageR > 0.07 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((monitoringData.voltageR / (normalParameters.voltageR * 1.3)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Voltage S */}
            <div className="monitor-gauge">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Tegangan S</div>
              <div className={`text-2xl font-bold font-mono ${monColor(monitoringData.voltageS, normalParameters.voltageS, 0.15)}`}>
                {monitoringData.voltageS.toFixed(1)}
              </div>
              <div className="text-xs text-white/40">kV</div>
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    Math.abs(monitoringData.voltageS - normalParameters.voltageS) / normalParameters.voltageS > 0.15 ? 'bg-red-500' :
                    Math.abs(monitoringData.voltageS - normalParameters.voltageS) / normalParameters.voltageS > 0.07 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((monitoringData.voltageS / (normalParameters.voltageS * 1.3)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Voltage T */}
            <div className="monitor-gauge">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Tegangan T</div>
              <div className={`text-2xl font-bold font-mono ${monColor(monitoringData.voltageT, normalParameters.voltageT, 0.15)}`}>
                {monitoringData.voltageT.toFixed(1)}
              </div>
              <div className="text-xs text-white/40">kV</div>
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    Math.abs(monitoringData.voltageT - normalParameters.voltageT) / normalParameters.voltageT > 0.15 ? 'bg-red-500' :
                    Math.abs(monitoringData.voltageT - normalParameters.voltageT) / normalParameters.voltageT > 0.07 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((monitoringData.voltageT / (normalParameters.voltageT * 1.3)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Current */}
            <div className="monitor-gauge">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Arus Total</div>
              <div className={`text-2xl font-bold font-mono ${monColor(monitoringData.current, normalParameters.current, 0.3)}`}>
                {monitoringData.current.toFixed(0)}
              </div>
              <div className="text-xs text-white/40">A</div>
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    Math.abs(monitoringData.current - normalParameters.current) / normalParameters.current > 0.3 ? 'bg-red-500' :
                    Math.abs(monitoringData.current - normalParameters.current) / normalParameters.current > 0.15 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((monitoringData.current / (normalParameters.current * 2)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Frequency */}
            <div className="monitor-gauge">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Frekuensi</div>
              <div className={`text-2xl font-bold font-mono ${monColor(monitoringData.frequency, normalParameters.frequency, 0.05)}`}>
                {monitoringData.frequency.toFixed(1)}
              </div>
              <div className="text-xs text-white/40">Hz</div>
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    Math.abs(monitoringData.frequency - normalParameters.frequency) / normalParameters.frequency > 0.05 ? 'bg-red-500' :
                    Math.abs(monitoringData.frequency - normalParameters.frequency) / normalParameters.frequency > 0.02 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((monitoringData.frequency / (normalParameters.frequency * 1.1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Power & PF Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {/* Active Power */}
            <div className="glass-card p-4 text-center">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Daya Aktif</div>
              <div className={`text-xl font-bold font-mono ${monitoringData.activePower < 0 ? 'text-red-400' : monColor(monitoringData.activePower, normalParameters.activePower, 0.3)}`}>
                {monitoringData.activePower.toFixed(1)}
              </div>
              <div className="text-xs text-white/40">MW</div>
            </div>

            {/* Reactive Power */}
            <div className="glass-card p-4 text-center">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Daya Reaktif</div>
              <div className={`text-xl font-bold font-mono ${monitoringData.reactivePower < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {monitoringData.reactivePower.toFixed(1)}
              </div>
              <div className="text-xs text-white/40">MVAr</div>
            </div>

            {/* Power Factor */}
            <div className="glass-card p-4 text-center">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Faktor Daya</div>
              <div className={`text-xl font-bold font-mono ${Math.abs(monitoringData.powerFactor) < 0.7 ? 'text-red-400' : Math.abs(monitoringData.powerFactor) < 0.85 ? 'text-yellow-400' : 'text-green-400'}`}>
                {monitoringData.powerFactor.toFixed(2)}
              </div>
              <div className="text-xs text-white/40">cos φ</div>
            </div>

            {/* Load Status */}
            <div className="glass-card p-4">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2 text-center">Status Beban</div>
              <div className="space-y-1.5">
                {[
                  { label: 'Beban 1', active: monitoringData.load1 },
                  { label: 'Beban 2', active: monitoringData.load2 },
                  { label: 'Beban 3', active: monitoringData.load3 },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2 text-xs">
                    <div className={`w-2.5 h-2.5 rounded-full ${l.active ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className={l.active ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{l.active ? 'Aktif' : 'Padam'}</span>
                    <span className="text-white/40">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Normal Reference Values */}
          <div className="glass-card p-4 sm:p-6">
            <h3 className="text-sm font-bold text-cyan-400 mb-3">Nilai Normal Referensi</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/50">V<sub>R</sub></span>
                <span className="text-green-400 font-mono">{normalParameters.voltageR.toFixed(1)} kV</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/50">V<sub>S</sub></span>
                <span className="text-green-400 font-mono">{normalParameters.voltageS.toFixed(1)} kV</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/50">V<sub>T</sub></span>
                <span className="text-green-400 font-mono">{normalParameters.voltageT.toFixed(1)} kV</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/50">I</span>
                <span className="text-green-400 font-mono">{normalParameters.current.toFixed(0)} A</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/50">f</span>
                <span className="text-green-400 font-mono">{normalParameters.frequency.toFixed(1)} Hz</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/50">P</span>
                <span className="text-green-400 font-mono">{normalParameters.activePower.toFixed(1)} MW</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/50">Q</span>
                <span className="text-green-400 font-mono">{normalParameters.reactivePower.toFixed(1)} MVAr</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/50">cos φ</span>
                <span className="text-green-400 font-mono">{normalParameters.powerFactor.toFixed(2)}</span>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={exportEventLog}
                disabled={eventLog.length === 0}
                className="glow-btn-yellow text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Export CSV
              </button>
              <button
                onClick={exportEventLogPDF}
                disabled={eventLog.length === 0}
                className="glow-btn text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Export PDF
              </button>
              {eventLog.length === 0 && (
                <span className="text-white/30 text-xs">Jalankan simulasi terlebih dahulu untuk mengaktifkan export</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
