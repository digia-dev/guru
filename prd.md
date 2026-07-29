# PRD: AppGuru - Aplikasi Manajemen Guru (Versi Modern)

**Dokumen:** Product Requirements Document (PRD)
**Versi:** 2.1.0
**Tanggal:** 2026-07-29
**Penulis:** Tim Pengembang AppGuru
**Status:** Updated

---

## DAFTAR ISI

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Tujuan Produk](#2-tujuan-produk)
3. [Stakeholders](#3-stakeholders)
4. [Analisis Aplikasi Existing](#4-analisis-aplikasi-existing)
5. [Arsitektur Sistem](#5-arsitektur-sistem)
6. [Tech Stack](#6-tech-stack)
7. [Fitur-Fitur](#7-fitur-fitur)
8. [Halaman / Page Descriptions](#8-halaman--page-descriptions)
9. [User Stories](#9-user-stories)
10. [Database Schema](#10-database-schema)
11. [API Endpoints](#11-api-endpoints)
12. [Authentication & Authorization](#12-authentication--authorization)
13. [UI/UX Guidelines](#13-uiux-guidelines)
14. [Responsive Design](#14-responsive-design)
15. [Charts & Visualisasi Data](#15-charts--visualisasi-data)
16. [AI Integration](#16-ai-integration)
17. [Export & Import](#17-export--import)
18. [Performance Requirements](#18-performance-requirements)
19. [Security Requirements](#19-security-requirements)
20. [Testing Strategy](#20-testing-strategy)
21. [Deployment Strategy](#21-deployment-strategy)
22. [Monitoring & Analytics](#22-monitoring--analytics)
23. [Risiko & Mitigasi](#23-risiko--mitigasi)
24. [Roadmap & Milestones](#24-roadmap--milestones)
25. [Glossary](#25-glossary)

---

## 1. Ringkasan Eksekutif

### 1.1 Latar Belakang

AppGuru adalah aplikasi manajemen sekolah yang dirancang khusus untuk membantu guru dalam mengelola kegiatan pembelajaran sehari-hari. Aplikasi ini mencakup manajemen absensi, penilaian harian dan semester, agenda pembelajaran, data siswa, tabungan siswa, kalender pendidikan, dan berbagai fitur pendukung lainnya.

Versi sebelumnya (v1) dibangun sebagai single-page application (SPA) monolitik menggunakan Firebase sebagai backend, vanilla JavaScript, dan Tailwind CSS CDN. Versi baru (v2) ini akan melakukan migrasi total ke arsitektur modern dengan:

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript + PostgreSQL
- **Repository:** Dipisah menjadi `fe/` (frontend) dan `be/` (backend)
- **Autentikasi:** JWT-based authentication dengan refresh token
- **Database:** PostgreSQL dengan schema relasional yang terstruktur

### 1.2 Visi Produk

Menjadi platform manajemen pembelajaran yang paling intuitif, cepat, dan andal bagi guru di Indonesia, yang memungkinkan mereka fokus pada pengajaran而非administrasi.

### 1.3 Misi Produk

1. Menyederhanakan administrasi guru dengan antarmuka yang modern dan responsif
2. Menyediakan data real-time tentang kehadiran dan performa siswa
3. Memfasilitasi pencatatan nilai yang akurat dan perhitungan otomatis
4. Menyediakan alat untuk perencanaan agenda pembelajaran
5. Mendukung portabilitas data melalui ekspor ke Excel
6. Mengintegrasikan AI untuk membantu pembuatan catatan rapor

### 1.4 Target Pengguna

- **Pengguna Utama:** Guru mata pelajaran di tingkat SMP (Sekolah Menengah Pertama)
- **Contoh Pengguna:** Siti Nurafifah, guru dengan 5 kelas (7-6, 7-7, 7-8, 7-9, 7-10)
- **Pengguna Sekunder:** Wali kelas yang membutuhkan data administratif siswa
- **Pengguna Tersier:** Kepala sekolah atau staf administrasi yang memerlukan laporan

---

## 2. Tujuan Produk

### 2.1 Tujuan Bisnis

1. Mengurangi waktu administrasi guru hingga 60% dengan otomatisasi perhitungan nilai
2. Menyediakan satu platform terpadu untuk semua kebutuhan pencatatan guru
3. Meningkatkan akurasi data kehadiran dan nilai siswa
4. Memudahkan pelaporan perkembangan siswa ke orang tua

### 2.2 Tujuan Teknis

1. **Migrasi Total:** Pindah dari Firebase + vanilla JS ke PostgreSQL + React + TypeScript
2. **Performa:** Waktu loading halaman < 1 detik, time to interactive < 2 detik
3. **Skalabilitas:** Mendukung hingga 1000 siswa dan 50 guru secara bersamaan
4. **Keamanan:** Autentikasi JWT, RLS di database, enkripsi data sensitif
5. **Code Quality:** TypeScript strict mode, ESLint, coverage > 80%
6. **Dual Repo:** Pemisahan frontend dan backend untuk pengembangan yang lebih terstruktur

### 2.3 Key Performance Indicators (KPI)

| Metrik | Target |
|--------|--------|
| Waktu muat halaman | < 1 detik |
| Waktu simpan data | < 500 ms |
| Uptime | > 99.5% |
| Kepuasan pengguna (NPS) | > 70 |
| Jumlah bug kritis per bulan | < 3 |
| Response time API (p95) | < 200 ms |

---

## 3. Stakeholders

| Stakeholder | Peran | Kebutuhan Utama |
|-------------|-------|-----------------|
| Siti Nurafifah | End User (Guru) | Absensi, nilai, agenda, tabungan |
| Tim Developer | Development | Code quality, maintainability |
| Kepala Sekolah | Decision Maker | Laporan, data agregat |
| Orang Tua | Indirect User | Informasi perkembangan anak |
| Admin IT | Maintenance | Deployment, monitoring |

---

## 4. Analisis Aplikasi Existing

### 4.1 Arsitektur Existing (v1)

```
appguru.html (Monolitik ~5000 baris)
├── HTML Structure
│   ├── Mobile Container (bottom-nav, mobile-header, mobile-main)
│   └── Desktop Container (sidebar, header, desktop-main)
├── CSS (inline <style>)
│   ├── CSS Variables (warna, font)
│   ├── Custom Components (quote-card, attendance-btn, grade-input)
│   ├── Responsive Media Queries (mobile/desktop breakpoints)
│   └── Animations (fadeIn, slideUp)
├── JavaScript (inline <script>)
│   ├── Firebase Init (Firestore + Storage)
│   ├── Caching (allStudentsCache Map)
│   ├── Navigation (SPA routing dengan data-page)
│   ├── Page Renderers (renderHomePage, renderAgendaPage, dll)
│   ├── CRUD Operations (semua collection Firestore)
│   ├── Auto-Save (debounce 5 detik, batch writes)
│   ├── Chart (ApexCharts untuk tren absensi)
│   ├── Export (XLSX untuk Excel)
│   ├── AI Integration (Gemini API)
│   ├── Calendar Processing (Kalender Akademik)
│   └── Keyboard Shortcuts (Ctrl+S, Ctrl+N, Ctrl+E)
└── External Dependencies (CDN)
    ├── Tailwind CSS
    ├── Firebase v9
    ├── ApexCharts
    ├── flatpickr
    └── XLSX
```

### 4.2 Kekurangan Existing (v1)

1. **Monolitik & Tidak Maintainable:** 5000+ baris dalam satu file HTML
2. **Firebase Vendor Lock-in:** Tergantung Firebase untuk backend
3. **No Type Safety:** Vanilla JavaScript rawan runtime error
4. **Inline CSS:** Sulit di-scale dan dimaintain
5. **CDN Dependencies:** Tidak ada bundle optimization
6. **No Auth System:** Tidak ada login page, Firebase security rules minimal
7. **No State Management:** Semua state di global variable
8. **Performance Issues:** Banyak Firestore reads tanpa caching yang optimal
9. **No Testing:** Tidak ada unit test atau integration test
10. **Manual Deployment:** Tidak ada CI/CD pipeline

### 4.3 Fitur yang Dipertahankan

- ✅ Manajemen absensi dengan 4 status (H/S/I/A)
- ✅ Penilaian harian per BAB (Pengetahuan + Keterampilan + Sikap)
- ✅ Penilaian semester dengan perhitungan nilai rapor otomatis
- ✅ Agenda mingguan dengan tampilan kalender
- ✅ Kalender pendidikan interaktif
- ✅ Tabungan siswa (kelas 7-9) dengan setoran dan penarikan
- ✅ Data wali kelas (lengkap dengan info orang tua)
- ✅ Materi pembelajaran (link sharing)
- ✅ Dashboard dengan statistik dan grafik
- ✅ Ekspor data ke Excel
- ✅ AI integration (Gemini untuk ide kegiatan dan catatan rapor)
- ✅ Search siswa dari semua kelas

### 4.4 Improvement untuk v2

1. **React Component Architecture:** Setiap halaman menjadi komponen React
2. **TypeScript:** Type safety di seluruh codebase
3. **PostgreSQL:** Database relasional yang lebih terstruktur
4. **JWT Authentication:** Login page dengan role-based access
5. **Vite Bundler:** Build optimization, HMR, tree shaking
6. **React Router:** Dynamic routing dengan lazy loading
7. **React Query:** Server state management, caching, auto-refetch
8. **Tailwind JIT:** Optimized CSS tanpa CDN
9. **Dual Repository:** FE dan BE dipisah untuk maintainability
10. **Testing:** Jest + React Testing Library + Supertest

---

## 5. Arsitektur Sistem

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Frontend (fe/)                        │  │
│  │  Vite + React + TypeScript + Tailwind             │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────────┐  │  │
│  │  │ React   │ │ React    │ │ ApexCharts        │  │  │
│  │  │ Router  │ │ Query    │ │ (Chart library)   │  │  │
│  │  └─────────┘ └──────────┘ └───────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                    │ HTTP/HTTPS                    │
│                    │ JWT Bearer Token              │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│              Supabase (Hosted Backend)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Edge Functions (Deno)                            │   │
│  │  ┌──────────────┐ ┌──────────────┐               │   │
│  │  │ auth (JWT)   │ │ grades       │               │   │
│  │  │ students     │ │ attendance   │               │   │
│  │  │ agenda       │ │ tabungan     │               │   │
│  │  │ materi       │ │ backup       │               │   │
│  │  └──────────────┘ └──────────────┘               │   │
│  ├──────────────────────────────────────────────────┤   │
│  │              PostgreSQL Database                   │   │
│  │  (Managed by Supabase + pg_graphql)                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Frontend Architecture

```
fe/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component + Router
│   ├── index.css             # Tailwind imports + global styles
│   ├── api/
│   │   └── client.ts         # Axios instance + interceptors
│   ├── context/
│   │   ├── AuthContext.tsx    # JWT auth context provider
│   │   └── ImpersonationContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts        # Auth hook
│   │   ├── useCache.ts       # Local cache hook
│   │   ├── useAutoSave.ts    # Debounced auto-save hook
│   │   ├── useClasses.ts     # Classes utility
│   │   ├── useMutation.ts    # Optimistic mutation hook
│   │   └── useKeyboardShortcuts.ts
│   ├── utils/
│   │   └── grades.ts         # Grade calculation helpers
│   ├── components/
│   │   ├── Layout.tsx        # Main layout (sidebar + content)
│   │   ├── Sidebar.tsx       # Desktop sidebar navigation
│   │   ├── TopHeader.tsx     # Mobile top header
│   │   ├── BottomNav.tsx     # Mobile bottom navigation
│   │   ├── FloatingSaveBtn.tsx
│   │   ├── Modal.tsx         # Reusable modal component
│   │   ├── QuoteCard.tsx     # Daily quote card
│   │   ├── ProtectedRoute.tsx
│   │   ├── Card.tsx          # Reusable card component
│   │   ├── Button.tsx        # Reusable button component
│   │   ├── AdminLayout.tsx   # Admin sub-layout
│   │   ├── StudentDetailModal.tsx
│   │   └── charts/
│   │       └── AttendanceChart.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx   # Marketing landing page (/) — Unsplash images + parallax
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Agenda.tsx
│   │   ├── Absensi.tsx
│   │   ├── Nilai.tsx
│   │   ├── PenilaianSemester.tsx
│   │   ├── AnalisisNilai.tsx  # Analytics dashboard with ranking
│   │   ├── Materi.tsx
│   │   ├── Data.tsx
│   │   ├── KalenderPendidikan.tsx
│   │   ├── Settings.tsx       # Bobot nilai, backup/restore, tahun ajaran
│   │   ├── Profile.tsx        # Edit nama, email, password
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── UsersPage.tsx
│   │       ├── AcademicYearsPage.tsx
│   │       ├── SubjectsPage.tsx
│   │       ├── LogsPage.tsx
│   │       └── AnnouncementsPage.tsx
│   └── types/
│       └── index.ts          # Shared TypeScript interfaces
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

### 5.3 Backend Architecture

```
supabase/functions/
├── auth/                    # Edge Function: Auth & system endpoints
│   └── index.ts             # Login, register, refresh, me, grade-weights, backup, restore
├── students/
│   └── index.ts             # CRUD students
├── attendance/
│   └── index.ts             # CRUD attendance + batch save
├── grades/
│   └── index.ts             # CRUD grades harian & semester
├── activities/
│   └── index.ts             # CRUD learning activities
├── tabungan/
│   └── index.ts             # CRUD tabungan
├── kas-umum/
│   └── index.ts             # CRUD kas umum
├── materi/
│   └── index.ts             # CRUD materi
├── analytic/                # Analytics & dashboard
│   └── index.ts             # Dashboard stats, grade analytics
├── academic-years/
│   └── index.ts             # CRUD academic years
├── semesters/
│   └── index.ts             # CRUD semesters
├── subjects/
│   └── index.ts             # CRUD subjects
├── calendar/
│   └── index.ts             # Calendar events
├── notifications/
│   └── index.ts             # Push notifications
└── _shared/
    ├── cors.ts              # CORS headers
    └── supabase.ts          # Supabase client
```

### 5.3 Database Hosting: Supabase

PostgreSQL managed by Supabase with:
- Auto-generated REST API via pg_graphql
- Row Level Security (RLS) for multi-tenant data isolation
- Built-in authentication (Supabase Auth)
- Real-time subscriptions for live updates
- Database backups & point-in-time recovery

### 5.4 Project Structure

```
appguru/
├── fe/                    # Frontend (Vite + React + TypeScript)
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── supabase/              # Supabase backend
│   └── functions/         # Edge Functions (Deno)
│
├── appguru_ui.tsx         # Original landing page design mockup
├── prd.md                 # This document
├── AGENTS.md              # Agent instructions
├── CHECK.md               # Review checklist
└── README.md
```

---

## 6. Tech Stack

### 6.1 Frontend Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| React | ^18.3 | UI Library |
| TypeScript | ^5.4 | Type Safety |
| Vite | ^5.2 | Build Tool & Dev Server |
| Tailwind CSS | ^3.4 | Utility-first CSS |
| React Router | ^6.23 | Client-side Routing |
| TanStack React Query | ^5.32 | Server State Management |
| Axios | ^1.7 | HTTP Client |
| ApexCharts | ^3.44 | Charts & Visualizations |
| react-apexcharts | ^1.4 | React wrapper for ApexCharts |
| flatpickr | ^4.6 | Date Picker |
| XLSX (SheetJS) | ^0.20 | Excel Export |
| react-hot-toast | ^2.4 | Toast Notifications |
| date-fns | ^3.6 | Date Utilities |
| lucide-react | ^0.460 | SVG Icon Library |
| clsx | ^2.1 | Classname utility |

### 6.2 Backend Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Supabase | - | Hosted PostgreSQL + Auth + Edge Functions |
| Deno | ^2 | Edge Functions Runtime |
| TypeScript | ^5 | Type Safety |
| Supabase JS Client | ^2 | Database & Auth Client |
| JWT | - | Authentication (Supabase-managed) |
| pg_graphql | - | Auto-generated GraphQL API |

### 6.3 Database Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| PostgreSQL | ^16 | Relational Database (Supabase-managed) |
| Supabase Studio | - | Database Management UI |

### 6.4 DevOps Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Supabase CLI | - | Local dev, migrations, function deploy |
| Vercel | - | Frontend Hosting |
| Supabase | - | Backend + Database Hosting |

---

## 7. Fitur-Fitur

### 7.1 Fitur Inti (MVP)

#### F0: Landing Page (Marketing Page)
- **ID:** F-000
- **Deskripsi:** Halaman marketing utama di route `/`
- **Kompleksitas:** Low
- **Priority:** P0
- **Detail:**
  - Full-bleed hero section dengan gambar real (Unsplash)
  - Efek parallax scroll pada background
  - Reveal animations saat scroll (IntersectionObserver)
  - Stats strip (counter angka pengguna)
  - Feature cards dengan foto thumbnail (2 kolom grid)
  - CTA section dengan parallax background
  - Tombol navigasi ke `/login` dan `/register`
  - Sticky navbar dengan glassmorphism
  - Jika sudah login, redirect otomatis ke `/app`

#### F1: Autentikasi & Login
- **ID:** F-001
- **Deskripsi:** Login page dengan JWT authentication
- **Kompleksitas:** Medium
- **Priority:** P0 (Critical)
- **Detail:**
  - Login dengan email dan password
  - JWT access token (15 menit) + refresh token (7 hari)
  - Role-based access (guru, admin)
  - Protected routes (redirect ke login jika belum auth)
  - Logout dan token revocation
  - Remember me functionality

#### F2: Dashboard
- **ID:** F-002
- **Deskripsi:** Halaman utama dengan ringkasan data dan grafik
- **Kompleksitas:** High
- **Priority:** P0 (Critical)
- **Detail:**
  - Kartu statistik (Total Siswa, Kelas Aktif, Hadir Hari Ini, Total Tabungan)
  - Grafik tren absensi (ApexCharts, stacked bar)
  - Daftar agenda hari ini
  - Acara mendatang dari kalender pendidikan
  - Quote harian motivasi
  - Search siswa global
  - Tombol aksi cepat (Absensi, Input Nilai, Tambah Agenda)

#### F3: Agenda Harian
- **ID:** F-003
- **Deskripsi:** Manajemen agenda pembelajaran mingguan
- **Kompleksitas:** High
- **Priority:** P0 (Critical)
- **Detail:**
  - Tampilan kalender mingguan (Monday-Sunday, 07:00-18:00)
  - Event blocks dengan warna per kelas
  - Navigasi minggu (prev, next, today)
  - CRUD agenda (tambah, edit, hapus)
  - Multiple time slots per hari (max 3)
  - Duplikasi agenda ke minggu depan
  - Ekspor agenda ke Excel
  - AI-generated activity ideas (Gemini)
  - Flatpickr untuk pemilihan tanggal

#### F4: Absensi / Daftar Hadir
- **ID:** F-004
- **Deskripsi:** Pencatatan kehadiran siswa per kelas per tanggal
- **Kompleksitas:** High
- **Priority:** P0 (Critical)
- **Detail:**
  - Pilih kelas dan tanggal
  - 4 status kehadiran: Hadir (H), Sakit (S), Izin (I), Alfa (A)
  - Radio button style untuk setiap siswa
  - Ringkasan counter per status
  - Bulk "Semua Hadir"
  - Auto-save dengan debounce 5 detik
  - Batch writes ke database
  - Daftar siswa absen (S/I/A) untuk monitoring
  - Export ke Excel per rentang tanggal
  - Tambah siswa baru dari halaman absensi
  - Floating save button

#### F5: Penilaian Harian
- **ID:** F-005
- **Deskripsi:** Input nilai harian per BAB
- **Kompleksitas:** High
- **Priority:** P0 (Critical)
- **Detail:**
  - Filter kelas, semester (Ganjil/Genap), dan BAB (1-4)
  - Tabel input dengan kolom:
    - Pengetahuan (P1-P5 + Rata-rata)
    - Keterampilan (K1-K5 + Rata-rata)
    - Sikap (Jujur, Disiplin, Tanggung Jawab + Rata-rata)
  - Perhitungan otomatis rata-rata per BAB
  - Perhitungan otomatis rata-rata semester
  - View "Semua BAB" yang menampilkan ringkasan
  - Input keyboard navigation (arrow keys, tab, enter)
  - Auto-save dengan debounce
  - Export ke Excel
  - Floating save button

#### F6: Penilaian Semester
- **ID:** F-006
- **Deskripsi:** Penilaian akhir semester dengan perhitungan rapor
- **Kompleksitas:** High
- **Priority:** P0 (Critical)
- **Detail:**
  - Filter kelas dan semester
  - Kolom: Rata Harian, Rata Kehadiran, STS, SAS, Nilai Rapor
  - Perhitungan otomatis:
    - Rata Harian = (Pengetahuan + Keterampilan + Sikap) / 3
    - Rata Kehadiran = (Hadir / Total Hari Efektif) * 100
    - Nilai Rapor = (Harian * 0.5) + (STS * 0.1) + (SAS * 0.2) + (Kehadiran * 0.2)
  - Input STS dan SAS
  - Export ke Excel
  - Floating save button

#### F7: Data Siswa
- **ID:** F-007
- **Deskripsi:** Manajemen data lengkap siswa (Wali Kelas)
- **Kompleksitas:** Medium
- **Priority:** P1 (High)
- **Detail:**
  - Tabel dengan editable cells (contenteditable)
  - Field: NIS, Nama, Alamat, Tgl Lahir, Nama Ayah, Pekerjaan Ayah, Nama Ibu, Pekerjaan Ibu, No HP, Catatan
  - Inline editing dengan auto-save
  - Flatpickr untuk input tanggal lahir
  - Export ke Excel
  - Floating save button

#### F8: Tabungan Siswa
- **ID:** F-008
- **Deskripsi:** Manajemen tabungan siswa (khusus kelas 7-9)
- **Kompleksitas:** Medium
- **Priority:** P1 (High)
- **Detail:**
  - Ringkasan total saldo dan total setoran kas umum
  - Daftar siswa dengan saldo masing-masing
  - Riwayat transaksi per siswa (modal)
  - Tambah setoran (uang masuk)
  - Tarik saldo (uang keluar)
  - Tarik dari kas umum tabungan
  - Riwayat setor kas umum
  - Edit dan hapus transaksi
  - Export ke Excel
  - Floating action buttons (FAB)

#### F9: Materi Pembelajaran
- **ID:** F-009
- **Deskripsi:** Sharing link materi pembelajaran
- **Kompleksitas:** Low
- **Priority:** P2 (Medium)
- **Detail:**
  - Tambah judul dan URL materi
  - Daftar materi (urut berdasarkan waktu upload)
  - Hapus materi
  - Link terbuka di tab baru

#### F10: Pengaturan & Bobot Nilai
- **ID:** F-010
- **Deskripsi:** Halaman settings untuk manajemen data dan konfigurasi
- **Kompleksitas:** Medium
- **Priority:** P1
- **Detail:**
  - Card Template/Export/Import untuk tiap data (Siswa, Kalender, Materi)
  - Bobot Nilai: input 3 komponen (Harian, STS, SAS) dengan validasi total 100%
  - Tampilan Tahun Ajaran aktif (nama, semester, periode) — data dari API /academic-years
  - Backup & Restore: download JSON semua data user, upload file JSON untuk restore
  - Grade weights disimpan via `PUT /auth/grade-weights`, diambil via `GET /auth/grade-weights`
  - Backup endpoint: `GET /auth/backup` (return JSON), `POST /auth/restore` (upload JSON)

#### F11: Profile (Edit Akun)
- **ID:** F-011
- **Deskripsi:** Edit profil pengguna (nama, email, password)
- **Kompleksitas:** Low
- **Priority:** P2
- **Detail:**
  - Toggle edit mode untuk nama dan email
  - Verifikasi password saat ini sebelum perubahan
  - Update via `PUT /auth/me`

#### F12: Analisis Nilai
- **ID:** F-012
- **Deskripsi:** Dashboard analitik nilai siswa
- **Kompleksitas:** Medium
- **Priority:** P1
- **Detail:**
  - Filter kelas, semester, tahun ajaran, mata pelajaran
  - Summary cards: Total Siswa, KKM, Di Bawah KKM, Rata-rata Kelas
  - Rata-rata Kelas (6 komponen: Pengetahuan, Keterampilan, Sikap, STS, SAS, Total Rata-rata)
  - Ranking siswa (list ringkas tanpa progress bar)
  - Ranking table detail (rank, nama, pengetahuan, keterampilan, sikap, STS, SAS, rata-rata)
  - Deteksi siswa di bawah KKM (warna merah)
  - Data dari `GET /analytics`

#### F13: Kalender Pendidikan
- **ID:** F-010
- **Deskripsi:** Kalender akademik interaktif
- **Kompleksitas:** Medium
- **Priority:** P1 (High)
- **Detail:**
  - 13 bulan (Juli 2025 - Juli 2026)
  - Horizontal slider dengan snap scrolling
  - Event types dengan warna berbeda:
    - Libur Nasional (merah)
    - Awal Masuk Sekolah (hijau)
    - UTS (oranye)
    - Ujian Akhir (biru)
    - Bagi Rapor (abu-abu)
    - Libur Semester (kuning)
    - PSA Kelas 9 (amber)
  - Intersection Observer untuk update event list
  - Mobile dan desktop view
  - Acara mendatang di dashboard

#### F11: Search Siswa
- **ID:** F-011
- **Deskripsi:** Pencarian siswa global dari semua kelas
- **Kompleksitas:** Low
- **Priority:** P2 (Medium)
- **Detail:**
  - Search input di dashboard
  - Cari berdasarkan nama atau NIS
  - Min 3 karakter untuk trigger search
  - Max 5 hasil ditampilkan
  - Klik hasil untuk melihat detail siswa

#### F12: Detail Siswa
- **ID:** F-012
- **Deskripsi:** Modal detail lengkap siswa
- **Kompleksitas:** Medium
- **Priority:** P2 (Medium)
- **Detail:**
  - Informasi dasar (NIS, Nama, Kelas)
  - Tab semester (Ganjil/Genap)
  - Ringkasan nilai per semester
  - Ringkasan absensi per semester
  - AI-generated catatan rapor (Gemini)

### 7.2 Fitur Pendukung

#### F13: Notifikasi
- **ID:** F-013
- **Deskripsi:** Notifikasi agenda dan acara
- **Kompleksitas:** Low
- **Priority:** P2 (Medium)
- **Detail:**
  - Badge notifikasi di bell icon
  - Hitung agenda hari ini + acara mendatang
  - Slide-down panel untuk mobile
  - Modal untuk desktop

#### F14: Auto-Save
- **ID:** F-014
- **Deskripsi:** Penyimpanan data otomatis
- **Kompleksitas:** Medium
- **Priority:** P1 (High)
- **Detail:**
  - Debounce 5 detik setelah perubahan
  - Batch writes untuk performa
  - Save indicator (saving, saved, error)
  - Perubahan di-track per tipe data (grades, attendance, wali kelas, tabungan)

#### F15: Export Excel
- **ID:** F-015
- **Deskripsi:** Ekspor data ke format Excel
- **Kompleksitas:** Low
- **Priority:** P2 (Medium)
- **Detail:**
  - Export agenda (rentang tanggal)
  - Export absensi (kelas + rentang tanggal)
  - Export nilai harian (kelas + semester + BAB)
  - Export nilai semester (kelas + semester)
  - Export data wali kelas
  - Export tabungan (rentang tanggal)

#### F16: Keyboard Shortcuts
- **ID:** F-016
- **Deskripsi:** Shortcut keyboard untuk aksi cepat
- **Kompleksitas:** Low
- **Priority:** P3 (Low)
- **Detail:**
  - Ctrl+S: Simpan
  - Ctrl+N: Tambah baru (agenda/siswa tergantung page)
  - Ctrl+E: Ekspor
  - Escape: Tutup modal

#### F17: AI Integration (Gemini)
- **ID:** F-017
- **Deskripsi:** Integrasi AI untuk membantu guru
- **Kompleksitas:** Medium
- **Priority:** P2 (Medium)
- **Detail:**
  - Generate ide kegiatan pembelajaran
  - Generate catatan raport siswa
  - Menggunakan Gemini Pro API
  - Loading state saat generate

---

## 8. Halaman / Page Descriptions

### 8.0 Landing Page

**Route:** `/`
**Layout:** Full-width marketing page, no sidebar
**Auth:** Public (redirect ke /app jika sudah login)

**Komponen:**
- Sticky navbar (logo, Masuk, Daftar Gratis)
- Hero section (full-screen image dengan parallax, headline, CTA, badges)
- Stats strip (250+ sekolah, 5.000+ guru, dll)
- Features grid (2 kolom, card dengan foto thumbnail)
- CTA section (parallax image + tombol daftar)
- Footer (logo, copyright)

### 8.1 Login Page

**Route:** `/login`
**Layout:** Centered card, no sidebar
**Auth:** Public (no token required)

**Komponen:**
- Form login (email, password)
- Tombol submit
- Link ke halaman utama (jika sudah login)
- Error message handling
- Loading state
- Animasi transisi

**States:**
- **Loading:** Spinner saat submit
- **Empty:** Form kosong
- **Error:** Invalid credentials, network error, server error
- **Success:** Redirect ke dashboard

### 8.2 Dashboard

**Route:** `/app`
**Layout:** Main layout (sidebar + content)
**Auth:** Protected

**Komponen:**
- Greeting card (waktu-based)
- Search box
- Quote card
- Statistic cards (4 grid)
- Quick action buttons
- Attendance trend chart
- Today's agenda list
- Upcoming events list

**States:**
- **Loading:** Skeleton loading cards
- **Empty:** "Belum ada data" untuk list
- **Error:** Error boundary dengan retry
- **Refetch:** Pull-to-refresh atau auto-refetch

### 8.3 Agenda Page

**Route:** `/agenda`
**Layout:** Main layout
**Auth:** Protected

**Komponen:**
- Week calendar header
- Day headers (Mon-Sun)
- Time slots (07:00-18:00)
- Event blocks (colored by class)
- Navigation buttons (prev, next, today)
- Date picker
- CRUD modal
- Duplicate button
- Export button
- Kalender Pendidikan shortcut

**States:**
- **Loading:** Skeleton grid
- **Empty:** "Tidak ada agenda" untuk minggu kosong
- **Error:** Error message dengan retry
- **Modal:** Tambah/Edit/Hapus agenda

### 8.4 Absensi Page

**Route:** `/absensi`
**Layout:** Main layout
**Auth:** Protected

**Komponen:**
- Class selector
- Date input
- Export controls (desktop)
- Summary counters (H/S/I/A)
- Bulk action button
- Student attendance list
- Absent students panel (desktop)
- Floating save button
- Add student button

**States:**
- **Loading:** Student list skeleton
- **Empty:** "Tidak ada siswa" untuk kelas
- **Changed:** Save indicator saat ada perubahan
- **Saving:** Spinner di FAB
- **Error:** Error di list atau save

### 8.5 Nilai Harian Page

**Route:** `/nilai`
**Layout:** Main layout
**Auth:** Protected

**Komponen:**
- Filter grid (grid-cols-2): Kelas, Semester, Tahun Ajaran, Mata Pelajaran
- BAB chip buttons (1 baris: Semua BAB, BAB 1-4)
- Grade table with inputs
- Auto-calculated averages
- Floating save button
- Keyboard navigation
- Save indicator (saving/saved/error)

**States:**
- **Loading:** Table skeleton
- **Empty:** "Tidak ada siswa" atau grade belum diisi
- **Changed:** Cell highlight untuk perubahan
- **Saving:** Save indicator
- **Error:** Error fetch atau save

### 8.6 Penilaian Semester Page

**Route:** `/penilaian-semester`
**Layout:** Main layout
**Auth:** Protected

**Komponen:**
- Filter grid (grid-cols-2): Kelas, Mata Pelajaran, Semester, Tahun Ajaran
- Semester grade table (Nama, Rata Harian, Kehadiran, STS, SAS, Nilai Rapor)
- Input for STS and SAS
- Auto-calculated: Rata Harian, Nilai Rapor
- Floating save button
- Save indicator

**States:**
- **Loading:** Table skeleton
- **Empty:** No data message
- **Error:** Error message

### 8.7 Data Page

**Route:** `/data`
**Layout:** Main layout
**Auth:** Protected

**Content:**
- Editable table semua siswa di kelas yang dipilih (NIS, Nama, Alamat, Tgl Lahir, Ayah, Ibu, No HP, Catatan)
- Inline cell editing dengan tombol simpan batch
- Horizontal scroll pada mobile (NIS + Nama ikut scroll)
- Export/Import Excel
- Filter kelas

**States:**
- **Loading:** Table skeleton
- **Empty:** "Belum ada siswa" message
- **Error:** Error message

### 8.8 Kalender Pendidikan Page

**Route:** `/kalender`
**Layout:** Main layout
**Auth:** Protected

**Komponen:**
- Calendar grid (13 months: Juli - Juli)
- Day indicators with event color dots
- Legend warna di bawah section Acara
- Acara list per bulan (di bawah kalender)
- Template/Export/Import button (di bawah Acara)

**States:**
- **Loading:** Calendar skeleton
- **Empty:** "Tidak ada acara" per bulan
- **Error:** Error message

---

## 9. User Stories

### 9.1 Authentication

```
US-001: Sebagai guru, saya ingin login dengan email dan password
  agar saya dapat mengakses data siswa saya.

US-002: Sebagai guru, saya ingin sesi login saya bertahan
  agar saya tidak perlu login berulang kali dalam sehari.

US-003: Sebagai admin, saya ingin logout secara manual
  untuk keamanan saat menggunakan perangkat bersama.
```

### 9.2 Dashboard

```
US-004: Sebagai guru, saya ingin melihat ringkasan data di dashboard
  agar saya cepat mengetahui kondisi kelas hari ini.

US-005: Sebagai guru, saya ingin melihat grafik absensi
  agar saya bisa memonitor tren kehadiran siswa.

US-006: Sebagai guru, saya ingin mencari siswa dengan cepat
  untuk melihat detail nilai dan absensi mereka.

US-007: Sebagai guru, saya ingin melihat quote motivasi setiap hari
  untuk memulai pembelajaran dengan semangat positif.
```

### 9.3 Agenda

```
US-008: Sebagai guru, saya ingin melihat jadwal mengajar mingguan
  agar saya tahu kelas apa yang harus saya ajar.

US-009: Sebagai guru, saya ingin menambah jadwal baru
  untuk mencatat kegiatan pembelajaran.

US-010: Sebagai guru, saya ingin mengedit jadwal yang sudah ada
  jika ada perubahan kegiatan.

US-011: Sebagai guru, saya ingin menghapus jadwal
  jika kegiatan dibatalkan.

US-012: Sebagai guru, saya ingin menduplikasi jadwal ke minggu depan
  untuk menghemat waktu jika jadwalnya sama.

US-013: Sebagai guru, saya ingin mengekspor agenda ke Excel
  untuk laporan ke kepala sekolah.
```

### 9.4 Absensi

```
US-014: Sebagai guru, saya ingin mencatat kehadiran siswa per kelas
  untuk mendokumentasikan partisipasi siswa.

US-015: Sebagai guru, saya ingin melihat ringkasan kehadiran
  untuk mengetahui jumlah siswa yang hadir, sakit, izin, dan alfa.

US-016: Sebagai guru, saya ingin menandai semua siswa hadir
  untuk efisiensi waktu jika semua siswa hadir.

US-017: Sebagai guru, saya ingin menyimpan absensi secara otomatis
  agar data tidak hilang jika saya lupa menyimpan.

US-018: Sebagai guru, saya ingin mengekspor absensi ke Excel
  untuk rekapitulasi bulanan.
```

### 9.5 Penilaian

```
US-019: Sebagai guru, saya ingin input nilai harian per BAB
  untuk mencatat pencapaian pembelajaran siswa.

US-020: Sebagai guru, saya ingin nilai rata-rata dihitung otomatis
  agar saya tidak perlu menghitung manual.

US-021: Sebagai guru, saya ingin menilai sikap siswa
  untuk mencatat perkembangan karakter siswa.

US-022: Sebagai guru, saya ingin navigasi keyboard saat input nilai
  agar input lebih cepat dan efisien.

US-023: Sebagai guru, saya ingin nilai rapor dihitung otomatis
  berdasarkan formula yang sudah ditentukan.

US-024: Sebagai guru, saya ingin mengekspor nilai ke Excel
  untuk dokumentasi dan laporan.
```

### 9.6 Data Siswa

```
US-025: Sebagai wali kelas, saya ingin mengedit data siswa
  untuk memperbarui informasi kontak orang tua.

US-026: Sebagai wali kelas, saya ingin mengekspor data siswa
  untuk laporan kependudukan.
```

### 9.7 Tabungan

```
US-027: Sebagai wali kelas 7-9, saya ingin mencatat setoran tabungan
  untuk mengelola uang tabungan siswa.

US-028: Sebagai wali kelas, saya ingin melihat total saldo tabungan
  untuk mengetahui jumlah uang yang terkumpul.

US-029: Sebagai wali kelas, saya ingin menarik tabungan
  untuk disetorkan ke kas umum.

US-030: Sebagai wali kelas, saya ingin melihat riwayat transaksi
  untuk audit dan transparansi.
```

### 9.8 Kalender

```
US-031: Sebagai guru, saya ingin melihat kalender pendidikan
  untuk mengetahui jadwal libur dan ujian.

US-032: Sebagai guru, saya ingin acara ditandai dengan warna
  agar mudah membedakan jenis acara.
```

### 9.9 AI Integration

```
US-033: Sebagai guru, saya ingin AI membantu membuat ide kegiatan
  untuk variasi metode pembelajaran.

US-034: Sebagai guru, saya ingin AI membuat catatan rapor
  untuk menghemat waktu menulis komentar individual.
```

---

## 10. Database Schema

### 10.1 Entity Relationship Diagram (ERD)

```
┌────────────────┐     ┌──────────────────┐     ┌────────────────┐
│    users       │     │   students       │     │   attendance   │
├────────────────┤     ├──────────────────┤     ├────────────────┤
│ id (PK)        │◄─┐ │ id (PK)          │◄┐   │ id (PK)        │
│ email (uniq)   │  └─│ teacher_id (FK)  │ └───│ student_id (FK)│
│ password_hash  │    │ student_id (uniq)│     │ event_date     │
│ name           │    │ name             │     │ class          │
│ role           │    │ class            │     │ keterangan     │
│ teacher_classes│    │ address          │     │ teacher_id (FK)│
│ avatar_url     │    │ dob              │     │ created_at     │
│ created_at     │    │ father_name      │     └────────────────┘
└────────────────┘    │ father_job       │
                      │ mother_name      │     ┌────────────────┐
                      │ mother_job       │     │   grades       │
                      │ phone            │     ├────────────────┤
                      │ notes            │     │ id (PK)        │
                      │ created_at       │◄┐   │ student_id (FK)│
                      └──────────────────┘ └───│ teacher_id (FK)│
                                                │ semester       │
┌────────────────┐     ┌──────────────────┐     │ academic_year  │
│  activities    │     │   tabungan       │     │ bab_1 (jsonb)  │
├────────────────┤     ├──────────────────┤     │ bab_2 (jsonb)  │
│ id (PK)        │     │ id (PK)          │     │ bab_3 (jsonb)  │
│ teacher_id (FK)│     │ teacher_id (FK)  │     │ bab_4 (jsonb)  │
│ event_date     │     │ student_id (FK)  │     │ pengetahuan   │
│ class          │     │ tanggal          │     │ keterampilan  │
│ waktu_mulai    │     │ uang_masuk       │     │ sikap_jujur   │
│ waktu_selesai  │     │ uang_keluar      │     │ sikap_disiplin│
│ catatan        │     │ created_at       │     │ sikap_tgg_jwb │
│ created_at     │     └──────────────────┘     │ sts           │
└────────────────┘                              │ sas           │
                      ┌──────────────────┐     │ created_at    │
                      │ kas_umum_tabungan│     └────────────────┘
                      ├──────────────────┤
                      │ id (PK)          │     ┌────────────────┐
                      │ teacher_id (FK)  │     │   materi       │
                      │ tanggal          │     ├────────────────┤
                      │ jumlah           │     │ id (PK)        │
                      │ keterangan       │     │ teacher_id (FK)│
                      │ created_at       │     │ title          │
                      └──────────────────┘     │ url            │
                                                │ type           │
┌────────────────┐     ┌──────────────────┐     │ uploaded_at    │
│ calendar_events│     │   subjects       │     └────────────────┘
├────────────────┤     ├──────────────────┤
│ id (PK)        │     │ id (PK)          │     ┌────────────────┐
│ teacher_id (FK)│     │ name (uniq)      │     │ grade_weights  │
│ event_date     │     │ created_at       │     ├────────────────┤
│ jenis          │     └──────────────────┘     │ id (PK)        │
│ event_type     │                              │ teacher_id (FK)│
│ color_class    │     ┌──────────────────┐     │ bobot_harian   │
│ created_at     │     │  academic_years  │     │ bobot_sts      │
└────────────────┘     ├──────────────────┤     │ bobot_sas      │
                       │ id (PK)          │     │ created_at     │
┌────────────────┐     │ name (uniq)      │     │ updated_at     │
│  semesters     │     │ start_date       │     └────────────────┘
├────────────────┤     │ end_date         │
│ id (PK)        │     │ is_active        │     ┌────────────────┐
│ academic_year  │◄────│ created_at       │     │ notifications  │
│ name (Ganjil/  │     │ updated_at       │     ├────────────────┤
│      Genap)    │     └──────────────────┘     │ id (PK)        │
│ start_date     │                              │ teacher_id (FK)│
│ end_date       │                              │ title          │
└────────────────┘                              │ message        │
                                                │ is_read        │
                                                │ created_at     │
                                                └────────────────┘
```

### 10.2 Tables Definition

#### Table: users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email untuk login |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt hash |
| name | VARCHAR(100) | NOT NULL | Nama lengkap |
| role | VARCHAR(20) | DEFAULT 'guru' | Role: guru, admin |
| teacher_classes | TEXT[] | DEFAULT '{}' | Array kelas yang diajar |
| created_at | TIMESTAMP | DEFAULT NOW() | Waktu dibuat |
| updated_at | TIMESTAMP | DEFAULT NOW() | Waktu diupdate |

#### Table: students

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| teacher_id | INTEGER | FK -> users.id | Guru yang mengelola |
| student_id | VARCHAR(20) | NOT NULL | NIS (Nomor Induk Siswa) |
| name | VARCHAR(100) | NOT NULL | Nama lengkap |
| class | VARCHAR(10) | NOT NULL | Kelas (e.g., "7-6") |
| address | TEXT | | Alamat rumah |
| dob | DATE | | Tanggal lahir |
| father_name | VARCHAR(100) | | Nama ayah |
| father_job | VARCHAR(100) | | Pekerjaan ayah |
| mother_name | VARCHAR(100) | | Nama ibu |
| mother_job | VARCHAR(100) | | Pekerjaan ibu |
| phone | VARCHAR(20) | | No HP orang tua |
| notes | TEXT | | Catatan |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes:**
- UNIQUE (teacher_id, student_id)
- INDEX ON (teacher_id, class)
- INDEX ON (name)

#### Table: attendance

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| teacher_id | INTEGER | FK -> users.id | |
| student_id | VARCHAR(20) | NOT NULL | |
| event_date | DATE | NOT NULL | Tanggal |
| class | VARCHAR(10) | NOT NULL | |
| keterangan | CHAR(1) | NOT NULL | H/S/I/A |
| timestamp | TIMESTAMP | DEFAULT NOW() | |

**Indexes:**
- UNIQUE (teacher_id, student_id, event_date)
- INDEX ON (teacher_id, event_date, class)
- INDEX ON (teacher_id, event_date, keterangan)

#### Table: grades

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| teacher_id | INTEGER | FK -> users.id | |
| student_id | VARCHAR(20) | NOT NULL | |
| semester | VARCHAR(10) | NOT NULL | Ganjil/Genap |
| bab_1 | JSONB | DEFAULT '{}' | Nilai BAB 1 |
| bab_2 | JSONB | DEFAULT '{}' | Nilai BAB 2 |
| bab_3 | JSONB | DEFAULT '{}' | Nilai BAB 3 |
| bab_4 | JSONB | DEFAULT '{}' | Nilai BAB 4 |
| pengetahuan_rata | NUMERIC(5,2) | | Rata-rata pengetahuan |
| keterampilan_rata | NUMERIC(5,2) | | Rata-rata keterampilan |
| sikap_rata | NUMERIC(5,2) | | Rata-rata sikap |
| sikap_jujur | VARCHAR(20) | | Nilai sikap jujur |
| sikap_disiplin | VARCHAR(20) | | Nilai sikap disiplin |
| sikap_tgg_jawab | VARCHAR(20) | | Nilai tanggung jawab |
| sts | NUMERIC(5,2) | | Sumatif Tengah Semester |
| sas | NUMERIC(5,2) | | Sumatif Akhir Semester |
| timestamp | TIMESTAMP | DEFAULT NOW() | |

**Indexes:**
- UNIQUE (teacher_id, student_id, semester)

**JSONB Structure for bab_1..bab_4:**
```json
{
  "pengetahuan_1": 85,
  "pengetahuan_2": 90,
  "pengetahuan_3": 78,
  "pengetahuan_4": 88,
  "pengetahuan_5": 92,
  "keterampilan_1": 80,
  "keterampilan_2": 85,
  "keterampilan_3": 90,
  "keterampilan_4": 75,
  "keterampilan_5": 88,
  "pengetahuan_rata": 87,
  "keterampilan_rata": 84
}
```

#### Table: learning_activities

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| teacher_id | INTEGER | FK -> users.id | |
| event_date | DATE | NOT NULL | Tanggal kegiatan |
| class | VARCHAR(10) | NOT NULL | Kelas |
| waktu_mulai | TIME | NOT NULL | Jam mulai |
| waktu_selesai | TIME | NOT NULL | Jam selesai |
| catatan | TEXT | | Catatan kegiatan |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes:**
- INDEX ON (teacher_id, event_date)
- INDEX ON (teacher_id, event_date, class)

#### Table: tabungan

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| teacher_id | INTEGER | FK -> users.id | |
| student_id | VARCHAR(20) | NOT NULL | |
| tanggal | DATE | NOT NULL | Tanggal transaksi |
| uang_masuk | NUMERIC(12,2) | DEFAULT 0 | Setoran |
| uang_keluar | NUMERIC(12,2) | DEFAULT 0 | Penarikan |
| timestamp | TIMESTAMP | DEFAULT NOW() | |

**Indexes:**
- INDEX ON (teacher_id, student_id)
- INDEX ON (teacher_id, tanggal)

#### Table: kas_umum_tabungan

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| teacher_id | INTEGER | FK -> users.id | |
| tanggal | DATE | NOT NULL | Tanggal transaksi |
| jumlah | NUMERIC(12,2) | NOT NULL | Jumlah penarikan |
| keterangan | TEXT | | Alasan penarikan |
| timestamp | TIMESTAMP | DEFAULT NOW() | |

#### Table: materi

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| teacher_id | INTEGER | FK -> users.id | |
| title | VARCHAR(255) | NOT NULL | Judul materi |
| url | TEXT | NOT NULL | URL materi |
| type | VARCHAR(20) | DEFAULT 'link' | Tipe materi |
| uploaded_at | TIMESTAMP | DEFAULT NOW() | |

#### Table: subjects

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| name | VARCHAR(100) | NOT NULL UNIQUE | Nama mapel |
| created_at | TIMESTAMP | DEFAULT NOW() | |

#### Table: grade_weights

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| teacher_id | INTEGER | FK -> users.id, UNIQUE | Guru |
| bobot_harian | NUMERIC(5,2) | DEFAULT 0 | Bobot nilai harian (%) |
| bobot_sts | NUMERIC(5,2) | DEFAULT 0 | Bobot STS (%) |
| bobot_sas | NUMERIC(5,2) | DEFAULT 0 | Bobot SAS (%) |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Constraint:** bobot_harian + bobot_sts + bobot_sas = 100

#### Table: calendar_events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| event_date | DATE | NOT NULL | Tanggal acara |
| jenis | VARCHAR(100) | NOT NULL | Nama acara |
| event_type | VARCHAR(50) | NOT NULL | Tipe acara |
| color_class | VARCHAR(50) | | Warna display |
| is_global | BOOLEAN | DEFAULT true | Global untuk semua guru |

#### Table: academic_years

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| name | VARCHAR(20) | NOT NULL UNIQUE | e.g. "2025/2026" |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NOT NULL | |
| is_active | BOOLEAN | DEFAULT false | Year aktif |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

#### Table: semesters

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| academic_year_id | INTEGER | FK -> academic_years.id | Tahun ajaran |
| name | VARCHAR(10) | NOT NULL | Ganjil / Genap |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NOT NULL | |

---

## 11. API Endpoints

### 11.1 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/login | Login user | No |
| POST | /auth/register | Register user | No |
| POST | /auth/refresh | Refresh access token | No |
| POST | /auth/logout | Logout user | Yes |
| GET | /auth/me | Get current user | Yes |
| PUT | /auth/me | Update profile (name, email) | Yes |

**User-managed endpoints (via /auth prefix):**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /auth/grade-weights | Get grade weights | Yes |
| PUT | /auth/grade-weights | Save grade weights | Yes |
| GET | /auth/backup | Download all data as JSON | Yes |
| POST | /auth/restore | Upload JSON to restore | Yes |

**POST /auth/login**
```json
// Request
{ "email": "guru@example.com", "password": "password123" }

// Response 200
{
  "user": { "id": 1, "email": "guru@example.com", "name": "Siti Nurafifah", "role": "guru" },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}

// Response 401
{ "error": "Invalid email or password" }
```

### 11.2 Students

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /students | List all students | Yes |
| POST | /students | Create student | Yes |
| PUT | /students/:id | Update student | Yes |
| DELETE | /students/:id | Delete student | Yes |

**Query Parameters for GET /students:**
- `class` - Filter by class (e.g., "7-6")
- `search` - Search by name or NIS

### 11.3 Attendance

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /attendance | List attendance records | Yes |
| POST | /attendance/batch | Batch save attendance | Yes |
| GET | /attendance/summary | Get attendance summary | Yes |

**Query Parameters for GET /attendance:**
- `class` - Filter by class
- `event_date` - Filter by date
- `start_date` - Start date range
- `end_date` - End date range

**POST /attendance/batch**
```json
// Request
{
  "class": "7-6",
  "event_date": "2026-07-26",
  "records": [
    { "student_id": "1234", "name": "Ahmad", "keterangan": "H" },
    { "student_id": "1235", "name": "Budi", "keterangan": "S" }
  ]
}

// Response 200
{ "message": "Attendance saved successfully", "count": 2 }
```

**GET /attendance/summary**
```json
// Response 200
{
  "total": 32,
  "hadir": 28,
  "sakit": 2,
  "izin": 1,
  "alfa": 1,
  "persentase": 87.5
}
```

### 11.4 Grades

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /grades | List grades | Yes |
| POST | /grades/batch | Batch save grades | Yes |
| GET | /grades/semester | Get semester grades | Yes |

**Query Parameters for GET /grades:**
- `class` - Filter by class
- `semester` - Filter by semester (Ganjil/Genap)
- `bab` - Filter by BAB number
- `academic_year_id` - Filter by tahun ajaran

### 11.5 Learning Activities (Agenda)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /activities | List activities | Yes |
| GET | /activities/:id | Get activity by ID | Yes |
| POST | /activities | Create activity | Yes |
| PUT | /activities/:id | Update activity | Yes |
| DELETE | /activities/:id | Delete activity | Yes |
| POST | /activities/duplicate | Duplicate to next week | Yes |
| POST | /activities/batch | Batch create activities | Yes |

**Query Parameters for GET /activities:**
- `start_date` - Start date
- `end_date` - End date
- `class` - Filter by class

### 11.6 Tabungan

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /tabungan | List tabungan records | Yes |
| POST | /tabungan | Create tabungan record | Yes |
| PUT | /tabungan/:id | Update tabungan record | Yes |
| DELETE | /tabungan/:id | Delete tabungan record | Yes |
| GET | /tabungan/summary | Get tabungan summary | Yes |

### 11.7 Kas Umum Tabungan

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /kas-umum | List kas umum records | Yes |
| POST | /kas-umum | Create kas umum record | Yes |
| PUT | /kas-umum/:id | Update kas umum record | Yes |
| DELETE | /kas-umum/:id | Delete kas umum record | Yes |

### 11.8 Materi

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /materi | List all materi | Yes |
| POST | /materi | Create materi | Yes |
| DELETE | /materi/:id | Delete materi | Yes |

### 11.9 Dashboard & Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /dashboard/stats | Get dashboard statistics | Yes |
| GET | /dashboard/attendance-trend | Get attendance trend data | Yes |
| GET | /analytic | Get grade analytics data | Yes |

### 11.10 Academic Years & Semesters

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /academic-years | List academic years | Yes |
| POST | /academic-years | Create academic year | Admin |
| GET | /semesters | List semesters | Yes |

### 11.11 Subjects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /subjects | List subjects | Yes |
| POST | /subjects | Create subject | Admin |
| DELETE | /subjects/:id | Delete subject | Admin |

### 11.12 Calendar Events

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /calendar-events | List events | Yes |
| POST | /calendar-events | Create event | Yes |
| PUT | /calendar-events/:id | Update event | Yes |
| DELETE | /calendar-events/:id | Delete event | Yes |

### 11.13 Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /notifications | List notifications | Yes |
| POST | /notifications/register | Register push token | Yes |
| PUT | /notifications/:id/read | Mark as read | Yes |

### 11.14 Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /admin/users | List all users | Admin |
| GET | /admin/logs | View activity logs | Admin |
| GET | /admin/stats | Admin dashboard stats | Admin |

### 11.15 Search

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /search | Global search (students, classes) | Yes |

### 11.16 AI

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /ai/activity-ideas | Generate activity ideas | Yes |
| POST | /ai/rapor-note | Generate rapor note | Yes |

---

## 12. Authentication & Authorization

### 12.1 Authentication Strategy

- **Supabase Auth** manages user registration, login, and JWT tokens
- **JWT** dikirim via Authorization header: `Authorization: Bearer <token>`
- **Row Level Security (RLS)** on all tables for data isolation
- **Refresh tokens** handled automatically by Supabase client

### 12.2 Auth Flow

```
1. Login
   POST /auth/login
   Response: { user, accessToken, refreshToken }

2. API Request
   GET /students
   Authorization: Bearer <accessToken>

3. Token Expired
   Response 401

4. Refresh Token
   POST /auth/refresh
   Body: { refreshToken }
   Response: { accessToken, refreshToken }

5. Logout
   POST /auth/logout
   Body: { refreshToken }
   Server: Revoke refresh token
```

### 12.3 Token Payload

```typescript
// Access Token Payload
interface JwtPayload {
  userId: number;
  email: string;
  role: 'guru' | 'admin';
  iat: number;
  exp: number;
}

// Refresh Token
interface RefreshTokenPayload {
  userId: number;
  tokenId: string; // UUID untuk revocation
  iat: number;
  exp: number;
}
```

### 12.4 Frontend Auth Flow

1. Login form submit → POST /api/auth/login
2. Store tokens:
   - accessToken → memory (zustand/context state)
   - refreshToken → localStorage (with httpOnly cookie as alternative)
3. Axios interceptor:
   - Request: Attach Authorization header
   - Response 401: Try refresh, if fail → redirect to login
4. ProtectedRoute component checks auth state
5. On app mount: try refresh token to restore session

### 12.5 Authorization Rules

| Role | Can Access |
|------|------------|
| guru | Own data (by teacher_id) |
| admin | All data, manage users |

### 12.6 Security Measures

- Password hashing dengan bcrypt (salt rounds: 12)
- Rate limiting pada login endpoint (5 attempts per minute)
- CORS whitelist
- Helmet security headers
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping
- CSRF token untuk state-changing requests

---

## 13. UI/UX Guidelines

### 13.1 Design System

**Typography:**
- Font family: Poppins (headings), Inter (body)
- Scale: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px

**Color Palette:**

| Token | Hex | Usage |
|-------|-----|-------|
| primary | #4f46e5 | Buttons, links, active states |
| primary-dark | #4338ca | Hover states |
| secondary | #6366f1 | Accents |
| success | #10b981 | Hadir status, save success |
| warning | #f59e0b | Sakit status |
| error | #ef4444 | Alfa status, errors |
| info | #3b82f6 | Izin status, info messages |
| bg-primary | #ffffff | Card backgrounds |
| bg-secondary | #f8fafc | Page background |
| text-primary | #1e293b | Main text |
| text-secondary | #64748b | Secondary text |
| border | #e2e8f0 | Borders, dividers |

**Class Colors:**

| Class | Badge Color |
|-------|-------------|
| 7-6 | Red (#ef4444) |
| 7-7 | Blue (#3b82f6) |
| 7-8 | Green (#10b981) |
| 7-9 | Yellow (#ca8a04) |
| 7-10 | Purple (#8b5cf6) |

### 13.2 Component Library

- All components use Tailwind CSS utility classes
- Consistent border-radius: 12px untuk cards, 8px untuk buttons
- Shadows: sm untuk cards, lg untuk modals
- Transitions: 0.2s ease untuk hover effects, 0.3s cubic-bezier untuk modals

### 13.3 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Bottom navigation, slide-up modals |
| Desktop | >= 769px | Sidebar, centered modals |

### 13.4 Loading States

- Skeleton loading untuk initial page load
- Spinner (fa-spinner) untuk actions
- Overlay untuk page-level loading
- Toast notifications untuk success/error messages

### 13.5 Empty States

Setiap list/data display harus memiliki empty state:
- Icon + message yang informatif
- Call-to-action jika relevan (e.g., "Tambah Jadwal Pertama")

### 13.6 Error States

- Inline error messages di forms
- Error boundaries di page level
- Toast untuk API errors
- Retry button untuk failed loads

---

## 14. Responsive Design

### 14.1 Mobile Layout

```
┌──────────────────────┐
│ Header (sticky)      │
│ ┌──────────────────┐ │
│ │ Greeting + Date  │ │
│ └──────────────────┘ │
│                      │
│ Content              │
│ (scrollable)         │
│                      │
│                      │
│                      │
│                      │
├──────────────────────┤
│ Bottom Navigation    │
│ Home | Agenda | ...  │
└──────────────────────┘
```

### 14.2 Desktop Layout

```
┌─────────┬────────────────────────────┐
│         │ Header                     │
│         │ ┌───────┬────────────────┐ │
│ Sidebar │ │Breadcrumb│ User Info   │ │
│         │ └───────┴────────────────┘ │
│ Home    │                            │
│ Agenda  │ Content                    │
│ Absensi │ (scrollable)               │
│ Nilai   │                            │
│ Data    │                            │
│         │                            │
│         │                            │
└─────────┴────────────────────────────┘
```

### 14.3 Component Adaptations

| Component | Mobile | Desktop |
|-----------|--------|---------|
| Navigation | Bottom nav (5 items) | Sidebar (7 items) |
| Modal | Slide-up from bottom | Centered with overlay |
| Notification | Slide-down from top | Centered modal |
| Table | Horizontal scroll | Full width |
| Calendar | Full width slider | With side panel |
| Charts | Full width | Grid layout |
| FAB | Above bottom nav | Fixed position |

---

## 15. Charts & Visualisasi Data

### 15.1 Attendance Trend Chart

**Library:** ApexCharts via react-apexcharts

**Type:** Stacked Bar Chart

**Series:**
- Hadir (green, #10b981)
- Sakit (yellow, #f59e0b)
- Izin (blue, #3b82f6)
- Alfa (red, #ef4444)

**X-axis:** Dates (day-month format)

**Y-axis:** Number of students

**Features:**
- Zoom enabled
- Tooltip with details
- Date range filter (start date, end date)
- Class filter (all or specific class)
- Legend with click to toggle series

### 15.2 Dashboard Statistic Cards

**Type:** Icon + Number + Label

**Cards:**
1. Total Siswa - indigo icon
2. Kelas Aktif - green icon
3. Hadir Hari Ini - blue icon
4. Total Tabungan - purple icon

### 15.3 Future Charts (Roadmap)

- Pie chart: Perbandingan kehadiran per kelas
- Line chart: Tren nilai rata-rata per BAB
- Bar chart: Distribusi nilai per rentang

---

## 16. AI Integration

### 16.1 Gemini API Integration

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

**API Key:** Disimpan di environment variable (backend), bukan di frontend

### 16.2 Activity Ideas Generator

**Trigger:** Button "Dapatkan Ide Kegiatan" di modal tambah agenda

**Prompt Template:**
```
Berikan 3-5 ide kegiatan pembelajaran yang menarik dan sesuai
untuk siswa kelas {class} SMP pada tanggal {date}.
Berikan dalam format singkat dan praktis.
```

**Response:** Parsed dari Gemini response, ditampilkan di dalam modal

### 16.3 Rapor Note Generator

**Trigger:** Button "Buat Catatan" di modal detail siswa

**Prompt Template:**
```
Buatkan catatan rapor yang positif dan konstruktif untuk siswa
bernama {name} dengan data:
- Nilai Pengetahuan: {pRata}
- Nilai Keterampilan: {kRata}
- Nilai Sikap: {sRata}
...
```

**Response:** Text yang diisi ke textarea catatan rapor

---

## 17. Export & Import

### 17.1 Excel Export (XLSX)

**Library:** SheetJS (xlsx)

**Exportable Data:**

| Data | Format | Filter Options |
|------|--------|----------------|
| Agenda | .xlsx | Rentang tanggal |
| Absensi | .xlsx | Kelas + rentang tanggal |
| Nilai Harian | .xlsx | Kelas + semester + BAB |
| Nilai Semester | .xlsx | Kelas + semester |
| Data Siswa | .xlsx | Kelas (7-9) |
| Tabungan | .xlsx | Rentang tanggal |

### 17.2 Export Flow

1. User klik tombol export
2. Fetch data dari API (filtered)
3. Convert ke format Excel menggunakan XLSX.utils.json_to_sheet()
4. Generate file dan download via browser
5. Show success toast

### 17.3 Future: Import

- Import data siswa dari Excel (batch)
- Import nilai dari template Excel

---

## 18. Performance Requirements

### 18.1 Frontend Performance

| Metrik | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1 detik |
| Time to Interactive (TTI) | < 2 detik |
| Largest Contentful Paint (LCP) | < 2.5 detik |
| Cumulative Layout Shift (CLS) | < 0.1 |
| First Input Delay (FID) | < 100 ms |
| Bundle Size (initial) | < 200 KB gzipped |
| Lighthouse Score | > 90 |

### 18.2 Backend Performance

| Metrik | Target |
|--------|--------|
| API Response Time (p50) | < 100 ms |
| API Response Time (p95) | < 300 ms |
| API Response Time (p99) | < 1000 ms |
| Database Query Time | < 50 ms |
| Concurrent Users | > 50 |

### 18.3 Optimization Strategies

**Frontend:**
1. Code splitting per page (React.lazy + Suspense)
2. React Query caching with staleTime
3. Memoization (React.memo, useMemo, useCallback)
4. Virtual scrolling untuk tabel besar
5. Debounced search (300ms)
6. Debounced auto-save (5000ms)
7. Batch API calls
8. Image optimization (WebP format)

**Backend:**
1. Database indexing
2. Connection pooling
3. Pagination untuk list endpoints
4. JSONB untuk data fleksibel (grades per BAB)
5. Batch endpoints untuk multiple writes
6. Response compression (gzip)

---

## 19. Security Requirements

### 19.1 Authentication Security

- Password minimum 8 karakter dengan kombinasi huruf dan angka
- bcrypt hash dengan salt rounds 12
- JWT secret key minimum 256-bit
- Refresh token rotation (new refresh token setiap kali refresh)
- Token revocation on logout

### 19.2 API Security

- All API endpoints (except login/register) require JWT
- CORS whitelist untuk origin frontend
- Rate limiting: 100 requests per minute per user
- Request validation dengan Zod
- SQL injection prevention via parameterized queries
- Helmet middleware untuk security headers

### 19.3 Data Security

- All database queries use parameterized inputs
- teacher_id filter pada semua queries (row-level security)
- No sensitive data in URL parameters
- HTTPS only in production
- Environment variables untuk secrets

### 19.4 Frontend Security

- No API keys in frontend code (proxy via backend for AI)
- React's built-in XSS protection
- Content Security Policy headers
- Sanitized user input sebelum display

---

## 20. Testing Strategy

### 20.1 Testing Levels

| Level | Tools | Coverage |
|-------|-------|----------|
| Unit (Frontend) | Vitest + React Testing Library | 80% |
| Unit (Backend) | Jest + Supertest | 85% |
| Integration | Supertest (API) | 70% |
| E2E | Playwright | 50% (critical paths) |

### 20.2 Frontend Testing

- Component rendering tests
- User interaction tests (click, input, navigation)
- Hook tests (useAuth, useAutoSave)
- API mock tests (MSW - Mock Service Worker)
- Snapshot tests for stable components

### 20.3 Backend Testing

- Route handler tests
- Middleware tests (auth)
- Database query tests (testcontainers)
- Validation tests (Zod schemas)
- Error handling tests

### 20.4 Critical Test Scenarios

1. Login flow (success, invalid credentials, expired token)
2. Attendance save (single, batch, with existing records)
3. Grade calculation (per BAB, semester averages, rapor formula)
4. Agenda CRUD (create, update, delete, duplicate)
5. Tabungan transaction (setor, tarik, kas umum)
6. Export functionality (all data types)

---

## 21. Deployment Strategy

### 21.1 Environment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Production                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │ Vercel   │    │ Railway  │    │ Supabase/    │  │
│  │ (FE)     │◄──►│ (BE)     │◄──►│ Neon (DB)    │  │
│  │ appguru  │    │ api.app  │    │ postgresql   │  │
│  │ .vercel  │    │ .railway │    │ .supabase    │  │
│  │ .app     │    │ .app     │    │ .co          │  │
│  └──────────┘    └──────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 21.2 CI/CD Pipeline (GitHub Actions)

**Frontend Pipeline:**
1. Lint + Type check
2. Unit tests
3. Build (vite build)
4. Deploy ke Vercel

**Backend Pipeline:**
1. Lint + Type check
2. Unit tests
3. Build (tsc)
4. Deploy ke Railway/Render

### 21.3 Environment Variables

**Frontend (.env):**
```
VITE_API_URL=https://api.appguru.railway.app
VITE_APP_NAME=AppGuru
```

**Backend (.env):**
```
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/appguru
JWT_SECRET=super-secret-key-min-256-bit
JWT_REFRESH_SECRET=another-secret-key
GEMINI_API_KEY=AIzaSy...
CORS_ORIGIN=https://appguru.vercel.app
NODE_ENV=production
```

---

## 22. Monitoring & Analytics

### 22.1 Backend Monitoring

- **Logging:** morgan untuk HTTP logs, winston untuk application logs
- **Error Tracking:** Sentry integration
- **Performance:** Response time monitoring (custom middleware)
- **Uptime:** Supabase project health (monitored by Supabase)

### 22.2 Frontend Monitoring

- **Error Boundary:** Catches React errors, logs to console
- **Performance:** Lighthouse CI for regression testing
- **Analytics:** Google Analytics atau Plausible (privacy-friendly)

### 22.3 Database Monitoring

- Query performance (pg_stat_statements)
- Connection pool utilization
- Slow query logging (> 100ms)

---

## 23. Risiko & Mitigasi

| Risiko | Dampak | Probabilitas | Mitigasi |
|--------|--------|-------------|----------|
| Data loss saat migrasi | Critical | Medium | Backup Firebase data, migration script dengan dry-run |
| API rate limiting | High | Low | Implement retry with exponential backoff |
| JWT compromise | Critical | Low | Short expiry (15 min), refresh token rotation |
| Database connection leak | High | Low | Connection pool monitoring, proper pool.release() |
| Browser compatibility | Medium | Low | Target modern browsers (Chrome, Firefox, Edge) |
| Gemini API downtime | Medium | Medium | Graceful fallback, user notification |
| Large dataset performance | Medium | Medium | Pagination, virtual scrolling, database indexing |
| Concurrent edit conflicts | Medium | Medium | Last-write-wins strategy, optimistic updates |

---

## 24. Roadmap & Milestones

### Phase 1: Foundation (Week 1-2)
- ✅ Project structure setup (FE + BE)
- ✅ Database schema creation
- ✅ Authentication system
- ✅ Basic CRUD API endpoints
- ✅ Frontend login page
- ✅ Main layout (sidebar, bottom nav)

### Phase 2: Core Features (Week 3-4)
- Dashboard page with charts
- Agenda page with week calendar
- Attendance page with batch save
- Grade pages (harian + semester)

### Phase 3: Data Management (Week 5-6)
- Data siswa page (editable table)
- Tabungan page with transactions
- Materi page
- Kalender pendidikan page

### Phase 4: Enhancement (Week 7-8)
- AI integration (Gemini)
- Export to Excel
- Search functionality
- Keyboard shortcuts
- Performance optimization
- Testing

### Phase 5: Deployment (Week 9-10)
- CI/CD pipeline
- Production deployment
- Monitoring setup
- Documentation
- User training

---

## 25. Glossary

| Term | Definition |
|------|------------|
| BAB | Bagian atau unit pembelajaran dalam satu semester |
| NIS | Nomor Induk Siswa, ID unik untuk setiap siswa |
| STS | Sumatif Tengah Semester, penilaian di pertengahan semester |
| SAS | Sumatif Akhir Semester, penilaian di akhir semester |
| Rapor | Laporan hasil belajar siswa per semester |
| Wali kelas | Guru yang bertanggung jawab atas satu kelas tertentu |
| FAB | Floating Action Button, tombol aksi melayang |
| Debounce | Teknik untuk menunda eksekusi fungsi sampai jeda waktu tertentu |
| JWT | JSON Web Token, format token untuk autentikasi |
| JSONB | Binary JSON format di PostgreSQL untuk data semi-struktural |
| H/S/I/A | Hadir/Sakit/Izin/Alfa (status kehadiran) |
| Kas Umum | Uang tabungan yang sudah disetorkan ke bendahara sekolah |
| Gemini | Model AI dari Google untuk generate teks |
| ApexCharts | Library charting berbasis JavaScript |

---

## APPENDIX

### A. Perbandingan v1 vs v2

| Aspek | v1 (Lama) | v2 (Baru) |
|-------|-----------|-----------|
| Frontend | Vanilla JS + HTML templates | React + TypeScript |
| Styling | Tailwind CDN | Tailwind CLI + JIT |
| Backend | Firebase Firestore | Express + PostgreSQL |
| Bundler | None (CDN) | Vite |
| Auth | Firebase Auth | JWT Custom |
| State Management | Global variables | React Query + Context |
| Type Safety | None | TypeScript Strict |
| Database | NoSQL (Firestore) | SQL (PostgreSQL) |
| Repo | Single file | Dual repo (FE/BE) |
| Testing | None | Jest + RTL |
| Deployment | Manual | CI/CD |

### B. File Count Estimation

| Directory | Files | Lines per File | Total Lines |
|-----------|-------|----------------|-------------|
| prd.md | 1 | 1000+ | 1000+ |
| core.js | 1 | ~300 | 300 |
| fe/src/pages/ | 8 | ~300 each | 2400 |
| fe/src/components/ | 7 | ~100 each | 700 |
| fe/src/hooks/ | 3 | ~80 each | 240 |
| fe/src/context/ | 1 | ~150 | 150 |
| fe/src/api/ | 1 | ~100 | 100 |
| supabase/functions/ | 13 | ~200 | 200 |
| fe/src/types/ | 1 | ~150 | 150 |
| fe/config files | 5 | ~30 each | 150 |
| be/src/routes/ | 7 | ~150 each | 1050 |
| be/src/middleware/ | 1 | ~60 | 60 |
| be/src/db/ | 2 | ~50 each | 100 |
| be/src/types/ | 1 | ~100 | 100 |
| be/config files | 3 | ~20 each | 60 |
| **Total** | **41** | | **~6560+** |

### C. Referensi

1. React Documentation: https://react.dev
2. Vite Documentation: https://vitejs.dev
3. Tailwind CSS Documentation: https://tailwindcss.com
4. Express Documentation: https://expressjs.com
5. PostgreSQL Documentation: https://postgresql.org
6. ApexCharts Documentation: https://apexcharts.com
7. Firebase Documentation: https://firebase.google.com
8. Gemini API Documentation: https://ai.google.dev
9. React Query Documentation: https://tanstack.com/query
10. SheetJS Documentation: https://sheetjs.com

---

*Dokumen ini adalah PRD untuk aplikasi AppGuru v2.0.0. Semua spesifikasi dapat berubah sesuai kebutuhan pengembangan. Untuk pertanyaan atau saran, hubungi tim pengembang.*
