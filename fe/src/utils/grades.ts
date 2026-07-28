const SIKAP_MAPPING: Record<string, number> = {
  'Sangat Baik': 90, 'Baik': 80, 'Cukup': 70, 'Kurang': 60,
};

function nilaiKeAngka(val: any): number | null {
  if (val == null || val === '') return null;
  const num = parseFloat(val);
  if (!isNaN(num)) return num;
  return SIKAP_MAPPING[val] ?? null;
}

function rata(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v != null && !isNaN(v));
  return nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}

export function hitungBabRata(babData: any, type: 'pengetahuan' | 'keterampilan') {
  const val = [1, 2, 3, 4, 5].map(i => nilaiKeAngka(babData?.[`${type}_${i}`]));
  return rata(val);
}

export function hitungSikapRata(jujur: any, disiplin: any, tgg: any) {
  return rata([nilaiKeAngka(jujur), nilaiKeAngka(disiplin), nilaiKeAngka(tgg)]);
}

export function hitungOverallRata(gradeData: any, changes: Map<string, any>, studentId: string) {
  const pRatas: number[] = [];
  const kRatas: number[] = [];
  for (let b = 1; b <= 4; b++) {
    const babData = gradeData?.[`bab_${b}`] || {};
    const change = changes.get(studentId)?.[`bab_${b}`];
    const merged = { ...babData, ...change };
    const p = hitungBabRata(merged, 'pengetahuan');
    const k = hitungBabRata(merged, 'keterampilan');
    if (p != null) pRatas.push(p);
    if (k != null) kRatas.push(k);
  }
  return { pengetahuan_rata: rata(pRatas), keterampilan_rata: rata(kRatas) };
}

export function ambilNilai(gradeMap: Map<string, any>, changes: Map<string, any>, studentId: string, field: string) {
  const c = changes.get(studentId);
  if (c && c[field] !== undefined) return c[field];
  return (gradeMap.get(studentId) as any)?.[field] ?? '';
}
