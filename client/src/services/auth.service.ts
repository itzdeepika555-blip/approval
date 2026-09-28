import { User } from '../types';
import { request } from './api';

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
   * Authenticate user with real PostgreSQL backend
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response?.token) {
      localStorage.setItem('maha_auth_token', response.token);
      localStorage.setItem('maha_auth_user', JSON.stringify(response.user));
    }

    return response;
  },

  /**
   * Register new Citizen industrial account in PostgreSQL
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response?.token) {
      localStorage.setItem('maha_auth_token', response.token);
      localStorage.setItem('maha_auth_user', JSON.stringify(response.user));
    }

    return response;
  },

  /**
   * Get current authenticated session from PostgreSQL
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await request<User>('/auth/me');
      if (user) {
        localStorage.setItem('maha_auth_user', JSON.stringify(user));
        return user;
      }
    } catch {
      // Token may be expired or invalid
    }
    const stored = localStorage.getItem('maha_auth_user');
    return stored ? JSON.parse(stored) : null;
  },
};
