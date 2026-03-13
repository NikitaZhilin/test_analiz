import { apiRequest } from './client';
import type { Profile } from '../types';

export async function getProfiles(): Promise<Profile[]> {
  return apiRequest<Profile[]>('/api/profiles');
}

export async function createProfile(name: string): Promise<Profile> {
  return apiRequest<Profile>('/api/profiles', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateProfile(profileId: number, name: string): Promise<Profile> {
  return apiRequest<Profile>(`/api/profiles/${profileId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function deleteProfile(profileId: number): Promise<void> {
  return apiRequest<void>(`/api/profiles/${profileId}`, {
    method: 'DELETE',
  });
}
