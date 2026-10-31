import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, IndianRupee } from 'lucide-react';

export default function ServiceModal({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  subCategories = [],
  service = null, // null for create, object for edit
  defaultCategoryId = null,
  defaultSubCategoryId = null,
  loading = false,
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');

  // Filter sub-categories based on selected category
  const filteredSubCategories = subCategories.filter(
    (sub) => String(sub.parent_id || sub.parent?.id) === String(selectedCategoryId)
  );

  useEffect(() => {
    if (service) {
      const parentCatId = service.category?.parent_id || service.category?.parent?.id || '';
      setSelectedCategoryId(parentCatId ? String(parentCatId) : '');
      setSelectedSubCategoryId(service.service_category_id ? String(service.service_category_id) : '');
      setName(service.name || '');
      setPrice(service.price !== undefined && service.price !== null ? String(service.price) : '');
      setDescription(service.description || '');
      setStatus(service.status || 'active');
    } else {
      const catId = defaultCategoryId ? String(defaultCategoryId) : categories[0]?.id ? String(categories[0].id) : '';
      setSelectedCategoryId(catId);

      const subId = defaultSubCategoryId
        ? String(defaultSubCategoryId)
        : '';
      setSelectedSubCategoryId(subId);
      setName('');
      setPrice('');
      setDescription('');
      setStatus('active');
    }
    setError('');
  }, [service, defaultCategoryId, defaultSubCategoryId, categories, isOpen]);

  // When category changes in form, reset or select first subcategory
  const handleCategoryChange = (e) => {
    const newCatId = e.target.value;
    setSelectedCategoryId(newCatId);
    const validSubs = subCategories.filter(
      (sub) => String(sub.parent_id || sub.parent?.id) === String(newCatId)
    );
    setSelectedSubCategoryId(validSubs[0]?.id ? String(validSubs[0].id) : '');
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      setError('Please select a Category.');
      return;
    }
    if (!selectedSubCategoryId) {
      setError('Please select a Sub-Category.');
      return;
    }
    if (!name.trim()) {
      setError('Service Name is required.');
      return;
    }
    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      setError('Please enter a valid price (0 or higher).');
      return;
    }
    setError('');
    onSubmit({
      service_category_id: Number(selectedSubCategoryId),
      name: name.trim(),
      price: Number(price),
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
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {service ? 'Edit Clinical Service' : 'Add Clinical Service'}
              </h3>
              <p className="text-xs text-slate-500">Form C • Billable appointment procedure</p>
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

          {/* 1. Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Select Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            >
              <option value="">-- Choose Category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Sub-Category Dependent Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Select Sub-Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSubCategoryId}
              onChange={(e) => setSelectedSubCategoryId(e.target.value)}
              disabled={loading || !selectedCategoryId}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium disabled:opacity-50"
            >
              <option value="">
                {selectedCategoryId ? '-- Choose Sub-Category --' : '-- First Select Category Above --'}
              </option>
              {filteredSubCategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            {selectedCategoryId && filteredSubCategories.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No Sub-Categories found in this Category. Please add one first.
              </p>
            )}
          </div>

          {/* 3. Service Name & Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Service Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hydra Glow Deep Cleanse, ECG Analysis..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Standard Price (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                disabled={loading}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
              />
            </div>
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
                  name="svc_status"
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
                  name="svc_status"
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
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{service ? 'Update Service' : 'Create Service'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

