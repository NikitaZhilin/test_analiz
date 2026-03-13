export interface User {
  id: number;
  email: string;
}

export interface Profile {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Analyte {
  id: number;
  canonical_name: string;
  display_name_ru: string;
  synonyms: string[] | null;
  default_unit: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  profile_id: number;
  taken_at: string;
  lab_name: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportListItem {
  id: number;
  profile_id: number;
  taken_at: string;
  lab_name: string | null;
  comment: string | null;
  created_at: string;
  results_count: number;
}

export interface ReportDetail extends Report {
  results: Result[];
}

export interface Result {
  id: number;
  report_id: number;
  analyte_id: number;
  value: number;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  flag: string | null;
  raw_name: string | null;
  created_at: string;
  updated_at: string;
  analyte?: Analyte;
}

export interface ChartPoint {
  date: string;
  value: number;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  report_id: number;
}

export interface ChartData {
  analyte: {
    id: number;
    display_name_ru: string;
    default_unit: string | null;
  };
  points: ChartPoint[];
}

export interface ImportPreviewRow {
  row_index: number;
  analyte_raw: string | null;
  value: number;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  matched: boolean;
  analyte: Analyte | null;
  errors: string[];
}

export interface ImportPreviewResponse {
  parsed_rows: ImportPreviewRow[];
  unmatched_count: number;
}

export interface ImportConfirmRow {
  row_index: number;
  analyte_id: number | null;
  create_new_analyte: boolean;
  analyte_name: string | null;
  value: number;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  raw_name: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
