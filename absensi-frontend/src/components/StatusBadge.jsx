const STYLES = {
  hadir: 'bg-status-hadir/10 text-[#065F46] border-status-hadir/20',
  terlambat: 'bg-status-terlambat/10 text-[#92400E] border-status-terlambat/20',
  alpa: 'bg-status-alpa/10 text-[#991B1B] border-status-alpa/20',
  ditolak: 'bg-status-radius-fail/10 text-[#991B1B] border-status-radius-fail/30',
};

const LABELS = {
  hadir: 'Tepat Waktu',
  terlambat: 'Terlambat',
  alpa: 'Alpa',
  ditolak: 'Ditolak',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-surface-subtle text-text-secondary border-border';
  const label = LABELS[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-semibold border ${style}`}>
      {label}
    </span>
  );
}
