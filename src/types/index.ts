export interface Participant {
  email: string;
  wechatId: string; // WeChat ID for participant identification
  registeredAt: Date;
  addedBy: 'self' | 'admin';
  role: 'user' | 'representative'; // New role field
  designatedBy?: string; // Who designated them as representative
  designatedAt?: Date;
  sessionId: string; // Which session they belong to
}

export interface Group {
  id: string;
  sessionId: string; // Which session this group belongs to
  name?: string; // Optional group name
  representative: string;
  members: string[];
  status: 'pending' | 'approved' | 'locked' | 'ballot-ready' | 'ballot-drawn';
  createdAt: Date;
  validatedAt?: Date;
  ballotDrawnAt?: Date; // When representative performed the draw
  ballotPosition?: number; // Position drawn by representative
}

export interface BallotEntry {
  groupId: string;
  position: number;
  drawnAt: Date;
}

export interface BallotSession {
  id: string;
  name: string;
  sessionDate: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  closedAt?: Date;
  ballotStarted?: boolean;
  ballotStartedAt?: Date;
}

export interface BallotResult {
  sessionId: string;
  entries: BallotEntry[];
  totalGroups: number;
  totalParticipants: number;
  drawnAt: Date;
  ballotStatus: 'not-started' | 'in-progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
}

export interface AdminUser {
  username: string;
  password: string;
  createdAt: Date;
  createdBy: string;
  lastLogin?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentAdmin: string | null;
  loginTime?: Date;
}

export interface AppState {
  participants: Participant[];
  groups: Group[];
  ballotResults: BallotResult | null;
  ballotSessions: BallotSession[];
  currentSessionId: string | null;
  currentUser: string | null;
  admins: AdminUser[];
  auth: AuthState;
}

export type UserRole = 'user' | 'representative' | 'admin' | 'guest';

export type PageType = 
  | 'landing' 
  | 'registration' 
  | 'group-formation' 
  | 'status' 
  | 'results' 
  | 'login'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-participants'
  | 'admin-groups'
  | 'admin-ballot'
  | 'admin-settings';