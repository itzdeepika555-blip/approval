import { User } from '../types';
import { request } from './api';
import { DEMO_USERS } from '../mock/mockData';

export interface LoginCredentials {
  email: string;
  password: string;
  role?: 'CITIZEN' | 'OFFICER' | 'ADMIN';
}

export interface SignupData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  companyName: string;
  panNumber: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  /**
   * Authenticate user with backend or demo credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Try backend endpoint first
      return await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch {
      // Clean fallback to mock credentials for Phase 2 UI development
      const demoKey = credentials.email.toLowerCase().includes('officer')
        ? 'officer'
        : credentials.email.toLowerCase().includes('admin')
        ? 'admin'
        : 'citizen';

      const demo = DEMO_USERS[demoKey];
      return {
        token: demo.token,
        user: {
          ...demo.user,
          email: credentials.email || demo.user.email,
        },
      };
    }
  },

  /**
   * Register new Citizen industrial account
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      return await request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      // Fallback mock registration response
      const newUser: User = {
        id: `usr-cit-${Date.now()}`,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        role: 'CITIZEN',
        designation: `Founder, ${data.companyName}`,
      };
      const token = `jwt-mock-${Date.now()}`;
      return { token, user: newUser };
    }
  },

  /**
   * Get current authenticated session
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      return await request<User>('/auth/me');
    } catch {
      const stored = localStorage.getItem('maha_auth_user');
      return stored ? JSON.parse(stored) : null;
    }
  },
};
