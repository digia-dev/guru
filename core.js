class AppGuruCore {
  static TEACHER_CLASSES = ['7-6', '7-7', '7-8', '7-9', '7-10'];
  static ATTENDANCE_STATUS = { H: 'Hadir', S: 'Sakit', I: 'Izin', A: 'Alfa' };
  static SEMESTERS = ['Ganjil', 'Genap'];
  static BAB_COUNT = 4;
  static GRADE_FIELDS = { pengetahuan: [1, 2, 3, 4, 5], keterampilan: [1, 2, 3, 4, 5] };
  static SIKAP_FIELDS = ['sikap_jujur', 'sikap_disiplin', 'sikap_tgg_jawab'];
  static SIKAP_MAPPING = { 'Sangat Baik': 90, 'Baik': 80, 'Cukup': 70, 'Kurang': 60 };
  static RAPOR_WEIGHTS = { harian: 0.5, sts: 0.1, sas: 0.2, kehadiran: 0.2 };
  static DEBOUNCE_MS = 5000;
  static FIRESTORE_BATCH_LIMIT = 400;

  static getCurrentSemester() {
    const month = new Date().getMonth() + 1;
    return (month >= 7 || month <= 12) ? 'Ganjil' : 'Genap';
  }

  static getTodayDateString() {
    return new Date().toLocaleDateString('en-CA');
  }

  static getGreeting() {
    const hour = new Date().getHours();
    if (hour < 10) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }

  static calculateAverage(values) {
    const nums = values.filter(v => v != null && v !== '' && !isNaN(parseFloat(v))).map(Number);
    return nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
  }

  static calculateSikapAverage(jujur, disiplin, tanggungJawab) {
    const toNumeric = val => {
      const num = parseFloat(val);
      if (!isNaN(num)) return num;
      return this.SIKAP_MAPPING[val] || null;
    };
    const values = [jujur, disiplin, tanggungJawab].map(toNumeric).filter(v => v !== null);
    return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  }

  static calculateBabaverages(babData) {
    const result = { ...babData };
    for (const type of ['pengetahuan', 'keterampilan']) {
      const values = [1, 2, 3, 4, 5].map(i => result[`${type}_${i}`]);
      result[`${type}_rata`] = this.calculateAverage(values);
    }
    return result;
  }

  static calculateSemesterAverages(gradeData) {
    const data = { ...gradeData };
    const allBabPRata = [];
    const allBabKRata = [];
    for (let b = 1; b <= this.BAB_COUNT; b++) {
      const bab = data[`bab_${b}`];
      if (bab) {
        if (bab.pengetahuan_rata != null) allBabPRata.push(bab.pengetahuan_rata);
        if (bab.keterampilan_rata != null) allBabKRata.push(bab.keterampilan_rata);
      }
    }
    data.pengetahuan_rata = this.calculateAverage(allBabPRata);
    data.keterampilan_rata = this.calculateAverage(allBabKRata);
    data.sikap_rata = this.calculateSikapAverage(data.sikap_jujur, data.sikap_disiplin, data.sikap_tgg_jawab);
    return data;
  }

  static calculateAttendanceRate(summary) {
    const total = summary.H + summary.S + summary.I + summary.A;
    return total > 0 ? Math.round((summary.H / total) * 100) : 0;
  }

  static calculateNilaiRapor(nilaiHarian, sts, sas, rataKehadiran) {
    return Math.round(
      (nilaiHarian * this.RAPOR_WEIGHTS.harian) +
      (sts * this.RAPOR_WEIGHTS.sts) +
      (sas * this.RAPOR_WEIGHTS.sas) +
      (rataKehadiran * this.RAPOR_WEIGHTS.kehadiran)
    );
  }

  static calculateNilaiHarian(gradeData) {
    const p = gradeData.pengetahuan_rata || 0;
    const k = gradeData.keterampilan_rata || 0;
    const s = gradeData.sikap_rata || 0;
    return (p > 0 && k > 0 && s > 0) ? Math.round((p + k + s) / 3) : 0;
  }

  static formatCurrency(amount) {
    return `Rp ${(amount || 0).toLocaleString('id-ID')}`;
  }

  static formatDate(date, locale = 'id-ID') {
    if (typeof date === 'string') date = new Date(date + 'T00:00:00');
    return date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  static getDailyQuote() {
    const quotes = [
      { quote: 'Kagum padamu, bukan karena kau sempurna, tapi karena kau berani menjadi apa adanya.', author: 'Rendy Giantara' },
      { quote: 'Aku tidak jatuh cinta, aku tenggelam dalam dirimu.', author: 'Rendy Giantara' },
      { quote: 'Mencintaimu bukanlah sebuah pilihan, melainkan satu-satunya takdir yang tidak bisa kuhindari.', author: 'Rendy Giantara' },
      { quote: 'Kamu adalah rumah di mana jiwaku bisa melepaskan semua perjalanannya.', author: 'Rendy Giantara' },
      { quote: 'Aku adalah labirin yang tak pernah menemukan ujungnya. Dan kau, kau adalah jejak kakiku yang membuat labirin itu memiliki tujuannya.', author: 'Rendy Giantara' },
      { quote: 'Aku ingin mencintaimu dengan sederhana; dengan kata yang tak sempat diucapkan kayu kepada api yang menjadikannya abu.', author: 'Sapardi Djoko Damono' },
      { quote: 'The day I met you, my soul said, I am home.', author: 'Rumi' },
    ];
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    return quotes[dayOfYear % quotes.length];
  }

  static getClassColor(cls) {
    const colors = { '7-6': '#ef4444', '7-7': '#3b82f6', '7-8': '#10b981', '7-9': '#ca8a04', '7-10': '#8b5cf6' };
    return colors[cls] || '#6b7280';
  }

  static getStatusColor(status) {
    const colors = { H: 'bg-green-100 text-green-800', S: 'bg-yellow-100 text-yellow-800', I: 'bg-blue-100 text-blue-800', A: 'bg-red-100 text-red-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  static chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
    return chunks;
  }

  static getEventTypeColor(eventType) {
    const colors = {
      'libur-nasional': 'bg-red-100 text-red-800',
      'awal-sekolah': 'bg-green-100 text-green-800',
      'libur-semester': 'bg-yellow-100 text-yellow-800',
      'ujian-akhir': 'bg-blue-100 text-blue-800',
      'uts': 'bg-orange-100 text-orange-800',
      'libur-puasa-fitri': 'bg-cyan-100 text-cyan-800',
      'bagi-rapor': 'bg-gray-100 text-gray-800',
      'psa-kelas-9': 'bg-amber-100 text-amber-800'
    };
    return colors[eventType] || 'bg-gray-100 text-gray-800';
  }

  static debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  static validateStudentId(id) {
    return /^\d{4,20}$/.test(id);
  }

  static validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static validateGradeValue(val) {
    if (val === '' || val == null) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }

  static attendanceStatusSummary(records) {
    const counts = { H: 0, S: 0, I: 0, A: 0 };
    records.forEach(r => { if (counts.hasOwnProperty(r.keterangan)) counts[r.keterangan]++; });
    return counts;
  }

  static getAcademicYearMonths() {
    const months = [];
    for (let i = 0; i < 13; i++) {
      months.push(new Date(2025, 6 + i, 1));
    }
    return months;
  }

  static getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setDate(d.getDate() + 6);
    return { start: d, end };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppGuruCore;
}
