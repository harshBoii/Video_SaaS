'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit3, FiSave, FiLink2, FiChevronRight } from 'react-icons/fi';
import Swal from 'sweetalert2';

const FlowchainBuilder = () => {
  const [roles, setRoles] = useState([]);
  const [chainName, setChainName] = useState('');
  const [chainDesc, setChainDesc] = useState('');
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch company roles for assigning to steps
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/roles');
      const data = await res.json();
      setRoles(data);
    })();
  }, []);

  const addStep = () => {
    const newStep = {
      id: crypto.randomUUID(),
      name: `Step ${steps.length + 1}`,
      description: '',
      roleId: '',
      transitions: [],
    };
    setSteps([...steps, newStep]);
  };

  const deleteStep = (id) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStep = (id, field, value) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addTransition = (fromStepId) => {
    const otherSteps = steps.filter((s) => s.id !== fromStepId);
    if (otherSteps.length === 0) return Swal.fire('No other steps to link to.');

Swal.fire({
  title: `
    <div style="
      font-weight: 700;
      font-size: 1.25rem;
      color: #1f2937;
      margin-bottom: 0.5rem;
    ">
      Add Transition
    </div>
    <p style="color:#6b7280; font-size: 0.875rem;">
      Define how this step connects to the next one.
    </p>
  `,
  html: `
    <div style="
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;
      font-family: 'Inter', sans-serif;
    ">
      <div>
        <label for="condition" style="
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        ">
          Transition Condition
        </label>
        <select id="condition" class="swal2-select" style="
          width: 85%;
          padding: 0.6rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #111827;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        " onfocus="this.style.borderColor='#6366f1'">
          <option value="SUCCESS">✅ Success</option>
          <option value="FAILURE">⚠️ Failure</option>
        </select>
      </div>

      <div>
        <label for="toStep" style="
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        ">
          Target Step
        </label>
        <select id="toStep" class="swal2-select" style="
          width: 85%;
          padding: 0.6rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #111827;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        " onfocus="this.style.borderColor='#6366f1'">
          ${otherSteps
            .map(
              (s) => `
                <option value="${s.name}">
                  🪜 ${s.name}
                </option>
              `
            )
            .join('')}
        </select>
      </div>
    </div>
  `,
  showCancelButton: true,
  confirmButtonText: '<span style="font-weight:600">Add Transition</span>',
  cancelButtonText: 'Cancel',
  buttonsStyling: false,
  focusConfirm: false,
  customClass: {
    popup:
      'rounded-2xl shadow-lg p-6 bg-white border border-gray-100 text-left',
    confirmButton:
      'bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all',
    cancelButton:
      'bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 ml-2 transition-all',
  },
  preConfirm: () => {
    const condition = document.getElementById('condition').value;
    const toStepName = document.getElementById('toStep').value;
    return { condition, toStepName };
  },
}).then((result) => {
  if (result.isConfirmed) {
    const { condition, toStepName } = result.value;
    setSteps((prev) =>
      prev.map((s) =>
        s.id === fromStepId
          ? {
              ...s,
              transitions: [...s.transitions, { condition, toStepName }],
            }
          : s
      )
    );
  }
});
  }
  const handleSubmit = async () => {
    if (!chainName.trim() || steps.length === 0) {
      return Swal.fire('Please enter a flowchain name and at least one step.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/flowchains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chainName,
          description: chainDesc,
          steps: steps.map((s) => ({
            name: s.name,
            description: s.description,
            roleId: s.roleId || null,
            transitions: s.transitions,
          })),
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      Swal.fire('Success!', 'Flowchain created successfully.', 'success');
      setChainName('');
      setChainDesc('');
      setSteps([]);
    } catch (err) {
      console.error(err);
      Swal.fire('Error!', 'Failed to create flowchain', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Flowchain Builder</h1>
            <p className="text-sm text-gray-500">
              Design your company’s custom approval pipeline visually.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={addStep}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg"
          >
            <FiPlus /> Add Step
          </motion.button>
        </div>

        {/* Flowchain Details */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            value={chainName}
            onChange={(e) => setChainName(e.target.value)}
            placeholder="Flowchain Name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <input
            value={chainDesc}
            onChange={(e) => setChainDesc(e.target.value)}
            placeholder="Description"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Steps List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="relative bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <input
                    value={step.name}
                    onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                    className="text-lg font-semibold bg-transparent border-b border-transparent focus:border-indigo-300 outline-none text-gray-800"
                  />
                  <FiTrash2
                    onClick={() => deleteStep(step.id)}
                    className="text-red-500 cursor-pointer hover:text-red-700"
                  />
                </div>

                <textarea
                  placeholder="Step description..."
                  value={step.description}
                  onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                  className="w-full text-sm text-gray-600 bg-transparent border-b border-gray-200 focus:border-indigo-300 outline-none mb-3"
                />

                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Assigned Role
                </label>
                <select
                  value={step.roleId}
                  onChange={(e) => updateStep(step.id, 'roleId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>

                {/* Transitions */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Transitions
                  </h4>
                  <div className="space-y-2">
                    {step.transitions.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center text-sm justify-between bg-white/70 px-3 py-1.5 rounded-lg border border-indigo-100"
                      >
                        <span className="font-medium text-indigo-600">
                          {t.condition} → {t.toStepName}
                        </span>
                        <FiChevronRight className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addTransition(step.id)}
                    className="mt-3 text-indigo-600 text-sm flex items-center gap-1 hover:underline"
                  >
                    <FiLink2 /> Add Transition
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-60"
          >
            <FiSave /> {loading ? 'Saving...' : 'Save Flowchain'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default FlowchainBuilder;
