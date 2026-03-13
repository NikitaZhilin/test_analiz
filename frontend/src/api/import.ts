import { apiRequestMultipart, apiRequest } from './client';
import type { ImportPreviewResponse } from '../types';

export async function previewImport(
  profileId: number,
  file: File
): Promise<ImportPreviewResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequestMultipart<ImportPreviewResponse>(
    `/api/import/profile/${profileId}/preview`,
    formData
  );
}

export async function confirmImport(
  profileId: number,
  data: {
    taken_at: string;
    lab_name?: string;
    comment?: string;
    rows: {
      row_index: number;
      analyte_id: number | null;
      create_new_analyte: boolean;
      analyte_name: string | null;
      value: number;
      unit?: string;
      ref_low?: number;
      ref_high?: number;
      raw_name?: string;
    }[];
  }
): Promise<{ report_id: number; created_results: number }> {
  return apiRequest(`/api/import/profile/${profileId}/confirm`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
