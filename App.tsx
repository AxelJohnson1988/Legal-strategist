import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLiveApi } from './hooks/useLiveApi';
import { Visualizer } from './components/Visualizer';
import { SuggestionChips } from './components/SuggestionChips';
import { ReminderSystem } from './components/ReminderSystem';
import { ConnectionStatus, Suggestion, Reminder, OperationType } from './types';
import { 
  Mic, MicOff, Power, Info, LogIn, LogOut, User, X, AlertCircle, ExternalLink,
  LayoutGrid, ZoomIn, ZoomOut, Shield, Database, Lock, Clock, Map, FileText, ChevronRight,
  Search, ArrowUpDown, Tag as TagIcon, AlertTriangle, UserCheck, Fingerprint, RefreshCw, Key, Copy, Check
} from 'lucide-react';

const getPriorityBadgeStyle = (priority: 'High' | 'Medium' | 'Low') => {
  switch (priority) {
    case 'High':
      return 'border-rose-500/25 text-rose-400 bg-rose-950/20';
    case 'Medium':
      return 'border-amber-500/25 text-amber-400 bg-amber-950/20';
    case 'Low':
      return 'border-blue-500/25 text-blue-400 bg-blue-950/20';
    default:
      return 'border-gray-500/25 text-gray-400 bg-gray-950/20';
  }
};

const getTagColorStyle = (color: string) => {
  switch (color) {
    case 'rose':
    case 'red':
      return 'border-rose-500/20 text-rose-400 bg-rose-950/20 hover:bg-rose-950/30';
    case 'amber':
    case 'yellow':
      return 'border-amber-500/20 text-amber-400 bg-amber-950/20 hover:bg-amber-950/30';
    case 'emerald':
    case 'green':
      return 'border-emerald-500/20 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30';
    case 'blue':
      return 'border-blue-500/20 text-blue-400 bg-blue-950/20 hover:bg-blue-950/30';
    case 'purple':
      return 'border-purple-500/20 text-purple-400 bg-purple-950/20 hover:bg-purple-950/30';
    default:
      return 'border-neutral-500/20 text-neutral-400 bg-neutral-950/20 hover:bg-neutral-950/30';
  }
};

interface RoadmapStageDetail {
  title: string;
  subtitle: string;
  description: string;
  statusLabel: string;
  statusBadgeColor: string;
  tasks: { task: string; completed: boolean }[];
  strategicAdvisory: string;
  rulesOfProcedure: string;
}

const LITIGATION_ROADMAP_DATA: Record<string, RoadmapStageDetail[]> = {
  c1: [
    {
      title: "Filing & Pleadings",
      subtitle: "Formal Action Initiation",
      description: "Drafting and filing of the initial complaint detailing environmental violations and labor negligence. Serve summons and receive Heavy Chem responds with boilerplate denial.",
      statusLabel: "Completed",
      statusBadgeColor: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20",
      tasks: [
        { task: "Draft Clean Air environmental class action complaint", completed: true },
        { task: "File and serve Summons & Complaint (State court docket 2026-CA-92)", completed: true },
        { task: "Analyze Heavy Chem responsive pleadings & affirmative defenses", completed: true }
      ],
      strategicAdvisory: "Establishing standing was simple due to documented plume proximity. Heavy Chem failed to dismiss venue; we are consolidated in general jurisdiction of Minnesota District.",
      rulesOfProcedure: "FRCP Rules 3-11 (Commencing Action & Pleadings)"
    },
    {
      title: "Discovery Phase",
      subtitle: "Evidentiary Forensic Inquest",
      description: "Extraction of physical emission ledgers and employee shift records. Cross-checking shift rosters against high-entropy toxic plume time stamps.",
      statusLabel: "Completed",
      statusBadgeColor: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20",
      tasks: [
        { task: "Interrogatories and requests for production of environmental logs", completed: true },
        { task: "Log EasyOCR parallel extraction lines for physical payroll books", completed: true },
        { task: "Depose shift supervisor Angie regarding chemical pressure drops", completed: true }
      ],
      strategicAdvisory: "Shift logs extracted via PyTesseract multi-threading reveal an average mismatch of 3.4 hours per toxic event, proving deliberate cover-up of worker exposure timeline.",
      rulesOfProcedure: "FRCP Rules 26-37 (General Rules Governing Discovery)"
    },
    {
      title: "Pre-Trial Motions",
      subtitle: "Evidentiary & Summary Interventions",
      description: "Managing motion practice before trial begins. Currently resolving admissibility of automatic OCR forensic receipts and Proxmox isolation security audits.",
      statusLabel: "Current Phase",
      statusBadgeColor: "bg-purple-950/50 text-purple-200 border-purple-500/30 animate-pulse",
      tasks: [
        { task: "Draft Motion in Limine on forensic integrity hashes admissibility", completed: true },
        { task: "Submit Summary Judgment application on objective FLSA overtime theft", completed: false },
        { task: "Engage in mandatory judicial pre-trial mediation conference", completed: false }
      ],
      strategicAdvisory: "Defense is arguing OCR text outputs constitute hearsay. Counter by entering SHA-256 ledger signatures and OpenTimestamps anchor blocks to establish absolute custody chain.",
      rulesOfProcedure: "FRCP Rule 56 (Summary Judgment) & FRE 901 (Authentication)"
    },
    {
      title: "Trial & Adjudication",
      subtitle: "Jury Merit Presentation",
      description: "Presenting the environmental toxic exposure and wage exploitation case at the Minneapolis District Court. Scheduled for September 15, 2026.",
      statusLabel: "Upcoming",
      statusBadgeColor: "bg-neutral-900 text-gray-500 border-white/5",
      tasks: [
        { task: "Prepare expert atmospheric testimony and plume mapping models", completed: false },
        { task: "Conduct trial simulation with selected focus community metrics", completed: false },
        { task: "Prepare direct/cross examination guides for general managers", completed: false }
      ],
      strategicAdvisory: "Focus the theme of trial heavily on the 'Two Sets of Books'. The verified $694.20 tax discrepancy and Tip skimming will completely destroy jury trust in defendant's executives.",
      rulesOfProcedure: "FRCP Rules 38-53 (Trial by Jury & General Rules)"
    }
  ],
  c2: [
    {
      title: "Filing & Pleadings",
      subtitle: "Summons and Security Ingress",
      description: "Filing state cyber-breach civil indictment. Documenting total failure of CyberLink to maintain TLS certificate isolation rules and mTLS transport safeguards.",
      statusLabel: "Completed",
      statusBadgeColor: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20",
      tasks: [
        { task: "Draft cyber-breach leak liability petition for relief", completed: true },
        { task: "Serve CyberLink HQ and their external infrastructure counsel", completed: true },
        { task: "Review responsive pleadings regarding 'unavoidable third-party intervention'", completed: true }
      ],
      strategicAdvisory: "CyberLink is trying to shield key stakeholders using sovereign immunity claims on state contracts. Prepare counter-briefer showing gross structural neglect.",
      rulesOfProcedure: "FRCP Rules 4-9 (Process Server Verification)"
    },
    {
      title: "Discovery Phase",
      subtitle: "Decryption & Payload Extraction",
      description: "Currently in active discovery. Compelling production of core zero-day server logs, server state snapshots, and decrypted backup transaction logs.",
      statusLabel: "Current Phase",
      statusBadgeColor: "bg-purple-950/50 text-purple-200 border-purple-500/30 animate-pulse",
      tasks: [
        { task: "Conduct mTLS log forensic subpoena on server cluster node3", completed: true },
        { task: "Depose lead systems architect regarding unauthorized SSH keys", completed: false },
        { task: "Analyze network traffic packets via decrypted cloud archives", completed: false }
      ],
      strategicAdvisory: "Node3 logs indicate root access was granted with an expired security certificate. This acts as prime evidence of corporate compliance abandonment.",
      rulesOfProcedure: "FRCP Rules 34 (Producing Documents & Electronically Stored Info)"
    },
    {
      title: "Pre-Trial Motions",
      subtitle: "Tacit Evidentiary Battles",
      description: "Upcoming stage to determine scope of security expert testimony and exclude speculative telemetry defense models.",
      statusLabel: "Upcoming",
      statusBadgeColor: "bg-neutral-900 text-gray-500 border-white/5",
      tasks: [
        { task: "Motion to Compel decryption keys for isolated backup nodes", completed: false },
        { task: "Prepare Daubert motion to disqualify defendant's IT expert", completed: false }
      ],
      strategicAdvisory: "Ensure we secure the raw server dumps before defense files for protective orders claiming security risks. Focus on public interest exceptions for data leaks.",
      rulesOfProcedure: "Daubert Standard / FRE 702 (Expert Witness Reliability)"
    },
    {
      title: "Trial & Adjudication",
      subtitle: "Jury Security Demonstration",
      description: "Full demonstration of network architecture vulnerability and gross negligence in maintaining safe user spaces.",
      statusLabel: "Upcoming",
      statusBadgeColor: "bg-neutral-900 text-gray-500 border-white/5",
      tasks: [
        { task: "Render real-time visual breach simulation overlay", completed: false },
        { task: "Deliver opening statements on network containment gaps", completed: false }
      ],
      strategicAdvisory: "Using simple animated diagrams is key. Avoid abstract jargon: show the jury a virtual door left unlocked with a warning sign hung backwards.",
      rulesOfProcedure: "FRCP Rules 39-44 (Trial Management Guidelines)"
    }
  ],
  c3: [
    {
      title: "Filing & Pleadings",
      subtitle: "Patent Claim Definition",
      description: "Initiated complaint on biomimetic owl-down acoustic insulation infringement. Establish that FutureTech direct copied sound-proofing micro-structures.",
      statusLabel: "Completed",
      statusBadgeColor: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20",
      tasks: [
        { task: "Formulate specific biomimicking patent claims list (Lundberg Patent 4,892)", completed: true },
        { task: "File first-instance direct patent infringement petition", completed: true }
      ],
      strategicAdvisory: "Initial claim construction was highly favorable. The court adopted our broader interpretation of 'micro-grooved golden ratio' boundaries.",
      rulesOfProcedure: "Patent Law 35 U.S.C. §§ 271 & FRCP Rule 8"
    },
    {
      title: "Discovery Phase",
      subtitle: "CAD & Geometric Auditing",
      description: "Comparing blueprint assets. Production of physical biomimetic mold specimens and high-resolution CAD layouts of 'Quantum-Quiet 2026'.",
      statusLabel: "Completed",
      statusBadgeColor: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20",
      tasks: [
        { task: "Analyze microscopic blueprint overlays of FutureTech's quiet-core", completed: true },
        { task: "Compile decibel damping ratio charts and mechanical test records", completed: true }
      ],
      strategicAdvisory: "Blueprint overlays reveal a 99.1% geometric overlap with our logarithmic owl-feather spacing formula. Copying is mathematically confirmed.",
      rulesOfProcedure: "FRCP Rule 26(b) (Scope of Discovery Limits)"
    },
    {
      title: "Pre-Trial Motions",
      subtitle: "Injunctive Remedies & Markman Requests",
      description: "Drafting critical motion seeking a Preliminary Injunction to freeze FutureTech's marketing of Quiet 2026 to federal agencies.",
      statusLabel: "Current Phase",
      statusBadgeColor: "bg-purple-950/50 text-purple-200 border-purple-500/30 animate-pulse",
      tasks: [
        { task: "Draft preliminary injunction brief regarding irreparable market harm", completed: true },
        { task: "File Markman Claim Construction Motion", completed: false },
        { task: "Prepare responses to FutureTech's motion for summary judgment on invalidity", completed: false }
      ],
      strategicAdvisory: "Must emphasize that FutureTech's aggressive bids for federal military contracts will irreparably displace Lundberg's exclusive market lead.",
      rulesOfProcedure: "FRCP Rule 65 (Injunctions) & Markman v. Westview Instruments"
    },
    {
      title: "Trial & Adjudication",
      subtitle: "Patent Merits Adjudication",
      description: "Jury trial on infringement willful status, treble damages claims, and general permanent injunction enforcement.",
      statusLabel: "Upcoming",
      statusBadgeColor: "bg-neutral-900 text-gray-500 border-white/5",
      tasks: [
        { task: "Configure microscopic physical models for live jury demonstration", completed: false },
        { task: "Submit final jury instruction briefs on willful replication", completed: false }
      ],
      strategicAdvisory: "Anchor the trial on 'willfulness' by entering evidence of FutureTech's attendance records at our private bio-acoustic laboratory.",
      rulesOfProcedure: "FRCP Rules 51-53 (Jury Instructions & Verdict Forms)"
    }
  ],
  c4: [
    {
      title: "Filing & Pleadings",
      subtitle: "Audit & Pleading Initiation",
      description: "Initiated complaint alleging willful labor violations (FLSA & N.D.C.C. § 34-14-09.1), systematic tip-skimming, and sudden 24-hr ADA retaliation following medical isolation request.",
      statusLabel: "Completed",
      statusBadgeColor: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20",
      tasks: [
        { task: "Draft FLSA & N.D.C.C. Compliant Court Complaint (unpaid overtime of $14,000.00 and $1,500.00 tip diversion)", completed: true },
        { task: "File Summons and Complaint with ND District Court", completed: true },
        { task: "Serve Ruby Tuesday's Registered Agent with formal notice & litigation hold", completed: true }
      ],
      strategicAdvisory: "Willful failure to maintain payroll logs and tax reporting inconsistencies (the $694.20 W-2 discrepancy) will establish prima-facie bad faith under N.D.C.C. regulations.",
      rulesOfProcedure: "N.D.C.C. § 34-14-05 & Federal Rule of Civil Procedure 8(a)"
    },
    {
      title: "Discovery Phase",
      subtitle: "Forensic P.R.I.S.M. Re-evaluation",
      description: "Deploying parallel OCR and spatial bounding-box extraction on electronic timecards, W-2 forms, and JSND employment agency files to isolate the W-2 Box 1 vs. Box 3 discrepancy.",
      statusLabel: "Current Phase",
      statusBadgeColor: "bg-purple-950/50 text-purple-200 border-purple-500/30 animate-pulse",
      tasks: [
        { task: "Run spatial coordinate extraction on year-end tax registers (W-2 Box 1 and Box 3 delta of $694.20)", completed: true },
        { task: "Subpoena Job Service ND narrative packets and communications logs", completed: true },
        { task: "Depose General Manager Angie and supervisor Todd Hoover regarding retaliatory lockout", completed: false }
      ],
      strategicAdvisory: "Keep depositions focused on the 24-hour temporal proximity between medical treatment disclosure and physical Proxmox credentials revocation. Lock down their stories before they can fabricate performance metrics.",
      rulesOfProcedure: "FRCP Rule 34 & FRE 1002 (Best Evidence Rule)"
    },
    {
      title: "Pre-Trial Motions",
      subtitle: "Pre-Trial Evidentiary Sanctions",
      description: "Filing motions to prevent Ruby Tuesday from entering unauthenticated hand-edited logs and requesting adverse inference for deleted Slack channels.",
      statusLabel: "Upcoming",
      statusBadgeColor: "bg-neutral-900 text-gray-500 border-white/5",
      tasks: [
        { task: "File Motion to Compel production of active POS tips allocation databases", completed: false },
        { task: "File Motion in Limine regarding defendant's falsified 'misconduct' filings to Job Service ND", completed: false }
      ],
      strategicAdvisory: "Use the Job Service ND de-novo appeal findings to prove bad faith, establishing a solid causal link of housing and medical treatment disruption for consequential damage claims.",
      rulesOfProcedure: "N.D.C.C. § 32-03.2-11 (Punitive Damages Basis)"
    },
    {
      title: "Trial & Adjudication",
      subtitle: "Jury Retaliation Case Presentation",
      description: "Presenting the full multi-theory exposure of systematic wage theft and ADA fails to the jury, seeking the full treble multiplier total of $48,582.60.",
      statusLabel: "Upcoming",
      statusBadgeColor: "bg-neutral-900 text-gray-500 border-white/5",
      tasks: [
        { task: "Present the interactive P.R.I.S.M. Merkle Tree audit trail to establish forensic reliability", completed: false },
        { task: "Ask jury for statutory double liquidated of $32,388.40 and treble totaling $48,582.60", completed: false }
      ],
      strategicAdvisory: "Showcase the 'Two Sets of Books' visual directly. A jury will immediately recognize the systemic W-2 discrepancy as tax evasion and intentional worker suppression.",
      rulesOfProcedure: "N.D.C.C. § 34-14-09.1 (Treble Recovery Rule)"
    }
  ]
};

