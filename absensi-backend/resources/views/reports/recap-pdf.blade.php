<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rekap Presensi</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #0F172A; }
        h1 { font-size: 16px; margin-bottom: 0; }
        p.sub { color: #64748B; margin-top: 2px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #E2E8F0; padding: 6px 8px; text-align: left; }
        th { background-color: #EFF4FF; }
        .text-right { text-align: right; }
        .note { margin-top: 16px; font-size: 10px; color: #64748B; }
    </style>
</head>
<body>
    <h1>Rekap Presensi Siswa</h1>
    <p class="sub">Periode: {{ $date_from }} s/d {{ $date_to }} &middot; Hari efektif (estimasi): {{ $effective_days }} hari</p>

    <table>
        <thead>
            <tr>
                <th>NIS</th>
                <th>Nama</th>
                <th>Kelas</th>
                <th class="text-right">Hadir</th>
                <th class="text-right">Terlambat</th>
                <th class="text-right">Alpa</th>
                <th class="text-right">Persentase</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    <td>{{ $row['nis'] }}</td>
                    <td>{{ $row['name'] }}</td>
                    <td>{{ $row['class'] }}</td>
                    <td class="text-right">{{ $row['hadir'] }}</td>
                    <td class="text-right">{{ $row['terlambat'] }}</td>
                    <td class="text-right">{{ $row['alpa'] }}</td>
                    <td class="text-right">{{ $row['persentase'] }}%</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align:center">Tidak ada data siswa.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <p class="note">
        Catatan: "Hari efektif" dihitung dari jumlah tanggal berbeda yang memiliki minimal satu catatan
        presensi di sistem pada rentang ini, bukan dari kalender akademik resmi. Dicetak otomatis oleh
        Sistem Absensi Digital pada {{ now()->format('d M Y H:i') }} WIB.
    </p>
</body>
</html>
