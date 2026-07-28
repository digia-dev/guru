# PRD: AppGuru - Aplikasi Manajemen Guru (Versi Modern)

**Dokumen:** Product Requirements Document (PRD)
**Versi:** 2.0.0
**Tanggal:** 2026-07-26
**Penulis:** Tim Pengembang AppGuru
**Status:** Final

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
│                          │ HTTP/HTTPS                    │
│                          │ JWT Bearer Token              │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│                Backend (be/)                             │
│  Node.js + Express + TypeScript                          │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ Auth         │ │ API Routes   │ │ Middleware      │  │
│  │ (JWT)        │ │ (RESTful)    │ │ (Auth, Logging) │  │
│  └──────────────┘ └──────────────┘ └────────────────┘  │
│                          │                               │
│                    ┌─────┴─────┐                        │
│                    │ PostgreSQL │                        │
│                    └───────────┘                        │
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
│   │   └── AuthContext.tsx    # JWT auth context provider
│   ├── hooks/
│   │   ├── useAuth.ts        # Auth hook
│   │   ├── useCache.ts       # Local cache hook
│   │   └── useAutoSave.ts    # Debounced auto-save hook
│   ├── components/
│   │   ├── Layout.tsx        # Main layout (sidebar + content)
│   │   ├── Sidebar.tsx       # Desktop sidebar navigation
│   │   ├── BottomNav.tsx     # Mobile bottom navigation
│   │   ├── FloatingSaveBtn.tsx
│   │   ├── Modal.tsx         # Reusable modal component
│   │   ├── QuoteCard.tsx     # Daily quote card
│   │   ├── ProtectedRoute.tsx
│   │   └── charts/
│   │       ├── index.ts      # Chart exports
│   │       └── AttendanceChart.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Agenda.tsx
│   │   ├── Absensi.tsx
│   │   ├── Nilai.tsx
│   │   ├── PenilaianSemester.tsx
│   │   ├── Data.tsx
│   │   └── KalenderPendidikan.tsx
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
be/
├── src/
│   ├── index.ts              # Entry point (Express app)
│   ├── db/
│   │   ├── pool.ts           # PostgreSQL connection pool
│   │   └── schema.sql        # Complete database schema
│   ├── middleware/
│   │   └── auth.ts           # JWT verification middleware
│   ├── routes/
│   │   ├── auth.ts           # Login, register, refresh token
│   │   ├── students.ts       # CRUD students
│   │   ├── attendance.ts     # CRUD attendance
│   │   ├── grades.ts         # CRUD grades
│   │   ├── agenda.ts         # CRUD learning activities
│   │   ├── tabungan.ts       # CRUD tabungan + kas umum
│   │   └── materi.ts         # CRUD materi links
│   └── types/
│       └── index.ts          # Shared TypeScript interfaces
├── package.json
├── tsconfig.json
├── .env.example
└── .eslintrc.json
```

### 5.4 Dual Repository Strategy

```
appguru/
├── fe/                    # Frontend repository
│   ├── package.json       # React dependencies
│   ├── vite.config.ts     # Vite configuration
│   ├── ...
│   └── .git
│
├── be/                    # Backend repository
│   ├── package.json       # Express dependencies
│   ├── tsconfig.json      # TypeScript configuration
│   ├── ...
│   └── .git
│
├── core.js                # Shared utility (client-side)
├── prd.md                 # This document
├── appguru.html           # Original v1 file
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
| clsx | ^2.1 | Classname utility |

### 6.2 Backend Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Node.js | ^20.11 | Runtime |
| Express | ^4.19 | Web Framework |
| TypeScript | ^5.4 | Type Safety |
| pg (node-postgres) | ^8.12 | PostgreSQL Driver |
| jsonwebtoken | ^9.0 | JWT Generation & Verification |
| bcryptjs | ^2.4 | Password Hashing |
| zod | ^3.22 | Request Validation |
| cors | ^2.8 | CORS Middleware |
| helmet | ^7.1 | Security Headers |
| morgan | ^1.10 | HTTP Logging |
| dotenv | ^16.4 | Environment Variables |
| tsx | ^4.7 | TypeScript Execution |
| jest | ^29.7 | Testing |
| supertest | ^6.3 | HTTP Testing |

### 6.3 Database Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| PostgreSQL | ^16 | Relational Database |
| pgAdmin | ^8 | Database Management |
| Supabase | ^2 | Hosted PostgreSQL + Auth |

