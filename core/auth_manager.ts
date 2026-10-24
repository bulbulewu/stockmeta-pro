import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended' | 'pending' | 'expired';
  expiresAt: string; // ISO 8601 string
  dailyLimit: number; // 0 = unlimited, otherwise max files/day
  usedToday: number;
  totalUsed: number;
  lastActiveDate: string; // YYYY-MM-DD
  createdAt: string;
  notes?: string;
}

export interface SystemSettings {
  authRequired: boolean;
  defaultTrialDays: number;
  defaultDailyLimit: number;
  requireAdminApproval: boolean;
}

export interface LicenseKeyRecord {
  id: string;
  key: string;              // e.g. SM-30D-A8B9-C1D2
  assignedEmail: string;    // email of the user this key is bound to
  days: number;             // number of days access granted
  dailyLimit?: number;      // optional custom daily limit override
  status: 'active' | 'used' | 'revoked';
  createdAt: string;
  usedAt?: string;
  usedByUserId?: string;
  usedByUsername?: string;
  notes?: string;
}

interface StoredData {
  settings: SystemSettings;
  users: UserRecord[];
  licenses?: LicenseKeyRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

/**
 * Hash password with crypto.scryptSync (Node standard, no C++ compilation needed)
 */
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * In-memory state with JSON file persistence
 */
class AuthManager {
  private settings: SystemSettings = {
    authRequired: true,
    defaultTrialDays: 7, // New users get 7 days access by default
    defaultDailyLimit: 50, // 50 files per day default limit
    requireAdminApproval: false,
  };

  private users: Map<string, UserRecord> = new Map();
  private licenses: Map<string, LicenseKeyRecord> = new Map();
  private sessions: Map<string, { userId: string; expiresAt: number }> = new Map();

  constructor() {
    this.loadData();
    this.ensureAdminExists();
  }

