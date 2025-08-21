import type { AdminUser, AuthState } from '../types';

const AUTH_STORAGE_KEY = 'ticket-ballot-auth';
const ADMINS_STORAGE_KEY = 'ticket-ballot-admins';

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    currentAdmin: null,
  };

  private admins: AdminUser[] = [];

  constructor() {
    this.loadAuthData();
    this.initializeDefaultAdmin();
  }

  private loadAuthData(): void {
    try {
      // Load auth state
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        this.authState = {
          ...parsed,
          loginTime: parsed.loginTime ? new Date(parsed.loginTime) : undefined,
        };
      }

      // Load admins
      const storedAdmins = localStorage.getItem(ADMINS_STORAGE_KEY);
      if (storedAdmins) {
        const parsed = JSON.parse(storedAdmins);
        this.admins = parsed.map((admin: any) => ({
          ...admin,
          createdAt: new Date(admin.createdAt),
          lastLogin: admin.lastLogin ? new Date(admin.lastLogin) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
      this.authState = {
        isAuthenticated: false,
        currentAdmin: null,
      };
      this.admins = [];
    }
  }

  private saveAuthData(): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.authState));
      localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(this.admins));
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  }

  private initializeDefaultAdmin(): void {
    // Create default admin if no admins exist
    if (this.admins.length === 0) {
      const defaultAdmin: AdminUser = {
        username: 'admin',
        password: this.hashPassword('password'), // Simple hash for demo
        createdAt: new Date(),
        createdBy: 'system',
      };
      this.admins.push(defaultAdmin);
      this.saveAuthData();
    }
  }

  // Simple password hashing (for demo purposes - use proper bcrypt in production)
  private hashPassword(password: string): string {
    // Simple hash function - replace with proper bcrypt in production
    let hash = 0;
    const saltedPassword = password + 'ballot-salt-2024';
    for (let i = 0; i < saltedPassword.length; i++) {
      const char = saltedPassword.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    return this.hashPassword(password) === hashedPassword;
  }

  // Authentication methods
  login(username: string, password: string): boolean {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const admin = this.admins.find(a => a.username.toLowerCase() === username.toLowerCase());
    if (!admin) {
      throw new Error('Invalid username or password');
    }

    if (!this.verifyPassword(password, admin.password)) {
      throw new Error('Invalid username or password');
    }

    // Update last login
    admin.lastLogin = new Date();

    // Set auth state
    this.authState = {
      isAuthenticated: true,
      currentAdmin: admin.username,
      loginTime: new Date(),
    };

    this.saveAuthData();
    return true;
  }

  logout(): void {
    this.authState = {
      isAuthenticated: false,
      currentAdmin: null,
    };
    this.saveAuthData();
  }

  isAuthenticated(): boolean {
    // Check if session is still valid (24 hours)
    if (this.authState.isAuthenticated && this.authState.loginTime) {
      const now = new Date();
      const loginTime = new Date(this.authState.loginTime);
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLogin > 24) {
        this.logout();
        return false;
      }
    }
    
    return this.authState.isAuthenticated;
  }

  getCurrentAdmin(): string | null {
    return this.isAuthenticated() ? this.authState.currentAdmin : null;
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  // Admin management
  getAdmins(): AdminUser[] {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    // Return admins without passwords for security
    return this.admins.map(admin => ({
      ...admin,
      password: '[HIDDEN]',
    })) as AdminUser[];
  }

  addAdmin(username: string, password: string): boolean {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if username already exists
    if (this.admins.some(a => a.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username already exists');
    }

    const newAdmin: AdminUser = {
      username: username.toLowerCase(),
      password: this.hashPassword(password),
      createdAt: new Date(),
      createdBy: this.authState.currentAdmin || 'unknown',
    };

    this.admins.push(newAdmin);
    this.saveAuthData();
    return true;
  }

  changePassword(currentPassword: string, newPassword: string): boolean {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    if (!currentPassword || !newPassword) {
      throw new Error('Current and new passwords are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    const currentAdmin = this.admins.find(a => a.username === this.authState.currentAdmin);
    if (!currentAdmin) {
      throw new Error('Admin not found');
    }

    if (!this.verifyPassword(currentPassword, currentAdmin.password)) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    currentAdmin.password = this.hashPassword(newPassword);
    this.saveAuthData();
    return true;
  }

  removeAdmin(username: string): boolean {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    if (username === this.authState.currentAdmin) {
      throw new Error('Cannot remove your own admin account');
    }

    if (username === 'admin') {
      throw new Error('Cannot remove the default admin account');
    }

    const index = this.admins.findIndex(a => a.username.toLowerCase() === username.toLowerCase());
    if (index === -1) {
      throw new Error('Admin not found');
    }

    this.admins.splice(index, 1);
    this.saveAuthData();
    return true;
  }

  // Get admin stats
  getAdminStats() {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    const currentAdmin = this.admins.find(a => a.username === this.authState.currentAdmin);
    return {
      totalAdmins: this.admins.length,
      currentAdmin: this.authState.currentAdmin,
      loginTime: this.authState.loginTime,
      lastLogin: currentAdmin?.lastLogin,
      sessionValid: this.isAuthenticated(),
    };
  }

  // Security helpers
  clearAllData(): void {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(ADMINS_STORAGE_KEY);
    localStorage.removeItem('ticket-ballot-data'); // Clear ballot data too
    
    this.authState = {
      isAuthenticated: false,
      currentAdmin: null,
    };
    this.admins = [];
    this.initializeDefaultAdmin();
  }
}

export const authService = new AuthService();