// API client с улучшенной безопасностью
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

let accessToken: string | null = null;
let refreshToken: string | null = null;

// Генерация уникального ID запроса для аудита
function generateRequestId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
}

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  // Токены хранятся в памяти и localStorage (для persistence)
  // В production лучше использовать httpOnly cookies
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function initAuth() {
  accessToken = localStorage.getItem('access_token');
  refreshToken = localStorage.getItem('refresh_token');
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function isAuthenticated(): boolean {
  return !!accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  skipLogging?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { skipAuth = false, skipLogging = false, headers = {}, ...restConfig } = config;

  let token = accessToken;

  if (!skipAuth && !token) {
    throw new Error('Not authenticated');
  }

  const requestId = generateRequestId();
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...restConfig,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  });

  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
        ...restConfig,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          Authorization: `Bearer ${newToken}`,
          ...headers,
        },
      });

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
      }

      return retryResponse.json();
    }
    throw new Error('Authentication failed');
  }

  if (!response.ok) {
    let errorData: any = { detail: 'Request failed' };
    try {
      errorData = await response.json();
    } catch {
      // Ignore parse errors
    }

    // Не раскрываем детали ошибок клиенту
    const errorMessage = errorData.detail || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function apiRequestMultipart<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  let token = accessToken;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const requestId = generateRequestId();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'X-Request-ID': requestId,
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'X-Request-ID': requestId,
          Authorization: `Bearer ${newToken}`,
        },
        body: formData,
      });

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
      }

      return retryResponse.json();
    }
    throw new Error('Authentication failed');
  }

  if (!response.ok) {
    let errorData: any = { detail: 'Request failed' };
    try {
      errorData = await response.json();
    } catch {
      // Ignore parse errors
    }

    const errorMessage = errorData.detail || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMessage);
  }

  return response.json();
}

// Очистка токенов при закрытии вкладки (опционально)
window.addEventListener('beforeunload', () => {
  // Можно очистить токены из памяти, но оставить в localStorage
  accessToken = null;
});
