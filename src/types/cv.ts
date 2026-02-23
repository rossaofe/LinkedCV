export interface Experience {
  title: string;
  company: string;
  duration: string;
  location?: string;
  description?: string;
}

export interface Education {
  degree: string;
  field?: string;
  school: string;
  years: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  date?: string;
}

export interface CVData {
  name: string;
  headline: string;
  location?: string;
  about?: string;
  photoUrl?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    linkedin?: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications?: Certification[];
  personalInfo?: string;
}
