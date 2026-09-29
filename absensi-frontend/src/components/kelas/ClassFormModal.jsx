import { useEffect, useState } from 'react';
import Modal from '../Modal';
import api from '../../lib/api';

export default function ClassFormModal({ open, onClose, onSaved, teachers, schoolClass }) {
  const [form, setForm] = useState({ name: '', wali_kelas_id: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(schoolClass);

  useEffect(() => {
    if (schoolClass) {
      setForm({ name: schoolClass.name || '', wali_kelas_id: schoolClass.wali_kelas_id || '' });
    } else {
      setForm({ name: '', wali_kelas_id: '' });
    }
    setErrors({});
  }, [schoolClass, open]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = { name: form.name, wali_kelas_id: form.wali_kelas_id || null };

    try {
      if (isEdit) {
        await api.put(`/classes/${schoolClass.id}`, payload);
      } else {
        await api.post('/classes', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({ general: [err.response?.data?.message || 'Gagal menyimpan data kelas.'] });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Kelas' : 'Tambah Kelas'}>
      <form onSubmit={handleSubmit} className="space-y-space-md">
        {errors.general && <p className="text-body-sm text-error">{errors.general[0]}</p>}

        <div>
          <label className="block text-label-md font-medium text-text-primary mb-space-xs">Nama Kelas</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Contoh: XII RPL 1"
            className={`w-full h-11 px-space-md rounded-lg border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container ${
              errors.name ? 'border-error' : 'border-border'
            }`}
          />
          {errors.name && <p className="text-body-sm text-error mt-1">{errors.name[0]}</p>}
        </div>

        <div>
          <label className="block text-label-md font-medium text-text-primary mb-space-xs">Wali Kelas</label>
          <select
            name="wali_kelas_id"
            value={form.wali_kelas_id}
            onChange={handleChange}
            className="w-full h-11 px-space-md rounded-lg border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            <option value="">- Belum ada wali kelas -</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.nip})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-space-sm pt-space-sm">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-lg border border-border text-text-primary font-medium hover:bg-surface-subtle"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
