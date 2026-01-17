// =====================
// USER TYPES
// =====================

export interface User {
  id?: string;
  email: string;
  name?: string;
  picture?: string;

  // IMPORTANT: used for route protection
  role?: "user" | "admin";

  profile?: UserProfile;
}

export interface UserProfile {
  degree: string;
  specialization: string;
  cgpa: number;
  graduation_year: number;
  university: string;
  skills: string[];
}

// Used only for job prediction API payload
export interface PredictionPayload {
  degree: string;
  specialization: string;
  cgpa: number;
  graduation_year: number;
  university: string;
  skills: string[];
}

// =====================
// AUTH TYPES
// =====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;

  // Optional admin support
  is_admin?: boolean;
  admin_code?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

// =====================
// JOB PREDICTION TYPES
// =====================

export interface JobRolePrediction {
  job: string;
  confidence: number;
  justification?: string;
}

export interface JobPrediction {
  primary: JobRolePrediction;
  alternatives: JobRolePrediction[];

  // Optional helper
  top_roles?: any;
}

export interface PredictionHistory {
  id: string;
  userId: string;
  education: UserProfile;
  prediction: JobPrediction;
  createdAt: string;
}

// =====================
// CERTIFICATION TYPES
// =====================

export interface Certification {
  id: string;
  certification_name: string;
  issued_by: string;
  year: number;
  created_at?: string;
}

export interface CertificationCreate {
  certification_name: string;
  issued_by: string;
  year: number;
}

// =====================
// FEEDBACK TYPES
// =====================

export interface Feedback {
  predictionId: number;
  rating: number;
  comment?: string;
  role: string;
}

// =====================
// ADMIN TYPES
// =====================

// Admin login response
export interface AdminLoginResponse {
  access: string;
  refresh?: string;
  is_admin: boolean;
}

// Admin user object (optional use)
export interface AdminUser {
  email: string;
  role: "admin";
}

// User logs for admin dashboard
export interface UserLog {
  id: number | string;
  user_email: string;
  degree: string;
  specialization: string;
  predictions: string[];
  createdAt: string;
}

// Flagged / incorrect predictions
export interface FlaggedPrediction {
  id: number | string;
  user_email: string;
  prediction: string;
  reason: string;
}