### 6.4 DevOps Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Docker | ^25 | Containerization |
| GitHub Actions | - | CI/CD Pipeline |
| Vercel | - | Frontend Hosting |
| Railway / Render | - | Backend Hosting |
| Neon / Supabase | - | PostgreSQL Hosting |

---

## 7. Fitur-Fitur

### 7.1 Fitur Inti (MVP)

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

#### F10: Kalender Pendidikan
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

**Route:** `/`
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
- Class filter
- Semester filter
- BAB filter chips
- Export button
- Grade table with inputs
- Auto-calculated averages
- Floating save button
- Keyboard navigation

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
- Class filter
- Semester filter
- Export button
- Semester grade table
- Input for STS and SAS
- Auto-calculated values
- Floating save button

**States:**
- **Loading:** Table skeleton
- **Empty:** No data message
- **Error:** Error message

### 8.7 Data Page

**Route:** `/data`
**Layout:** Main layout
**Auth:** Protected

**Sub-pages (tabs):**
1. **Data Siswa (Wali Kelas):** Editable table, export
2. **Tabungan Siswa:** Summary, list, FAB actions
3. **Materi:** Add form, list with delete

**States per tab:**
- **Loading:** Tab content skeleton
- **Empty:** "Belum ada data" message
- **Error:** Error message per tab

### 8.8 Kalender Pendidikan Page

**Route:** `/kalender`
**Layout:** Main layout
**Auth:** Protected

**Komponen:**
- Calendar slider (13 months)
- Day indicators with event colors
- Event legend
- Event list (desktop, synced via Intersection Observer)
- Navigation arrows (desktop)
- Mobile event list per month

**States:**
- **Loading:** Calendar skeleton
- **Empty:** "Tidak ada acara" per bulan
- **Error:** Error message
- **Scroll:** Optimistic UI untuk slider

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
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   users     │     │   students       │     │  attendance  │
├─────────────┤     ├──────────────────┤     ├──────────────┤
│ id (PK)     │◄──┐ │ id (PK)          │◄┐   │ id (PK)      │
│ email       │    └─│ teacher_id (FK)  │ └───│ student_id   │
│ password    │      │ student_id (uniq)│     │ event_date   │
│ name        │      │ name             │     │ class        │
│ role        │      │ class            │     │ keterangan   │
│ created_at  │      │ address          │     │ teacher_id   │
└─────────────┘      │ dob              │     │ timestamp    │
                     │ father_name      │     └──────────────┘
                     │ father_job       │
                     │ mother_name      │     ┌──────────────┐
                     │ mother_job       │     │   grades     │
                     │ phone            │     ├──────────────┤
                     │ notes            │     │ id (PK)      │
                     │ created_at       │◄┐   │ student_id   │
                     └──────────────────┘ └───│ teacher_id   │
                                              │ semester     │
┌─────────────┐     ┌──────────────────┐     │ bab_1 (jsonb)│
│ activities  │     │   tabungan       │     │ bab_2 (jsonb)│
├─────────────┤     ├──────────────────┤     │ bab_3 (jsonb)│
│ id (PK)     │     │ id (PK)          │     │ bab_4 (jsonb)│
│ teacher_id  │     │ student_id       │     │ pengetahuan  │
│ event_date  │     │ tanggal          │     │ keterampilan │
│ class       │     │ uang_masuk       │     │ sikap_jujur  │
│ waktu_mulai │     │ uang_keluar      │     │ sikap_disiplin│
│ waktu_selesai│     │ teacher_id       │     │ sikap_tgg_jwb│
│ catatan     │     │ timestamp        │     │ sts          │
│ created_at  │     └──────────────────┘     │ sas          │
└─────────────┘                              │ timestamp    │
                    ┌──────────────────┐     └──────────────┘
                    │ kas_umum_tabungan│
                    ├──────────────────┤     ┌──────────────┐
                    │ id (PK)          │     │   materi     │
                    │ teacher_id       │     ├──────────────┤
                    │ tanggal          │     │ id (PK)      │
                    │ jumlah           │     │ teacher_id   │
                    │ keterangan       │     │ title        │
                    │ timestamp        │     │ url          │
                    └──────────────────┘     │ type         │
                                             │ uploaded_at  │
                    ┌──────────────────┐     └──────────────┘
                    │ calendar_events  │
                    ├──────────────────┤
                    │ id (PK)          │
                    │ event_date       │
                    │ jenis            │
                    │ event_type       │
                    │ color_class      │
                    └──────────────────┘
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

