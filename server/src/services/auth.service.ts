import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, StoredUser, StoredBusinessProfile } from './db.service';
import { config } from '../config';
import { SignupInput, LoginInput } from '../validators/auth.validator';
import { JwtUserPayload } from '../types';

export class AuthService {
  /**
   * Sanitizes a user object to remove confidential credential fields
   */
  public sanitizeUser(user: StoredUser) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Generates a signed JWT access token
   */
  public generateToken(user: StoredUser): string {
    const payload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || null,
    };

    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry as any,
    });
  }

  /**
   * Citizen Registration (Public Sign-up)
   * Strictly enforces CITIZEN role to prevent privilege escalation.
   */
  public async signup(input: SignupInput) {
    const emailNormalized = input.email.trim().toLowerCase();
    const phone = (input.phone || input.mobileNumber || '').trim();

    // Check if user already exists
    const existingEmail = db.users.find(u => u.email.toLowerCase() === emailNormalized);
    if (existingEmail) {
      const err: any = new Error('An account with this email address already exists.');
      err.statusCode = 409;
      err.errorCode = 'EMAIL_EXISTS';
      throw err;
    }

    if (phone) {
      const existingPhone = db.users.find(u => u.phone === phone);
      if (existingPhone) {
        const err: any = new Error('An account with this mobile number already exists.');
        err.statusCode = 409;
        err.errorCode = 'PHONE_EXISTS';
        throw err;
      }
    }

    // Salt and hash password (min 10 rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Create user - strictly CITIZEN role
    const newUser: StoredUser = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: emailNormalized,
      passwordHash,
      fullName: input.fullName.trim(),
      phone: phone || `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'CITIZEN', // STRICT: No privilege escalation
      isActive: true,
      departmentId: null,
      designation: input.companyName ? `Founder, ${input.companyName}` : 'Industrialist',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in DB
    db.users.push(newUser);

    // If companyName or panNumber provided, initialize starter business profile
    if (input.companyName || input.panNumber) {
      const newProfile: StoredBusinessProfile = {
        id: `profile-${Date.now()}`,
        userId: newUser.id,
        businessName: input.companyName || 'My Industrial Enterprise',
        legalEntityType: 'PRIVATE_LIMITED',
        industrySector: 'General Manufacturing',
        businessActivity: 'Industrial manufacturing & operations',
        district: 'Pune',
        taluka: 'Haveli',
        pinCode: '411001',
        isMidcArea: false,
        landAreaSqm: 1000,
        builtUpAreaSqm: 500,
        investmentPlantMachinery: 10000000,
        investmentLandBuilding: 5000000,
        employeeCount: 15,
        powerRequirementKva: 50,
        waterRequirementKld: 10,
        pollutionCategory: 'GREEN',
        effluentDischargeKld: 2,
        hazardousWasteGeneration: false,
        hasBoiler: false,
        hasDgSet: false,
        gstRegistered: !!input.panNumber,
        panNumber: input.panNumber || undefined,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.businessProfiles.push(newProfile);
    }

    // Audit log
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: newUser.id,
      userRole: newUser.role,
      action: 'USER_REGISTERED',
      entityName: 'User',
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role },
      createdAt: new Date(),
    });

    // Generate JWT
    const token = this.generateToken(newUser);

    return {
      user: this.sanitizeUser(newUser),
      token,
    };
  }

  /**
   * User Login (Supports Citizen, Officer, Admin)
   */
  public async login(input: LoginInput) {
    const emailNormalized = input.email.trim().toLowerCase();

    const user = db.users.find(u => u.email.toLowerCase() === emailNormalized);
    if (!user) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.errorCode = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (!user.isActive) {
      const err: any = new Error('Your account has been deactivated. Please contact portal administration.');
      err.statusCode = 403;
      err.errorCode = 'ACCOUNT_DEACTIVATED';
      throw err;
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.errorCode = 'INVALID_CREDENTIALS';
      throw err;
    }

    // Generate JWT
    const token = this.generateToken(user);

    // Audit log
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: user.id,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityName: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      createdAt: new Date(),
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Retrieve currently authenticated user's profile
   */
  public async getMe(userId: string) {
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.errorCode = 'USER_NOT_FOUND';
      throw err;
    }

    return this.sanitizeUser(user);
  }
}

export const authService = new AuthService();
