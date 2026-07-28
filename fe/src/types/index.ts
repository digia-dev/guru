export interface User {
  id: number;
  email: string;
  name: string;
  role: 'guru' | 'admin';
  teacher_classes: string[];
  teacher_subjects: string[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
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
}

export interface Attendance {
  id: number;
  teacher_id: number;
  student_id: string;
  event_date: string;
  class: string;
  keterangan: 'H' | 'S' | 'I' | 'A';
}

export interface AttendanceBatchRecord {
  student_id: string;
  name?: string;
  keterangan: 'H' | 'S' | 'I' | 'A' | null;
}

export interface Grade {
  id?: number;
  teacher_id?: number;
  student_id: string;
  semester: 'Ganjil' | 'Genap';
  bab_1?: any;
  bab_2?: any;
  bab_3?: any;
  bab_4?: any;
  pengetahuan_rata?: number | null;
  keterampilan_rata?: number | null;
  sikap_rata?: number | null;
  sikap_jujur?: string | null;
  sikap_disiplin?: string | null;
  sikap_tgg_jawab?: string | null;
  sts?: number | null;
  sas?: number | null;
}

export interface SemesterGrade {
  student_id: string;
  name: string;
  class: string;
  rata_harian: number | null;
  rata_kehadiran: string;
  sts: number | null;
  sas: number | null;
  nilai_rapor: number | null;
  grade_id: number | null;
}

export interface LearningActivity {
  id: number;
  teacher_id: number;
  event_date: string;
  class: string;
  waktu_mulai: string;
  waktu_selesai: string;
  catatan?: string;
  subject_id?: number | null;
}

export interface Tabungan {
  id: number;
  teacher_id: number;
  student_id: string;
  tanggal: string;
  uang_masuk: number;
  uang_keluar: number;
}

export interface KasUmum {
  id: number;
  teacher_id: number;
  tanggal: string;
  jumlah: number;
  keterangan?: string;
}

export interface Materi {
  id: number;
  teacher_id: number;
  title: string;
  url: string;
  type: string;
  uploaded_at: string;
}

export interface CalendarEvent {
  id: number;
  event_date: string;
  jenis: string;
  event_type: string;
  color_class?: string;
}

export interface DashboardStats {
  total_students: number;
  active_classes: number;
  hadir_hari_ini: number;
  total_tabungan: number;
  classes: string[];
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

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message?: string;
  type: 'system' | 'agenda' | 'event';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export type PageType = 'dashboard' | 'agenda' | 'absensi' | 'nilai' | 'penilaian-semester' | 'data' | 'kalender' | 'settings' | 'profile' | 'admin-dashboard' | 'admin-users' | 'admin-academic-years' | 'admin-semesters' | 'admin-subjects' | 'admin-logs';

export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Semester {
  id: number;
  academic_year_id: number;
  academic_year_name?: string;
  name: 'Ganjil' | 'Genap';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

export interface AdminDashboardData {
  total_users: number;
  total_gurus: number;
  total_students: number;
  total_classes: number;
  hadir_hari_ini: number;
  total_tabungan: number;
  teachers: Array<{ id: number; name: string; email: string; student_count: number }>;
  recent_logs: ActivityLog[];
}
