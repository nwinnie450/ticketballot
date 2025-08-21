import type { AppState, Participant, Group, BallotResult, BallotEntry, BallotSession } from '../types';

const STORAGE_KEY = 'ticket-ballot-data';

class BallotService {
  private data: AppState = {
    participants: [],
    groups: [],
    ballotResults: null,
    ballotSessions: [],
    currentSessionId: null,
    currentUser: null,
    admins: [],
    auth: {
      isAuthenticated: false,
      currentAdmin: null,
    },
  };

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        this.data = {
          ...parsed,
          participants: parsed.participants?.map((p: any) => ({
            ...p,
            registeredAt: new Date(p.registeredAt),
          })) || [],
          groups: parsed.groups?.map((g: any) => ({
            ...g,
            createdAt: new Date(g.createdAt),
            validatedAt: g.validatedAt ? new Date(g.validatedAt) : undefined,
          })) || [],
          ballotResults: parsed.ballotResults ? {
            ...parsed.ballotResults,
            drawnAt: new Date(parsed.ballotResults.drawnAt),
            entries: parsed.ballotResults.entries.map((e: any) => ({
              ...e,
              drawnAt: new Date(e.drawnAt),
            })),
          } : null,
        };
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // Participant management
  registerParticipant(email: string, addedBy: 'self' | 'admin' = 'self', sessionId?: string): boolean {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (this.isParticipantRegistered(email)) {
      throw new Error('Email already registered');
    }

    // Use current session or create default session
    const currentSessionId = sessionId || this.data.currentSessionId || this.createDefaultSession();

    this.data.participants.push({
      email: email.toLowerCase(),
      registeredAt: new Date(),
      addedBy,
      role: 'user', // Default role is user
      sessionId: currentSessionId,
    });
    
    this.saveData();
    return true;
  }

  isParticipantRegistered(email: string): boolean {
    return this.data.participants.some(p => p.email.toLowerCase() === email.toLowerCase());
  }

  getParticipants(sessionId?: string): Participant[] {
    const currentSessionId = sessionId || this.data.currentSessionId;
    if (!currentSessionId) return [];
    
    return this.data.participants.filter(p => p.sessionId === currentSessionId);
  }

  getAllParticipants(): Participant[] {
    return [...this.data.participants];
  }

  removeParticipant(email: string): boolean {
    const index = this.data.participants.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
    if (index === -1) return false;

    // Remove from any groups first
    this.data.groups = this.data.groups.map(group => ({
      ...group,
      members: group.members.filter(member => member.toLowerCase() !== email.toLowerCase()),
    })).filter(group => group.members.length > 0); // Remove empty groups

    this.data.participants.splice(index, 1);
    this.saveData();
    return true;
  }

  // Role management
  designateRepresentative(email: string, designatedBy: string): boolean {
    const participant = this.data.participants.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!participant) {
      throw new Error('Participant not found');
    }

    participant.role = 'representative';
    participant.designatedBy = designatedBy;
    participant.designatedAt = new Date();
    
