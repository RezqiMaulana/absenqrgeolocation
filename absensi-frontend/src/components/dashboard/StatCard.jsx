export default function StatCard({ icon, label, value, sub, subColor = 'text-text-secondary', accent = false }) {
  return (
    <div
      className={`rounded-xl p-space-md border ${
        accent
          ? 'bg-primary-container text-on-primary border-transparent'
          : 'bg-surface border-border'
      }`}
    >
      <div className="flex items-center justify-between mb-space-sm">
        <span className={`text-label-sm ${accent ? 'text-surface-variant/80' : 'text-text-secondary'}`}>
          {label}
        </span>
        {icon && (
          <span
            className={`material-symbols-outlined text-[20px] ${
              accent ? 'text-surface' : 'text-text-secondary'
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className={`text-headline-lg font-bold font-tabular ${accent ? 'text-surface' : 'text-text-primary'}`}>
        {value}
      </div>
      {sub && <div className={`text-body-sm mt-1 ${accent ? 'text-surface-variant/80' : subColor}`}>{sub}</div>}
    </div>
  );
}
