import { useEffect, useState } from 'react';
import Modal from '../Modal';
import api from '../../lib/api';

const emptyForm = { nis: '', name: '', gender: '', class_id: '', email: '', password: '' };

export default function StudentFormModal({ open, onClose, onSaved, classes, student }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(student);

  useEffect(() => {
    if (student) {
      setForm({
        nis: student.nis || '',
        name: student.name || '',
        gender: student.gender || '',
        class_id: student.class_id || '',
        email: '',
        password: '',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [student, open]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      if (isEdit) {
        await api.put(`/students/${student.id}`, {
          nis: form.nis,
          name: form.name,
          gender: form.gender || null,
          class_id: form.class_id || null,
        });
      } else {
        await api.post('/students', {
          nis: form.nis,
          name: form.name,
          gender: form.gender || null,
          class_id: form.class_id || null,
          email: form.email,
          password: form.password || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({ general: [err.response?.data?.message || 'Gagal menyimpan data siswa.'] });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Siswa' : 'Tambah Siswa Manual'}>
      <form onSubmit={handleSubmit} className="space-y-space-md">
        {errors.general && <p className="text-body-sm text-error">{errors.general[0]}</p>}

        <Field label="NIS" name="nis" value={form.nis} onChange={handleChange} error={errors.nis} required />
        <Field label="Nama Lengkap" name="name" value={form.name} onChange={handleChange} error={errors.name} required />

        <div>
          <label className="block text-label-md font-medium text-text-primary mb-space-xs">Jenis Kelamin</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full h-11 px-space-md rounded-lg border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            <option value="">- Pilih -</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <div>
          <label className="block text-label-md font-medium text-text-primary mb-space-xs">Kelas</label>
          <select
            name="class_id"
            value={form.class_id}
            onChange={handleChange}
            className="w-full h-11 px-space-md rounded-lg border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            <option value="">- Belum ada kelas -</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {!isEdit && (
          <>
            <Field
              label="Email (untuk akun login)"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <Field
              label="Password (opsional)"
              name="password"
              type="text"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              placeholder={`Kosongkan = default pakai NIS (${form.nis || '...'})`}
            />
          </>
        )}

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

function Field({ label, name, value, onChange, error, type = 'text', required, placeholder }) {
  return (
    <div>
      <label className="block text-label-md font-medium text-text-primary mb-space-xs">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`w-full h-11 px-space-md rounded-lg border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container ${
          error ? 'border-error' : 'border-border'
        }`}
      />
      {error && <p className="text-body-sm text-error mt-1">{error[0]}</p>}
    </div>
  );
}
