import type { AppState, Participant, Group, BallotResult, BallotSession } from '../types';

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
            wechatId: p.wechatId || '', // Handle backward compatibility
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
  registerParticipant(email: string, wechatId: string, addedBy: 'self' | 'admin' = 'self', sessionId?: string): boolean {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (!wechatId || !wechatId.trim()) {
      throw new Error('WeChat ID is required');
    }

    if (this.isParticipantRegistered(email)) {
      throw new Error('Email already registered');
    }

    // Check if WeChat ID is already registered
    if (this.isWechatIdRegistered(wechatId.trim())) {
      throw new Error('WeChat ID already registered');
    }

    // Use current session or create default session
    const currentSessionId = sessionId || this.data.currentSessionId || this.createDefaultSession();

    this.data.participants.push({
      email: email.toLowerCase(),
      wechatId: wechatId.trim(),
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

  isWechatIdRegistered(wechatId: string): boolean {
    return this.data.participants.some(p => p.wechatId.toLowerCase() === wechatId.toLowerCase());
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

    // Check if this person is in a group that already has a representative
    const currentSessionId = this.data.currentSessionId;
    if (currentSessionId) {
      const userGroup = this.data.groups.find(g => 
        g.sessionId === currentSessionId && (
          g.representative.toLowerCase() === email.toLowerCase() ||
          g.members.some(m => m.toLowerCase() === email.toLowerCase())
        )
      );

      if (userGroup) {
        // If they're already the representative, no need to change
        if (userGroup.representative.toLowerCase() === email.toLowerCase()) {
          return true; // Already representative, no action needed
        }
        
        // If they're a member but group already has a different representative, prevent it
        if (userGroup.representative.toLowerCase() !== email.toLowerCase()) {
          throw new Error(`Cannot make ${email} representative. Group "${userGroup.name || 'Unnamed Group'}" already has representative: ${userGroup.representative}`);
        }
      }
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
  createGroup(representative: string, members: string[], name?: string): string {
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

    // Total group size = representative + members (members can be 0 for 1-person groups)
    const totalGroupSize = members.length + 1;
    if (totalGroupSize < 1 || totalGroupSize > 3) {
      throw new Error(`Groups must have 1-3 total members. You have ${totalGroupSize} (1 rep + ${members.length} members)`);
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
    
    // Auto-assign name if not provided, otherwise validate custom name
    let finalGroupName: string;
    if (!name || !name.trim()) {
      finalGroupName = this.generateGroupName();
    } else {
      const trimmedName = name.trim();
      // Check for duplicate group names in current session
      const duplicateNameGroup = this.data.groups.find(g => 
        g.sessionId === currentSessionId && 
        g.name && 
        g.name.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (duplicateNameGroup) {
        throw new Error(`Group name "${trimmedName}" already exists. Please choose a different name.`);
      }
      finalGroupName = trimmedName;
    }

    const group: Group = {
      id: groupId,
      sessionId: currentSessionId,
      name: finalGroupName,
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

  // Two-phase ballot management
  startBallot(sessionId?: string): BallotResult {
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

    // Change approved groups to ballot-ready status
    approvedGroups.forEach(group => {
      group.status = 'ballot-ready';
    });

    const totalParticipants = approvedGroups.reduce((sum, group) => sum + group.members.length, 0);

    const result: BallotResult = {
      sessionId: currentSessionId,
      entries: [], // No entries yet - representatives will draw
      totalGroups: approvedGroups.length,
      totalParticipants,
      drawnAt: new Date(),
      ballotStatus: 'in-progress',
      startedAt: new Date(),
    };

    this.data.ballotResults = result;
    this.saveData();
    return result;
  }

  // Representative draws for their group
  drawForGroup(groupId: string, representativeEmail: string): number {
    const group = this.data.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (group.representative.toLowerCase() !== representativeEmail.toLowerCase()) {
      throw new Error('Only the group representative can draw for this group');
    }

    if (group.status !== 'ballot-ready') {
      throw new Error('Group is not ready for ballot drawing');
    }

    if (!this.data.ballotResults || this.data.ballotResults.ballotStatus !== 'in-progress') {
      throw new Error('Ballot session is not active');
    }

    // Get all available positions (positions not yet drawn by other groups)
    const drawnPositions = this.data.groups
      .filter(g => g.sessionId === group.sessionId && g.ballotPosition)
      .map(g => g.ballotPosition!);
    
    const totalGroups = this.data.groups.filter(g => 
      g.sessionId === group.sessionId && g.status === 'ballot-ready'
    ).length;
    
    const availablePositions = Array.from({length: totalGroups}, (_, i) => i + 1)
      .filter(pos => !drawnPositions.includes(pos));
    
    if (availablePositions.length === 0) {
      throw new Error('No available positions to draw');
    }

    // Randomly select from available positions
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const drawnPosition = availablePositions[randomIndex];

    // Update group with drawn position
    group.status = 'ballot-drawn';
    group.ballotPosition = drawnPosition;
    group.ballotDrawnAt = new Date();

    // Add to ballot results
    this.data.ballotResults.entries.push({
      groupId: group.id,
      position: drawnPosition,
      drawnAt: new Date(),
    });

    // Check if all groups have drawn
    const allGroupsDrawn = this.data.groups
      .filter(g => g.sessionId === group.sessionId && (g.status === 'ballot-ready' || g.status === 'ballot-drawn'))
      .every(g => g.status === 'ballot-drawn');

    if (allGroupsDrawn) {
      this.data.ballotResults.ballotStatus = 'completed';
      this.data.ballotResults.completedAt = new Date();
      
      // Lock all groups
      this.data.groups
        .filter(g => g.sessionId === group.sessionId && g.status === 'ballot-drawn')
        .forEach(g => g.status = 'locked');
    }

    this.saveData();
    return drawnPosition;
  }

  // Legacy method for backward compatibility
  runBallot(sessionId?: string): BallotResult {
    return this.startBallot(sessionId);
  }

  getBallotResults(sessionId?: string): BallotResult | null {
    const currentSessionId = sessionId || this.data.currentSessionId;
    if (!this.data.ballotResults || this.data.ballotResults.sessionId !== currentSessionId) {
      return null;
    }
    return this.data.ballotResults;
  }

  // Check if representative can draw for their group
  canRepresentativeDraw(groupId: string, representativeEmail: string): boolean {
    const group = this.data.groups.find(g => g.id === groupId);
    return group?.representative.toLowerCase() === representativeEmail.toLowerCase() && 
           group?.status === 'ballot-ready' &&
           this.data.ballotResults?.ballotStatus === 'in-progress';
  }

  // Get ballot status for current session
  getBallotStatus(sessionId?: string): string {
    const results = this.getBallotResults(sessionId);
    if (!results) return 'not-started';
    return results.ballotStatus;
  }

  // Admin functions (deprecated - use authService instead)
  setAdmin(_isAdmin: boolean): void {
    // This function is deprecated, admin authentication is now handled by authService
  }

  isAdmin(): boolean {
    // This function is deprecated, admin authentication is now handled by authService
    return false;
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

  private generateGroupName(): string {
    const kellyYuWenWenSongs = [
      // Write a Night of Heartbeat (2016)
      '我只想写一首好歌曲', '一夜成长', '心跳',
      
      // Undefined (2018)
      '偷不走的现在', '深度对话', '其实其实', '过去', '伤患', '奉陪', 
      '体面', '交换手机', '你是我的',
      
      // Intermezzo (2021)
      '白衣少年', '试探', '余地', '浪花', '配合', '要不要', 
      '门前雪', '盲听',
      
      // It's Me (2023)
      '是我', '你好', '过来人', '刺猬', '小心', '顽固天真', '影子',
      
      // Scorpio (2024)
      '已读不回', '狼人', '原罪', '可惜', '夕阳向晚', '保持安静', 
      '查理查理', '何必', '路人', '天蝎座'
    ];
    
    const currentSessionId = this.data.currentSessionId;
    const existingGroupNames = this.data.groups
      .filter(g => g.sessionId === currentSessionId && g.name)
      .map(g => g.name!.toLowerCase());
    
    // Try to find a unique song name
    const availableSongs = kellyYuWenWenSongs.filter(song => 
      !existingGroupNames.includes(`${song} 組`.toLowerCase())
    );
    
    if (availableSongs.length > 0) {
      const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
      return `${randomSong} 組`;
    }
    
    // If all songs are used, add numbers to make them unique
    let counter = 1;
    let baseName = '';
    do {
      const randomSong = kellyYuWenWenSongs[Math.floor(Math.random() * kellyYuWenWenSongs.length)];
      baseName = `${randomSong} 組 ${counter}`;
      counter++;
    } while (existingGroupNames.includes(baseName.toLowerCase()) && counter <= 100);
    
    return baseName;
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

  // Clear ballot data only (keep admin authentication)
  clearBallotData(): void {
    this.data = {
      participants: [],
      groups: [],
      ballotResults: null,
      ballotSessions: [],
      currentSessionId: null,
      currentUser: null,
      admins: this.data.admins, // Keep existing admins
      auth: {
        isAuthenticated: false, // Clear current session but keep admin accounts
        currentAdmin: null,
      },
    };
    this.saveData();
  }
}

export const ballotService = new BallotService();