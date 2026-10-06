import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Data sementara (Mock Data) untuk simulasi
// Nantinya data ini harus di-fetch dari API backend Anda
// const dataMingguan = [
//   { hari: 'Senin', tepat_waktu: 93.2, terlambat: 3.5, izin_sakit: 2.1, alpa: 1.2 },
//   { hari: 'Selasa', tepat_waktu: 94.8, terlambat: 2.5, izin_sakit: 1.5, alpa: 1.2 },
//   { hari: 'Rabu', tepat_waktu: 95.6, terlambat: 2.0, izin_sakit: 2.4, alpa: 0.0 },
//   { hari: 'Kamis', tepat_waktu: 95.0, terlambat: 3.0, izin_sakit: 1.0, alpa: 1.0 },
//   { hari: 'Jumat', tepat_waktu: 85.0, terlambat: 10.0, izin_sakit: 2.0, alpa: 3.0 },
// ];

export default function KehadiranChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Belum ada data minggu ini
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="hari" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `${value}%`} />
        <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${value}%`, '']} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        
        {/* URUTAN BAR HARUS SESUAI DENGAN BACKEND */}
        <Bar dataKey="hadir" name="Hadir" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={15} />
        <Bar dataKey="terlambat" name="Terlambat" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={15} />
        <Bar dataKey="izin_sakit" name="Izin / Sakit" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={15} />
        <Bar dataKey="alpa" name="Alpa / Bolos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={15} />
      </BarChart>
    </ResponsiveContainer>
  );
}