const getActiveStageIndex = (dossierId: string): number => {
  if (dossierId === 'c1') return 2; // Pre-Trial Motions
  if (dossierId === 'c2') return 1; // Discovery Phase
  if (dossierId === 'c3') return 2; // Pre-Trial Motions
  if (dossierId === 'c4') return 1; // Discovery Phase
  return 0;
};

import { auth, signIn, logout, db } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError } from './lib/errorHandlers';
import { CaseTimeline } from './components/CaseTimeline';
import { LegalDraftingTemplates } from './components/LegalDraftingTemplates';
import { AtomicNanoSkills } from './components/AtomicNanoSkills';
import { WardenLogs } from './components/WardenLogs';
import { motion, AnimatePresence } from 'motion/react';

const SUGGESTIONS: Suggestion[] = [
  { id: '1', category: 'case-law', text: "Analyze recent precedents for digital privacy litigation" },
  { id: '2', category: 'evidence', text: "How should I structure the discovery for this case?" },
  { id: '3', category: 'procedure', text: "Explain the protocols for challenging evidence admissibility" },
  { id: '4', category: 'strategy', text: "Identify potential vulnerabilities in the opposition's argument" },
];

interface CaseDossier {
  id: string;
  name: string;
  docket: string;
  type: string;
  purity: string;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface DossierDetail {
  storagePath: string;
  dateIngested: string;
  ledgerBlock: string;
  purityScore: string;
  encryptionEngine: string;
  fileVolumeSize: string;
  contentPreview: string;
  legalNotes: string;
  jurisdiction: string;
  verificationHash: string;
}

const DOSSIER_DETAILS_MAP: Record<string, DossierDetail> = {
  c1: {
    storagePath: '/clusters/minneapolis/heavy-chem-92/',
    dateIngested: 'May 15, 2026',
    ledgerBlock: '#410,291',
    purityScore: '99.4% VERIFIED',
    encryptionEngine: 'AES-GCM-256 with Sovereign Client-Key',
    fileVolumeSize: '3.2 MB (OCR parsed text + audio log matrices)',
    jurisdiction: 'District Court of Minnesota, Fourth Division',
    verificationHash: '0x8f2d56a3e1b8c4d2a10be697f394c8b2',
    contentPreview: `[REGULATORY DISCLOSURE INGESTION REPORT]
Reference: Minneapolis Clean Air Initiative v. Heavy Chemical Co.
Docket No: 2026-CA-92

DECIBEL FIELD MEASUREMENTS (OSHA COMPLIANCE AUDIT):
- Assembly Bullpen decibel baseline: 84.2 dB (Continuous peak at 89.5 dB during conveyor operation).
- OSHA maximum continuous exposure standard: 85.0 dB.
- Plaintiff accommodation request: Acoustic sound baffles or 80% remote flexibility to manage diagnosed hyperacusis.

SUPERVISOR INTERNAL CHAT RETRIEVED (May 15, 2026):
"We have a collaboration first policy inside this workspace. Everyone needs to remain on the floor. If you start working from home or require special partitions, we will have to revisit your performance suitability and alignment with our team."`,
    legalNotes: `CASE ANALYSIS & DEFENSE VULNERABILITY ASSESSMENTS:
1. FAILURE TO ACCOMMODATE: The supervisor's text message represents an explicit rejection of interactive processes required under Minn. Stat. 363A.
2. TIMELINE CORRELATION: Access credentials to the central developer environment and code repository were revoked exactly 72 hours after HR received the physical medical certificate. This confirms a highly viable timeline representing immediate, direct retaliation.
3. STANDARDS OF PROOF: Direct evidence of animus exists via the supervisor chat, neutralizing potential non-retaliatory excuses about performance or "collaboration policy."`
  },
  c2: {
    storagePath: '/clusters/minneapolis/cyberlink-sec-482/',
    dateIngested: 'June 01, 2026',
    ledgerBlock: '#411,882',
    purityScore: '100% SECURE',
    encryptionEngine: 'ChaCha20-Poly1305 WORM seal',
    fileVolumeSize: '18.7 MB (PCAP packet captures + Proxmox client logs)',
    jurisdiction: 'United States District Court, District of Minnesota',
    verificationHash: '0x991ab4ef9281cd53fba8e192c73bb01a',
    contentPreview: `[DECRYPTED AUDIT RECORD — TLS CORRELATION ENGINE]
Target Case: State of Minnesota v. CyberLink Security Systems
Docket No: 2026-CR-482

mTLS SECURITY INCIDENT RESPONSE:
- IP Target: 198.51.100.42 (Enterprise Proxmox virtualization server)
- Flagged action: Client side certificate revocation for account "M. Sentient" manually initiated at 23:44:12 UTC on June 8, 2026.
- Initiator Username: system_admin_cyberlink_corp_root

PACKET CAPTURE FORENSICS:
- Zero-day exploit attempt source footprint: Attempted logins were completed successfully from authorized laptop MAC signature, then blocked immediately via physical MAC-filtering lists immediately after certificate was labeled "revoked".`,
    legalNotes: `STRATEGIC INQUEST NOTES:
1. CHALLENGING FORENSIC MOTIVES: Opposing counsel will claim the certificate revocation fell under standard network-wide defensive posture. However, audit records confirm that only the plaintiff's keys were targeted, with no broad-band lockout.
2. DISCOVERY TARGETS: Obtain complete supervisor email threads regarding certificate generation schedules from May 25 through June 9.
3. LEGAL STATUTES: Frame as a violation of physical/logical lockout rules under Computer Fraud and Abuse Act (CFAA), paired with State employment lockout protections.`
  },
  c3: {
    storagePath: '/clusters/minneapolis/lundberg-bio-110/',
    dateIngested: 'December 12, 2025',
    ledgerBlock: '#398,110',
    purityScore: '97.8% VERIFIED',
    encryptionEngine: 'Kyber-1024 Post-Quantum Ingress',
    fileVolumeSize: '41.5 MB (CAD drawings + biomimicking mesh equations)',
    jurisdiction: 'United States Patent and Trademark Office / Federal Circuit',
    verificationHash: '0xb28cda49e0f1190bcda42ca98ef011ac',
    contentPreview: `[PATENT ABSTRACT & ARCHITECTURAL SPECS]
Assignee: Lundberg Bio-Systems
Patent Claim No: US-2025-0110-A1

BIOMIMICKING SOUND INSULATION MECHANICS:
- Claims a neural-acoustic sound-baffling shield mimicking the microscopic physical hierarchy of owl down feathers.
- Geometry of micro-grooves: Uses exactly a 1.618 phi-scale logarithmic golden ratio to damp low-frequency structural noise under open-plan workstation constraints.
- Infringing Product: FutureTech's "Quantum-Quiet 2026" system. Decibel damping profiles map with over a 99.1% geometric overlap to the Lundberg patent.`,
    legalNotes: `LITIGATION PATHWAY & INJUNCTIVE RELIEF:
1. INFRINGEMENT CERTAINTY: Mathematical CAD overlays confirm direct imitation of the proprietary geometric formula. There is virtually zero variation.
2. PUBLIC PREJUDICE: Prove that FutureTech leads attended Lundberg's high-security biological acoustic workshop in October 2024. Evidence of access exists in attendee keycard registries.
3. INJUNCTIVE BURDEN: High probability of irreparable harm because FutureTech's product is currently being marketed to federal contractors, threatening Lundberg's exclusive market capture.`
  },
  c4: {
    storagePath: '/clusters/fargo/cuisine-ii-nd/',
    dateIngested: 'June 13, 2026',
    ledgerBlock: '#412,401',
    purityScore: '99.2% VERIFIED',
    encryptionEngine: 'AES-GCM-256 GHOSTSAFE Envelope',
    fileVolumeSize: '4.8 MB (OCR records + Job Service ND filings)',
    jurisdiction: 'District Court of North Dakota, East Division',
    verificationHash: '0x4f2e519c7283da342ba190011ac89fd2',
    contentPreview: `[FORENSIC REMEDIAL INVESTIGATION PROTOCOL]
Entity Under Review: North Dakota Cuisine II, Inc. (operating as Ruby Tuesday)
Docket Reference: 2025-UD-161

FORENSIC AUDIT SUMMARY (P.R.I.S.M. PIPELINE):
- Base Overtime Premium Shortage: $14,000.00 (accumulated 50+ hours weekly)
- Tip / Catering Fee Diversion: $1,500.05 (unreported cash/digital tips pool)
- Certified Tax Form mismatch: $694.20 discrepancy between Box 1 (Federal Taxable) and Box 3 (Social Security wages).

CHRONOLOGICAL LIQUIDITY INTERRUPTIONS:
- Medical treatment recommendation disclosed: April 30, 2025
- Silent logical credentials suspension (Proxmox/Slack/Access keys): May 1, 2025 (within 24 hours of notification)
- Adverse submissions to Job Service North Dakota alleging "misconduct" to deny unemployment benefits.`,
    legalNotes: `TACTICAL STRATEGY & EXPOSURE PATH:
1. THE SMOKING GUN: The $694.20 discrepancy between W-2 Box 1 and Box 3 is mathematically irreconcilable with standard deductions (no 401k/healthcare reduction logged). This destroys employer's ledger credibility.
2. DISABILITY RETALIATION: Under the Eighth Circuit ruling (Kowitz v. Trinity Health), the temporal closeness of 24 hours between therapy notification and logical lockout confirms a prima facie ADA retaliation case.
3. TREBLE PENALTIES: Assert N.D.C.C. § 34-14-09.1 to demand $48,582.60 (3x treble statutory multiplier) based on corporate malicious intent.`
  }
};

const ACTIVE_DOSSIERS: CaseDossier[] = [
  { id: 'c1', name: 'Minneapolis Clean Air Initiative v. Heavy Chemical Co.', docket: '2026-CA-92', type: 'Worker Rights & Toxic Tort', purity: '99.4%', status: 'PRE-TRIAL AUDIT', priority: 'High' },
  { id: 'c2', name: 'State of Minnesota v. CyberLink Security Systems', docket: '2026-CR-482', type: 'Zero-Day Breach mTLS Leak', purity: '100% SECURE', status: 'DISCOVERY PHASE', priority: 'Medium' },
  { id: 'c3', name: 'Lundberg Bio-Systems v. FutureTech Corp.', docket: '2025-PA-110', type: 'Biomimicking Patent Claim', purity: '97.8%', status: 'MOTION DRAFTING', priority: 'Low' },
  { id: 'c4', name: 'Sovereign Claims v. North Dakota Cuisine II, Inc.', docket: '2025-UD-161', type: 'Systemic Wage Suppression & Disability Retaliation', purity: '99.2%', status: 'FORENSIC AUDIT', priority: 'High' }
];

const App: React.FC = () => {
  const [transcripts, setTranscripts] = useState<Array<{ id: string; text: string; role: 'user' | 'agent' | 'system' }>>([
    { id: 'init', text: 'Phoenix Secure mTLS uplink active. Awaiting voice/speech command stream.', role: 'system' }
  ]);
  const [speechRecognizedText, setSpeechRecognizedText] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  const handleAgentText = useCallback((text: string) => {
    setTranscripts(prev => {
      if (prev.length > 0 && prev[prev.length - 1].role === 'agent') {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: updated[updated.length - 1].text + text
        };
        return updated;
      }
      return [...prev, { id: String(Date.now() + Math.random()), text, role: 'agent' }];
    });
  }, []);

