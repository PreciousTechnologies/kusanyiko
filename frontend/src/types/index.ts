// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'registrant' | 'apostle' | 'member';
  kanda?: string;
  country: string;
  region: string;
  first_name: string;
  last_name: string;
  profile_picture?: File | string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  role?: 'admin' | 'registrant' | 'apostle'; // Optional role field
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  new_password: string;
  confirm_password: string;
}

// Member types
export interface Member {
  id?: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'male' | 'female';
  age: number;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  saved: boolean; // Ameokoka
  church_registration_number: string;
  country: string;
  region?: string;
  center_area?: string;
  zone: string;
  cell: string;
  postal_address?: string;
  mobile_no: string;
  email?: string;
  church_position?: string;
  visitors_count: number;
  origin: 'invited' | 'efatha';
  residence: string;
  career?: string;
  attending_date: string;
  picture?: File | string;
  registered_by?: number;
  created_by?: number | string; // Can be ID or username string from serializer
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

// Statistics types
export interface AdminStats {
  total_members: number;
  country_stats: Array<{ country: string; count: number }>;
  region_stats: Array<{ region: string; count: number }>;
  gender_stats: Array<{ gender: string; count: number }>;
  marital_stats: Array<{ marital_status: string; count: number }>;
  saved_stats: Array<{ saved: boolean; count: number }>;
  recent_registrations: number;
  weekly_growth: Array<{ week: string; count: number }>;
}

export interface RegistrantStats {
  total_registered: number;
  gender_stats: Array<{ gender: string; count: number }>;
  region_stats: Array<{ region: string; count: number }>;
  saved_stats: Array<{ saved: boolean; count: number }>;
  recent_registrations: number;
  weekly_performance: Array<{ week: string; count: number }>;
  recent_activity: Array<{ first_name: string; last_name: string; created_at: string }>;
}

// API Response types
export interface AuthResponse {
  refresh: string;
  access: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Form validation schemas
export interface ValidationError {
  field: string;
  message: string;
}

// Geographic data
export interface TanzaniaRegion {
  value: string;
  label: string;
}

export interface DarEsSalaamArea {
  value: string;
  label: string;
}