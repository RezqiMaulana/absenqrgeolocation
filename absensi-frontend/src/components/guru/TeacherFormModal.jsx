import { useEffect, useState } from 'react';
import Modal from '../Modal';
import api from '../../lib/api';

const emptyForm = { nip: '', name: '', phone: '', email: '', password: '', role: 'wali_kelas' };

export default function TeacherFormModal({ open, onClose, onSaved, teacher }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(teacher);

  useEffect(() => {
    if (teacher) {
      setForm({
        nip: teacher.nip || '',
        name: teacher.name || '',
        phone: teacher.phone || '',
        email: '',
        password: '',
        role: teacher.user?.role || 'wali_kelas',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [teacher, open]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      if (isEdit) {
        await api.put(`/teachers/${teacher.id}`, {
          nip: form.nip,
          name: form.name,
          phone: form.phone || null,
        });
      } else {
        await api.post('/teachers', {
          nip: form.nip,
          name: form.name,
          phone: form.phone || null,
          email: form.email,
          password: form.password || undefined,
          role: form.role,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({ general: [err.response?.data?.message || 'Gagal menyimpan data guru.'] });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Guru' : 'Tambah Guru'}>
      <form onSubmit={handleSubmit} className="space-y-space-md">
        {errors.general && <p className="text-body-sm text-error">{errors.general[0]}</p>}

        <Field label="NIP" name="nip" value={form.nip} onChange={handleChange} error={errors.nip} required />
        <Field label="Nama Lengkap" name="name" value={form.name} onChange={handleChange} error={errors.name} required />
        <Field label="No. HP" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} />

        {!isEdit && (
          <>
            <div>
              <label className="block text-label-md font-medium text-text-primary mb-space-xs">Peran (Role)</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full h-11 px-space-md rounded-lg border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                <option value="wali_kelas">Wali Kelas</option>
                <option value="seksi_absensi">Seksi Absensi</option>
              </select>
            </div>
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
              placeholder={`Kosongkan = default pakai NIP (${form.nip || '...'})`}
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
