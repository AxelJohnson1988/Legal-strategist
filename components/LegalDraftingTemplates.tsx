import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { DraftDocument, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandlers';
import { 
  FileText, BookOpen, Compass, Copy, Check, Save, Trash2, Edit3, 
  Plus, Search, ChevronRight, FileDown, Eye, AlertCircle, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default templated field helpers containing instructional legal placeholders
const TEMPLATE_PLACEHOLDERS = {
  case_brief: {
    caseName: 'e.g. Miranda v. Arizona',
    citation: 'e.g. 384 U.S. 436 (1966)',
    courtName: 'e.g. United States Supreme Court',
    factsSegment: 'Enumerate chronological material events and facts that prompted the litigation...',
    legalIssues: 'Specify the constitutional, statutory, or regulatory questions of law presented...',
    holdingDec: 'The ultimate decision or legal ruling established by the court...',
    rationaleDec: 'Detailed logical explanation, statutory interpretation, or cases cited in support...',
    practitionerNotes: 'Strategic takeaways, precedents modified, or upcoming defense arguments...'
  },
  motion_summary: {
    motionType: 'e.g. Motion for Summary Judgment',
    movingParty: 'e.g. Defendant Acme Corporation',
    opposingParty: 'e.g. Plaintiff Jane Doe',
    coreArguments: 'Outline major arguments relying closely on procedural rules and undisputed facts...',
    stdOfReview: 'Applicable legal standard of review (e.g. "no genuine dispute as to any material fact")...',
    supportingEvidence: 'List specific affidavits, admissions, or deposition page transcripts...',
    reliefRequested: 'State the precise order item or final adjudication requested of the court...'
  },
  discovery_plan: {
    disclosuresDue: 'Scope and timeline of initial mandatory disclosures under Rule 26(a)...',
    depositionsPlanned: 'Name of key witnesses, executive officers, experts, and core topics of inquiry...',
    productionRequests: 'Categories of relevant electronic business records, documents, or data packets required...',
    interrogatoriesList: 'Primary written interrogatory topics designed to uncover factual claims...',
    keyDeadlines: 'Strict timeline summarizing discovery closing, joint status reports, or trial...'
  }
};

const TEMPLATE_TITLES = {
  case_brief: 'Case Brief Analytical Template',
  motion_summary: 'Procedural Motion Summary',
  discovery_plan: 'Strategic Discovery Plan'
};

export const LegalDraftingTemplates: React.FC = () => {
  // Saved documents status
  const [drafts, setDrafts] = useState<DraftDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDraft, setActiveDraft] = useState<DraftDocument | null>(null);

  // Template drafting editor states
  const [selectedTemplate, setSelectedTemplate] = useState<'case_brief' | 'motion_summary' | 'discovery_plan'>('case_brief');
  const [docTitle, setDocTitle] = useState('');
  const [contentFields, setContentFields] = useState<Record<string, string>>({});
  
  // Interactivity feedback states
  const [clipboardCopied, setClipboardCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load user drafts securely from Firestore
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const path = 'drafts';
    const q = query(collection(db, path), where('userId', '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DraftDocument)).sort((a, b) => {
        const aTime = a.updatedAt?.seconds || 0;
        const bTime = b.updatedAt?.seconds || 0;
        return bTime - aTime; // Show recently updated first
      });
      setDrafts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  // Initialize fields when template type changes
  useEffect(() => {
    if (!activeDraft) {
      setDocTitle('');
      const defaultFields: Record<string, string> = {};
      Object.keys(TEMPLATE_PLACEHOLDERS[selectedTemplate]).forEach((key) => {
        defaultFields[key] = '';
      });
      setContentFields(defaultFields);
    }
  }, [selectedTemplate, activeDraft]);

  // Load a draft document into active editing state
  const handleLoadDraft = (draft: DraftDocument) => {
    setActiveDraft(draft);
    setSelectedTemplate(draft.templateType);
    setDocTitle(draft.title);
    setContentFields(draft.content as Record<string, string>);
    setErrorMessage(null);
    setSaveSuccess(false);
  };

  // Turn active document back to blank creation state
  const handleNewDraft = () => {
    setActiveDraft(null);
    setDocTitle('');
    const defaultFields: Record<string, string> = {};
    Object.keys(TEMPLATE_PLACEHOLDERS[selectedTemplate]).forEach((key) => {
      defaultFields[key] = '';
    });
    setContentFields(defaultFields);
    setErrorMessage(null);
    setSaveSuccess(false);
  };

  // Synchronize input fields
  const handleFieldChange = (key: string, value: string) => {
    setContentFields(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Persist / Save action incorporating security & error standards
  const handleSaveDoc = async () => {
    if (!auth.currentUser) return;
    if (!docTitle.trim()) {
      setErrorMessage('Please provide a document title before saving.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    const path = activeDraft?.id ? `drafts/${activeDraft.id}` : 'drafts';

    try {
      const docPayload = {
        userId: auth.currentUser.uid,
        title: docTitle,
        templateType: selectedTemplate,
        content: contentFields,
        updatedAt: serverTimestamp()
      };

      if (activeDraft?.id) {
        // Update existing document
        await updateDoc(doc(db, 'drafts', activeDraft.id), docPayload);
        // Sync state
        setActiveDraft(prev => prev ? { ...prev, title: docTitle, content: contentFields } : null);
      } else {
        // Create new draft
        const docRef = await addDoc(collection(db, 'drafts'), {
          ...docPayload,
          createdAt: serverTimestamp()
        });
        // Establish as active draft to permit incremental updates
        setActiveDraft({
          id: docRef.id,
          userId: auth.currentUser.uid,
          title: docTitle,
          templateType: selectedTemplate,
          content: contentFields,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving legal brief draft:', err);
      setErrorMessage('Uplink failed. Ensure title is correct and database rules allow access.');
      handleFirestoreError(err, activeDraft?.id ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete draft helper
  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this legal draft?')) return;

    const path = `drafts/${id}`;
    try {
      await deleteDoc(doc(db, 'drafts', id));
      if (activeDraft?.id === id) {
        handleNewDraft();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Generate dynamic, clean, readable Legal Markdown/Plaintext
  const generateFormattedDraft = () => {
    const formattedTitle = docTitle || 'Untitled Draft Document';
    const divider = '='.repeat(formattedTitle.length);
    
    let md = `${formattedTitle}\n${divider}\n`;
    md += `Type: ${TEMPLATE_TITLES[selectedTemplate]}\n`;
    md += `Generated: ${new Date().toLocaleDateString()} via Phoenix Secure Legal Workspace\n\n`;

    if (selectedTemplate === 'case_brief') {
      md += `## 1. COURT & CITATION INFO\n`;
      md += `Case Name: ${contentFields.caseName || '[Not provided]'}\n`;
      md += `Citation: ${contentFields.citation || '[Not provided]'}\n`;
      md += `Jurisdiction / Court: ${contentFields.courtName || '[Not provided]'}\n\n`;
      md += `## 2. MATERIAL FACTS & CONTEXT\n${contentFields.factsSegment || '[Not analyzed]'}\n\n`;
      md += `## 3. QUESTIONS OF LAW PRESENTED\n${contentFields.legalIssues || '[Not analyzed]'}\n\n`;
      md += `## 4. JUDGE / COURT HOLDING\n${contentFields.holdingDec || '[Not specified]'}\n\n`;
      md += `## 5. RATIONALE & PRECEDENT ANALYSIS\n${contentFields.rationaleDec || '[Not specified]'}\n\n`;
      md += `## 6. PRACTITIONER & STRATEGY TAKEAWAYS\n${contentFields.practitionerNotes || '[No strategic notes recorded]'}\n`;
    } else if (selectedTemplate === 'motion_summary') {
      md += `## 1. MOTION SUMMARY HEADERS\n`;
      md += `Motion Type: ${contentFields.motionType || '[Not specified]'}\n`;
      md += `Moving Party: ${contentFields.movingParty || '[Not specified]'}\n`;
      md += `Opposing Party: ${contentFields.opposingParty || '[Not specified]'}\n\n`;
      md += `## 2. STANDARD OF REVIEW APPLICABLE\n${contentFields.stdOfReview || '[Not specified]'}\n\n`;
      md += `## 3. CORE ARGUMENTS ADVANCED\n${contentFields.coreArguments || '[Not analyzed]'}\n\n`;
      md += `## 4. MATERIAL EVIDENCE & RECORD EXCERPTS\n${contentFields.supportingEvidence || '[Not compiled]'}\n\n`;
      md += `## 5. FORMS OF RELIEF REQUESTED\n${contentFields.reliefRequested || '[Not specified]'}\n`;
    } else {
      md += `## 1. MANDATORY DISCLOSURES (RULE 26)\n${contentFields.disclosuresDue || '[Not scheduled]'}\n\n`;
      md += `## 2. WITNESS DEPOSITIONS SCHEMA\n${contentFields.depositionsPlanned || '[Not compiled]'}\n\n`;
      md += `## 3. DOCUMENTARY REQUESTS FOR PRODUCTION\n${contentFields.productionRequests || '[Not planned]'}\n\n`;
      md += `## 4. INTERROGATORY LINES OF INQUIRY\n${contentFields.interrogatoriesList || '[Not outlined]'}\n\n`;
      md += `## 5. KEY DISCOVERY DEADLINES & MILESTONES\n${contentFields.keyDeadlines || '[Not scheduled]'}\n`;
    }
    
    return md;
  };

  // Clipboard integration conforming to user restrictions
  const handleCopyToClipboard = () => {
    const text = generateFormattedDraft();
    navigator.clipboard.writeText(text).then(() => {
      setClipboardCopied(true);
      setTimeout(() => setClipboardCopied(false), 2000);
    });
  };

  // Local physical file exporter (clean.txt format)
  const handleDownloadFile = () => {
    const text = generateFormattedDraft();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(docTitle || 'legal_draft').toLowerCase().replace(/\s+/g, '_')}_brief.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!auth.currentUser) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mt-6 px-4">
      <div className="bg-neutral-900 border border-white/5 rounded-[2.5rem] p-6 md:p-8 xl:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        
        {/* Glow ambient background accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
          <div>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.2em] mb-1.5 block">PRODUCING TRUTH</span>
            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <BookOpen className="text-purple-400" size={28} />
              Structured Legal Templates
            </h2>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">Draft structured briefs, dynamic motion summaries, and discovery timelines aligned with procedural standards.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeDraft && (
              <button
                onClick={handleNewDraft}
                className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/5"
              >
                <Plus size={14} />
                Create New Brief
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Division Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* Side pane: saved briefs library */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-neutral-950/60 rounded-3xl border border-white/5 p-5 flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Secure Draft Storage ({drafts.length})
                </span>
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs gap-2">
                  <RefreshCw className="animate-spin text-purple-400" size={18} />
                  <span>Scanning local archives...</span>
                </div>
              ) : drafts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 text-center px-4 py-10 border border-dashed border-white/5 rounded-2xl">
                  <FileText className="mb-2 text-neutral-700" size={28} />
                  <p className="text-xs">No saved drafts found.</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Select a template on the right to construct your initial strategic brief.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      onClick={() => handleLoadDraft(draft)}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3 group relative ${
                        activeDraft?.id === draft.id
                          ? 'bg-purple-500/10 border-purple-500/30 shadow-md shadow-purple-500/5'
                          : 'bg-neutral-900/50 border-white/5 hover:border-white/10 hover:bg-neutral-900'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${
                        draft.templateType === 'case_brief' ? 'bg-orange-500/10 text-orange-400' :
                        draft.templateType === 'motion_summary' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {draft.templateType === 'case_brief' ? <FileText size={14} /> :
                         draft.templateType === 'motion_summary' ? <BookOpen size={14} /> : <Compass size={14} />}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-white text-xs font-bold truncate">{draft.title}</h4>
                        <span className="text-[9px] text-gray-500 font-bold tracking-wider uppercase block mt-1">
                          {draft.templateType.replace('_', ' ')}
                        </span>
                        <span className="text-[8px] text-gray-600 block mt-0.5">
                          {draft.updatedAt ? new Date(draft.updatedAt.seconds * 1000).toLocaleDateString() : 'Drafting'}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteDraft(draft.id!, e)}
                        className="p-1.5 text-neutral-600 hover:text-red-400 absolute right-2.5 top-2.5 rounded-lg hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete document draft"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Helper Tips box */}
            <div className="bg-neutral-950/20 border border-white/5 p-5 rounded-3xl text-xs text-gray-400 flex flex-col gap-2">
              <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={12} className="text-purple-400" /> Professional drafting helper
              </span>
              <p className="leading-relaxed text-gray-400">
                Templates conform to standard legal filing formats. Save documents to sync with your secure cloud profile. You can download drafts as `.txt` files containing clean legal headings.
              </p>
            </div>
          </div>

          {/* Primary workspace editor & live preview */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Template Class Selector - only active when NOT editing an existing document */}
            <div className="flex bg-neutral-950 p-1.5 rounded-2xl border border-white/5">
              {(['case_brief', 'motion_summary', 'discovery_plan'] as const).map((type) => (
                <button
                  key={type}
                  disabled={!!activeDraft}
                  onClick={() => setSelectedTemplate(type)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold tracking-tight transition-all ${
                    selectedTemplate === type
                      ? 'bg-neutral-800 text-white shadow-lg'
                      : activeDraft 
                        ? 'text-gray-600 cursor-not-allowed opacity-50' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type === 'case_brief' ? <FileText size={14} /> :
                   type === 'motion_summary' ? <BookOpen size={14} /> : <Compass size={14} />}
                  <span className="hidden sm:inline">{TEMPLATE_TITLES[type].split(' ')[0]} {TEMPLATE_TITLES[type].split(' ')[1] || ''}</span>
                  <span className="sm:hidden">{type.replace('_', ' ')}</span>
                </button>
              ))}
            </div>

            {/* Editing Pane Canvas */}
            <div className="bg-neutral-950/40 rounded-[2rem] border border-white/5 p-6 md:p-8 flex flex-col gap-5">
              
              {/* Document Master Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">
                    {activeDraft ? 'EDITING SECURE BRIEF' : 'NEW BRIEF SPECIFICATION'}
                  </label>
                  <input
                    required
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Enter unique document name, case code or docket code..."
                    className="w-full bg-transparent text-white text-lg font-black placeholder:text-gray-700 border-none outline-none focus:ring-0 p-0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-2 bg-neutral-950 hover:bg-neutral-900 border border-white/5 hover:border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                    title="Copy formatted markdown to clipboard"
                  >
                    {clipboardCopied ? <Check size={16} className="text-emerald-400 animate-scale" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={handleDownloadFile}
                    className="p-2 bg-neutral-950 hover:bg-neutral-900 border border-white/5 hover:border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                    title="Download clean plain-text report"
                  >
                    <FileDown size={16} />
                  </button>
                </div>
              </div>

              {/* Dynamic Form Blocks Based on Selected Template */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {selectedTemplate === 'case_brief' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Case Name</label>
                        <input
                          type="text"
                          value={contentFields.caseName || ''}
                          onChange={(e) => handleFieldChange('caseName', e.target.value)}
                          placeholder={TEMPLATE_PLACEHOLDERS.case_brief.caseName}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Citation Code</label>
                        <input
                          type="text"
                          value={contentFields.citation || ''}
                          onChange={(e) => handleFieldChange('citation', e.target.value)}
                          placeholder={TEMPLATE_PLACEHOLDERS.case_brief.citation}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Court Jurisdiction</label>
                      <input
                        type="text"
                        value={contentFields.courtName || ''}
                        onChange={(e) => handleFieldChange('courtName', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.case_brief.courtName}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Material Fact Profile</label>
                      <textarea
                        rows={3}
                        value={contentFields.factsSegment || ''}
                        onChange={(e) => handleFieldChange('factsSegment', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.case_brief.factsSegment}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Questions of Law / Issues Presentation</label>
                      <textarea
                        rows={3}
                        value={contentFields.legalIssues || ''}
                        onChange={(e) => handleFieldChange('legalIssues', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.case_brief.legalIssues}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5 font-bold">Court Holding</label>
                        <textarea
                          rows={3}
                          value={contentFields.holdingDec || ''}
                          onChange={(e) => handleFieldChange('holdingDec', e.target.value)}
                          placeholder={TEMPLATE_PLACEHOLDERS.case_brief.holdingDec}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5 font-bold">Incorruptible Legal Rationale</label>
                        <textarea
                          rows={3}
                          value={contentFields.rationaleDec || ''}
                          onChange={(e) => handleFieldChange('rationaleDec', e.target.value)}
                          placeholder={TEMPLATE_PLACEHOLDERS.case_brief.rationaleDec}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Practitioner Strategy Notes</label>
                      <textarea
                        rows={2}
                        value={contentFields.practitionerNotes || ''}
                        onChange={(e) => handleFieldChange('practitionerNotes', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.case_brief.practitionerNotes}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </>
                )}

                {selectedTemplate === 'motion_summary' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Motion Category</label>
                        <input
                          type="text"
                          value={contentFields.motionType || ''}
                          onChange={(e) => handleFieldChange('motionType', e.target.value)}
                          placeholder={TEMPLATE_PLACEHOLDERS.motion_summary.motionType}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Moving Party</label>
                        <input
                          type="text"
                          value={contentFields.movingParty || ''}
                          onChange={(e) => handleFieldChange('movingParty', e.target.value)}
                          placeholder={TEMPLATE_PLACEHOLDERS.motion_summary.movingParty}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Opposing Party</label>
                      <input
                        type="text"
                        value={contentFields.opposingParty || ''}
                        onChange={(e) => handleFieldChange('opposingParty', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.motion_summary.opposingParty}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Governing Standard of Review</label>
                      <textarea
                        rows={2}
                        value={contentFields.stdOfReview || ''}
                        onChange={(e) => handleFieldChange('stdOfReview', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.motion_summary.stdOfReview}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Moving Core Legal Arguments</label>
                      <textarea
                        rows={3}
                        value={contentFields.coreArguments || ''}
                        onChange={(e) => handleFieldChange('coreArguments', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.motion_summary.coreArguments}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Supporting Evidence Transcripts / Exhibits</label>
                      <textarea
                        rows={2}
                        value={contentFields.supportingEvidence || ''}
                        onChange={(e) => handleFieldChange('supportingEvidence', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.motion_summary.supportingEvidence}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Relief Requested</label>
                      <textarea
                        rows={2}
                        value={contentFields.reliefRequested || ''}
                        onChange={(e) => handleFieldChange('reliefRequested', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.motion_summary.reliefRequested}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </>
                )}

                {selectedTemplate === 'discovery_plan' && (
                  <>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Initial Disclosures Required (FRCP Rule 26a)</label>
                      <textarea
                        rows={3}
                        value={contentFields.disclosuresDue || ''}
                        onChange={(e) => handleFieldChange('disclosuresDue', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.discovery_plan.disclosuresDue}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Depositions Strategy & Planned Witnesses</label>
                      <textarea
                        rows={3}
                        value={contentFields.depositionsPlanned || ''}
                        onChange={(e) => handleFieldChange('depositionsPlanned', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.discovery_plan.depositionsPlanned}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Electronic Requests for Production (RFP)</label>
                      <textarea
                        rows={3}
                        value={contentFields.productionRequests || ''}
                        onChange={(e) => handleFieldChange('productionRequests', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.discovery_plan.productionRequests}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Mandatory Interrogatories Areas of Inquiry</label>
                      <textarea
                        rows={3}
                        value={contentFields.interrogatoriesList || ''}
                        onChange={(e) => handleFieldChange('interrogatoriesList', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.discovery_plan.interrogatoriesList}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Substantive Discovery Deadlines Calendar</label>
                      <textarea
                        rows={2}
                        value={contentFields.keyDeadlines || ''}
                        onChange={(e) => handleFieldChange('keyDeadlines', e.target.value)}
                        placeholder={TEMPLATE_PLACEHOLDERS.discovery_plan.keyDeadlines}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Feedback Alert indicators */}
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <Check size={14} />
                  <span>Uplink Success. Legal template synced securely with encrypted databases.</span>
                </div>
              )}

              {/* Actions row: Save draft trigger */}
              <div className="flex justify-end pt-3 border-t border-white/5">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveDoc}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs py-3.5 px-6 rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      Syncing Vault...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      {activeDraft ? 'Synchronize Active Draft' : 'Commit & Save Draft'}
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
