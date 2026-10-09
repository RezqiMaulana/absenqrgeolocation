export default function PlaceholderPage({ title }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-space-lg">
      <h1 className="text-headline-md font-bold text-text-primary mb-space-xs">{title}</h1>
      <p className="text-body-md text-text-secondary">
        Halaman ini akan dibangun lengkap di batch berikutnya.
      </p>
    </div>
  );
}
