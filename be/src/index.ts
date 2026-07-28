import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import attendanceRoutes from './routes/attendance';
import gradesRoutes from './routes/grades';
import agendaRoutes from './routes/agenda';
import tabunganRoutes from './routes/tabungan';
import kasUmumRoutes from './routes/kasUmum';
import materiRoutes from './routes/materi';
import dashboardRoutes from './routes/dashboard';
import classesRoutes from './routes/classes';
import semestersRoutes from './routes/semesters';
import calendarEventsRoutes from './routes/calendarEvents';
import aiRoutes from './routes/ai';
import notificationsRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import academicYearsRoutes from './routes/academicYears';
import logsRoutes from './routes/logs';
import subjectsRoutes from './routes/subjects';
import importRoutes from './routes/import';
import searchRoutes from './routes/search';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'AppGuru API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/activities', agendaRoutes);
app.use('/api/tabungan', tabunganRoutes);
app.use('/api/kas-umum', kasUmumRoutes);
app.use('/api/materi', materiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/semesters', semestersRoutes);
app.use('/api/calendar-events', calendarEventsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic-years', academicYearsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/search', searchRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AppGuru BE running on http://localhost:${PORT}`);
});

export default app;
