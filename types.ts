
export interface Student {
  id: string; // Matrícula
  name: string;
  email: string;
  classIds: string[];
}

export interface Class {
  id:string;
  name: string;
  teacherId: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'justified_absent';
  justification?: string;
  justificationStatus?: 'pending' | 'approved' | 'rejected';
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  sector: string;
  photoUrl?: string; // Adicionado para a foto de perfil
}

export type CommunicationType = 'absence' | 'positive' | 'support' | 'corrective';

export interface CommunicationLog {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  type: CommunicationType;
  content: string;
  timestamp: number;
}
