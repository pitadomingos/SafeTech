import { User, UserRole } from '../types';
import { isSupabaseConfigured } from './supabaseClient';
import { db } from './databaseService';

export interface AuthResponse {
    user: User | null;
    status: 'success' | 'invalid' | 'error' | 'trial_expired';
    message?: string;
}

export const authService = {
  /**
   * Authenticates user against the public.users table via REST API.
   */
  async authenticate(username: string, password?: string): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
          return { user: data.user, status: 'success' };
      } else {
          return { user: null, status: data.status || 'invalid', message: data.message };
      }
    } catch (e: any) {
        return { user: null, status: 'error', message: e.message };
    }
  },

  async signOut() {
      // Logic handled by App Context
  },

  async registerCompany(companyData: any): Promise<any> {
    const response = await fetch('/api/register-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });
    return response.json();
  },

  async registerUser(userData: any): Promise<any> {
    const response = await fetch('/api/register-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  async updateCompany(id: string, updateData: any): Promise<any> {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return response.json();
  }
};