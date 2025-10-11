'use client';

import { useState } from 'react';
import { FiEdit3, FiSave, FiX } from 'react-icons/fi';

export default function EditCampaignRow({ campaign }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(campaign);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setIsEditing(false);
  };

  return (
    <tr className="border-b hover:bg-gray-50 transition">
      <td className="px-6 py-3">
        {isEditing ? (
          <input name="name" value={form.name} onChange={handleChange} className="border rounded px-2 py-1 text-sm w-full" />
        ) : (
          form.name
        )}
      </td>
      <td className="px-6 py-3">{form.admin?.firstName || '—'}</td>
      <td className="px-6 py-3">{form.team?.name || '—'}</td>
      <td className="px-6 py-3">{new Date(form.createdAt).toLocaleDateString()}</td>
      <td className="px-6 py-3 flex items-center gap-2">
        {isEditing ? (
          <>
            <button onClick={handleSave} disabled={loading} className="p-2 text-green-600 hover:text-green-800">
              <FiSave />
            </button>
            <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:text-gray-800">
              <FiX />
            </button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:text-blue-800">
            <FiEdit3 />
          </button>
        )}
      </td>
    </tr>
  );
}