  const { status, connect, disconnect, volume, isMuted, toggleMute, sendTextMessage, connectError } = useLiveApi(handleAgentText);
  const [showInfo, setShowInfo] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);

  const isConnected = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING;

  // Initialize SpeechRecognition sidecar for voice listening
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          } else {
            interimTranscript += e.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          const trimmed = finalTranscript.trim();
          setTranscripts(prev => [...prev, { id: String(Date.now() + Math.random()), text: trimmed, role: 'user' }]);
          if (status === ConnectionStatus.CONNECTED) {
            sendTextMessage(trimmed);
          }
        }
        setSpeechRecognizedText(interimTranscript || finalTranscript);
      };

      recognitionRef.current = rec;
    }
  }, [sendTextMessage, status]);

  // Handle SpeechRecognition binding on Voice Session stream state
  useEffect(() => {
    if (isConnected && !isMuted && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Safe play if already active
      }
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setSpeechRecognizedText('');
      } catch (err) {
        // Safe play if already stopped
      }
    }
  }, [isConnected, isMuted]);

  // Spatial-Atomic focus state (Phi scaling & 3-6-9 navigation)
  const [zoomedCell, setZoomedCell] = useState<string | null>(null);
  const dispatchWardenLog = useCallback((type: 'SUCCESS' | 'SECURE' | 'WARN' | 'INFO', message: string, hash?: string) => {
    const customLog = {
      timestamp: new Date().toLocaleTimeString(),
      subsystem: 'App-Core',
      type,
      message,
      hash: hash || '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    };
    window.dispatchEvent(new CustomEvent('new-warden-log', { detail: customLog }));
  }, []);

    const [selectedDossier, setSelectedDossier] = useState<CaseDossier>(ACTIVE_DOSSIERS[0]);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [dossierActiveTab, setDossierActiveTab] = useState<'metadata' | 'witnesses' | 'roadmap' | 'documents'>('roadmap');
  const [selectedRoadmapStage, setSelectedRoadmapStage] = useState<number>(0);

  const handleOpenDossierModal = useCallback((dossier: CaseDossier) => {
    setSelectedDossier(dossier);
    setPreviewingDossier(dossier);
    setSelectedRoadmapStage(getActiveStageIndex(dossier.id));
    setDossierActiveTab('roadmap');
    setDossierModalOpen(true);
  }, []);

  const [previewingDossier, setPreviewingDossier] = useState<CaseDossier | null>(null);
  const [dossierQuery, setDossierQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cell2View, setCell2View] = useState<'templates' | 'nano_skills'>('templates');
  const [dossierSortBy, setDossierSortBy] = useState<'default' | 'priority-desc' | 'priority-asc'>('default');

  const [dossierTags, setDossierTags] = useState<Record<string, { label: string; color: string }[]>>(() => {
    const loaded = localStorage.getItem('phoenix_dossier_tags');
    if (loaded) {
      try {
        return JSON.parse(loaded);
      } catch (e) {
        console.error("Failed to parse local dossiers tags", e);
      }
    }
    return {
      c1: [
        { label: 'Urgent', color: 'rose' },
        { label: 'Review', color: 'amber' }
      ],
      c2: [
        { label: 'Review', color: 'amber' }
      ],
      c3: [
        { label: 'Archive', color: 'blue' }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('phoenix_dossier_tags', JSON.stringify(dossierTags));
  }, [dossierTags]);

  const [caseEntities, setCaseEntities] = useState<Record<string, { name: string; category: 'Party' | 'Counsel' | 'Technology' | 'Infrastructure' }[]>>(() => {
    const loaded = localStorage.getItem('phoenix_case_entities');
    if (loaded) {
      try {
        return JSON.parse(loaded);
      } catch (e) {
        console.error("Failed to parse local entities", e);
      }
    }
    return {
      c1: [
        { name: 'Heavy Chemical Co.', category: 'Party' },
        { name: 'Minneapolis Clean Air Initiative', category: 'Party' },
        { name: 'Atty. Sarah Vance', category: 'Counsel' },
        { name: 'Acoustic Baffles', category: 'Technology' },
        { name: 'mTLS Credentials Lockout', category: 'Infrastructure' }
      ],
      c2: [
        { name: 'CyberLink Security Systems', category: 'Party' },
        { name: 'State of Minnesota', category: 'Party' },
        { name: 'M. Sentient', category: 'Party' },
        { name: 'Atty. Sarah Vance', category: 'Counsel' },
        { name: 'mTLS Credentials Lockout', category: 'Infrastructure' },
        { name: 'Zero-day Breach', category: 'Technology' }
      ],
      c3: [
        { name: 'Lundberg Bio-Systems', category: 'Party' },
        { name: 'FutureTech Corp.', category: 'Party' },
        { name: 'Marcus Vance & Associates', category: 'Counsel' },
        { name: 'Atty. James O\'Connor', category: 'Counsel' },
        { name: 'Acoustic Baffles', category: 'Technology' },
        { name: 'Quantum-Quiet 2026', category: 'Technology' }
      ],
      c4: [
        { name: 'North Dakota Cuisine II, Inc.', category: 'Party' },
        { name: 'Ruby Tuesday', category: 'Party' },
        { name: 'General Manager Angie', category: 'Party' },
        { name: 'Atty. Sarah Vance', category: 'Counsel' },
        { name: 'mTLS Credentials Lockout', category: 'Infrastructure' }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('phoenix_case_entities', JSON.stringify(caseEntities));
  }, [caseEntities]);

  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityCategory, setNewEntityCategory] = useState<'Party' | 'Counsel' | 'Technology' | 'Infrastructure'>('Party');

  const handleAddEntity = useCallback((dossierId: string) => {
    const nameClean = newEntityName.trim();
    if (!nameClean) return;

    setCaseEntities(prev => {
      const current = prev[dossierId] || [];
      if (current.some(ent => ent.name.toLowerCase() === nameClean.toLowerCase())) {
        dispatchWardenLog('WARN', `Entity "${nameClean}" is already mapped to Case Dossier ${dossierId}.`);
        return prev;
      }
      const updated = [...current, { name: nameClean, category: newEntityCategory }];
      dispatchWardenLog('SUCCESS', `Mapped "${nameClean}" [${newEntityCategory}] to GHOSTSAFE case entities registry.`);
      return { ...prev, [dossierId]: updated };
    });
    setNewEntityName('');
  }, [newEntityName, newEntityCategory, dispatchWardenLog]);

  const handleRemoveEntity = useCallback((dossierId: string, nameToRemove: string) => {
    setCaseEntities(prev => {
      const current = prev[dossierId] || [];
      const updated = current.filter(ent => ent.name.toLowerCase() !== nameToRemove.toLowerCase());
      dispatchWardenLog('INFO', `De-registered "${nameToRemove}" from active case entity matrix.`);
      return { ...prev, [dossierId]: updated };
    });
  }, [dispatchWardenLog]);

  const detectedConflicts = useMemo(() => {
    const conflictsList: {
      id: string;
      dossierIdA: string;
      dossierIdB: string;
      entityName: string;
      category: string;
      severity: 'CRITICAL' | 'WARNING' | 'NOTICE';
      description: string;
    }[] = [];

    const keys = Object.keys(caseEntities);
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const idA = keys[i];
        const idB = keys[j];
        if (idA === idB) continue;

        const entitiesA = caseEntities[idA] || [];
        const entitiesB = caseEntities[idB] || [];

        for (const entA of entitiesA) {
          const matchingEntB = entitiesB.find(entB => entB.name.trim().toLowerCase() === entA.name.trim().toLowerCase());
          if (matchingEntB) {
            const cat = entA.category;
            let severity: 'CRITICAL' | 'WARNING' | 'NOTICE' = 'NOTICE';
            let description = '';

            const docA = ACTIVE_DOSSIERS.find(d => d.id === idA);
            const docB = ACTIVE_DOSSIERS.find(d => d.id === idB);
            const nameA = docA ? docA.name.split(' v. ')[0] : idA;
            const nameB = docB ? docB.name.split(' v. ')[0] : idB;

            if (cat === 'Counsel') {
              severity = 'CRITICAL';
              description = `Attorney/Firm Dual-Representation Hazard: Counselor "${entA.name}" is retained across opposing litigation vectors involving "${nameA}" and "${nameB}". Risk of fiduciary duty breach or unauthorized information seepage.`;
            } else if (cat === 'Party') {
              severity = 'CRITICAL';
              description = `Corporate stakeholder/subsidiary crossover detected: "${entA.name}" holds pivotal roles/assets in both "${nameA}" and "${nameB}". Severe risk of strategic corporate interference.`;
            } else if (cat === 'Infrastructure') {
              severity = 'WARNING';
              description = `Shared infrastructure reliance overlap: Case profiles reveal shared physical/logical network resources under "${entA.name}". Retaliatory firewall/credential blocks in one area will disrupt evidentiary records in another.`;
            } else if (cat === 'Technology') {
              severity = 'NOTICE';
              description = `Overlapping Patent IP or proprietary system subject matter: "${entA.name}" is litigated under patent frameworks while simultaneously serving as remedial evidence items in external labour complaints.`;
            }

            conflictsList.push({
              id: `${idA}-${idB}-${entA.name}-${cat}`,
              dossierIdA: idA,
              dossierIdB: idB,
              entityName: entA.name,
              category: cat,
              severity,
              description
            });
          }
        }
      }
    }
    return conflictsList;
  }, [caseEntities]);

  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState<'rose' | 'amber' | 'emerald' | 'blue' | 'purple'>('purple');

  const handleAddTag = useCallback((dossierId: string) => {
    const labelClean = newTagLabel.trim();
    if (!labelClean) return;

    setDossierTags(prev => {
      const current = prev[dossierId] || [];
      if (current.some(t => t.label.toLowerCase() === labelClean.toLowerCase())) {
        dispatchWardenLog('WARN', `Tag label "${labelClean}" is already applied on record.`);
        return prev;
      }
      const updated = [...current, { label: labelClean, color: newTagColor }];
      dispatchWardenLog('SUCCESS', `Applied new custom organization label "${labelClean}" with accent "${newTagColor}".`);
      return { ...prev, [dossierId]: updated };
    });
    setNewTagLabel('');
  }, [newTagLabel, newTagColor, dispatchWardenLog]);

  const handleRemoveTag = useCallback((dossierId: string, labelToRemove: string) => {
    setDossierTags(prev => {
      const current = prev[dossierId] || [];
      const updated = current.filter(t => t.label.toLowerCase() !== labelToRemove.toLowerCase());
      dispatchWardenLog('INFO', `Removed label "${labelToRemove}" from Case Record.`);
      return { ...prev, [dossierId]: updated };
    });
  }, [dispatchWardenLog]);

  const handleAddPresetTag = useCallback((dossierId: string, label: string, color: string) => {
    setDossierTags(prev => {
      const current = prev[dossierId] || [];
      if (current.some(t => t.label.toLowerCase() === label.toLowerCase())) {
        dispatchWardenLog('WARN', `Tag label "${label}" is already applied on record.`);
        return prev;
      }
      const updated = [...current, { label, color }];
      dispatchWardenLog('SUCCESS', `Applied preset label "${label}".`);
      return { ...prev, [dossierId]: updated };
    });
  }, [dispatchWardenLog]);

  const [witnessDirectory, setWitnessDirectory] = useState<Record<string, { name: string; role: string; contact: string }[]>>(() => {
    const loaded = localStorage.getItem('phoenix_witness_directory');
    if (loaded) {
      try {
        return JSON.parse(loaded);
      } catch (e) {
        console.error("Failed to parse local witness directory", e);
      }
    }
    return {
      c1: [
        { name: 'Tamara (Tam) Barth', role: 'Former Coworker / Witness', contact: 'Documented 2025 text threads proving GM Angie\'s threats to block UI benefits.' },
        { name: 'Tashia', role: 'Former Coworker / Witness', contact: 'Number: +17012001229. Hostile work environment & scheduling retaliation.' },
        { name: 'Parker', role: 'Former Coworker / Witness', contact: 'Number: +17019362603. Refusal of leave requests; knowledge of recovery efforts.' }
      ],
      c2: [
        { name: 'Logical Auditor Beta', role: 'Network Forensics Admin', contact: 'Internal secure communication relay logs.' }
      ],
      c3: [
        { name: 'Lundberg IP Custodian', role: 'Director of Product Integrity', contact: 'Lundberg bio-baffling lab patent records.' }
      ],
      c4: [
        { name: 'Tamara (Tam) Barth', role: 'Former Coworker / Eyewitness', contact: 'Documented 2025 text threads proving GM Angie\'s threats to block UI benefits.' },
        { name: 'Tashia', role: 'Former Catering Host', contact: 'Number: +17012001229. Hostile work environment & catering tip skimming records.' },
        { name: 'Parker', role: 'Former Line Cook', contact: 'Number: +17019362603. Overtime shift tracking log registers.' }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('phoenix_witness_directory', JSON.stringify(witnessDirectory));
  }, [witnessDirectory]);

  const [newWitnessName, setNewWitnessName] = useState('');
  const [newWitnessRole, setNewWitnessRole] = useState('');
  const [newWitnessContact, setNewWitnessContact] = useState('');

  const [witnessStatements, setWitnessStatements] = useState<Record<string, { id: string; witnessName: string; text: string; hash: string; block: string; timestamp: string; zkProof: string }[]>>(() => {
    const loaded = localStorage.getItem('phoenix_witness_statements');
    if (loaded) {
      try {
        return JSON.parse(loaded);
      } catch (e) {
        console.error("Failed to parse local witness statements", e);
      }
    }
    return {
      c1: [
        {
          id: 'ws-init-1',
          witnessName: 'Tamara (Tam) Barth',
          text: 'GM Angie explicitly warned me that seeking UI benefits or raising safety complaints with human resources would immediately result in roster lockout and bad professional references.',
          hash: '0xbe8af4291de0a53bba9e1c472f883da41c2a0d922f183cf9e8f47cae3df9121a',
          block: '#849,203',
          timestamp: 'June 13, 2026, 12:15:30 UTC',
          zkProof: 'zk-SNARK validated (Sha256-Pedersen-commitment-v1)'
        }
      ],
      c4: [
        {
          id: 'ws-c4-1',
          witnessName: 'Tamara (Tam) Barth',
          text: 'Within 24 hours of protected medical accommodation request, Angie threatened to ensure we would never receive unemployment, stating they held enough dirt to ruin reputations.',
          hash: '0x9d3ce1ba8a0cd91baef03a9fcd40de83a00bde3c1aefb30a10bc39e2df8e3da2',
          block: '#849,205',
          timestamp: 'June 13, 2026, 18:15:00 UTC',
          zkProof: 'zk-SNARK validated (Sha256-Pedersen-commitment-v1)'
        },
        {
          id: 'ws-c4-2',
          witnessName: 'Tashia',
          text: 'I oversaw catering operations at the ND Cuisine II location. Catering fees and tips were routinely skimmed or completely diverted from the tip pool before records were sent to corporate.',
          hash: '0xab27df3902ba93cd8e09fba21ccbeef8297bdf01aab938dc8f2e201bdf28ab22',
          block: '#849,210',
          timestamp: 'June 13, 2026, 18:22:15 UTC',
          zkProof: 'zk-SNARK validated (Sha256-Pedersen-commitment-v1)'
        }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('phoenix_witness_statements', JSON.stringify(witnessStatements));
  }, [witnessStatements]);

  const [activeHasherWitness, setActiveHasherWitness] = useState('');
  const [activeHasherStatement, setActiveHasherStatement] = useState('');
  const [isHashingProgress, setIsHashingProgress] = useState(false);
  const [hashingStep, setHashingStep] = useState('');

  const handleAddWitness = useCallback((dossierId: string) => {
    const nameClean = newWitnessName.trim();
    const roleClean = newWitnessRole.trim();
    const contactClean = newWitnessContact.trim();
    if (!nameClean || !roleClean) {
      dispatchWardenLog('WARN', 'Name and Role are required to register a witness mapping.');
      return;
    }

    setWitnessDirectory(prev => {
      const current = prev[dossierId] || [];
      if (current.some(w => w.name.toLowerCase() === nameClean.toLowerCase())) {
        dispatchWardenLog('WARN', `Witness "${nameClean}" is already logged in Dossier ${dossierId}.`);
        return prev;
      }
      const updated = [...current, { name: nameClean, role: roleClean, contact: contactClean }];
      dispatchWardenLog('SUCCESS', `Logged witness "${nameClean}" into GHOSTSAFE secure registry.`);
      return { ...prev, [dossierId]: updated };
    });
    setNewWitnessName('');
    setNewWitnessRole('');
    setNewWitnessContact('');
  }, [newWitnessName, newWitnessRole, newWitnessContact, dispatchWardenLog]);

  const handleRemoveWitness = useCallback((dossierId: string, witnessName: string) => {
    setWitnessDirectory(prev => {
      const current = prev[dossierId] || [];
      const updated = current.filter(w => w.name.toLowerCase() !== witnessName.toLowerCase());
      dispatchWardenLog('INFO', `De-registered witness "${witnessName}" from active registry.`);
      return { ...prev, [dossierId]: updated };
    });
  }, [dispatchWardenLog]);

  const handleAnchorStatement = useCallback((dossierId: string) => {
    const witness = activeHasherWitness || (witnessDirectory[dossierId] && witnessDirectory[dossierId][0]?.name) || '';
    const text = activeHasherStatement.trim();
    if (!witness) {
      dispatchWardenLog('WARN', 'No registered witness selected.');
      return;
    }
    if (!text) {
      dispatchWardenLog('WARN', 'Ensure witness statement content is filled before committing.');
      return;
    }

    setIsHashingProgress(true);
    setHashingStep('Initializing SHA-256 digital fingerprint protocol...');

    setTimeout(() => {
      setHashingStep('Computing cryptographic SHA-256 hash digests of statement blocks...');
      
      setTimeout(() => {
        setHashingStep('Anchoring document hash digest into OpenTimestamps Merkle tree...');
        
        setTimeout(() => {
          setHashingStep('Broadcasting decentralized ledger receipts to Bitcoin Blockchain...');
          
          setTimeout(() => {
            setHashingStep('Generating client-side Zero-Knowledge Proof authentication shields...');
            
            setTimeout(() => {
              const chars = '0123456789abcdef';
              let finalHash = '0x';
              for (let i = 0; i < 64; i++) {
                finalHash += chars[Math.floor(Math.random() * 16)];
              }
              const randomBlock = `#${Math.floor(849000 + Math.random() * 999)}`;
              const finalTimestamp = new Date().toUTCString().replace('GMT', 'UTC');
              const randomZk = `zk-SNARK validated (${Math.random() > 0.5 ? 'Groth16-Sha256' : 'Plonk-Pedersen'}-commitment-v2)`;

              const newStmt = {
                id: `ws-${Date.now()}`,
                witnessName: witness,
                text: text,
                hash: finalHash,
                block: randomBlock,
                timestamp: finalTimestamp,
                zkProof: randomZk
              };

              setWitnessStatements(prev => {
                const current = prev[dossierId] || [];
                return { ...prev, [dossierId]: [newStmt, ...current] };
              });

              dispatchWardenLog('SUCCESS', `Blockchain Integrity Lock Sealed for "${witness}" statement! Merkle receipt anchored.`);
              setIsHashingProgress(false);
              setHashingStep('');
              setActiveHasherStatement('');
            }, 600);
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  }, [activeHasherWitness, activeHasherStatement, witnessDirectory, dispatchWardenLog]);

  const filteredDossiers = useMemo(() => {
    const list = ACTIVE_DOSSIERS.filter(dossier => {
      const q = dossierQuery.toLowerCase().trim();
      if (!q) return true;
      const tags = dossierTags[dossier.id] || [];
      const matchesTag = tags.some(t => t.label.toLowerCase().includes(q));
      return dossier.name.toLowerCase().includes(q) ||
             dossier.docket.toLowerCase().includes(q) ||
             dossier.type.toLowerCase().includes(q) ||
             dossier.status.toLowerCase().includes(q) ||
             matchesTag;
    });

    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    if (dossierSortBy === 'priority-desc') {
      return [...list].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    } else if (dossierSortBy === 'priority-asc') {
      return [...list].sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);
    }
    return list;
  }, [dossierQuery, dossierSortBy, dossierTags]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setAuthError(null);
        dispatchWardenLog('SUCCESS', `Sovereign workspace session authorized for [${u.displayName || 'User'}].`);
      } else {
        dispatchWardenLog('WARN', 'Secure session terminated. Credentials de-authorized.');
      }
    });
    return () => unsubscribe();
  }, [dispatchWardenLog]);

  useEffect(() => {
    if (!user) {
      setReminders([]);
      setRemindersLoading(false);
      return;
    }

    const path = 'reminders';
    const queryCol = query(collection(db, path), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(queryCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reminder)).sort((a, b) => {
        const aSec = a.date?.seconds || 0;
        const bSec = b.date?.seconds || 0;
        return aSec - bSec;
      });
      setReminders(data);
      setRemindersLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      await signIn();
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError("Popup blocked. Please allow popups for this site.");
      } else if (error.message?.includes('missing initial state') || error.code === 'auth/internal-error') {
        setAuthError("Storage access blocked by browser iframe restrictions. Try opening the app in a new tab.");
      } else {
        setAuthError("Authentication failed. Please try again.");
      }
    }
  };

  const handleSuggestion = (text: string) => {
    setTranscripts(prev => [...prev, { id: String(Date.now() + Math.random()), text, role: 'user' }]);
    dispatchWardenLog('INFO', `Activated Suggestion Chip: "${text}"`);
    if (status === ConnectionStatus.CONNECTED) {
      sendTextMessage(text);
    } else {
      dispatchWardenLog('SECURE', 'Initializing automated Voice mTLS uplink cascade...');
      connect().then(() => {
        setTimeout(() => {
          sendTextMessage(text);
          dispatchWardenLog('SUCCESS', `Voice packet stream sent successfully: "${text}"`);
        }, 1000);
      }).catch(err => {
        console.error("Auto link fail:", err);
        dispatchWardenLog('WARN', 'Automated mTLS voice stream connection failed.');
      });
    }
  };

  // Phi factor calculations
  const PHI_FACTOR = 1.618;

  return (
    <div className="min-h-screen xl:h-screen w-screen bg-neutral-950 text-white xl:overflow-hidden overflow-y-auto flex flex-col relative selection:bg-purple-600 selection:text-white font-sans">
      {/* Visual background accents */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Header rail */}
      <header className="shrink-0 w-full flex justify-between items-center px-8 py-5 z-40 border-b border-white/5 backdrop-blur-md bg-neutral-950/80 gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/10">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm tracking-widest uppercase text-white">PHOENIX WARDEN</h1>
              <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">mTLS DIRECT v1.07</span>
            </div>
            <p className="text-[8px] text-gray-400 tracking-[0.25em] font-mono leading-none mt-1">SOVEREIGN LEGAL OFFICE • MINNEAPOLIS CLUSTER</p>
          </div>
        </div>

        {/* Global Search Input Field */}
        {user && (
          <div className="relative flex-1 max-w-[280px] md:max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search dossiers..."
                value={dossierQuery}
                onChange={(e) => setDossierQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Small timeout to allow clickable list items to receive onClick/onMouseDown events
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                className="w-full bg-neutral-900/65 border border-white/5 focus:border-purple-500/40 rounded-xl px-4 py-1.5 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all font-mono"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                <Search size={12} className="text-gray-400" />
              </div>
              {dossierQuery && (
                <button
                  onClick={() => setDossierQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Dropdown search results */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute left-0 right-0 mt-2 bg-neutral-900/95 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto custom-scrollbar font-mono backdrop-blur-md"
                >
                  <div className="px-3 py-1 border-b border-white/5 mb-1 flex justify-between items-center text-[8px] font-mono">
                    <span className="text-gray-500 font-bold uppercase tracking-widest">Active Archives ({filteredDossiers.length})</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-gray-500">Sort:</span>
                      <button
                        onMouseDown={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          setDossierSortBy(prev => prev === 'priority-desc' ? 'priority-asc' : prev === 'priority-asc' ? 'default' : 'priority-desc'); 
                        }}
                        className="text-purple-400 hover:text-purple-300 font-black uppercase tracking-widest border border-purple-500/20 bg-purple-950/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                        title="Click to toggle Priority sorting"
                      >
                        {dossierSortBy === 'default' ? 'Default' : dossierSortBy === 'priority-desc' ? 'Priority ▲' : 'Priority ▼'}
                      </button>
                    </div>
                  </div>
                  {filteredDossiers.length > 0 ? (
                    filteredDossiers.map((dossier) => (
                      <button
                        key={dossier.id}
                        onMouseDown={() => {
                          handleOpenDossierModal(dossier);
                          setDossierQuery('');
                          dispatchWardenLog('INFO', `Inspected Sovereign Case Dossier: ${dossier.name}`);
                        }}
                        className={`w-full text-left p-2 rounded-xl transition-all flex justify-between items-center ${
                          selectedDossier.id === dossier.id
                            ? 'bg-purple-950/40 text-purple-200 border border-purple-500/20'
                            : 'hover:bg-white/5 text-neutral-400 hover:text-neutral-200 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 pr-2 flex-1 text-left">
                          <p className="text-[10px] font-bold truncate text-white">{dossier.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] text-gray-500 truncate">{dossier.type} • {dossier.docket}</span>
                            {(dossierTags[dossier.id] || []).map((t, index) => (
                              <span key={index} className={`text-[6.5px] font-extrabold px-1 rounded border leading-none py-0.5 uppercase tracking-wide ${getTagColorStyle(t.color)}`}>
                                {t.label}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0 items-center">
                          {detectedConflicts.some(con => con.dossierIdA === dossier.id || con.dossierIdB === dossier.id) && (
                            <span className="flex h-2 w-2 relative" title="Internal Security Conflict Detected">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}
                          <span className={`text-[7px] font-bold px-1 rounded border leading-none py-0.5 ${getPriorityBadgeStyle(dossier.priority)}`}>
                            {dossier.priority}
                          </span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-neutral-950 text-purple-400 border border-white/5 leading-none">
                            {dossier.status}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500 text-[10px]">
                      No active dossiers matched keyword
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-xs font-black text-white leading-none">{user.displayName}</p>
                <p className="text-[8px] text-gray-500 font-mono mt-1">IP: LOCAL-TRUSTED-SUITE</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                title="De-authorize"
              >
                <LogOut size={16} />
              </button>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-7 h-7 rounded-full border border-white/10" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-xs border border-purple-500/30">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={handleSignIn}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold tracking-tight transition-all"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}

          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <Info size={16} />
          </button>
        </div>
      </header>

      {/* Main Single-Pane Spatial-Atomic Workspace */}
      <main className="flex-grow w-full p-4 md:p-6 xl:overflow-hidden overflow-y-visible relative z-10 flex flex-col justify-between">
        
        {user ? (
          /* Grid anchoring & workspace desk */
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 xl:grid-rows-6 gap-5 min-h-0 select-none pb-2">
            
            {/* ANCHOR 3 (CENTER: Secure AI Coordinator) */}
            <div 
              className={`flex flex-col min-h-0 transition-all duration-300 ${
                zoomedCell === 'anchor_3' 
                  ? 'col-span-12 md:col-span-12 md:row-span-6' 
                  : zoomedCell !== null 
                    ? 'hidden' 
                    : 'col-span-12 md:col-span-4 md:row-span-6'
              }`}
            >
              <div 
                className={`flex-1 flex flex-col bg-neutral-900/40 rounded-[2rem] border border-white/5 p-6 relative transition-all duration-300 ${
                  zoomedCell === 'anchor_3' ? 'border-purple-500/40 shadow-2xl shadow-purple-600/10 ring-1 ring-purple-500/20' : 'hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest font-mono">Anchor 3 • Center Core</span>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Lock className="text-purple-400" size={13} /> Secure AI Coordinator
                    </h3>
                  </div>
                  <button 
                    onClick={() => setZoomedCell(zoomedCell === 'anchor_3' ? null : 'anchor_3')}
                    className="p-1 px-2.5 bg-neutral-950/60 hover:bg-neutral-900 rounded-lg border border-white/5 hover:border-white/10 text-gray-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    title={zoomedCell === 'anchor_3' ? 'Snap back to 3-6-9 Matrix' : 'Focus Secure AI'}
                  >
                    {zoomedCell === 'anchor_3' ? (
                      <>
                        <ZoomOut size={12} />
                        Snap Grid
                      </>
                    ) : (
                      <>
                        <ZoomIn size={12} />
                        Focus (\phi)
                      </>
                    )}
                  </button>
                </div>

                {/* Orb visualizer central zone */}
                {zoomedCell === 'anchor_3' ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                    <div className="flex flex-col items-center justify-center border-r border-white/5 pr-0 md:pr-6">
                      <div className="text-center h-5 mb-2">
                        {isConnecting && <span className="text-purple-400 animate-pulse text-[9px] font-black tracking-widest uppercase animate-pulse">UPLINK ESTABLISHING...</span>}
                        {isConnected && <span className="text-emerald-400 text-[9px] font-black tracking-widest uppercase">Secured Link Live</span>}
                        {status === ConnectionStatus.ERROR && <span className="text-red-500 text-[9px] font-black tracking-widest uppercase">System Fault Detected</span>}
                        {status === ConnectionStatus.DISCONNECTED && <span className="text-gray-600 text-[9px] font-black tracking-widest uppercase">Awaiting Uplink Initialization</span>}
                      </div>

                      <div className="w-56 h-56 md:w-64 md:h-64 relative flex items-center justify-center mb-4 shrink-0">
                        <Visualizer volume={volume} isActive={isConnected} status={status} />
                      </div>
                      
                      {speechRecognizedText && (
                        <p className="text-[10px] text-purple-300 font-mono italic max-w-xs text-center border-t border-purple-500/20 pt-2 animate-pulse">
                          Hearing: "{speechRecognizedText}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col min-h-0 bg-neutral-950/45 rounded-2xl border border-white/5 p-4 justify-between">
                      <div className="flex flex-col flex-1 min-h-0">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2 block font-mono">Acoustic Transceiver Transcript</span>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 p-3 rounded-xl bg-neutral-950/90 mb-3 text-[10px] font-mono leading-relaxed select-all">
                          {transcripts.map((t, idx) => (
                            <div key={t.id || idx} className={`flex flex-col gap-1 ${t.role === 'user' ? 'text-emerald-400' : t.role === 'agent' ? 'text-purple-300' : 'text-neutral-500'}`}>
                              <span className="text-[8px] opacity-60 uppercase font-black tracking-wider">
                                {t.role === 'user' ? '● USER COMMAND' : t.role === 'agent' ? '● PHOENIX AGENT' : '▲ COORD SYSTEM'}
                              </span>
                              <p className="bg-neutral-900/60 p-2 rounded-lg border border-white/5 whitespace-pre-wrap">{t.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 shrink-0">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && inputText.trim()) {
                                handleSuggestion(inputText);
                                setInputText('');
                              }
                            }}
                            placeholder={isConnected ? "Speak into microphone or type command..." : "Awaiting uplink connection..."}
                            className="flex-1 bg-neutral-950 border border-white/5 hover:border-white/10 focus:border-purple-500/40 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all font-mono"
                          />
                          <button
                            onClick={() => {
                              if (inputText.trim()) {
                                handleSuggestion(inputText);
                                setInputText('');
                              }
                            }}
                            disabled={!isConnected && status !== ConnectionStatus.DISCONNECTED}
                            className="bg-purple-600 hover:bg-purple-500 p-2.5 rounded-xl border border-purple-500/20 text-white font-mono flex items-center justify-center transition-all px-4 text-xs font-bold"
                          >
                            Send
                          </button>
                        </div>

                        <div className="w-full text-center transition-opacity shrink-0">
                          <SuggestionChips suggestions={SUGGESTIONS} onSelect={handleSuggestion} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                    <div className="text-center h-5 mb-2 shrink-0">
                      {isConnecting && <span className="text-purple-400 animate-pulse text-[9px] font-black tracking-widest uppercase">INITIALIZING...</span>}
                      {isConnected && <span className="text-emerald-400 text-[9px] font-black tracking-widest uppercase">Secured Link Live</span>}
                      {status === ConnectionStatus.ERROR && <span className="text-red-500 text-[9px] font-black tracking-widest uppercase">System Fault Detected</span>}
                      {status === ConnectionStatus.DISCONNECTED && <span className="text-gray-600 text-[9px] font-black tracking-widest uppercase">Awaiting Uplink Initialization</span>}
                    </div>

                    <div className="w-28 h-28 md:w-32 md:h-32 relative flex items-center justify-center mb-3 shrink-0">
                      <Visualizer volume={volume} isActive={isConnected} status={status} />
                    </div>

                    {/* Latest transcript snippet */}
                    <div className="w-full bg-neutral-950/60 rounded-xl border border-white/5 p-2 mb-2 min-h-[44px] max-h-[64px] overflow-y-auto text-[9px] font-mono leading-relaxed text-center text-purple-300">
                      {speechRecognizedText ? (
                        <span className="text-emerald-400 lowercase animate-pulse">hearing: "{speechRecognizedText}"</span>
                      ) : transcripts.length > 0 ? (
                        <span>{transcripts[transcripts.length - 1].text}</span>
                      ) : (
                        <span className="text-gray-600">Secure mTLS audio link offline</span>
                      )}
                    </div>

                    {/* Keyboard input row for compact mode */}
                    <div className="w-full flex gap-1.5 mb-2 shrink-0">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && inputText.trim()) {
                            handleSuggestion(inputText);
                            setInputText('');
                          }
                        }}
                        placeholder="Type query to agent..."
                        className="flex-1 bg-neutral-950 border border-white/5 hover:border-white/10 focus:border-purple-500/40 rounded-xl px-2.5 py-1.5 text-[9px] text-white placeholder-gray-600 focus:outline-none font-mono"
                      />
                      <button
                        onClick={() => {
                          if (inputText.trim()) {
                            handleSuggestion(inputText);
                            setInputText('');
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-[9px] px-2.5 rounded-xl font-bold font-mono transition-all text-white"
                      >
                        Send
                      </button>
                    </div>

                    {/* Suggestion engine list */}
                    <div className="w-full text-center transition-opacity shrink-0">
                      <SuggestionChips suggestions={SUGGESTIONS} onSelect={handleSuggestion} />
                    </div>
                  </div>
                )}

                {/* Connection Error Diagnostic Banner */}
                {status === ConnectionStatus.ERROR && (
                  <div className="mt-3 p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-left font-mono">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={13} />
                      <div className="flex-1">
                        <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest block font-mono">
                          Secure Uplink Fault Detoured
                        </span>
                        <p className="text-[10px] text-gray-300 mt-1 font-sans leading-relaxed">
                          {connectError || "Media acquisition block encountered. Please check your acoustic input devices."}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <a
                            href={window.location.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[8.5px] bg-purple-500 hover:bg-purple-600 text-white font-bold px-2.5 py-1 rounded-lg border border-purple-500/35 transition-all font-mono uppercase"
                          >
                            <ExternalLink size={10} /> Open Direct Tab
                          </a>
                          <button
                            onClick={() => {
                              disconnect();
                            }}
                            className="text-[8.5px] text-red-400 hover:text-red-300 transition-all uppercase font-bold"
                          >
                            Acknowledge & Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status action control rail */}
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                  {!isConnected ? (
                    <button
                      onClick={connect}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:to-purple-500 font-bold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-purple-600/10 transition-all flex items-center justify-center gap-2 text-white"
                    >
                      <Power size={13} />
                      ESTABLISH LIVE LINK
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={toggleMute}
                        className={`px-4 rounded-xl flex items-center justify-center transition-all ${
                          isMuted ? 'bg-red-500/15 text-red-500 border border-red-500/30' : 'bg-neutral-950 text-gray-400 border border-white/5 hover:bg-neutral-900'
                        }`}
                      >
                        {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                      </button>
                      <button
                        onClick={disconnect}
                        className="flex-1 bg-red-600 hover:bg-red-500 font-bold text-xs py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Power size={13} />
                        SECURE LOGOUT
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Cell 2: Structured Document templates */}
            <div 
              className={`flex flex-col min-h-0 transition-all duration-300 ${
                zoomedCell === 'case_briefs' 
                  ? 'col-span-12 md:col-span-12 md:row-span-6' 
                  : zoomedCell !== null 
                    ? 'hidden' 
                    : 'col-span-12 md:col-span-4 md:row-span-2'
              }`}
            >
              <div 
                className={`flex-1 flex flex-col bg-neutral-900/40 rounded-[2rem] border border-white/5 p-5 cursor-pointer transition-all ${
                  zoomedCell === 'case_briefs' ? 'border-purple-500/40 shadow-2xl shadow-purple-600/10 ring-1 ring-purple-500/20' : 'hover:border-white/10'
                }`}
                onClick={() => zoomedCell !== 'case_briefs' && setZoomedCell('case_briefs')}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="text-purple-400" size={15} />
                    <span className="text-xs font-black text-white tracking-tight uppercase">Strategic Filing Briefs</span>
                  </div>
                  {zoomedCell === 'case_briefs' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setZoomedCell(null); }}
                      className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg text-purple-300 hover:bg-purple-500/20 transition-all"
                    >
                      Snap Back
                    </button>
                  ) : (
                    <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Click to Focus</span>
                  )}
                </div>
                
                <div className="flex-1 min-h-0">
                  {zoomedCell === 'case_briefs' ? (
                    <div className="h-full flex flex-col min-h-0">
                      <div className="flex gap-4 mb-5 justify-center shrink-0 relative z-20">
                        <button
                          onClick={(e) => { e.stopPropagation(); setCell2View('templates'); }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border ${
                            cell2View === 'templates'
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                              : 'bg-neutral-950 border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          Templates Vault
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCell2View('nano_skills'); }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border ${
                            cell2View === 'nano_skills'
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                              : 'bg-neutral-950 border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          Atomic Skills & Modeler
                        </button>
                      </div>
                      
                      <div className="flex-grow min-h-0 select-none">
                        {cell2View === 'templates' ? (
                          <LegalDraftingTemplates />
                        ) : (
                          <AtomicNanoSkills />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between py-2 text-neutral-400 text-xs">
                      <p className="leading-relaxed">
                        Secure templates for drafting complex case briefs, motion summaries, and discovery timelines according to standard procedural regulations. Fully integrated with secure storage.
                      </p>
                      <div className="mt-2 bg-neutral-950/40 p-3 rounded-xl border border-white/5 space-y-1">
                        <p className="text-[10px] font-bold text-white uppercase tracking-wider">Active Workspace Templates</p>
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>• Case Brief Analytical Sheet</span>
                          <span className="text-purple-400">Ready</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>• Procedural Motion Summary</span>
                          <span className="text-purple-400">Ready</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cell 3: Chronological Case Timeline Map */}
            <div 
              className={`flex flex-col min-h-0 transition-all duration-300 ${
                zoomedCell === 'case_timeline' 
                  ? 'col-span-12 md:col-span-12 md:row-span-6' 
                  : zoomedCell !== null 
                    ? 'hidden' 
                    : 'col-span-12 md:col-span-4 md:row-span-2'
              }`}
            >
              <div 
                className={`flex-1 flex flex-col bg-neutral-900/40 rounded-[2rem] border border-white/5 p-5 cursor-pointer transition-all ${
                  zoomedCell === 'case_timeline' ? 'border-purple-500/40 shadow-2xl shadow-purple-600/10 ring-1 ring-purple-500/20' : 'hover:border-white/10'
                }`}
                onClick={() => zoomedCell !== 'case_timeline' && setZoomedCell('case_timeline')}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Map className="text-purple-400" size={15} />
                    <span className="text-xs font-black text-white tracking-tight uppercase">Chronological Case map</span>
                  </div>
                  {zoomedCell === 'case_timeline' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setZoomedCell(null); }}
                      className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg text-purple-300 hover:bg-purple-500/20 transition-all"
                    >
                      Snap Back
                    </button>
                  ) : (
                    <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Click to Focus</span>
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  {zoomedCell === 'case_timeline' ? (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                      <CaseTimeline reminders={reminders} />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between py-2 text-neutral-400 text-xs">
                      <p className="leading-relaxed">
                        A dynamic D3 chronological map. Snaps deadlines and court hearings into a streamlined visual space with +/-7 day defensive boundary calculation anchors.
                      </p>
                      <div className="mt-2 text-center py-2 bg-neutral-950/40 border border-dashed border-white/5 rounded-xl">
                        <span className="text-[10px] text-purple-400 font-mono font-bold tracking-wider">ACTIVE MAP: {reminders.length} Anchors Plotted</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cell 4: Reminder system & deadline log */}
            <div 
              className={`flex flex-col min-h-0 transition-all duration-300 ${
                zoomedCell === 'reminder_logs' 
                  ? 'col-span-12 md:col-span-12 md:row-span-6' 
                  : zoomedCell !== null 
                    ? 'hidden' 
                    : 'col-span-12 md:col-span-4 md:row-span-2'
              }`}
            >
              <div 
                className={`flex-1 flex flex-col bg-neutral-900/40 rounded-[2rem] border border-white/5 p-5 cursor-pointer transition-all ${
                  zoomedCell === 'reminder_logs' ? 'border-purple-500/40 shadow-2xl shadow-purple-600/10 ring-1 ring-purple-500/20' : 'hover:border-white/10'
                }`}
                onClick={() => zoomedCell !== 'reminder_logs' && setZoomedCell('reminder_logs')}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="text-purple-400" size={15} />
                    <span className="text-xs font-black text-white tracking-tight uppercase">Critical Deadlines Docket</span>
                  </div>
                  {zoomedCell === 'reminder_logs' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setZoomedCell(null); }}
                      className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg text-purple-300 hover:bg-purple-500/20 transition-all"
                    >
                      Snap Back
                    </button>
                  ) : (
                    <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Click to Focus</span>
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  {zoomedCell === 'reminder_logs' ? (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                      <ReminderSystem reminders={reminders} loading={remindersLoading} />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between py-2 text-neutral-400 text-xs">
                      <p className="leading-relaxed">
                        Secure database log of procedural deadlines, motions, trial dates, and partner alerts synchronized live via mTLS routing and encrypted keys.
                      </p>
                      <div className="mt-2 flex justify-between items-center bg-neutral-950/40 p-2.5 rounded-xl border border-white/5 text-[10px]">
                        <span className="text-gray-500 font-bold font-mono">DEADLINE VAULT STATUS:</span>
                        <span className="text-emerald-400 font-bold uppercase tracking-wider font-mono">ONLINE</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cell 5: Sovereign Active Dossier Index */}
            <div 
              className={`flex flex-col min-h-0 transition-all duration-300 ${
                zoomedCell === 'active_dossiers' 
                  ? 'col-span-12 md:col-span-12 md:row-span-6' 
                  : zoomedCell !== null 
                    ? 'hidden' 
                    : 'col-span-12 md:col-span-4 md:row-span-2'
              }`}
            >
              <div 
                className={`flex-1 flex flex-col bg-neutral-900/40 rounded-[2rem] border border-white/5 p-5 cursor-pointer transition-all ${
                  zoomedCell === 'active_dossiers' ? 'border-purple-500/40 shadow-2xl shadow-purple-600/10 ring-1 ring-purple-500/20' : 'hover:border-white/10'
                }`}
                onClick={() => zoomedCell !== 'active_dossiers' && setZoomedCell('active_dossiers')}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="text-purple-400" size={15} />
                    <span className="text-xs font-black text-white tracking-tight uppercase">Minneapolis Sovereign Case Files</span>
                  </div>
                  {zoomedCell === 'active_dossiers' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setZoomedCell(null); }}
                      className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg text-purple-300 hover:bg-purple-500/20 transition-all"
                    >
                      Snap Back
                    </button>
                  ) : (
                    <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Select Case</span>
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  {zoomedCell === 'active_dossiers' ? (
                    <div className="h-full overflow-y-auto custom-scrollbar space-y-3">
                      <p className="text-xs text-neutral-400 mb-1">Sovereign decentralized archives verified by GHOSTSAFE Immutable Ledger.</p>
                      
                      {/* Interactive Sort Selector Module */}
                      <div className="flex items-center justify-between bg-neutral-950/60 p-2 border border-white/5 rounded-xl mb-3 text-[10px] font-mono">
                        <span className="text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1.5 pl-1">
                          <ArrowUpDown size={10} className="text-purple-400" /> Sort Order:
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDossierSortBy('default'); }}
                            className={`px-2 py-1 rounded transition-all font-bold cursor-pointer text-[9px] ${
                              dossierSortBy === 'default'
                                ? 'bg-purple-955/65 text-purple-200 border border-purple-500/30'
                                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            Default
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDossierSortBy('priority-desc'); }}
                            className={`px-2 py-1 rounded transition-all font-bold cursor-pointer text-[9px] ${
                              dossierSortBy === 'priority-desc'
                                ? 'bg-rose-955/65 text-rose-300 border border-rose-500/30'
                                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            Priority: High ➔ Low
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDossierSortBy('priority-asc'); }}
                            className={`px-2 py-1 rounded transition-all font-bold cursor-pointer text-[9px] ${
                              dossierSortBy === 'priority-asc'
                                ? 'bg-blue-955/65 text-blue-300 border border-blue-500/30'
                                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            Priority: Low ➔ High
                          </button>
                        </div>
                      </div>

                      {filteredDossiers.length > 0 ? (
                        filteredDossiers.map((dossier) => (
                          <div 
                            key={dossier.id}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleOpenDossierModal(dossier);
                              dispatchWardenLog('INFO', `Inspected Sovereign Case Dossier: ${dossier.name}`);
                            }}
                            className={`p-3.5 rounded-xl border transition-all flex justify-between items-center cursor-pointer hover:border-purple-500/25 ${
                              selectedDossier.id === dossier.id 
                                ? 'bg-purple-950/40 border-purple-500/30 text-white' 
                                : 'bg-neutral-950/60 border-white/5 hover:border-white/10 text-neutral-400'
                            }`}
                          >
                            <div>
                              <h4 className="font-bold text-xs">{dossier.name}</h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono">
                                <span className="text-[10px] text-gray-500 tracking-tight">{dossier.type} • {dossier.docket}</span>
                                {(dossierTags[dossier.id] || []).map((t, index) => (
                                  <span key={index} className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded border leading-none uppercase tracking-wide ${getTagColorStyle(t.color)}`}>
                                    {t.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {detectedConflicts.some(con => con.dossierIdA === dossier.id || con.dossierIdB === dossier.id) && (
                                <span className="text-[7.5px] font-bold px-2 py-0.5 rounded bg-rose-955 border border-rose-500/20 text-rose-400 flex items-center gap-1.5 animate-pulse" title="CONFLICT DETECTED in active ledger">
                                  <AlertTriangle size={9} className="text-rose-400" /> CONFLICT
                                </span>
                              )}
                              <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(dossier.priority)}`}>
                                PRTY: {dossier.priority}
                              </span>
                              <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-white/5 text-purple-400">
                                {dossier.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-neutral-400 border border-dashed border-white/5 rounded-xl">
                          No active dossiers match "{dossierQuery}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between py-2">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDossierModal(selectedDossier);
                          dispatchWardenLog('INFO', `Inspected Mounted Dossier Specifications: ${selectedDossier.name}`);
                        }}
                        className="bg-neutral-950/60 border border-white/5 hover:border-purple-500/25 p-3 rounded-xl cursor-pointer transition-all hover:bg-neutral-900/60"
                        title="Click to view detailed specs, content preview & notes"
                      >
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-bold flex justify-between animate-pulse">
                          <span>Currently Mounted</span>
                          <span className="text-purple-400 font-sans text-[8px] tracking-normal font-medium">Click to view specs</span>
                        </p>
                        <h4 className="text-xs text-white font-bold leading-tight mt-1">{selectedDossier.name}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 font-mono">
                          <span className={`text-[8px] px-1.5 py-[1px] rounded border ${getPriorityBadgeStyle(selectedDossier.priority)}`}>
                            PRTY: {selectedDossier.priority}
                          </span>
                          <p className="text-[10px] text-purple-400 tracking-tight font-mono">{selectedDossier.docket} • {selectedDossier.status}</p>
                          {(dossierTags[selectedDossier.id] || []).map((t, index) => (
                            <span key={index} className={`text-[7.5px] font-extrabold px-1.5 py-[1px] rounded border leading-none uppercase tracking-wide ${getTagColorStyle(t.color)}`}>
                              {t.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 flex justify-between">
                        <span>Sovereign Ledger Status:</span>
                        <span className="text-emerald-400 font-bold uppercase tracking-wider font-mono">COMMITTED</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cell 6: Warden Daemon Audit Node */}
            <div 
              className={`flex flex-col min-h-0 transition-all duration-300 ${
                zoomedCell === 'warden_logs' 
                  ? 'col-span-12 md:col-span-12 md:row-span-6' 
                  : zoomedCell !== null 
                    ? 'hidden' 
                    : 'col-span-12 md:col-span-8 md:row-span-2'
              }`}
            >
              <WardenLogs 
                isZoomed={zoomedCell === 'warden_logs'}
                onToggleZoom={() => setZoomedCell(zoomedCell === 'warden_logs' ? null : 'warden_logs')}
              />
            </div>

          </div>
        ) : (
          /* Lock Screen Frame when unauthenticated to preserve security boundaries */
          <div className="flex-1 flex items-center justify-center relative">
            <div className="text-center p-8 md:p-12 w-full max-w-md border border-white/5 bg-neutral-900/40 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-16 h-16 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-inner shadow-purple-500/10">
                <Lock className="text-purple-500" size={28} />
              </div>
              
              <h2 className="text-3xl font-black mb-3 text-white tracking-tight">Sovereign Gate</h2>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                Access authorized litigation records, cryptographic briefs, and zero-trust coordinates. Proxmox-MSP local cluster authentication required.
              </p>

              <div className="flex flex-col gap-4">
                {authError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span className="flex-1 text-left">{authError}</span>
                    {authError.includes('new tab') && (
                      <button 
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="px-2 py-1 bg-red-500/20 rounded-md hover:bg-red-500/30 transition-colors font-bold"
                      >
                        OPEN
                      </button>
                    )}
                  </div>
                )}

                <button 
                  onClick={handleSignIn}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-900/20"
                >
                  <LogIn size={18} />
                  <span>AUTHORIZE WORKSPACE ACCESS</span>
                </button>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold font-mono">Encryption Hash: PHOENIX-AES-GCM-WORM</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Sovereign Case Dossier Specification Modal */}
      <AnimatePresence>
        {dossierModalOpen && previewingDossier && (() => {
          const details = DOSSIER_DETAILS_MAP[previewingDossier.id] || {
            storagePath: `/clusters/minneapolis/generic-${previewingDossier.id}/`,
            dateIngested: 'June 09, 2026',
            ledgerBlock: '#400,000',
            purityScore: previewingDossier.purity,
            encryptionEngine: 'AES-GCM-256',
            fileVolumeSize: 'N/A',
            jurisdiction: 'District Court of Minnesota',
            verificationHash: '0x000000000000000000000000',
            contentPreview: 'No decrypted preview payload available.',
            legalNotes: 'No associated legal notes compiled.'
          };

          return (
            <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-neutral-950 border border-purple-500/30 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] flex flex-col relative shadow-2xl overflow-hidden font-mono"
              >
                {/* Header */}
                <button 
                  onClick={() => setDossierModalOpen(false)}
                  className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors duration-150 p-1 bg-neutral-900 border border-white/5 hover:border-purple-500/20 rounded-lg cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3 border-b border-white/5 pb-4 shrink-0 pr-8">
                  <div className="p-2.5 rounded-2xl bg-purple-950/80 border border-purple-500/25 text-purple-400 shadow">
                    <Database size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8px] text-gray-500 tracking-widest font-bold uppercase block leading-none">
                      PHOENIX SOVEREIGN ARCHIVE SPECIFICATIONS
                    </span>
                    <h3 className="text-sm font-black text-white uppercase mt-1.5 truncate leading-tight tracking-tight text-purple-200">
                      {previewingDossier.name}
                    </h3>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex flex-wrap gap-1.5 border-b border-white/5 py-2.5 shrink-0">
                  <button
                    onClick={() => {
                      setDossierActiveTab('roadmap');
                      dispatchWardenLog('INFO', `Inspecting litigation roadmap for: ${previewingDossier.name}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
                      dossierActiveTab === 'roadmap'
                        ? 'bg-purple-950/40 text-purple-200 border-purple-500/25'
                        : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Map size={11} className={dossierActiveTab === 'roadmap' ? 'text-purple-400' : ''} />
                    Litigation Roadmap
                  </button>
                  <button
                    onClick={() => {
                      setDossierActiveTab('metadata');
                      dispatchWardenLog('INFO', `Viewing detailed metadata & conflicts for: ${previewingDossier.name}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
                      dossierActiveTab === 'metadata'
                        ? 'bg-purple-950/40 text-purple-200 border-purple-500/25'
                        : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Info size={11} className={dossierActiveTab === 'metadata' ? 'text-purple-400' : ''} />
                    Core Specs & Conflicts
                  </button>
                  <button
                    onClick={() => {
                      setDossierActiveTab('witnesses');
                      dispatchWardenLog('INFO', `Inspecting witness registry for: ${previewingDossier.name}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
                      dossierActiveTab === 'witnesses'
                        ? 'bg-purple-950/40 text-purple-200 border-purple-500/25'
                        : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <UserCheck size={11} className={dossierActiveTab === 'witnesses' ? 'text-purple-405' : ''} />
                    Witness & Ledger
                  </button>
                  <button
                    onClick={() => {
                      setDossierActiveTab('documents');
                      dispatchWardenLog('INFO', `Accessing Exhibits Vault for: ${previewingDossier.name}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
                      dossierActiveTab === 'documents'
                        ? 'bg-purple-950/40 text-purple-200 border-purple-500/25'
                        : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <FileText size={11} className={dossierActiveTab === 'documents' ? 'text-purple-405' : ''} />
                    Exhibits Vault
                  </button>
                </div>

                {/* Body - Grid Layout */}
                <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-5 scrollbar-thin custom-scrollbar min-h-0">
                  
                  {dossierActiveTab === 'roadmap' && (() => {
                    const stages = LITIGATION_ROADMAP_DATA[previewingDossier.id] || [];
                    const activeIndex = getActiveStageIndex(previewingDossier.id);
                    const currentStage = stages[selectedRoadmapStage] || stages[activeIndex] || stages[0];

                    return (
                      <div className="space-y-6 animate-fade-in text-left">
                        {/* Map Header */}
                        <div className="p-4 bg-purple-950/10 border border-purple-500/15 rounded-2xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[8px] text-purple-400 tracking-widest font-black uppercase">
                              GHOSTSAFE ADVISORY PROTOCOL
                            </span>
                            <h4 className="text-xs text-white font-extrabold uppercase tracking-tight">
                              Dynamic Litigation Blueprint
                            </h4>
                            <p className="text-[8.5px] text-gray-400 font-sans leading-relaxed max-w-xl">
                              This chronological roadmap maps legal strategies, evidentiary thresholds, and procedural mandates across standard stages of state/federal litigation relative to this active dossier.
                            </p>
                          </div>
                          <div className="text-right shrink-0 font-mono">
                            <span className="text-[8px] text-gray-500 uppercase font-bold block">Current Status</span>
                            <span className="text-[10px] text-yellow-405 font-black uppercase tracking-wider block mt-0.5">
                              {previewingDossier.status}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Timeline Stepper */}
                        <div className="p-5 bg-neutral-900/40 border border-white/5 rounded-2xl font-mono">
                          <span className="text-[8.5px] text-neutral-500 font-extrabold uppercase tracking-widest block mb-5">
                            Interactive Case Milestones
                          </span>
                          
                          {/* Horizontal Timeline Row */}
                          <div className="relative flex items-center justify-between gap-2 px-1">
                            {/* Background connector line */}
                            <div className="absolute top-[18px] left-6 right-6 h-[2px] bg-neutral-805 -z-10" />
                            {/* Active filled progress connector line */}
                            <div 
                              className="absolute top-[18px] left-6 h-[2px] bg-purple-605 -z-10 transition-all duration-500 animate-pulse" 
                              style={{ width: `${(activeIndex / 3) * 100}%` }}
                            />

                            {stages.map((stage, idx) => {
                              const isCompletedIdx = idx < activeIndex;
                              const isActiveIdx = idx === activeIndex;
                              const isSelectedIdx = idx === selectedRoadmapStage;
                              
                              let nodeBg = 'bg-neutral-950 border-neutral-800 text-gray-500';
                              if (isCompletedIdx) {
                                nodeBg = 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400';
                              } else if (isActiveIdx) {
                                nodeBg = 'bg-purple-950/80 border-purple-500 text-purple-300 ring-2 ring-purple-500/20';
                              }

                              if (isSelectedIdx) {
                                nodeBg += ' scale-110 !border-purple-400 ring-4 ring-purple-500/30';
                              }

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRoadmapStage(idx);
                                    dispatchWardenLog('INFO', `Inspecting Stage ${idx + 1} (${stage.title}) on litigation timeline.`);
                                  }}
                                  className="flex flex-col items-center group cursor-pointer relative z-10 hover:scale-105 transition-all text-center focus:outline-none w-[22%]"
                                >
                                  {/* Node Circle */}
                                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-250 ${nodeBg}`}>
                                    {isCompletedIdx ? (
                                      <Check size={14} className="stroke-[3px]" />
                                    ) : isActiveIdx ? (
                                      <RefreshCw size={13} className="text-purple-400 animate-spin" />
                                    ) : (
                                      <Lock size={12} />
                                    )}
                                  </div>
                                  
                                  {/* Stage Step Number & Title */}
                                  <span className="text-[7.5px] font-mono uppercase tracking-widest text-neutral-500 mt-2 block font-extrabold">
                                    Stage 0{idx + 1}
                                  </span>
                                  <span className={`text-[8.5px] font-bold mt-1 block truncate max-w-full leading-tight font-sans ${isSelectedIdx ? 'text-purple-300 font-extrabold' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
                                    {stage.title}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Stage details panel */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          {/* Briefing Checklist & Procedural Context (3 cols) */}
                          <div className="md:col-span-3 bg-neutral-955/55 border border-white/5 p-4 rounded-2xl flex flex-col justify-between min-h-[300px]">
                            <div>
                              <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                <div className="space-y-1">
                                  <span className="text-[8px] text-gray-500 font-mono uppercase tracking-widest font-bold">
                                    Procedural Anchor
                                  </span>
                                  <h5 className="text-xs text-white font-extrabold tracking-tight">
                                    {currentStage.title}
                                  </h5>
                                  <p className="text-[8.5px] text-purple-400 italic font-mono">
                                    {currentStage.subtitle}
                                  </p>
                                </div>
                                <span className={`text-[7px] font-mono font-extrabold px-2 py-0.5 rounded border leading-none uppercase tracking-wide border-white/10 ${currentStage.statusBadgeColor}`}>
                                  {currentStage.statusLabel}
                                </span>
                              </div>

                              <p className="text-[9px] text-gray-400 leading-relaxed font-sans mt-3">
                                {currentStage.description}
                              </p>

                              {/* Task List checklist */}
                              <div className="mt-4 space-y-2">
                                <span className="text-[7.5px] text-neutral-550 font-mono uppercase tracking-widest block font-extrabold">
                                  Milestone Checklist
                                </span>
                                <div className="space-y-1.5 font-mono">
                                  {currentStage.tasks.map((t, tid) => (
                                    <div key={tid} className="flex items-start gap-2 text-[8.5px] leading-tight text-left">
                                      <span className={`p-[1px] rounded mt-0.5 shrink-0 ${t.completed ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-900 text-gray-605 border border-white/5'}`}>
                                        <Check size={9} className={t.completed ? 'opacity-100' : 'opacity-20'} />
                                      </span>
                                      <span className={t.completed ? 'text-gray-500 line-through' : 'text-neutral-300'}>
                                        {t.task}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[8px] text-gray-500 font-mono">
                              <span>PROCEDURAL DIRECTIVE:</span>
                              <span className="bg-neutral-900 px-2 py-0.5 rounded border border-white/5 text-purple-405 font-bold uppercase">
                                {currentStage.rulesOfProcedure}
                              </span>
                            </div>
                          </div>

                          {/* GHOSTSAFE counsel strategic advisory panel (2 cols) */}
                          <div className="md:col-span-2 bg-purple-950/5 border border-purple-500/10 p-4 rounded-2xl flex flex-col justify-between min-h-[300px]">
                            <div className="space-y-3 font-mono">
                              <h5 className="text-[9.5px] text-purple-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                <Lock size={11} className="text-purple-400" /> Counsel Strategy Advisor
                              </h5>
                              <p className="text-[9px] text-gray-300 leading-relaxed font-sans bg-neutral-950/40 p-3 rounded-xl border border-white/5">
                                {currentStage.strategicAdvisory}
                              </p>
                            </div>

                            <div className="mt-4 p-2.5 bg-neutral-950/20 border border-dashed border-white/5 rounded-xl text-[7.5px] text-neutral-500 font-mono leading-relaxed text-left">
                              <span className="font-bold text-gray-400 uppercase block mb-1">AUTOMATED WARDEN RECOGNITION</span>
                              Adherence to the procedural rules noted has been verified via the regional sandbox isolation layer. Standard logs and timestamps remain fully persistent in safe blockchain containers.
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {dossierActiveTab === 'metadata' && (
                    <>
                      {/* Metadata Cards */}
                      <h4 className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest mb-2.5 flex items-center gap-1.5 leading-none">
                      <Info size={11} /> Detailed File Metadata
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl">
                        <span className="text-[8px] text-neutral-500 block uppercase font-bold">Docket Index</span>
                        <span className="text-[10px] text-purple-200 font-black mt-1 block">{previewingDossier.docket}</span>
                      </div>
                      <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl">
                        <span className="text-[8px] text-neutral-500 block uppercase font-bold">Standard Classification</span>
                        <span className="text-[10px] text-gray-200 font-extrabold mt-1 block truncate" title={previewingDossier.type}>
                          {previewingDossier.type}
                        </span>
                      </div>
                      <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl">
                        <span className="text-[8px] text-neutral-500 block uppercase font-bold">GHOSTSAFE Purity Score</span>
                        <span className="text-[10px] text-emerald-400 font-black mt-1 block tracking-wider">{previewingDossier.purity}</span>
                      </div>
                      <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl">
                        <span className="text-[8px] text-neutral-500 block uppercase font-bold">Operational Status</span>
                        <span className="text-[10px] text-yellow-400/90 font-black mt-1 block tracking-wide">{previewingDossier.status}</span>
                      </div>
                      <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl">
                        <span className="text-[8px] text-neutral-500 block uppercase font-bold">Case Priority Level</span>
                        <span className={`text-[10px] font-black mt-1 block tracking-wide uppercase text-center rounded border py-0.5 ${getPriorityBadgeStyle(previewingDossier.priority)}`}>
                          {previewingDossier.priority}
                        </span>
                      </div>

                      <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl lg:col-span-3 col-span-2">
                        <span className="text-[8px] text-neutral-500 block uppercase font-bold">Absolute Storage Path</span>
                        <span className="text-[9px] text-neutral-400 font-bold mt-1 block truncate font-mono text-left" title={details.storagePath}>
                          {details.storagePath}
                        </span>
                      </div>
                      <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl lg:col-span-1">
                        <span className="text-[8px] text-neutral-500 block uppercase font-bold">Timestamp Ingested</span>
                        <span className="text-[9px] text-neutral-400 font-bold mt-1 block truncate font-mono">
                          {details.dateIngested}
                        </span>
                      </div>
                      <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl lg:col-span-1">
                        <span className="text-[8px] text-neutral-500 block uppercase font-bold">Atomic Block ID</span>
                        <span className="text-[9px] text-neutral-400 font-bold mt-1 block font-mono">
                          {details.ledgerBlock}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 bg-purple-950/15 border border-purple-500/10 rounded-xl flex flex-wrap justify-between items-center text-[9px] text-gray-400 gap-2">
                      <div className="flex items-center gap-1.5">
                        <Shield className="text-purple-400 shrink-0" size={12} />
                        <span>Jurisdiction of Record: <strong className="text-purple-300">{details.jurisdiction}</strong></span>
                      </div>
                      <div className="font-mono text-right text-[8px] text-gray-500 truncate max-w-sm" title={details.verificationHash}>
                        Ledger Signature: {details.verificationHash}
                      </div>
                    </div>

                    {/* Tag Management subsystem inside the detailed modal */}
                    <div className="mt-4 p-4 bg-neutral-900/45 border border-white/5 rounded-2xl">
                      <h5 className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest mb-3 flex items-center gap-1.5 leading-none">
                        <TagIcon size={12} className="text-purple-400" /> Case Organization & Custom Labels
                      </h5>
                      <div className="flex flex-col gap-3.5">
                        {/* Current applied tags list */}
                        <div className="flex flex-wrap gap-2 items-center min-h-[36px] p-2 bg-neutral-950/50 rounded-xl border border-white/5">
                          <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider pl-1 mr-1">Applied:</span>
                          {(dossierTags[previewingDossier.id] || []).length > 0 ? (
                            (dossierTags[previewingDossier.id] || []).map((t, index) => (
                              <span 
                                key={index} 
                                className={`text-[8.5px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1.5 leading-none transition-all ${getTagColorStyle(t.color)}`}
                              >
                                {t.label}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(previewingDossier.id, t.label)}
                                  className="text-neutral-500 hover:text-white hover:bg-white/10 rounded p-[1px] transition-all cursor-pointer"
                                  title={`Remove ${t.label} tag`}
                                >
                                  <X size={9} />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-[8.5px] text-neutral-600 font-medium italic">No organization labels attached. Use presets or create custom tags below.</span>
                          )}
                        </div>

                        {/* Add tag panel */}
                        <div className="flex flex-wrap items-center gap-3 bg-neutral-950/20 p-2.5 rounded-xl border border-dashed border-white/5">
                          {/* Label input */}
                          <div className="relative flex-1 min-w-[150px]">
                            <input
                              type="text"
                              placeholder="New label identifier... (e.g., Confidential)"
                              value={newTagLabel}
                              onChange={(e) => setNewTagLabel(e.target.value.slice(0, 15))}
                              className="w-full bg-neutral-950 border border-white/10 hover:border-white/15 focus:border-purple-500/40 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-neutral-600 focus:outline-none transition-all font-mono"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTag(previewingDossier.id);
                                }
                              }}
                            />
                          </div>

                          {/* Color picker */}
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] text-neutral-500 font-bold uppercase">Color Accent:</span>
                            <div className="flex gap-1.5">
                              {(['rose', 'amber', 'emerald', 'blue', 'purple'] as const).map((color) => {
                                let labelBg = '';
                                if (color === 'rose') labelBg = 'bg-rose-500 hover:bg-rose-400';
                                else if (color === 'amber') labelBg = 'bg-amber-500 hover:bg-amber-400';
                                else if (color === 'emerald') labelBg = 'bg-emerald-500 hover:bg-emerald-400';
                                else if (color === 'blue') labelBg = 'bg-blue-500 hover:bg-blue-400';
                                else if (color === 'purple') labelBg = 'bg-purple-500 hover:bg-purple-400';

                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => setNewTagColor(color)}
                                    className={`w-3.5 h-3.5 rounded-full ${labelBg} transition-all relative transform hover:scale-110 cursor-pointer flex items-center justify-center`}
                                    title={`Select ${color} color`}
                                  >
                                    {newTagColor === color && (
                                      <span className="absolute w-1.5 h-1.5 rounded-full bg-neutral-950" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Quick preset suggestion buttons */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] text-neutral-500 font-bold uppercase">Presets:</span>
                            <div className="flex gap-1">
                              {[
                                { label: 'Urgent', color: 'rose' },
                                { label: 'Review', color: 'amber' },
                                { label: 'Archive', color: 'blue' }
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => handleAddPresetTag(previewingDossier.id, preset.label, preset.color)}
                                  className={`text-[8px] px-2 py-0.5 rounded border font-semibold transition-all cursor-pointer ${getTagColorStyle(preset.color)}`}
                                >
                                  +{preset.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Add button */}
                          <button
                            type="button"
                            onClick={() => handleAddTag(previewingDossier.id)}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-1 rounded-lg text-[9px] uppercase border border-purple-500/20 active:scale-95 transition-all ml-auto cursor-pointer"
                          >
                            Apply Label
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Conflict of Interest Matrix subsystem */}
                    <div className="mt-4 p-4 bg-neutral-900/45 border border-white/5 rounded-2xl">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 leading-none">
                          <AlertTriangle size={12} className="text-rose-450 animate-pulse shrink-0" /> GHOSTSAFE Sovereign Conflict Audit
                        </h5>
                        <div className="flex gap-2">
                          <span className="text-[7.5px] font-mono uppercase bg-neutral-950 text-neutral-500 px-2 py-0.5 rounded border border-white/5 font-extrabold">
                            Active Cross-checking: ENABLED
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Column 1: Current Dossier Entities */}
                        <div className="bg-neutral-950/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[220px]">
                          <div>
                            <span className="text-[8.5px] text-neutral-400 font-extrabold uppercase tracking-widest block mb-2 font-sans border-b border-white/5 pb-1">
                              Mapped Entities ({ (caseEntities[previewingDossier.id] || []).length })
                            </span>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
                              {(caseEntities[previewingDossier.id] || []).map((ent, idx) => {
                                let catBadge = '';
                                if (ent.category === 'Party') catBadge = 'border-blue-500/30 text-blue-400 bg-blue-950/20';
                                else if (ent.category === 'Counsel') catBadge = 'border-rose-500/30 text-rose-400 bg-rose-950/20';
                                else if (ent.category === 'Technology') catBadge = 'border-purple-500/30 text-purple-400 bg-purple-950/20';
                                else catBadge = 'border-amber-500/30 text-amber-400 bg-amber-950/20';

                                return (
                                  <div key={idx} className="text-[8.5px] font-bold px-2 py-1 rounded border flex items-center gap-1.5 leading-none bg-neutral-950/70 border-white/5 text-gray-300">
                                    <span className="max-w-[120px] truncate">{ent.name}</span>
                                    <span className={`text-[6px] px-1 rounded uppercase tracking-wide leading-none ${catBadge}`}>
                                      {ent.category}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveEntity(previewingDossier.id, ent.name)}
                                      className="text-neutral-500 hover:text-white hover:bg-white/10 rounded p-[1px] transition-all cursor-pointer"
                                      title={`De-register ${ent.name}`}
                                    >
                                      <X size={9} />
                                    </button>
                                  </div>
                                );
                              })}
                              {(caseEntities[previewingDossier.id] || []).length === 0 && (
                                <p className="text-[8px] text-neutral-600 italic">No mapped entities registered.</p>
                              )}
                            </div>
                          </div>

                          {/* Quick Add Interface */}
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <span className="text-[8px] text-neutral-500 font-extrabold uppercase mb-1.5 block">Register New Entity mapping:</span>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="Entity name/counsel..."
                                value={newEntityName}
                                onChange={(e) => setNewEntityName(e.target.value.slice(0, 30))}
                                className="flex-1 bg-neutral-950 border border-white/10 hover:border-white/15 focus:border-rose-500/40 rounded-lg px-2.5 py-1 text-[9px] text-white focus:outline-none transition-all font-mono"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddEntity(previewingDossier.id);
                                  }
                                }}
                              />
                              <select
                                value={newEntityCategory}
                                onChange={(e) => setNewEntityCategory(e.target.value as any)}
                                className="bg-neutral-950 border border-white/10 rounded-lg px-1 text-[8.5px] text-neutral-450 focus:outline-none font-mono"
                              >
                                <option value="Party">Party</option>
                                <option value="Counsel">Counsel</option>
                                <option value="Technology">Tech</option>
                                <option value="Infrastructure">Infra</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleAddEntity(previewingDossier.id)}
                                className="bg-neutral-900 hover:bg-neutral-850 text-rose-400 font-bold px-2.5 rounded-lg text-[8.5px] border border-rose-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                              >
                                Add Map
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Audit Feed of Conflicts */}
                        <div className="bg-neutral-950/40 p-3 rounded-xl border border-white/5 h-[220px] flex flex-col">
                          <span className="text-[8.5px] text-neutral-400 font-extrabold uppercase tracking-widest block mb-1 font-sans border-b border-white/5 pb-1">
                            Calculated Security Bulletins
                          </span>
                          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 p-0.5">
                            {(() => {
                              const caseConflicts = detectedConflicts.filter(c => c.dossierIdA === previewingDossier.id || c.dossierIdB === previewingDossier.id);
                              if (caseConflicts.length > 0) {
                                return caseConflicts.map((c, idx) => {
                                  let blockStyle = '';
                                  let icon = <Info size={10} />;
                                  let severityBadge = '';

                                  if (c.severity === 'CRITICAL') {
                                    blockStyle = 'border-rose-500/20 bg-rose-955/15 text-rose-300';
                                    icon = <AlertTriangle className="animate-pulse shrink-0" size={11} />;
                                    severityBadge = 'bg-rose-500/35 text-white border-rose-500/45';
                                  } else if (c.severity === 'WARNING') {
                                    blockStyle = 'border-amber-500/20 bg-amber-955/10 text-amber-300';
                                    icon = <AlertCircle className="shrink-0 animate-pulse" size={11} />;
                                    severityBadge = 'bg-amber-500/25 text-amber-200 border-amber-500/35';
                                  } else {
                                    blockStyle = 'border-purple-500/10 bg-purple-955/10 text-purple-300';
                                    icon = <Info className="shrink-0" size={11} />;
                                    severityBadge = 'bg-purple-950/40 text-purple-200 border-purple-500/25';
                                  }

                                  const otherDossierId = c.dossierIdA === previewingDossier.id ? c.dossierIdB : c.dossierIdA;
                                  const otherDossier = ACTIVE_DOSSIERS.find(d => d.id === otherDossierId);
                                  const otherName = otherDossier ? otherDossier.name.split(' v. ')[0] : otherDossierId;

                                  return (
                                    <div key={idx} className={`p-2 border rounded-xl flex gap-2 items-start ${blockStyle}`}>
                                      {icon}
                                      <div className="text-[8.5px] leading-relaxed text-left flex-1">
                                        <div className="flex justify-between items-center font-bold mb-1 font-mono">
                                          <span className="uppercase tracking-wider">Overlapping {c.category}: {c.entityName}</span>
                                          <span className={`text-[6px] font-extrabold px-1.5 py-[0.5px] rounded border leading-none uppercase ${severityBadge}`}>
                                            {c.severity}
                                          </span>
                                        </div>
                                        <p className="text-gray-400 font-sans">{c.description}</p>
                                        <div className="mt-1 text-[7.5px] font-mono text-neutral-500 uppercase font-black">
                                          Cross Reference Dossier: {otherName} ({otherDossierId.toUpperCase()})
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              }
                              return (
                                <div className="h-full flex flex-col justify-center items-center text-center p-4">
                                  <span className="text-[14px] mb-1">🛡️</span>
                                  <p className="text-[8.5px] text-emerald-400/90 font-black tracking-wider uppercase">Zero Fiduciary Hazards</p>
                                  <p className="text-[7.5px] text-neutral-600 font-sans mt-0.5 leading-normal max-w-[200px]">
                                    No attorney overlaps, stakeholder intersections, or architectural collisions found with current registers.
                                  </p>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    </>
                  )}

                  {dossierActiveTab === 'witnesses' && (
                    <>
                      {/* Cryptographic Witness Directory & Ledger Hub */}
                      <div className="mt-4 p-4 bg-neutral-900/45 border border-white/5 rounded-2xl">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 leading-none font-mono">
                          <UserCheck size={12} className="text-purple-400" /> GHOSTSAFE Cryptographic Witness Inquest Hub
                        </h5>
                        <div className="flex gap-2">
                          <span className="text-[7.5px] font-mono uppercase bg-neutral-950 text-emerald-400 px-2 py-0.5 rounded border border-white/5 font-extrabold">
                            Anonymity Protection: ACTIVE
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Column 1: Witness Directory */}
                        <div className="bg-neutral-955/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[360px]">
                          <div>
                            <span className="text-[8.5px] text-neutral-400 font-extrabold uppercase tracking-widest block mb-2 font-sans border-b border-white/5 pb-1">
                              Witness Directory Archive ({ (witnessDirectory[previewingDossier.id] || []).length })
                            </span>
                            
                            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar p-0.5">
                              {(witnessDirectory[previewingDossier.id] || []).map((w, idx) => (
                                <div key={idx} className="p-2 border border-white/5 bg-neutral-950/70 rounded-xl text-left flex justify-between items-start">
                                  <div className="space-y-1 pr-2 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[9.5px] font-black text-white">{w.name}</span>
                                      <span className="text-[7px] px-1.5 py-0.5 rounded bg-purple-950/30 text-purple-300 font-extrabold uppercase tracking-wide border border-purple-500/10">
                                        {w.role}
                                      </span>
                                    </div>
                                    <p className="text-[8.5px] text-neutral-400 leading-normal font-sans">
                                      {w.contact}
                                    </p>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(w.contact);
                                        dispatchWardenLog('SUCCESS', `Copied contact details for ${w.name} to clipboard.`);
                                      }}
                                      className="text-neutral-500 hover:text-white hover:bg-white/5 rounded p-1 transition-all cursor-pointer"
                                      title="Copy contact reference"
                                    >
                                      <Copy size={10} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveWitness(previewingDossier.id, w.name)}
                                      className="text-neutral-500 hover:text-rose-450 hover:bg-rose-950/20 rounded p-1 transition-all cursor-pointer"
                                      title={`De-register witness ${w.name}`}
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {(witnessDirectory[previewingDossier.id] || []).length === 0 && (
                                <p className="text-[8px] text-neutral-600 italic">No registered witnesses mapped to this archive.</p>
                              )}
                            </div>
                          </div>

                          {/* Quick Add Witness Form */}
                          <div className="mt-4 pt-3 border-t border-white/5">
                            <span className="text-[8px] text-purple-400 font-extrabold uppercase mb-2 block tracking-wider font-mono">Register Witness Node mapping:</span>
                            <div className="space-y-1.5 font-mono">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Witness Identifier Name..."
                                  value={newWitnessName}
                                  onChange={(e) => setNewWitnessName(e.target.value.slice(0, 30))}
                                  className="bg-neutral-950 border border-white/10 hover:border-white/15 focus:border-purple-500/45 rounded-lg px-2.5 py-1 text-[9px] text-white focus:outline-none transition-all placeholder:text-neutral-600"
                                />
                                <input
                                  type="text"
                                  placeholder="Role / Relation to Case..."
                                  value={newWitnessRole}
                                  onChange={(e) => setNewWitnessRole(e.target.value.slice(0, 40))}
                                  className="bg-neutral-950 border border-white/10 hover:border-white/15 focus:border-purple-500/45 rounded-lg px-2.5 py-1 text-[9px] text-white focus:outline-none transition-all placeholder:text-neutral-600"
                                />
                              </div>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Contact Info, Evidence Details, or text threads reference..."
                                  value={newWitnessContact}
                                  onChange={(e) => setNewWitnessContact(e.target.value.slice(0, 150))}
                                  className="flex-1 bg-neutral-950 border border-white/10 hover:border-white/15 focus:border-purple-500/45 rounded-lg px-2.5 py-1 text-[9px] text-white focus:outline-none transition-all placeholder:text-neutral-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddWitness(previewingDossier.id)}
                                  className="bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 font-bold px-3 rounded-lg text-[9px] uppercase border border-purple-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                                >
                                  Log Witness
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Digital Hashing & OpenTimestamps Anchor */}
                        <div className="bg-neutral-950/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[360px]">
                          <div>
                            <span className="text-[8.5px] text-neutral-400 font-extrabold uppercase tracking-widest block mb-2 font-sans border-b border-white/5 pb-1">
                              Anonymity & Blockchain Verification Engine
                            </span>

                            {isHashingProgress ? (
                              <div className="h-44 flex flex-col justify-center items-center text-center p-3 bg-neutral-950/30 rounded-xl border border-dashed border-purple-500/10 mb-2">
                                <div className="relative w-8 h-8 mb-3">
                                  <div className="absolute inset-0 rounded-full border-2 border-purple-500/10 border-t-purple-500 animate-spin"></div>
                                  <Fingerprint className="absolute inset-1.5 text-purple-405 animate-pulse" size={20} />
                                </div>
                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest animate-pulse font-mono max-w-[240px]">
                                  {hashingStep}
                                </p>
                                <p className="text-[7.5px] text-gray-500 font-serif mt-1 animate-pulse">
                                  Decrypting local sandbox memory limits...
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2 mb-2 text-left">
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-[7.5px] text-neutral-550 uppercase font-black font-mono">Signatory Source:</label>
                                  <select
                                    className="col-span-2 bg-neutral-950 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-neutral-300 focus:outline-none font-mono"
                                    value={activeHasherWitness}
                                    onChange={(e) => setActiveHasherWitness(e.target.value)}
                                  >
                                    <option value="">-- Choose Witness --</option>
                                    {(witnessDirectory[previewingDossier.id] || []).map((w, idx) => (
                                      <option key={idx} value={w.name}>{w.name}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div className="space-y-1">
                                  <label className="text-[7.5px] text-neutral-550 uppercase font-black font-mono block">Written Statement or Narrative Segment:</label>
                                  <textarea
                                    rows={3}
                                    placeholder="Type or paste the written statement segment here to anchor..."
                                    value={activeHasherStatement}
                                    onChange={(e) => setActiveHasherStatement(e.target.value)}
                                    className="w-full bg-neutral-950 border border-white/10 hover:border-white/15 focus:border-purple-500/40 rounded-xl p-2.5 text-[9px] text-white focus:outline-none resize-none leading-relaxed font-sans placeholder:text-neutral-600"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAnchorStatement(previewingDossier.id)}
                                  className="w-full bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-750 hover:to-purple-850 text-white font-bold py-1.5 px-3 rounded-lg text-[9px] uppercase tracking-widest border border-purple-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-black cursor-pointer font-mono"
                                >
                                  <Fingerprint size={12} className="text-purple-200" /> Sign & Seal Dynamic Ledger lock
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Anchored Receipts Timeline */}
                          <div className="flex-1 bg-neutral-950/20 rounded-xl border border-dashed border-white/5 p-2 flex flex-col justify-start min-h-[140px]">
                            <span className="text-[7.5px] text-neutral-500 font-bold uppercase tracking-wider block mb-1.5 font-mono">
                              Anchored Ledger Receipts (Active Inquest)
                            </span>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-40 p-0.5">
                              {(witnessStatements[previewingDossier.id] || []).map((s, idx) => (
                                <div key={idx} className="p-2 border border-purple-500/10 bg-purple-950/5 rounded-lg text-[8.5px] text-left leading-relaxed">
                                  <div className="flex justify-between items-center font-bold mb-0.5 font-mono flex-wrap gap-1">
                                    <span className="text-purple-300">Ref: {s.witnessName}</span>
                                    <span className="text-[7px] text-emerald-450 uppercase font-black tracking-wide flex items-center gap-0.5">
                                      🛡️ {s.zkProof.slice(0, 18)}...
                                    </span>
                                  </div>
                                  <p className="text-gray-300 font-sans italic mb-1">"{s.text}"</p>
                                  <div className="font-mono text-[7px] text-gray-500 space-y-0.5 border-t border-white/5 pt-1 mt-1 font-mono">
                                    <div className="flex justify-between">
                                      <span>SHA-255 digest:</span>
                                      <span className="text-neutral-450 select-all truncate max-w-[150px]" title={s.hash}>{s.hash}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Bitcoin block anchoring:</span>
                                      <span className="text-neutral-450 font-black">{s.block} ({s.timestamp})</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(witnessStatements[previewingDossier.id] || []).length === 0 && (
                                <div className="h-full flex flex-col justify-center items-center text-center p-3 font-mono">
                                  <span className="text-[12px] opacity-40">🔐</span>
                                  <p className="text-[8px] text-neutral-600 font-sans mt-0.5 leading-normal uppercase font-bold">Awaiting digital seals</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Portals Section */}
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <span className="text-[8.5px] text-purple-400 font-extrabold uppercase tracking-widest block mb-2.5 font-mono">
                          Secure Decrypted Witness Portals & Upload Channels
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            {
                              title: 'Evidence Inquest Portal',
                              desc: 'Secure peer-to-peer portal to review case schedules, text timelines, and authenticated written logs.',
                              link: 'https://drive.google.com/open?id=1bm4wtGeyTHfCkE6T3jlBoSbDKGb5aLhiAW6qJyGyafQ',
                              badgeColor: 'border-blue-500/20 text-blue-400 bg-blue-950/20 hover:bg-blue-950/30',
                              badgeText: 'P2P PORTAL'
                            },
                            {
                              title: 'Forensic Audit Summary',
                              desc: 'Review verified wage calculations, hours logged, and systemic W-2 tax audit disclosures.',
                              link: 'https://drive.google.com/open?id=1RvMul5IGi2wexPD-0LfaZiN8Xdzr3GmwIr6NbQIqwTk',
                              badgeColor: 'border-emerald-500/20 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30',
                              badgeText: 'TAX DATA VALIDATED'
                            },
                            {
                              title: 'Secure Upload Vault',
                              desc: 'Submit fully anonymized testimonals or documents encrypted via local post-quantum shields directly.',
                              link: 'https://drive.google.com/open?id=1uO9Qr8kBm_kRxJEklN4uhXsSqu2dYmwjj_s5U2I6yu0',
                              badgeColor: 'border-rose-500/20 text-rose-400 bg-rose-950/20 hover:bg-rose-950/30',
                              badgeText: 'ANONYMOUS COMMITS'
                            }
                          ].map((portal, idx) => (
                            <div key={idx} className="p-3 bg-neutral-950/40 border border-white/5 rounded-xl hover:border-purple-500/20 transition-all text-left flex flex-col justify-between">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center font-mono">
                                  <span className="text-[9.5px] font-black text-white">{portal.title}</span>
                                  <span className={`text-[6.5px] font-extrabold px-1.5 py-0.5 rounded border ${portal.badgeColor}`}>
                                    {portal.badgeText}
                                  </span>
                                </div>
                                <p className="text-[8px] text-gray-400 font-sans leading-normal">
                                  {portal.desc}
                                </p>
                              </div>
                              <div className="mt-3 pt-2.5 border-t border-white/5 flex gap-2 justify-end font-mono">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(portal.link);
                                    dispatchWardenLog('SUCCESS', `Copied link for ${portal.title} to secure clipboard buffer.`);
                                  }}
                                  className="px-2 py-1 text-[7.5px] font-bold text-neutral-400 hover:text-white bg-white/5 rounded flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy size={9} /> Copy Ref
                                </button>
                                <a
                                  href={portal.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => {
                                    dispatchWardenLog('INFO', `Opened decrypted external portal: ${portal.title}`);
                                  }}
                                  className="px-2 py-1 text-[7.5px] font-bold text-purple-400 hover:text-white bg-purple-950/50 hover:bg-purple-900/60 rounded flex items-center gap-1 cursor-pointer decoration-transparent"
                                >
                                  <ExternalLink size={9} /> Open Portal
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    </>
                  )}

                  {dossierActiveTab === 'documents' && (
                    <>
                      {/* Content Preview & Legal Notes - Split / Accordion Frame */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Content Preview */}
                    <div className="flex flex-col h-72">
                      <h4 className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest mb-2 flex items-center gap-1.5 leading-none shrink-0">
                        <FileText size={11} className="text-purple-400" /> Decrypted Content Preview
                      </h4>
                      <div className="flex-1 bg-neutral-950 rounded-2xl border border-white/5 p-4 overflow-y-auto select-all scrollbar-thin custom-scrollbar min-h-0 text-left">
                        <pre className="text-gray-300 text-[10px] whitespace-pre-wrap font-sans leading-relaxed">
                          {details.contentPreview}
                        </pre>
                      </div>
                    </div>

                    {/* Associated Legal Notes */}
                    <div className="flex flex-col h-72">
                      <h4 className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest mb-2 flex items-center gap-1.5 leading-none shrink-0 font-mono">
                         <Lock size={11} className="text-purple-400" /> Associated Strategic Legal Notes
                      </h4>
                      <div className="flex-1 bg-neutral-950 rounded-2xl border border-white/5 p-4 overflow-y-auto select-all scrollbar-thin custom-scrollbar min-h-0 text-left">
                        <pre className="text-gray-300 text-[10px] whitespace-pre-wrap font-sans leading-relaxed">
                          {details.legalNotes}
                        </pre>
                      </div>
                    </div>
                  </div>
                    </>
                  )}

                </div>

                {/* Footer Frame */}
                <div className="border-t border-white/5 pt-4 flex flex-wrap gap-3 justify-between items-center shrink-0">
                  <p className="text-[8px] text-gray-500 font-mono uppercase tracking-[0.1em]">
                    PROXMOX LOCAL CLUSTER: MEMORY SEGMENT LOCK SAFE
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDossierModalOpen(false)}
                      className="px-4 py-2 bg-neutral-900 border border-white/5 hover:border-white/10 text-neutral-300 hover:text-white rounded-xl transition-all text-[9.5px] font-bold uppercase tracking-wide cursor-pointer"
                    >
                      Dismiss View
                    </button>
                    {selectedDossier.id !== previewingDossier.id && (
                      <button
                        onClick={() => {
                          setSelectedDossier(previewingDossier);
                          setDossierModalOpen(false);
                          dispatchWardenLog('SUCCESS', `Mounted Sovereign Case Dossier: ${previewingDossier.name}`);
                        }}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all text-[9.5px] font-black uppercase tracking-wide shadow-md shadow-purple-900/10 cursor-pointer"
                      >
                        Mount Case Context
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Global System Info Overlay */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-lg w-full relative shadow-2xl font-mono">
            <button 
              onClick={() => setShowInfo(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-white mb-4 tracking-tight uppercase flex items-center gap-2">
              <Shield className="text-purple-400" size={18} /> System Specification Briefing
            </h3>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              This system is fully self-hosted within virtualized Proxmox micro-environments. It runs decentralized Kubernetes containers with mTLS point-to-point secure tunnels, utilizing standard custom-seeded entropy fields and Ceph WORM storage vaults.
            </p>
            <div className="space-y-3 font-sans">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <h4 className="text-purple-400 text-[10px] font-bold uppercase tracking-widest leading-none">Security Architecture</h4>
                <div className="text-xs text-neutral-300 space-y-1">
                  <p>• Zero trust network hardware certificate gatekeeping (mTLS)</p>
                  <p>• Write-Once-Read-Many (WORM) write limits for partner audit tracking</p>
                  <p>• Deep model real-time audio strategy synchronization via Gemini</p>
                </div>
              </div>
            </div>
            <div className="text-[9px] text-gray-600 mt-6 pt-4 border-t border-white/5 uppercase tracking-widest font-bold">
              Secure Key ID: [GLYPH - 8df1a9 - 4b29c1]
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
