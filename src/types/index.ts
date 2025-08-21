export interface Participant {
  email: string;
  registeredAt: Date;
  addedBy: 'self' | 'admin';
}

export interface Group {
  id: string;
  representative: string;
  members: string[];
  status: 'pending' | 'approved' | 'locked';
  createdAt: Date;
  validatedAt?: Date;
}

export interface BallotEntry {
  groupId: string;
  position: number;
  drawnAt: Date;
}

export interface BallotResult {
  entries: BallotEntry[];
  totalGroups: number;
  totalParticipants: number;
  drawnAt: Date;
}

export interface AppState {
  participants: Participant[];
  groups: Group[];
  ballotResults: BallotResult | null;
  isAdmin: boolean;
  currentUser: string | null;
}

export type UserRole = 'participant' | 'admin' | 'guest';

export type PageType = 
  | 'landing' 
  | 'registration' 
  | 'group-formation' 
  | 'status' 
  | 'results' 
  | 'admin-dashboard'
  | 'admin-participants'
  | 'admin-groups'
  | 'admin-ballot';