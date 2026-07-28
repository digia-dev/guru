export interface User {
  id: number;
  email: string;
  password_hash?: string;
  name: string;
  role: 'guru' | 'admin';
  teacher_classes: string[];
  auth_user_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: number;
  email: string;
  name: string;
  role: string;
  teacher_classes: string[];
}

export interface Student {
  id: number;
  teacher_id: number;
  student_id: string;
  name: string;
  class: string;
  address?: string;
  dob?: string;
  father_name?: string;
  father_job?: string;
  mother_name?: string;
  mother_job?: string;
  phone?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Attendance {
  id: number;
  teacher_id: number;
  student_id: string;
  event_date: string;
  class: string;
  keterangan: 'H' | 'S' | 'I' | 'A';
  timestamp: Date;
}

export interface GradeBab {
  pengetahuan_1?: number;
  pengetahuan_2?: number;
  pengetahuan_3?: number;
  pengetahuan_4?: number;
  pengetahuan_5?: number;
  keterampilan_1?: number;
  keterampilan_2?: number;
  keterampilan_3?: number;
  keterampilan_4?: number;
  keterampilan_5?: number;
  pengetahuan_rata?: number;
  keterampilan_rata?: number;
}

export interface Grade {
  id: number;
  teacher_id: number;
  student_id: string;
  semester: 'Ganjil' | 'Genap';
  bab_1: GradeBab;
  bab_2: GradeBab;
  bab_3: GradeBab;
  bab_4: GradeBab;
  pengetahuan_rata?: number;
  keterampilan_rata?: number;
  sikap_rata?: number;
  sikap_jujur?: string;
  sikap_disiplin?: string;
  sikap_tgg_jawab?: string;
  sts?: number;
  sas?: number;
}

export interface LearningActivity {
  id: number;
  teacher_id: number;
  event_date: string;
  class: string;
  waktu_mulai: string;
  waktu_selesai: string;
  catatan?: string;
  created_at: Date;
}

export interface Tabungan {
  id: number;
  teacher_id: number;
  student_id: string;
  tanggal: string;
  uang_masuk: number;
  uang_keluar: number;
  timestamp: Date;
}

export interface KasUmum {
  id: number;
  teacher_id: number;
  tanggal: string;
  jumlah: number;
  keterangan?: string;
  timestamp: Date;
}

export interface Materi {
  id: number;
  teacher_id: number;
  title: string;
  url: string;
  type: string;
  uploaded_at: Date;
}

export interface CalendarEvent {
  id: number;
  event_date: string;
  jenis: string;
  event_type: string;
  color_class?: string;
  is_global: boolean;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  authUserId: string;
  iat?: number;
  exp?: number;
}

export interface DashboardStats {
  total_students: number;
  active_classes: number;
  hadir_hari_ini: number;
  total_tabungan: number;
}

export interface AttendanceTrend {
  date: string;
  H: number;
  S: number;
  I: number;
  A: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
