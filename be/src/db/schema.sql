CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'guru' CHECK (role IN ('guru', 'admin')),
    teacher_classes TEXT[] DEFAULT '{}',
    teacher_subjects TEXT[] DEFAULT '{}',
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_id UUID NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    class VARCHAR(10) NOT NULL,
    address TEXT,
    dob DATE,
    father_name VARCHAR(100),
    father_job VARCHAR(100),
    mother_name VARCHAR(100),
    mother_job VARCHAR(100),
    phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(teacher_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_students_teacher_class ON students(teacher_id, class);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS semesters (
    id SERIAL PRIMARY KEY,
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(10) NOT NULL CHECK (name IN ('Ganjil', 'Genap')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(20) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(20),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) NOT NULL,
    event_date DATE NOT NULL,
    class VARCHAR(10) NOT NULL,
    keterangan CHAR(1) NOT NULL CHECK (keterangan IN ('H', 'S', 'I', 'A')),
    subject_id INTEGER REFERENCES subjects(id),
    timestamp TIMESTAMP DEFAULT NOW(),
    UNIQUE(teacher_id, student_id, event_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date_class ON attendance(teacher_id, event_date, class);
CREATE INDEX IF NOT EXISTS idx_attendance_keterangan ON attendance(teacher_id, event_date, keterangan);

CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) NOT NULL,
    semester VARCHAR(10) NOT NULL CHECK (semester IN ('Ganjil', 'Genap')),
    bab_1 JSONB DEFAULT '{}',
    bab_2 JSONB DEFAULT '{}',
    bab_3 JSONB DEFAULT '{}',
    bab_4 JSONB DEFAULT '{}',
    pengetahuan_rata NUMERIC(5,2),
    keterampilan_rata NUMERIC(5,2),
    sikap_rata NUMERIC(5,2),
    sikap_jujur VARCHAR(20),
    sikap_disiplin VARCHAR(20),
    sikap_tgg_jawab VARCHAR(20),
    sts NUMERIC(5,2),
    sas NUMERIC(5,2),
    timestamp TIMESTAMP DEFAULT NOW(),
    subject_id INTEGER REFERENCES subjects(id),
    UNIQUE(teacher_id, student_id, semester)
);

CREATE TABLE IF NOT EXISTS learning_activities (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    class VARCHAR(10) NOT NULL,
    waktu_mulai TIME NOT NULL,
    waktu_selesai TIME NOT NULL,
    catatan TEXT,
    subject_id INTEGER REFERENCES subjects(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_date ON learning_activities(teacher_id, event_date);

CREATE TABLE IF NOT EXISTS tabungan (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) NOT NULL,
    tanggal DATE NOT NULL,
    uang_masuk NUMERIC(12,2) DEFAULT 0,
    uang_keluar NUMERIC(12,2) DEFAULT 0,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tabungan_student ON tabungan(teacher_id, student_id);
CREATE INDEX IF NOT EXISTS idx_tabungan_tanggal ON tabungan(teacher_id, tanggal);

CREATE TABLE IF NOT EXISTS kas_umum_tabungan (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    jumlah NUMERIC(12,2) NOT NULL,
    keterangan TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materi (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'link',
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    event_date DATE NOT NULL,
    jenis VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    color_class VARCHAR(50),
    is_global BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(event_date);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_grades_teacher_semester ON grades(teacher_id, semester);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_semesters_year_active ON semesters(academic_year_id, is_active);
CREATE INDEX IF NOT EXISTS idx_academic_years_active ON academic_years(is_active, start_date DESC);
