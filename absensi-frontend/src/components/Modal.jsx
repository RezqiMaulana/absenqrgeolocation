export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md">
      <div className="absolute inset-0 bg-on-surface/40" onClick={onClose} />
      <div className={`relative bg-surface rounded-xl shadow-lg w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-space-md border-b border-border sticky top-0 bg-surface">
          <h3 className="text-headline-sm font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-space-md">{children}</div>
      </div>
    </div>
  );
}
