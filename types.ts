export interface StreamState {
  isConnected: boolean;
  isStreaming: boolean;
  isError: boolean;
  error?: string;
}

export interface Suggestion {
  id: string;
  text: string;
  category: 'case-law' | 'strategy' | 'evidence' | 'procedure';
}

export interface Reminder {
  id?: string;
  userId: string;
  title: string;
  description: string;
  date: any; // Firestore Timestamp
  type: 'filing' | 'court_date' | 'other';
  createdAt: any;
}

export interface DraftDocument {
  id?: string;
  userId: string;
  title: string;
  templateType: 'case_brief' | 'motion_summary' | 'discovery_plan';
  content: {
    caseName?: string;
    citation?: string;
    courtName?: string;
    factsSegment?: string;
    legalIssues?: string;
    holdingDec?: string;
    rationaleDec?: string;
    practitionerNotes?: string;
    
    motionType?: string;
    movingParty?: string;
    opposingParty?: string;
    coreArguments?: string;
    stdOfReview?: string;
    supportingEvidence?: string;
    reliefRequested?: string;

    disclosuresDue?: string;
    depositionsPlanned?: string;
    productionRequests?: string;
    interrogatoriesList?: string;
    keyDeadlines?: string;
  };
  createdAt: any;
  updatedAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}