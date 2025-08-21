import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ballotService } from '../services/ballotService';
import type { Participant, Group, BallotResult, UserRole } from '../types';

interface BallotContextType {
  // State
  participants: Participant[];
  groups: Group[];
  ballotResults: BallotResult | null;
  currentUser: string | null;
  userRole: UserRole;
  stats: ReturnType<typeof ballotService.getStats>;
  loading: boolean;
  error: string | null;

  // Actions
  registerParticipant: (email: string, addedBy?: 'self' | 'admin') => Promise<void>;
  createGroup: (representative: string, members: string[]) => Promise<void>;
  updateGroupStatus: (groupId: string, status: Group['status']) => Promise<void>;
  removeGroup: (groupId: string) => Promise<void>;
  removeParticipant: (email: string) => Promise<void>;
  runBallot: () => Promise<void>;
  setCurrentUser: (email: string | null) => void;
  setAdmin: (isAdmin: boolean) => void;
  refresh: () => void;
  clearError: () => void;
}

const BallotContext = createContext<BallotContextType | undefined>(undefined);

export function BallotProvider({ children }: { children: ReactNode }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [ballotResults, setBallotResults] = useState<BallotResult | null>(null);
  const [currentUser, setCurrentUserState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = ballotService.isAdmin();
  const stats = ballotService.getStats();

  const getUserRole = (): UserRole => {
    if (isAdmin) return 'admin';
    if (currentUser && ballotService.isParticipantRegistered(currentUser)) return 'participant';
    return 'guest';
  };

  const userRole = getUserRole();

  const refresh = () => {
    setParticipants(ballotService.getParticipants());
    setGroups(ballotService.getGroups());
    setBallotResults(ballotService.getBallotResults());
    setCurrentUserState(ballotService.getCurrentUser());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAsync = async (action: () => void | Promise<void>) => {
    try {
      setLoading(true);
      setError(null);
      await action();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const registerParticipant = async (email: string, addedBy: 'self' | 'admin' = 'self') => {
    await handleAsync(() => {
      ballotService.registerParticipant(email, addedBy);
    });
  };

  const createGroup = async (representative: string, members: string[]) => {
    await handleAsync(() => {
      ballotService.createGroup(representative, members);
    });
  };

  const updateGroupStatus = async (groupId: string, status: Group['status']) => {
    await handleAsync(() => {
      if (!ballotService.updateGroupStatus(groupId, status)) {
        throw new Error('Failed to update group status');
      }
    });
  };

  const removeGroup = async (groupId: string) => {
    await handleAsync(() => {
      if (!ballotService.removeGroup(groupId)) {
        throw new Error('Failed to remove group');
      }
    });
  };

  const removeParticipant = async (email: string) => {
    await handleAsync(() => {
      if (!ballotService.removeParticipant(email)) {
        throw new Error('Failed to remove participant');
      }
    });
  };

  const runBallot = async () => {
    await handleAsync(() => {
      ballotService.runBallot();
    });
  };

  const setCurrentUser = (email: string | null) => {
    ballotService.setCurrentUser(email);
    setCurrentUserState(email);
  };

  const setAdmin = (isAdmin: boolean) => {
    ballotService.setAdmin(isAdmin);
    refresh();
  };

  const clearError = () => setError(null);

  const value: BallotContextType = {
    participants,
    groups,
    ballotResults,
    currentUser,
    userRole,
    stats,
    loading,
    error,
    registerParticipant,
    createGroup,
    updateGroupStatus,
    removeGroup,
    removeParticipant,
    runBallot,
    setCurrentUser,
    setAdmin,
    refresh,
    clearError,
  };

  return <BallotContext.Provider value={value}>{children}</BallotContext.Provider>;
}

export function useBallot() {
  const context = useContext(BallotContext);
  if (context === undefined) {
    throw new Error('useBallot must be used within a BallotProvider');
  }
  return context;
}