    this.saveData();
    return true;
  }

  removeRepresentativeRole(email: string): boolean {
    const participant = this.data.participants.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!participant) {
      throw new Error('Participant not found');
    }

    participant.role = 'user';
    participant.designatedBy = undefined;
    participant.designatedAt = undefined;
    
    this.saveData();
    return true;
  }

  getParticipantRole(email: string): 'user' | 'representative' | null {
    const participant = this.data.participants.find(p => p.email.toLowerCase() === email.toLowerCase());
    return participant ? participant.role : null;
  }

  getRepresentatives(sessionId?: string): Participant[] {
    const currentSessionId = sessionId || this.data.currentSessionId;
    return this.data.participants.filter(p => 
      p.role === 'representative' && 
      (!currentSessionId || p.sessionId === currentSessionId)
    );
  }

  // Group management
  createGroup(representative: string, members: string[]): string {
    if (!this.isParticipantRegistered(representative)) {
      throw new Error('Representative must be registered');
    }

    // Check if representative has the right role
    const repRole = this.getParticipantRole(representative);
    if (repRole !== 'representative') {
      throw new Error('Only designated representatives can create groups');
    }

    // Validate all members are registered
    const invalidMembers = members.filter(email => !this.isParticipantRegistered(email));
    if (invalidMembers.length > 0) {
      throw new Error(`These members are not registered: ${invalidMembers.join(', ')}`);
    }

    if (members.length < 1 || members.length > 3) {
      throw new Error('Groups must have 1-3 members');
    }

    const currentSessionId = this.data.currentSessionId || this.createDefaultSession();

    // Check if representative is already in another group in current session
    const existingGroup = this.data.groups.find(g => 
      g.sessionId === currentSessionId && (
        g.representative.toLowerCase() === representative.toLowerCase() ||
        g.members.some(m => m.toLowerCase() === representative.toLowerCase())
      )
    );

    if (existingGroup) {
      throw new Error('Representative is already in a group for this session');
    }

    // Check if any members are already in other groups in current session
    const conflictingMembers = members.filter(email => 
      this.data.groups.some(g => 
        g.sessionId === currentSessionId && (
          g.members.some(m => m.toLowerCase() === email.toLowerCase()) ||
          g.representative.toLowerCase() === email.toLowerCase()
        )
      )
    );

    if (conflictingMembers.length > 0) {
      throw new Error(`These members are already in other groups: ${conflictingMembers.join(', ')}`);
    }

    const groupId = this.generateId();
    const group: Group = {
      id: groupId,
      sessionId: currentSessionId,
      representative: representative.toLowerCase(),
      members: members.map(email => email.toLowerCase()),
      status: 'pending',
      createdAt: new Date(),
    };

    this.data.groups.push(group);
    this.saveData();
    return groupId;
  }

  getGroups(sessionId?: string): Group[] {
    const currentSessionId = sessionId || this.data.currentSessionId;
    if (!currentSessionId) return [];
    
    return this.data.groups.filter(g => g.sessionId === currentSessionId);
  }

  getGroupByUser(email: string, sessionId?: string): Group | undefined {
    const currentSessionId = sessionId || this.data.currentSessionId;
    return this.data.groups.find(g => 
      g.sessionId === currentSessionId && (
        g.representative.toLowerCase() === email.toLowerCase() ||
        g.members.some(m => m.toLowerCase() === email.toLowerCase())
      )
    );
  }

  updateGroupStatus(groupId: string, status: Group['status']): boolean {
    const group = this.data.groups.find(g => g.id === groupId);
    if (!group) return false;

    group.status = status;
    if (status === 'approved') {
      group.validatedAt = new Date();
    }

    this.saveData();
    return true;
  }

  removeGroup(groupId: string): boolean {
    const index = this.data.groups.findIndex(g => g.id === groupId);
    if (index === -1) return false;

    this.data.groups.splice(index, 1);
    this.saveData();
    return true;
  }

  // Ballot management
  runBallot(sessionId?: string): BallotResult {
    const currentSessionId = sessionId || this.data.currentSessionId;
    if (!currentSessionId) {
      throw new Error('No active session available for ballot');
    }

    const approvedGroups = this.data.groups.filter(g => 
      g.sessionId === currentSessionId && g.status === 'approved'
    );
    
    if (approvedGroups.length === 0) {
      throw new Error('No approved groups available for ballot in current session');
    }

    // Lock all approved groups
    approvedGroups.forEach(group => {
      group.status = 'locked';
    });

    // Create randomized entries
    const shuffledGroups = this.shuffleArray([...approvedGroups]);
    const entries: BallotEntry[] = shuffledGroups.map((group, index) => ({
      groupId: group.id,
      position: index + 1,
      drawnAt: new Date(),
    }));

    const totalParticipants = approvedGroups.reduce((sum, group) => sum + group.members.length, 0);

    const result: BallotResult = {
      sessionId: currentSessionId,
      entries,
      totalGroups: approvedGroups.length,
      totalParticipants,
      drawnAt: new Date(),
    };

    this.data.ballotResults = result;
    this.saveData();
    return result;
  }

  getBallotResults(sessionId?: string): BallotResult | null {
    const currentSessionId = sessionId || this.data.currentSessionId;
    if (!this.data.ballotResults || this.data.ballotResults.sessionId !== currentSessionId) {
      return null;
    }
    return this.data.ballotResults;
  }

  // Admin functions
  setAdmin(isAdmin: boolean): void {
    this.data.isAdmin = isAdmin;
    this.saveData();
  }

  isAdmin(): boolean {
    return this.data.isAdmin;
  }

  setCurrentUser(email: string | null): void {
    this.data.currentUser = email?.toLowerCase() || null;
    this.saveData();
  }

  getCurrentUser(): string | null {
    return this.data.currentUser;
  }

  // Stats
  getStats() {
    const pendingGroups = this.data.groups.filter(g => g.status === 'pending').length;
    const approvedGroups = this.data.groups.filter(g => g.status === 'approved').length;
    const lockedGroups = this.data.groups.filter(g => g.status === 'locked').length;

    return {
      totalParticipants: this.data.participants.length,
      totalGroups: this.data.groups.length,
      pendingGroups,
      approvedGroups,
      lockedGroups,
      hasResults: !!this.data.ballotResults,
    };
  }

  // Utility methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Session management
  createSession(name: string, sessionDate: Date, createdBy: string): string {
    const sessionId = this.generateId();
    const session: BallotSession = {
      id: sessionId,
      name,
      sessionDate,
      isActive: true,
      createdBy,
      createdAt: new Date(),
    };

    this.data.ballotSessions.push(session);
    
    // Set as current session if it's the first one or if no current session
    if (!this.data.currentSessionId || this.data.ballotSessions.length === 1) {
      this.data.currentSessionId = sessionId;
    }
    
    this.saveData();
    return sessionId;
  }

  setCurrentSession(sessionId: string): boolean {
    const session = this.data.ballotSessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    this.data.currentSessionId = sessionId;
    this.saveData();
    return true;
  }

  closeSession(sessionId: string): boolean {
    const session = this.data.ballotSessions.find(s => s.id === sessionId);
    if (!session) return false;

    session.isActive = false;
    session.closedAt = new Date();
    
    // If this was the current session, clear it
    if (this.data.currentSessionId === sessionId) {
      this.data.currentSessionId = null;
    }
    
    this.saveData();
    return true;
  }

  getSessions(): BallotSession[] {
    return [...this.data.ballotSessions];
  }

  getCurrentSession(): BallotSession | null {
    if (!this.data.currentSessionId) return null;
    return this.data.ballotSessions.find(s => s.id === this.data.currentSessionId) || null;
  }

  createDefaultSession(): string {
    if (this.data.ballotSessions.length === 0) {
      return this.createSession(
        'Default Session',
        new Date(),
        'system'
      );
    }
    return this.data.currentSessionId || this.data.ballotSessions[0].id;
  }

  // Reset/Clear data (for testing)
  clearAll(): void {
    this.data = {
      participants: [],
      groups: [],
      ballotResults: null,
      ballotSessions: [],
      currentSessionId: null,
      currentUser: null,
      admins: [],
      auth: {
        isAuthenticated: false,
        currentAdmin: null,
      },
    };
    this.saveData();
  }
}

export const ballotService = new BallotService();