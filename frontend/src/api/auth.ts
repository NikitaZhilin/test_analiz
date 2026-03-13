import { apiRequest } from './client';
import type { User, AuthTokens } from '../types';

export async function register(email: string, password: string): Promise<AuthTokens> {
  return apiRequest<AuthTokens>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  return apiRequest<AuthTokens>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export async function getMe(): Promise<User> {
  // Пробуем несколько раз с задержкой на случай если токен ещё не активен
  for (let i = 0; i < 3; i++) {
    try {
      return await apiRequest<User>('/api/auth/me');
    } catch (error: any) {
      // Если это последняя попытка или ошибка не 401 - выбрасываем
      if (i === 2 || !error.message.includes('401')) {
        throw error;
      }
      // Ждём перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
  throw new Error('Failed to get user data');
}
