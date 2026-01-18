

export interface User {
  id?: string;
  email: string;
  name?: string;
  picture?: string;

  
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


export interface PredictionPayload {
  degree: string;
  specialization: string;
  cgpa: number;
  graduation_year: number;
  university: string;
  skills: string[];
}


export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;

  
  is_admin?: boolean;
  admin_code?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}


export interface JobRolePrediction {
  job: string;
  confidence: number;
  justification?: string;
}

export interface JobPrediction {
  primary: JobRolePrediction;
  alternatives: JobRolePrediction[];

  top_roles?: any;
}

export interface PredictionHistory {
  id: string;
  userId: string;
  education: UserProfile;
  prediction: JobPrediction;
  createdAt: string;
}



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



export interface Feedback {
  predictionId: number;
  rating: number;
  comment?: string;
  role?: string;
  
}

export interface AdminLoginResponse {
  access: string;
  refresh?: string;
  is_admin: boolean;
}

export interface AdminUser {
  email: string;
  role: "admin";
}

export interface UserLog {
  id: number | string;
  user_email: string;
  degree: string;
  specialization: string;
  predictions: string[];
  createdAt: string;
}

export interface FlaggedPrediction {
  id: number | string;
  user_email: string;
  prediction: string;
  reason: string;
}
