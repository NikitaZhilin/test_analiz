import { apiRequest } from './client';
import type { Report, ReportListItem, ReportDetail, Result } from '../types';

export async function getReports(profileId: number): Promise<ReportListItem[]> {
  return apiRequest<ReportListItem[]>(`/api/reports/profile/${profileId}`);
}

export async function createReport(
  profileId: number,
  takenAt: string,
  labName?: string,
  comment?: string
): Promise<Report> {
  return apiRequest<Report>(`/api/reports/profile/${profileId}`, {
    method: 'POST',
    body: JSON.stringify({
      taken_at: takenAt,
      lab_name: labName,
      comment,
    }),
  });
}

export async function getReport(reportId: number): Promise<ReportDetail> {
  return apiRequest<ReportDetail>(`/api/reports/${reportId}`);
}

export async function updateReport(
  reportId: number,
  takenAt?: string,
  labName?: string,
  comment?: string
): Promise<Report> {
  return apiRequest<Report>(`/api/reports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify({
      taken_at: takenAt,
      lab_name: labName,
      comment,
    }),
  });
}

export async function deleteReport(reportId: number): Promise<void> {
  return apiRequest<void>(`/api/reports/${reportId}`, {
    method: 'DELETE',
  });
}

export async function bulkUpsertResults(
  reportId: number,
  results: {
    analyte_id: number;
    value: number;
    unit?: string;
    ref_low?: number;
    ref_high?: number;
    raw_name?: string;
  }[]
): Promise<Result[]> {
  return apiRequest<Result[]>(`/api/reports/${reportId}/results/bulk`, {
    method: 'POST',
    body: JSON.stringify(results),
  });
}
