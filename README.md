# AppGuru v2.0

Aplikasi Manajemen Guru Modern berbasis React + TypeScript + PostgreSQL.

## Struktur Repository

```
appguru/
├── fe/          # Frontend (Vite + React + TypeScript + Tailwind)
├── be/          # Backend (Express + TypeScript + PostgreSQL)
├── core.js      # Shared library (client-side utilities)
├── prd.md       # Product Requirements Document
└── appguru.html # Aplikasi versi original (v1)
```

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (bundler)
- Tailwind CSS 3
- React Router 6
- TanStack React Query
- ApexCharts
- Axios + JWT Auth

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (neon/supabase)
- JWT Authentication (access + refresh token)
- Zod validation
- Helmet security

## Cara Menjalankan

### Backend
```bash
cd be
cp .env.example .env  # Edit konfigurasi database
npm install
npm run dev
```

### Frontend
```bash
cd fe
cp .env.example .env
npm install
npm run dev
```

## Fitur
- Login/Register dengan JWT
- Dashboard dengan grafik absensi
- Agenda mingguan
- Absensi (H/S/I/A)
- Penilaian Harian per BAB
- Penilaian Semester
- Data Siswa (Wali Kelas)
- Tabungan Siswa
- Materi Pembelajaran
- Kalender Pendidikan
- Export Excel
- AI Integration (Gemini)

Database schema: `be/src/db/schema.sql`
