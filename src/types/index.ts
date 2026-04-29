export type LanguageType =
  | 'en' // English
  | 'fil' // Filipino (standardized Tagalog)
  | 'ceb' // Cebuano/Bisaya
  | 'ilo' // Ilocano
  | 'hil' // Hiligaynon/Ilonggo
  | 'war' // Waray
  | 'pam' // Kapampangan
  | 'bcl' // Bikol
  | 'pag' // Pangasinan
  | 'mag' // Maguindanao
  | 'tsg' // Tausug
  | 'mdh'; // Maranao

export interface NavigationItem {
  label: string;
  href: string;
  children?: NavigationItem[];
}

export interface GovJob {
  id: string;
  position: string;
  plantilla_item_no: string;
  salary_grade: number;
  monthly_salary: number;
  place_of_assignment: string;
  evaluator_email: string | null;
  education: string;
  training: string;
  experience: string;
  eligibility: string;
  competency: string;
  posting_date: string | null;
  closing_date: string | null;
  source_url: string;
  apply_url: string;
  first_seen_at: string;
  last_seen_at: string;
  missing_from_source: boolean;
}
