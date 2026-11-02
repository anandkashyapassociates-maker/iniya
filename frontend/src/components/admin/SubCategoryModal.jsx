import React, { useState, useEffect } from 'react';
import { X, FolderTree, Loader2 } from 'lucide-react';

export default function SubCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  subCategory = null, // null for create, object for edit
  defaultCategoryId = null,
  loading = false,
}) {
  const [parentId, setParentId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');

  useEffect(() => {
    if (subCategory) {
      setParentId(subCategory.parent_id || subCategory.parent?.id || '');
      setName(subCategory.name || '');
      setDescription(subCategory.description || '');
      setStatus(subCategory.status || 'active');
    } else {
      setParentId(defaultCategoryId || (categories[0]?.id ? String(categories[0].id) : ''));
      setName('');
      setDescription('');
      setStatus('active');
    }
    setError('');
  }, [subCategory, defaultCategoryId, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!parentId) {
      setError('Please select a parent Category.');
      return;
    }
    if (!name.trim()) {
      setError('Sub-Category Name is required.');
      return;
    }
    setError('');
    onSubmit({
      parent_id: Number(parentId),
      name: name.trim(),
      description: description.trim() || null,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {subCategory ? 'Edit Sub-Category' : 'Add Sub-Category'}
              </h3>
              <p className="text-xs text-slate-500">Form B • 2nd-level specialization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Select Parent Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Parent Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            >
              <option value="">-- Select Parent Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.status === 'active' ? 'Active' : 'Inactive'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Sub-Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skin Rejuvenation, Laser Treatments, General OPD..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                  status === 'active'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="sub_status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="sr-only"
                />
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Active</span>
              </label>

              <label
                className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                  status === 'inactive'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="sub_status"
                  value="inactive"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                  className="sr-only"
                />
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Inactive</span>
              </label>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{subCategory ? 'Update Sub-Category' : 'Create Sub-Category'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

