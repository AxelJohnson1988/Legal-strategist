import React, { useEffect, useState, useRef } from 'react';
import { Terminal, ShieldAlert, Cpu, Database, Activity, HardDrive, KeyRound, Lock, ZoomIn, ZoomOut, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogLine {
  timestamp: string;
  subsystem: string;
  type: 'INFO' | 'SUCCESS' | 'WARN' | 'SECURE';
  message: string;
  hash?: string;
}

interface WardenLogsProps {
  isZoomed?: boolean;
  onToggleZoom?: () => void;
}

const GLOSSARY = {
  ceph: {
    title: 'Ceph Storage Layer',
    simpleTitle: 'Redundant Secure Cloud Storage',
    desc: 'Ceph is a highly redundant cloud-based storage system. It distributes your active case files across multiple live server nodes so that if one server goes down, your data remains 100% healthy, private, and immediately accessible.',
  },
  worm: {
    title: 'WORM Entropy Stream',
    simpleTitle: 'Anti-Tamper Cryptographic Locking',
    desc: 'WORM (Write Once, Read Many) is a security storage rule: once a file or audit record is written, it is permanently locked and can never be modified or deleted. "Entropy" represents the mathematical randomness of the background security keys: high entropy (close to 1.0) means keys are 100% unpredictable, absolutely blocking unauthorized hackers.',
  },
  mtls: {
    title: 'mTLS Handshake Gateway',
    simpleTitle: 'Two-Way Session Security Verification',
    desc: 'Mutual TLS (mTLS) is a double-sided secure connection. Standard websites only verify the server, but mTLS requires BOTH your browser and our servers to verify each other using dynamic private security keys, making connection interception virtually impossible.',
  },
  temp: {
    title: 'Isolated Core Enclave Temp',
    simpleTitle: 'Cloud Server Computing Load',
    desc: 'Measures the thermal load of the private physical hardware chip hosting your case files. Keeping the core temperature low (typically 40°C–55°C) ensures ultra-fast, stable AI reasoning and secures database operations against heat-based side-channel attacks.',
  },
  wardenNode: {
    title: 'Warden Daemon Audit Node',
    simpleTitle: 'Secure Background System Monitor',
    desc: 'The Warden Daemon is an automatic background security manager. It runs continuous, isolated tracking tasks inside the server memory, instantly logging system activities (like file uploads, OCR processing, and SMTP mail queueing) to an unalterable compliance ledger for court readiness.',
  }
};

export const WardenLogs: React.FC<WardenLogsProps> = ({ isZoomed = false, onToggleZoom }) => {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [entropy, setEntropy] = useState<number>(0.992);
  const [cryptoKey, setCryptoKey] = useState<string>('PHX-AES-256-WORM-SHA256-v1.07');
  const [clusterUsage, setClusterUsage] = useState({ podCount: 8, nodeTemp: 44, cephSync: '100% HEALTHY' });
  const [isSimplified, setIsSimplified] = useState<boolean>(true); // Default to true (simplified) as requested to avoid confusion first, but let user toggle
  const [activeTooltip, setActiveTooltip] = useState<'ceph' | 'worm' | 'mtls' | 'temp' | 'wardenNode' | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Initial base logs
  const SUB_SYSTEMS = ['MTLS-GATEWAY', 'CEPH-ENCRYPT', 'WORM-AUDITOR', 'K8S-MICRO-VM', 'GHOSTSAFE-LEDGER', 'WardenDaemon'];
  const MESSAGES_POOL = [
    { type: 'INFO', msg: 'Polling mTLS certificate status from local hardware keychain... Authorized.' },
    { type: 'SECURE', msg: 'Hashed transaction anchored to Akashic Core. [GLYPH-8f3a1d-b52e7c]' },
    { type: 'SUCCESS', msg: 'EVA thermodynamic Consent Gate passed. (\\Delta H < 0) \\wedge (\\Delta E \\leq 0).' },
    { type: 'INFO', msg: 'Ceph distributed storage sync fully verified. Write-Once-Read-Many block locked.' },
    { type: 'WARN', msg: 'Minor entropy deviation detected in hardware RNG sidecar. Calibrating...' },
    { type: 'SECURE', msg: 'Zero-Trust secure proxy routing active. Port 3000 sandboxed successfully.' },
    { type: 'SUCCESS', msg: 'GHOSTSAFE local node emitted compliance Merkle proof.' }
  ];

  const generateLog = (): LogLine => {
    const subsystem = SUB_SYSTEMS[Math.floor(Math.random() * SUB_SYSTEMS.length)];
    const roll = MESSAGES_POOL[Math.floor(Math.random() * MESSAGES_POOL.length)];
    const hash = '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return {
      timestamp: new Date().toLocaleTimeString(),
      subsystem,
      type: roll.type as any,
      message: roll.msg,
      hash
    };
  };

  useEffect(() => {
    // Generate initial logs
    const initialLogs = Array.from({ length: 8 }, generateLog);
    setLogs(initialLogs);

    const handleNewLog = (e: Event) => {
      const customEvent = e as CustomEvent<LogLine>;
      if (customEvent.detail) {
        setLogs((prev) => [...prev.slice(-15), customEvent.detail]);
      }
    };
    window.addEventListener('new-warden-log', handleNewLog);

    const interval = setInterval(() => {
      setEntropy((prev) => Math.min(1.0, Math.max(0.95, prev + (Math.random() - 0.5) * 0.01)));
      setClusterUsage((prev) => ({
        ...prev,
        nodeTemp: Math.floor(40 + Math.random() * 8),
      }));
    }, 6000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('new-warden-log', handleNewLog);
    };
  }, []);

  useEffect(() => {
    const scrollContainer = logEndRef.current?.parentElement;
    if (scrollContainer) {
      // Smart Scroll Lock: Only auto-scroll down if the user was already looking near the bottom
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 50;
      if (isNearBottom) {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-neutral-950/70 border border-white/5 rounded-[2rem] p-6 text-neutral-300 relative overflow-hidden font-mono text-[11px] leading-relaxed shadow-xl">
      {/* Design accents */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
        <div 
          onMouseEnter={() => setActiveTooltip('wardenNode')}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip === 'wardenNode' ? null : 'wardenNode')}
          className="flex items-center gap-2 cursor-help group p-1 -m-1 rounded-lg hover:bg-white/5 transition-all"
        >
          <Terminal size={14} className="text-emerald-400" />
          <span className="text-white font-bold uppercase tracking-wider text-[10px]">
            {isSimplified ? GLOSSARY.wardenNode.simpleTitle : GLOSSARY.wardenNode.title}
          </span>
          <span className="text-[9px] text-purple-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-purple-950/60 px-1 rounded uppercase">Help</span>
        </div>
        <div className="flex items-center gap-2">
          {onToggleZoom && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleZoom(); }}
              className="p-1 px-2.5 bg-neutral-950/60 hover:bg-neutral-900 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all"
            >
              {isZoomed ? (
                <>
                  <ZoomOut size={11} className="text-purple-400" />
                  <span>Snap Grid</span>
                </>
              ) : (
                <>
                  <ZoomIn size={11} className="text-emerald-400" />
                  <span>Focus Log</span>
                </>
              )}
            </button>
          )}
          <span className="text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            ZTNA Node Active
          </span>
        </div>
      </div>

      {/* Grid status overview cards with hover/click explanations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 font-sans relative">
        {/* Card 1: Ceph Layer */}
        <div 
          onMouseEnter={() => setActiveTooltip('ceph')}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip === 'ceph' ? null : 'ceph')}
          className={`p-2 sm:p-2.5 rounded-2xl flex items-center gap-2 cursor-help transition-all relative group select-none border ${
            activeTooltip === 'ceph'
              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg'
              : 'bg-neutral-900/40 border-white/5 hover:border-emerald-500/20 hover:bg-neutral-900/60'
          }`}
        >
          <div className="p-1.5 rounded-lg bg-emerald-950/30 text-emerald-400 shrink-0">
            <HardDrive size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono truncate leading-tight">
              {isSimplified ? 'Storage' : 'Ceph Layer'}
            </p>
            <p className="text-[10px] sm:text-xs font-black text-white tracking-tight mt-0.5">{clusterUsage.cephSync}</p>
          </div>
          <span className="text-[7px] font-mono font-bold bg-neutral-950 text-emerald-400/80 px-1 rounded absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">INFO</span>
        </div>

        {/* Card 2: WORM Entropy */}
        <div 
          onMouseEnter={() => setActiveTooltip('worm')}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip === 'worm' ? null : 'worm')}
          className={`p-2 sm:p-2.5 rounded-2xl flex items-center gap-2 cursor-help transition-all relative group select-none border ${
            activeTooltip === 'worm'
              ? 'bg-purple-950/20 border-purple-500/40 shadow-lg'
              : 'bg-neutral-900/40 border-white/5 hover:border-purple-500/20 hover:bg-neutral-900/60'
          }`}
        >
          <div className="p-1.5 rounded-lg bg-purple-950/30 text-purple-400 shrink-0">
            <Activity size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono truncate leading-tight">
              {isSimplified ? 'Anti-Tamper' : 'WORM Entropy'}
            </p>
            <p className="text-[10px] sm:text-xs font-black text-white tracking-tight mt-0.5">{entropy.toFixed(4)}</p>
          </div>
          <span className="text-[7px] font-mono font-bold bg-neutral-950 text-purple-400/80 px-1 rounded absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">INFO</span>
        </div>

        {/* Card 3: mTLS Handshake */}
        <div 
          onMouseEnter={() => setActiveTooltip('mtls')}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip === 'mtls' ? null : 'mtls')}
          className={`p-2 sm:p-2.5 rounded-2xl flex items-center gap-2 cursor-help transition-all relative group select-none border ${
            activeTooltip === 'mtls'
              ? 'bg-blue-950/20 border-blue-500/40 shadow-lg'
              : 'bg-neutral-900/40 border-white/5 hover:border-blue-500/20 hover:bg-neutral-900/60'
          }`}
        >
          <div className="p-1.5 rounded-lg bg-blue-950/30 text-blue-400 shrink-0">
            <KeyRound size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono truncate leading-tight">
              {isSimplified ? 'mTLS' : 'mTLS Handshake'}
            </p>
            <p className="text-[10px] sm:text-xs font-black text-white tracking-tight mt-0.5 uppercase">VERIFIED</p>
          </div>
          <span className="text-[7px] font-mono font-bold bg-neutral-950 text-blue-400/80 px-1 rounded absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">INFO</span>
        </div>

        {/* Card 4: Core Temp */}
        <div 
          onMouseEnter={() => setActiveTooltip('temp')}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip === 'temp' ? null : 'temp')}
          className={`p-2 sm:p-2.5 rounded-2xl flex items-center gap-2 cursor-help transition-all relative group select-none border ${
            activeTooltip === 'temp'
              ? 'bg-orange-950/20 border-orange-500/40 shadow-lg'
              : 'bg-neutral-900/40 border-white/5 hover:border-orange-500/20 hover:bg-neutral-900/60'
          }`}
        >
          <div className="p-1.5 rounded-lg bg-orange-950/30 text-orange-400 shrink-0">
            <Cpu size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono truncate leading-tight">
              {isSimplified ? 'Load' : 'Core Temp'}
            </p>
            <p className="text-[10px] sm:text-xs font-black text-white tracking-tight mt-0.5">{isSimplified ? `${clusterUsage.nodeTemp}°C` : `${clusterUsage.nodeTemp}°C (Stable)`}</p>
          </div>
          <span className="text-[7px] font-mono font-bold bg-neutral-950 text-orange-400/80 px-1 rounded absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">INFO</span>
        </div>
      </div>

      {/* Dynamic Explainer Alert Banner inside the console */}
      <AnimatePresence mode="wait">
        {activeTooltip ? (
          <motion.div
            key={activeTooltip}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="mb-4 p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl font-sans text-neutral-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] bg-purple-950 text-purple-400 font-extrabold font-mono px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-wider">
                    {activeTooltip === 'wardenNode' ? 'Node Monitor' : `Metric: ${activeTooltip.toUpperCase()}`}
                  </span>
                  <span className="text-gray-500 font-bold">•</span>
                  <h4 className="text-xs font-black text-white uppercase tracking-tight">{GLOSSARY[activeTooltip].simpleTitle}</h4>
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed font-light pt-1">
                  {GLOSSARY[activeTooltip].desc}
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveTooltip(null); }}
                className="text-gray-500 hover:text-white text-xs font-bold font-mono px-1.5 py-0.5 rounded hover:bg-white/5"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="mb-4 py-2 px-3 bg-neutral-900/15 border border-dashed border-white/5 rounded-2xl flex items-center justify-between text-[9px] text-gray-500 font-sans gap-2">
            <span className="flex items-center gap-1 leading-none">
              <HelpCircle size={10} className="text-purple-400/80 animate-pulse shrink-0" />
              Hover or click status boxes to translate or reveal friendly explanations.
            </span>
            <button
              onClick={() => setIsSimplified(!isSimplified)}
              className="px-2.5 py-1 bg-purple-950/50 hover:bg-purple-950/80 text-purple-300 hover:text-white rounded-lg border border-purple-500/30 text-[8px] font-bold uppercase tracking-wider transition-all"
            >
              Mode: {isSimplified ? 'Simple Names' : 'Technical Names'}
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Realtime Terminal Flow */}
      <div className={`flex-1 bg-neutral-950 rounded-2xl p-4 border border-white/5 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 select-all custom-scrollbar ${isZoomed ? 'max-h-full' : 'max-h-[160px]'}`}>
        {logs.map((log, index) => (
          <div key={index} className="border-l-2 pl-2 border-white/5 hover:border-emerald-500/20 py-0.5" >
            <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-gray-500 font-bold uppercase block">
              <span className="text-neutral-600">[{log.timestamp}]</span>
              <span className="text-purple-400">@{log.subsystem}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[8px] ${
                log.type === 'SUCCESS' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/20' :
                log.type === 'WARN' ? 'bg-amber-950/50 text-amber-500 border border-amber-500/20' :
                log.type === 'SECURE' ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-500/20' :
                'bg-neutral-900 border border-white/5 text-neutral-400'
              }`}>{log.type}</span>
            </div>
            <p className="text-gray-300 text-[10px] mt-0.5">{log.message}</p>
            {log.hash && (
              <p className="text-[8px] text-neutral-600 font-mono tracking-tight font-light">{log.hash}</p>
            )}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Crytographic credentials status bar */}
      <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap justify-between items-center gap-2">
        <span className="text-[9px] text-neutral-500 flex items-center gap-1 uppercase tracking-widest">
          <Lock size={10} className="text-neutral-500" />
          CIPHER MATRIX: {cryptoKey}
        </span>
        <span className="text-[8px] text-neutral-600 tracking-wider">
          Node-K8s-ID: proxmox-minneapolis-baremetal-node-3a
        </span>
      </div>
    </div>
  );
};
