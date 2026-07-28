import { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

interface AttendanceChartProps {
  series: { name: string; data: number[]; color: string }[];
  categories: string[];
}

export default function AttendanceChart({ series, categories }: AttendanceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const inst = useRef<ApexCharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    if (inst.current) {
      inst.current.updateOptions({
        series,
        xaxis: { categories },
      }, false, false);
      return;
    }

    const options = {
      series,
      chart: {
        type: 'bar',
        height: 280,
        stacked: true,
        toolbar: { show: false },
        zoom: { enabled: false },
        parentHeightOffset: 0,
        animations: { enabled: false },
      },
      plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 0 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { categories, labels: { style: { colors: '#64748b', fontSize: '11px' } } },
      yaxis: { title: { text: 'Jumlah Siswa' }, labels: { style: { colors: '#64748b', fontSize: '11px' } } },
      fill: { opacity: 1 },
      legend: { position: 'top', horizontalAlign: 'left', labels: { colors: '#1e293b', useSeriesColors: false } },
      grid: { borderColor: '#e2e8f0' },
      tooltip: { shared: true, intersect: false },
    };

    const chart = new ApexCharts(el, options);
    inst.current = chart;
    chart.render();

    return () => {
      if (inst.current) {
        try { inst.current.destroy(); } catch {}
        inst.current = null;
      }
    };
  }, [series, categories]);

  return <div ref={chartRef} className="w-full" style={{ minHeight: 280 }} />;
}
