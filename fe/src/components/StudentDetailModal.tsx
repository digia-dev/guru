import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { DesktopModal, MobileModal } from './Modal';

function StudentSummaryAI({ student, grade, attendance, tabungan }: { student: { id: number; name: string; class: string }; grade: any; attendance: { hadir: number; sakit: number; izin: number; alfa: number; total: number }; tabungan?: number }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setSummary('');
    try {
      const { data } = await apiClient.post('/ai/student-summary', {
        studentId: student.id,
        name: student.name,
        class: student.class,
        pRata: grade?.pengetahuan_rata ?? null,
        kRata: grade?.keterampilan_rata ?? null,
        sRata: grade?.sikap_rata ?? null,
        hadir: attendance.hadir,
        sakit: attendance.sakit,
        izin: attendance.izin,
        alfa: attendance.alfa,
        totalHadir: attendance.total,
        tabungan: tabungan ?? 0,
      });
      setSummary(data.data);
    } catch {
      toast.error('Gagal membuat ringkasan');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={loading}
        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
        {loading ? 'Meminta AI...' : 'Buat Ringkasan'}
      </button>
      {summary && (
        <div className="w-full bg-white border rounded-lg px-3 py-2.5 text-sm mt-2 text-gray-700 leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  );
}

function CatatanRaporAI({ studentName, grade, attendance }: { studentName: string; grade: any; attendance: { hadir: number; total: number } }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setNote('');
    try {
      const { data } = await apiClient.post('/ai/rapor-note', {
        name: studentName,
        pRata: grade?.pengetahuan_rata ?? null,
        kRata: grade?.keterampilan_rata ?? null,
        sRata: grade?.sikap_rata ?? null,
        hadir: attendance.hadir,
        totalHadir: attendance.total,
      });
      setNote(data.data);
    } catch {
      toast.error('Gagal membuat catatan rapor');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={loading}
        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
        {loading ? 'Meminta AI...' : 'Buat Catatan Rapor'}
      </button>
      {note && (
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      )}
    </div>
  );
}

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
}

interface SemesterData {
  semester: string;
  is_active: boolean;
  grade: any | null;
  attendance: { hadir: number; sakit: number; izin: number; alfa: number; total: number };
}

export default function StudentDetailModal({ isOpen, onClose, studentId }: StudentDetailModalProps) {
  const [activeSemester, setActiveSemester] = useState('Ganjil');

  const { data: detail, isFetching } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/students/${studentId}/detail`);
      return data.data as { student: any; semesters: SemesterData[] };
    },
    enabled: isOpen && !!studentId,
  });

  const student = detail?.student;
  const semesters = detail?.semesters || [];
  const activeSem = semesters.find((s) => s.semester === activeSemester);

  const renderContent = () => {
    if (isFetching) {
      return (
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-3xl text-indigo-500 mb-2"></i>
          <p className="text-gray-500">Memuat data siswa...</p>
        </div>
      );
    }

    if (!student) {
      return <p className="text-center text-gray-500 py-8">Siswa tidak ditemukan.</p>;
    }

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl">
          <h3 className="text-xl font-bold">{student.name}</h3>
          <div className="flex gap-4 mt-2 text-sm">
            <span><i className="fas fa-id-card mr-1"></i>NIS: {student.student_id}</span>
            <span><i className="fas fa-school mr-1"></i>Kelas: {student.class}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {semesters.map((s) => (
            <button
              key={s.semester}
              onClick={() => setActiveSemester(s.semester)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeSemester === s.semester
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semester {s.semester}
              {s.is_active && <span className="ml-1 text-[10px]">(Aktif)</span>}
            </button>
          ))}
        </div>

        {activeSem && (
          <>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                <i className="fas fa-star text-yellow-500"></i>Nilai
              </h4>
              {activeSem.grade ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600">Pengetahuan</p>
                    <p className="text-lg font-bold text-blue-700">{activeSem.grade.pengetahuan_rata ?? '-'}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600">Keterampilan</p>
                    <p className="text-lg font-bold text-green-700">{activeSem.grade.keterampilan_rata ?? '-'}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600">Sikap</p>
                    <p className="text-lg font-bold text-purple-700">{activeSem.grade.sikap_rata ?? '-'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Belum ada nilai.</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                <i className="fas fa-user-check text-blue-500"></i>Kehadiran
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-green-50 p-2 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{activeSem.attendance.hadir}</p>
                  <p className="text-xs text-green-600">Hadir</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded-lg">
                  <p className="text-lg font-bold text-yellow-600">{activeSem.attendance.sakit}</p>
                  <p className="text-xs text-yellow-600">Sakit</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{activeSem.attendance.izin}</p>
                  <p className="text-xs text-blue-600">Izin</p>
                </div>
                <div className="bg-red-50 p-2 rounded-lg">
                  <p className="text-lg font-bold text-red-600">{activeSem.attendance.alfa}</p>
                  <p className="text-xs text-red-600">Alfa</p>
                </div>
              </div>
              {activeSem.attendance.total > 0 && (
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Kehadiran: {Math.round((activeSem.attendance.hadir / activeSem.attendance.total) * 100)}%
                </p>
              )}
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl">
              <h4 className="font-semibold text-sm text-indigo-700 mb-2 flex items-center gap-2">
                <i className="fas fa-robot"></i>Ringkasan Siswa (AI)
              </h4>
              <StudentSummaryAI
                student={{ id: student.id, name: student.name, class: student.class }}
                grade={activeSem.grade}
                attendance={activeSem.attendance}
                tabungan={student.tabungan_saldo}
              />
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl">
              <h4 className="font-semibold text-sm text-indigo-700 mb-2 flex items-center gap-2">
                <i className="fas fa-magic"></i>Catatan Rapor (AI)
              </h4>
              <CatatanRaporAI
                studentName={student.name}
                grade={activeSem.grade}
                attendance={activeSem.attendance}
              />
            </div>
          </>
        )}

        {student && (
          <div className="text-xs text-gray-400 pt-2 border-t">
            {student.address && <p><span className="font-medium">Alamat:</span> {student.address}</p>}
            {student.father_name && <p><span className="font-medium">Ayah:</span> {student.father_name}</p>}
            {student.mother_name && <p><span className="font-medium">Ibu:</span> {student.mother_name}</p>}
            {student.phone && <p><span className="font-medium">No HP:</span> {student.phone}</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <DesktopModal isOpen={isOpen} onClose={onClose} title="Detail Siswa">
        {renderContent()}
      </DesktopModal>
      <MobileModal isOpen={isOpen} onClose={onClose} title="Detail Siswa">
        {renderContent()}
      </MobileModal>
    </>
  );
}