#### Table: calendar_events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| event_date | DATE | NOT NULL | Tanggal acara |
| jenis | VARCHAR(100) | NOT NULL | Nama acara |
| event_type | VARCHAR(50) | NOT NULL | Tipe acara |
| color_class | VARCHAR(50) | | Warna display |
| is_global | BOOLEAN | DEFAULT true | Global untuk semua guru |

---

## 11. API Endpoints

### 11.1 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | Login user | No |
| POST | /api/auth/register | Register user | No |
| POST | /api/auth/refresh | Refresh access token | No |
| POST | /api/auth/logout | Logout user | Yes |
| GET | /api/auth/me | Get current user | Yes |

**POST /api/auth/login**
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
| GET | /api/students | List all students | Yes |
| GET | /api/students/:id | Get student by ID | Yes |
| POST | /api/students | Create student | Yes |
| PUT | /api/students/:id | Update student | Yes |
| DELETE | /api/students/:id | Delete student | Yes |

**Query Parameters for GET /api/students:**
- `class` - Filter by class (e.g., "7-6")
- `search` - Search by name or NIS

### 11.3 Attendance

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/attendance | List attendance records | Yes |
| POST | /api/attendance/batch | Batch save attendance | Yes |
| GET | /api/attendance/summary | Get attendance summary | Yes |

**Query Parameters for GET /api/attendance:**
- `class` - Filter by class
- `event_date` - Filter by date
- `start_date` - Start date range
- `end_date` - End date range

**POST /api/attendance/batch**
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

**GET /api/attendance/summary**
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
| GET | /api/grades | List grades | Yes |
| POST | /api/grades/batch | Batch save grades | Yes |
| GET | /api/grades/semester | Get semester grades | Yes |

**Query Parameters for GET /api/grades:**
- `class` - Filter by class
- `semester` - Filter by semester (Ganjil/Genap)
- `bab` - Filter by BAB number

### 11.5 Learning Activities (Agenda)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/activities | List activities | Yes |
| GET | /api/activities/:id | Get activity by ID | Yes |
| POST | /api/activities | Create activity | Yes |
| PUT | /api/activities/:id | Update activity | Yes |
| DELETE | /api/activities/:id | Delete activity | Yes |
| POST | /api/activities/duplicate | Duplicate to next week | Yes |
| POST | /api/activities/batch | Batch create activities | Yes |

**Query Parameters for GET /api/activities:**
- `start_date` - Start date
- `end_date` - End date
- `class` - Filter by class

### 11.6 Tabungan

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/tabungan | List tabungan records | Yes |
| POST | /api/tabungan | Create tabungan record | Yes |
| PUT | /api/tabungan/:id | Update tabungan record | Yes |
| DELETE | /api/tabungan/:id | Delete tabungan record | Yes |
| GET | /api/tabungan/summary | Get tabungan summary | Yes |

### 11.7 Kas Umum Tabungan

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/kas-umum | List kas umum records | Yes |
| POST | /api/kas-umum | Create kas umum record | Yes |
| PUT | /api/kas-umum/:id | Update kas umum record | Yes |
| DELETE | /api/kas-umum/:id | Delete kas umum record | Yes |

### 11.8 Materi

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/materi | List all materi | Yes |
| POST | /api/materi | Create materi | Yes |
| DELETE | /api/materi/:id | Delete materi | Yes |

### 11.9 Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/dashboard/stats | Get dashboard statistics | Yes |
| GET | /api/dashboard/attendance-trend | Get attendance trend data | Yes |

### 11.10 AI

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/ai/activity-ideas | Generate activity ideas | Yes |
| POST | /api/ai/rapor-note | Generate rapor note | Yes |

---

## 12. Authentication & Authorization

### 12.1 JWT Strategy

- **Access Token:** 15 menit expiry, dikirim via Authorization header
- **Refresh Token:** 7 hari expiry, disimpan di httpOnly cookie
- **Algorithm:** HS256 dengan secret key dari environment

### 12.2 Token Flow

```
1. Login
   POST /api/auth/login
   Response: { accessToken, refreshToken, user }

2. API Request
   GET /api/students
   Authorization: Bearer <accessToken>

3. Token Expired
   Response 401: { error: "Token expired" }

4. Refresh Token
   POST /api/auth/refresh
   Body: { refreshToken: "..." }
   Response: { accessToken, refreshToken }

5. Logout
   POST /api/auth/logout
   Body: { refreshToken: "..." }
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
- **Uptime:** Health check endpoint (/api/health)

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
