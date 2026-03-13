import { apiRequest } from './client';
import type { Analyte, ChartData } from '../types';

export async function getAnalytes(): Promise<Analyte[]> {
  return apiRequest<Analyte[]>('/api/analytes');
}

export async function createAnalyte(
  canonicalName: string,
  displayNameRu: string,
  synonyms?: string[],
  defaultUnit?: string
): Promise<Analyte> {
  return apiRequest<Analyte>('/api/analytes', {
    method: 'POST',
    body: JSON.stringify({
      canonical_name: canonicalName,
      display_name_ru: displayNameRu,
      synonyms,
      default_unit: defaultUnit,
    }),
  });
}

export async function matchAnalyte(name: string): Promise<{ matched: boolean; analyte: Analyte | null; suggestions: Analyte[] }> {
  return apiRequest(`/api/analytes/match?name=${encodeURIComponent(name)}`);
}

export async function getProfileAnalytes(profileId: number): Promise<Analyte[]> {
  return apiRequest<Analyte[]>(`/api/analytes/profile/${profileId}`);
}

export async function getAnalyteSeries(
  profileId: number,
  analyteId: number
): Promise<ChartData> {
  return apiRequest<ChartData>(`/api/analytes/profile/${profileId}/${analyteId}/series`);
}