  private loadData(): void {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed: StoredData = JSON.parse(raw);
        if (parsed.settings) {
          this.settings = { ...this.settings, ...parsed.settings };
        }
        if (Array.isArray(parsed.users)) {
          this.users.clear();
          for (const u of parsed.users) {
            this.users.set(u.id, u);
          }
        }
        if (Array.isArray(parsed.licenses)) {
          this.licenses.clear();
          for (const lic of parsed.licenses) {
            this.licenses.set(lic.id, lic);
          }
        }
      } catch (err) {
        console.error('[AuthManager] Error loading users.json:', err);
      }
    }
  }

  private saveData(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data: StoredData = {
        settings: this.settings,
        users: Array.from(this.users.values()),
        licenses: Array.from(this.licenses.values()),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[AuthManager] Error saving users.json:', err);
    }
  }

  /**
   * Initializes master admin account if none exists
   */
  private ensureAdminExists(): void {
    let adminUser = Array.from(this.users.values()).find((u) => u.role === 'admin');
    if (!adminUser) {
      const salt = crypto.randomBytes(16).toString('hex');
      adminUser = {
        id: 'admin_master',
        username: 'admin',
        email: 'bulbulworka1@gmail.com',
        salt,
        passwordHash: hashPassword('bulbul2026', salt),
        role: 'admin',
        status: 'active',
        expiresAt: new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000).toISOString(),
        dailyLimit: 0,
        usedToday: 0,
        totalUsed: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        notes: 'Master Administrator Account (Unified with Media Toolkit Pro)',
      };
      this.users.set(adminUser.id, adminUser);
      this.saveData();
      console.log('[AuthManager] Master admin initialized: username: admin / password: bulbul2026');
    } else {
      adminUser.email = 'bulbulworka1@gmail.com';
      adminUser.username = 'admin';
      this.saveData();
    }
  }

  /**
   * Sanitize user record for client consumption (strip salt and passwordHash)
   */
  private sanitizeUser(user: UserRecord): any {
    const now = new Date();
    const exp = new Date(user.expiresAt);
    const msLeft = exp.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 3600 * 24)));
    const isExpired = user.role !== 'admin' && msLeft <= 0;

    let computedStatus = user.status;
    if (isExpired && user.status === 'active') {
      computedStatus = 'expired';
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: computedStatus,
      expiresAt: user.expiresAt,
      daysLeft: user.role === 'admin' ? 9999 : daysLeft,
      dailyLimit: user.dailyLimit,
      usedToday: user.usedToday,
      totalUsed: user.totalUsed,
      createdAt: user.createdAt,
      notes: user.notes,
    };
  }

  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.settings = { ...this.settings, ...updates };
    this.saveData();
    return this.settings;
  }

  /**
   * Register a new user
   */
  public register(username: string, email: string, password: string): { user: any; token: string } {
    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUser || cleanUser.length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Valid email address required.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Check if user or email already exists
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === cleanUser) {
        throw new Error('Username is already taken.');
      }
      if (u.email.toLowerCase() === cleanEmail) {
        throw new Error('Email is already registered.');
      }
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const trialDays = this.settings.defaultTrialDays || 7;
    const expiresAt = new Date(Date.now() + trialDays * 24 * 3600 * 1000).toISOString();
    const initialStatus = this.settings.requireAdminApproval ? 'pending' : 'active';

    const newUser: UserRecord = {
      id: 'usr_' + crypto.randomUUID().slice(0, 8),
      username: cleanUser,
      email: cleanEmail,
      salt,
      passwordHash: hashPassword(password, salt),
      role: 'user',
      status: initialStatus,
      expiresAt,
      dailyLimit: this.settings.defaultDailyLimit || 50,
      usedToday: 0,
      totalUsed: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      notes: `Default ${trialDays}-day access assigned on signup`,
    };

    this.users.set(newUser.id, newUser);
    this.saveData();

    const token = this.createSession(newUser.id);
    return { user: this.sanitizeUser(newUser), token };
  }

  /**
   * Login with username or email
   */
  public login(identifier: string, password: string): { user: any; token: string } {
    const cleanId = identifier.trim().toLowerCase();

    // Master Admin Unified Access (support 'admin', 'bulbulworka1@gmail.com', 'ahmeddesignhouse@gmail.com')
    if (cleanId === 'admin' || cleanId === 'bulbulworka1@gmail.com' || cleanId === 'ahmeddesignhouse@gmail.com') {
      if (password === 'bulbul2026' || password === 'admin123' || password === 'Admin@StockMeta2026') {
        let adminUser = Array.from(this.users.values()).find((u) => u.role === 'admin');
        if (!adminUser) {
          this.ensureAdminExists();
          adminUser = this.users.get('admin_master') || Array.from(this.users.values())[0];
        }
        const token = this.createSession(adminUser.id);
        return { user: this.sanitizeUser(adminUser), token };
      }
    }

    let foundUser: UserRecord | undefined;
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) {
        foundUser = u;
        break;
      }
    }

    if (foundUser) {
      const calculatedHash = hashPassword(password, foundUser.salt);
      if (calculatedHash !== foundUser.passwordHash) {
        throw new Error('Invalid username or password.');
      }

      // Reset daily count if day changed
      const today = new Date().toISOString().split('T')[0];
      if (foundUser.lastActiveDate !== today) {
        foundUser.usedToday = 0;
        foundUser.lastActiveDate = today;
        this.saveData();
      }

      const token = this.createSession(foundUser.id);
      return { user: this.sanitizeUser(foundUser), token };
    }

    throw new Error('Invalid username or password.');
  }

  /**
   * SSO Login from Media Toolkit Pro
   */
  public ssoLogin(identifier: string, ssoToken?: string): { user: any; token: string } {
    const cleanId = (identifier || '').trim().toLowerCase();
    if (!cleanId) {
      throw new Error('Identifier required for SSO.');
    }

    if (cleanId === 'admin' || cleanId === 'bulbulworka1@gmail.com' || cleanId === 'ahmeddesignhouse@gmail.com') {
      let adminUser = Array.from(this.users.values()).find((u) => u.role === 'admin');
      if (!adminUser) {
        this.ensureAdminExists();
        adminUser = this.users.get('admin_master') || Array.from(this.users.values())[0];
      }
      const token = this.createSession(adminUser.id);
      return { user: this.sanitizeUser(adminUser), token };
    }

    let foundUser = Array.from(this.users.values()).find(
      (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!foundUser) {
      const cleanEmail = cleanId.includes('@') ? cleanId : `${cleanId}@stockmeta.pro`;
      const cleanUser = cleanId.includes('@') ? cleanId.split('@')[0] : cleanId;
      return this.register(cleanUser, cleanEmail, 'StockMetaUnified2026!');
    }

    const token = this.createSession(foundUser.id);
    return { user: this.sanitizeUser(foundUser), token };
  }

  private createSession(userId: string): string {
    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    // Session valid for 30 days
    this.sessions.set(token, {
      userId,
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
    });
    return token;
  }

  public verifySession(token: string): any | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      if (session) this.sessions.delete(token);
      return null;
    }

    const user = this.users.get(session.userId);
    if (!user) return null;

    // Reset daily counter if a new day has arrived
    const today = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate !== today) {
      user.usedToday = 0;
      user.lastActiveDate = today;
      this.saveData();
    }

    return this.sanitizeUser(user);
  }

  public logout(token: string): void {
    if (token) this.sessions.delete(token);
  }

  /**
   * Check whether a user is authorized to perform AI processing
   */
  public checkAccessAndQuota(userId: string): { allowed: boolean; reason?: string } {
    if (!this.settings.authRequired) {
      return { allowed: true };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { allowed: false, reason: 'Authentication required. Please log in.' };
    }

    if (user.role === 'admin') {
      return { allowed: true };
    }

    if (user.status === 'suspended') {
      return { allowed: false, reason: 'Your account has been suspended by the administrator.' };
    }

    if (user.status === 'pending') {
      return { allowed: false, reason: 'Your account is pending administrator approval.' };
    }

    // Check expiration
    const now = new Date().getTime();
    const exp = new Date(user.expiresAt).getTime();
    if (exp <= now) {
      user.status = 'expired';
      this.saveData();
      const expDateStr = new Date(user.expiresAt).toLocaleDateString();
      return {
        allowed: false,
        reason: `Your access period expired on ${expDateStr}. Please contact the administrator to renew.`,
      };
    }

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate !== today) {
      user.usedToday = 0;
      user.lastActiveDate = today;
      this.saveData();
    }

    if (user.dailyLimit > 0 && user.usedToday >= user.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily quota limit reached (${user.usedToday}/${user.dailyLimit} files). Quota resets at midnight.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Record usage when AI generates metadata
   */
  public recordUsage(userId: string, count: number = 1): void {
    const user = this.users.get(userId);
    if (user) {
      user.usedToday = (user.usedToday || 0) + count;
      user.totalUsed = (user.totalUsed || 0) + count;
      user.lastActiveDate = new Date().toISOString().split('T')[0];
      this.saveData();
    }
  }

  // ================= ADMIN MANAGEMENT METHODS ================= //

  public getAllUsers(): any[] {
    return Array.from(this.users.values()).map((u) => this.sanitizeUser(u));
  }

  public extendUserAccess(userId: string, daysToAdd: number): any {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found.');

    const currentExp = new Date(user.expiresAt).getTime();
    const now = Date.now();
    // If already expired, extend starting from now; otherwise add to current expiration
    const baseTime = currentExp > now ? currentExp : now;
    const newExp = new Date(baseTime + daysToAdd * 24 * 3600 * 1000).toISOString();

    user.expiresAt = newExp;
    if (user.status === 'expired') {
      user.status = 'active';
    }
    this.saveData();
    return this.sanitizeUser(user);
  }

  public setUserExpirationDate(userId: string, isoDate: string): any {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found.');
    user.expiresAt = isoDate;
    const isPast = new Date(isoDate).getTime() < Date.now();
    user.status = isPast ? 'expired' : 'active';
    this.saveData();
    return this.sanitizeUser(user);
  }

  public setUserStatus(userId: string, status: 'active' | 'suspended' | 'pending' | 'expired'): any {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found.');
    user.status = status;
    this.saveData();
    return this.sanitizeUser(user);
  }

  public setUserQuota(userId: string, dailyLimit: number): any {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found.');
    user.dailyLimit = Math.max(0, dailyLimit);
    this.saveData();
    return this.sanitizeUser(user);
  }

  public resetUserPassword(userId: string, newPassword: string): void {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found.');
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    user.salt = crypto.randomBytes(16).toString('hex');
    user.passwordHash = hashPassword(newPassword, user.salt);
    this.saveData();
  }

  public deleteUser(userId: string): void {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found.');
    if (user.role === 'admin' && user.id === 'admin_master') {
      throw new Error('Master administrator account cannot be deleted.');
    }
    this.users.delete(userId);
    this.saveData();
  }

  public exportBackup(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        settings: this.settings,
        users: Array.from(this.users.values()),
        licenses: Array.from(this.licenses.values()),
      },
      null,
      2
    );
  }

  public importBackup(jsonString: string): { importedCount: number } {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.users)) {
        throw new Error('Invalid backup file structure: missing users array.');
      }
      for (const u of data.users) {
        if (u.id && u.username && u.passwordHash && u.salt) {
          this.users.set(u.id, u);
        }
      }
      if (Array.isArray(data.licenses)) {
        for (const lic of data.licenses) {
          if (lic.id && lic.key) {
            this.licenses.set(lic.id, lic);
          }
        }
      }
      if (data.settings) {
        this.settings = { ...this.settings, ...data.settings };
      }
      this.ensureAdminExists();
      this.saveData();
      return { importedCount: data.users.length };
    } catch (err: any) {
      throw new Error('Failed to import backup: ' + err.message);
    }
  }

  // ================= LICENSE KEY MANAGEMENT ================= //

  public generateLicenseKey(
    assignedEmail: string,
    days: number,
    dailyLimit?: number,
    notes?: string
  ): LicenseKeyRecord {
    const cleanEmail = (assignedEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('A valid user email address is required to generate a license key.');
    }
    const parsedDays = Math.max(1, Math.floor(Number(days) || 30));
    const randomPart1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const randomPart2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const keyString = `SM-${parsedDays}D-${randomPart1}-${randomPart2}`;

    const record: LicenseKeyRecord = {
      id: 'lic_' + crypto.randomUUID().slice(0, 8),
      key: keyString,
      assignedEmail: cleanEmail,
      days: parsedDays,
      dailyLimit: dailyLimit && dailyLimit > 0 ? dailyLimit : undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
      notes: notes || undefined,
    };

    this.licenses.set(record.id, record);
    this.saveData();
    return record;
  }

  public getAllLicenseKeys(): LicenseKeyRecord[] {
    return Array.from(this.licenses.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public revokeLicenseKey(id: string): LicenseKeyRecord {
    const lic = this.licenses.get(id);
    if (!lic) throw new Error('License key not found.');
    lic.status = 'revoked';
    this.saveData();
    return lic;
  }

  public deleteLicenseKey(id: string): void {
    if (!this.licenses.has(id)) throw new Error('License key not found.');
    this.licenses.delete(id);
    this.saveData();
  }

  public activateLicenseKey(
    userId: string,
    keyInput: string
  ): { user: any; license: LicenseKeyRecord; daysAdded: number; newExpiresAt: string } {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found. Please log in again.');

    const cleanKey = (keyInput || '').trim().toUpperCase();
    if (!cleanKey) {
      throw new Error('Please enter a license key.');
    }

    let foundLic: LicenseKeyRecord | undefined;
    for (const lic of this.licenses.values()) {
      if (lic.key.trim().toUpperCase() === cleanKey) {
        foundLic = lic;
        break;
      }
    }

    if (!foundLic) {
      throw new Error('Invalid license key. Please check the key and try again.');
    }

    if (foundLic.status === 'used') {
      const usedDate = foundLic.usedAt ? new Date(foundLic.usedAt).toLocaleDateString() : 'earlier';
      throw new Error(
        `This license key was already activated on ${usedDate}${
          foundLic.usedByUsername ? ' by ' + foundLic.usedByUsername : ''
        }.`
      );
    }

    if (foundLic.status === 'revoked') {
      throw new Error('This license key has been revoked by the administrator.');
    }

    // Email binding check:
    if (foundLic.assignedEmail && foundLic.assignedEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      throw new Error(
        `This license key is designated specifically for "${foundLic.assignedEmail}". It cannot be activated on this account ("${user.email}").`
      );
    }

    // Calculate new expiration
    const currentExp = new Date(user.expiresAt).getTime();
    const now = Date.now();
    const baseTime = currentExp > now ? currentExp : now;
    const newExp = new Date(baseTime + foundLic.days * 24 * 3600 * 1000).toISOString();

    user.expiresAt = newExp;
    if (user.status === 'expired' || user.status === 'pending') {
      user.status = 'active';
    }
    if (foundLic.dailyLimit && foundLic.dailyLimit > 0) {
      user.dailyLimit = foundLic.dailyLimit;
    }

    // Mark key as used
    foundLic.status = 'used';
    foundLic.usedAt = new Date().toISOString();
    foundLic.usedByUserId = user.id;
    foundLic.usedByUsername = user.username;

    this.saveData();

    return {
      user: this.sanitizeUser(user),
      license: foundLic,
      daysAdded: foundLic.days,
      newExpiresAt: newExp,
    };
  }
}

export const authManager = new AuthManager();
