import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  FolderTree,
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Loader2,
  RefreshCw,
  X,
  Check,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import adminServiceManagementService from '../../services/adminServiceManagementService';
import CategoryModal from '../../components/admin/CategoryModal';
import SubCategoryModal from '../../components/admin/SubCategoryModal';
import ServiceModal from '../../components/admin/ServiceModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

export default function AdminServicesManagementPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Data states
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states (Strictly ONE at a time)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  // Search filter states for each column
  const [categorySearch, setCategorySearch] = useState('');
  const [subCategorySearch, setSubCategorySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // Modal open states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [subCategoryModalOpen, setSubCategoryModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Action loading states
  const [modalLoading, setModalLoading] = useState(false);

  // Delete Confirm Dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: null, // 'category' | 'sub_category' | 'service'
    item: null,
    loading: false,
  });

  // Fetch full data
  const loadData = useCallback(async (keepSelection = true) => {
    try {
      setLoading(true);
      const [catsRes, subsRes, svcsRes] = await Promise.all([
        adminServiceManagementService.getCategories(),
        adminServiceManagementService.getSubCategories(),
        adminServiceManagementService.getServices(),
      ]);

      const loadedCats = catsRes.data || [];
      const loadedSubs = subsRes.data || [];
      const loadedSvcs = svcsRes.data || [];

      setCategories(loadedCats);
      setSubCategories(loadedSubs);
      setServices(loadedSvcs);

      // Auto-select first category if none selected
      if (!keepSelection || !selectedCategoryId) {
        if (loadedCats.length > 0) {
          const firstCatId = loadedCats[0].id;
          setSelectedCategoryId(firstCatId);

          const matchingSubs = loadedSubs.filter(
            (s) => Number(s.parent_id || s.parent?.id) === Number(firstCatId)
          );
          if (matchingSubs.length > 0) {
            const firstSubId = matchingSubs[0].id;
            setSelectedSubCategoryId(firstSubId);

            const matchingSvcs = loadedSvcs.filter(
              (svc) => Number(svc.service_category_id) === Number(firstSubId)
            );
            if (matchingSvcs.length > 0) {
              setSelectedServiceId(matchingSvcs[0].id);
            } else {
              setSelectedServiceId(null);
            }
          } else {
            setSelectedSubCategoryId(null);
            setSelectedServiceId(null);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load services & categories data.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    loadData(false);
  }, []);

  // Selection Handlers (Rule: changing parent clears downstream child selection)
  const handleSelectCategory = (catId) => {
    if (selectedCategoryId === catId) return;
    setSelectedCategoryId(catId);
    setSelectedSubCategoryId(null);
    setSelectedServiceId(null);

    // Auto-select first sub-category if available
    const subsOfCat = subCategories.filter(
      (s) => Number(s.parent_id || s.parent?.id) === Number(catId)
    );
    if (subsOfCat.length > 0) {
      const firstSubId = subsOfCat[0].id;
      setSelectedSubCategoryId(firstSubId);

      const svcsOfSub = services.filter(
        (svc) => Number(svc.service_category_id) === Number(firstSubId)
      );
      if (svcsOfSub.length > 0) {
        setSelectedServiceId(svcsOfSub[0].id);
      }
    }
  };

  const handleSelectSubCategory = (subId) => {
    if (selectedSubCategoryId === subId) return;
    setSelectedSubCategoryId(subId);
    setSelectedServiceId(null);

    const svcsOfSub = services.filter(
      (svc) => Number(svc.service_category_id) === Number(subId)
    );
    if (svcsOfSub.length > 0) {
      setSelectedServiceId(svcsOfSub[0].id);
    }
  };

  const handleSelectService = (svcId) => {
    setSelectedServiceId(svcId);
  };

  // Filtered lists for 3 columns
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, categorySearch]);

  const filteredSubCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    let list = subCategories.filter(
      (s) => Number(s.parent_id || s.parent?.id) === Number(selectedCategoryId)
    );
    if (subCategorySearch.trim()) {
      const q = subCategorySearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [subCategories, selectedCategoryId, subCategorySearch]);

  const filteredServices = useMemo(() => {
    if (!selectedSubCategoryId) return [];
    let list = services.filter(
      (svc) => Number(svc.service_category_id) === Number(selectedSubCategoryId)
    );
    if (serviceSearch.trim()) {
      const q = serviceSearch.toLowerCase();
      list = list.filter(
        (svc) =>
          svc.name.toLowerCase().includes(q) ||
          (svc.description && svc.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [services, selectedSubCategoryId, serviceSearch]);

  // Selected object references for headers & breadcrumb
  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const activeSubCategoryObj = useMemo(
    () => subCategories.find((s) => s.id === selectedSubCategoryId) || null,
    [subCategories, selectedSubCategoryId]
  );

  const activeServiceObj = useMemo(
    () => services.find((svc) => svc.id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  // Form Submits
  const handleCategorySubmit = async (formData) => {
    setModalLoading(true);
    try {
      if (editingCategory) {
        await adminServiceManagementService.updateCategory(editingCategory.id, formData);
        toast.success(`Category '${formData.name}' updated successfully.`);
      } else {
        const res = await adminServiceManagementService.createCategory(formData);
        toast.success(`Category '${formData.name}' created successfully.`);
        if (res.data?.id) {
          setSelectedCategoryId(res.data.id);
          setSelectedSubCategoryId(null);
          setSelectedServiceId(null);
        }
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      await loadData(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubCategorySubmit = async (formData) => {
    setModalLoading(true);
    try {
      if (editingSubCategory) {
        await adminServiceManagementService.updateSubCategory(editingSubCategory.id, formData);
        toast.success(`Sub-Category '${formData.name}' updated successfully.`);
      } else {
        const res = await adminServiceManagementService.createSubCategory(formData);
        toast.success(`Sub-Category '${formData.name}' created successfully.`);
        if (res.data?.id) {
          setSelectedSubCategoryId(res.data.id);
          setSelectedServiceId(null);
        }
      }
      setSubCategoryModalOpen(false);
      setEditingSubCategory(null);
      await loadData(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save sub-category.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleServiceSubmit = async (formData) => {
    setModalLoading(true);
    try {
      if (editingService) {
        await adminServiceManagementService.updateService(editingService.id, formData);
        toast.success(`Service '${formData.name}' updated successfully.`);
      } else {
        const res = await adminServiceManagementService.createService(formData);
        toast.success(`Service '${formData.name}' created successfully.`);
        if (res.data?.id) {
          setSelectedServiceId(res.data.id);
        }
      }
      setServiceModalOpen(false);
      setEditingService(null);
      await loadData(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save service.');
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Handlers
  const handleConfirmDelete = async () => {
    const { type, item } = deleteDialog;
    if (!item) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      if (type === 'category') {
        await adminServiceManagementService.deleteCategory(item.id);
        toast.success(`Category '${item.name}' deleted successfully.`);
        if (selectedCategoryId === item.id) {
          setSelectedCategoryId(null);
          setSelectedSubCategoryId(null);
          setSelectedServiceId(null);
        }
      } else if (type === 'sub_category') {
        await adminServiceManagementService.deleteSubCategory(item.id);
        toast.success(`Sub-Category '${item.name}' deleted successfully.`);
        if (selectedSubCategoryId === item.id) {
          setSelectedSubCategoryId(null);
          setSelectedServiceId(null);
        }
      } else if (type === 'service') {
        await adminServiceManagementService.deleteService(item.id);
        toast.success(`Service '${item.name}' deleted successfully.`);
        if (selectedServiceId === item.id) {
          setSelectedServiceId(null);
        }
      }
      setDeleteDialog({ isOpen: false, type: null, item: null, loading: false });
      await loadData(true);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to delete record.';
      toast.error(errMsg);
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Header with 3D Icon */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-200/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="flex items-center gap-4">
          {/* 3D Folder / Catalog Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-50/60 flex items-center justify-center text-white shrink-0 transform -rotate-1 hover:rotate-0 transition-transform">
            <FolderTree className="w-7 h-7 drop-shadow-md" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                Services &amp; Categories
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>3-Tier Architecture</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure medical categories, specialty sub-categories, and billable procedures
            </p>
          </div>
        </div>

        {/* Action Buttons & Statistics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50/90 border border-slate-200/80 rounded-2xl px-3.5 py-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{categories.length} Categories</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>{subCategories.length} Sub-Categories</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{services.length} Services</span>
            </span>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all cursor-pointer shadow-xs"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/admin/appointments')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Appointments</span>
          </button>
        </div>
      </div>

      {/* Interactive Active Path Navigator Ribbon */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center flex-wrap gap-2 text-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Active Path:
          </span>

          {/* 1. Category Pill */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 font-semibold text-xs shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>{activeCategoryObj?.name || 'Select Category'}</span>
          </span>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          {/* 2. Sub-Category Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all ${
              activeSubCategoryObj
                ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                : 'bg-slate-50 text-slate-400 border border-slate-200/60'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
            <span>{activeSubCategoryObj?.name || 'Select Sub-Category'}</span>
          </span>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          {/* 3. Service Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all ${
              activeServiceObj
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-slate-50 text-slate-400 border border-slate-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {activeServiceObj
                ? `${activeServiceObj.name} — ₹${Number(activeServiceObj.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : 'Select Service'}
            </span>
          </span>
        </div>

        {/* Quick Booking Button if Service is Selected */}
        {activeServiceObj && (
          <button
            type="button"
            onClick={() => navigate(`/admin/appointments/create?service_id=${activeServiceObj.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book with this Service</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3-Column Studio Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ========================================================= */}
        {/* COLUMN 1: CATEGORIES                                      */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] flex flex-col h-[540px] overflow-hidden transition-all duration-200 hover:shadow-md">
          {/* Column Header with 3D Badge */}
          <div className="p-5 border-b border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  01
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-display">
                    Categories
                  </h2>
                  <p className="text-xs text-slate-400">Department Level</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            {/* Clean Minimal Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-600" />
                <span className="text-xs font-medium">Loading categories...</span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Layers className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No categories found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Category" to create one</p>
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const subCount = subCategories.filter(
                  (s) => Number(s.parent_id || s.parent?.id) === Number(cat.id)
                ).length;

                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/40 border-blue-400 shadow-sm ring-1 ring-blue-400/40 -translate-y-0.5'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold truncate font-display ${
                              isSelected ? 'text-blue-950' : 'text-slate-800'
                            }`}
                          >
                            {cat.name}
                          </h4>
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              cat.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={cat.status === 'active' ? 'Active' : 'Inactive'}
                          />
                        </div>

                        {cat.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-normal">
                            {cat.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-lg">
                            {subCount} {subCount === 1 ? 'sub-category' : 'sub-categories'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions + Active Arrow */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(cat);
                            setCategoryModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xs"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({
                              isOpen: true,
                              type: 'category',
                              item: cat,
                              loading: false,
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xs"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {isSelected && (
                          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-200">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: SUB-CATEGORIES                                  */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] flex flex-col h-[540px] overflow-hidden transition-all duration-200 hover:shadow-md">
          {/* Column Header with 3D Badge */}
          <div className="p-5 border-b border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  02
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-display">
                    Sub-Categories
                  </h2>
                  <p className="text-xs text-slate-400 truncate max-w-[150px]">
                    {activeCategoryObj ? `In ${activeCategoryObj.name}` : 'Select Category'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingSubCategory(null);
                  setSubCategoryModalOpen(true);
                }}
                disabled={!selectedCategoryId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sub-Category</span>
              </button>
            </div>

            {/* Clean Minimal Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={subCategorySearch}
                onChange={(e) => setSubCategorySearch(e.target.value)}
                placeholder="Search sub-categories..."
                disabled={!selectedCategoryId}
                className="w-full pl-9 pr-8 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {subCategorySearch && (
                <button
                  type="button"
                  onClick={() => setSubCategorySearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sub-Categories List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {!selectedCategoryId ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <FolderTree className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No Category Selected</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Choose a category from Column 1 to view sub-categories
                </p>
              </div>
            ) : filteredSubCategories.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <FolderTree className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No sub-categories here</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click "+ Add Sub-Category" to create one
                </p>
              </div>
            ) : (
              filteredSubCategories.map((sub) => {
                const isSelected = selectedSubCategoryId === sub.id;
                const svcCount = services.filter(
                  (svc) => Number(svc.service_category_id) === Number(sub.id)
                ).length;

                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubCategory(sub.id)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-50/90 to-purple-50/40 border-indigo-400 shadow-sm ring-1 ring-indigo-400/40 -translate-y-0.5'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold truncate font-display ${
                              isSelected ? 'text-indigo-950' : 'text-slate-800'
                            }`}
                          >
                            {sub.name}
                          </h4>
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              sub.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={sub.status === 'active' ? 'Active' : 'Inactive'}
                          />
                        </div>

                        {sub.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-normal">
                            {sub.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-lg">
                            {svcCount} {svcCount === 1 ? 'service' : 'services'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions + Active Arrow */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubCategory(sub);
                            setSubCategoryModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xs"
                          title="Edit Sub-Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({
                              isOpen: true,
                              type: 'sub_category',
                              item: sub,
                              loading: false,
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xs"
                          title="Delete Sub-Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {isSelected && (
                          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-200">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 3: CLINICAL SERVICES                               */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] flex flex-col h-[540px] overflow-hidden transition-all duration-200 hover:shadow-md">
          {/* Column Header with 3D Badge */}
          <div className="p-5 border-b border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  03
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-display">
                    Clinical Services
                  </h2>
                  <p className="text-xs text-slate-400 truncate max-w-[150px]">
                    {activeSubCategoryObj ? `In ${activeSubCategoryObj.name}` : 'Select Sub-Category'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingService(null);
                  setServiceModalOpen(true);
                }}
                disabled={!selectedSubCategoryId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            {/* Clean Minimal Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services or fees..."
                disabled={!selectedSubCategoryId}
                className="w-full pl-9 pr-8 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-50"
              />
              {serviceSearch && (
                <button
                  type="button"
                  onClick={() => setServiceSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Services List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {!selectedSubCategoryId ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No Sub-Category Selected</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select a sub-category from Column 2 to manage services
                </p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No services yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click "+ Add Service" to add a billable procedure
                </p>
              </div>
            ) : (
              filteredServices.map((svc) => {
                const isSelected = selectedServiceId === svc.id;

                return (
                  <div
                    key={svc.id}
                    onClick={() => handleSelectService(svc.id)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/40 border-emerald-400 shadow-sm ring-1 ring-emerald-400/40 -translate-y-0.5'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold truncate font-display ${
                              isSelected ? 'text-emerald-950' : 'text-slate-800'
                            }`}
                          >
                            {svc.name}
                          </h4>
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              svc.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={svc.status === 'active' ? 'Active' : 'Inactive'}
                          />
                        </div>

                        {/* Consultation Fee Display */}
                        <div className="mt-1.5 flex items-baseline gap-1 text-emerald-700 font-bold">
                          <span className="text-xs">₹</span>
                          <span className="text-base font-extrabold font-mono tracking-tight">
                            {Number(svc.price || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        {svc.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-normal">
                            {svc.description}
                          </p>
                        )}
                      </div>

                      {/* Right: Actions + Active Checkmark */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingService(svc);
                            setServiceModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xs"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({
                              isOpen: true,
                              type: 'service',
                              item: svc,
                              loading: false,
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xs"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {isSelected && (
                          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-200">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Form A Modal: Category */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCategorySubmit}
        category={editingCategory}
        loading={modalLoading}
      />

      {/* Form B Modal: Sub-Category */}
      <SubCategoryModal
        isOpen={subCategoryModalOpen}
        onClose={() => {
          setSubCategoryModalOpen(false);
          setEditingSubCategory(null);
        }}
        onSubmit={handleSubCategorySubmit}
        categories={categories}
        subCategory={editingSubCategory}
        defaultCategoryId={selectedCategoryId}
        loading={modalLoading}
      />

      {/* Form C Modal: Service */}
      <ServiceModal
        isOpen={serviceModalOpen}
        onClose={() => {
          setServiceModalOpen(false);
          setEditingService(null);
        }}
        onSubmit={handleServiceSubmit}
        categories={categories}
        subCategories={subCategories}
        service={editingService}
        defaultCategoryId={selectedCategoryId}
        defaultSubCategoryId={selectedSubCategoryId}
        loading={modalLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, type: null, item: null, loading: false })
        }
        onCancel={() =>
          setDeleteDialog({ isOpen: false, type: null, item: null, loading: false })
        }
        onConfirm={handleConfirmDelete}
        title={
          deleteDialog.type === 'category'
            ? 'Delete Category'
            : deleteDialog.type === 'sub_category'
            ? 'Delete Sub-Category'
            : 'Delete Clinical Service'
        }
        message={
          deleteDialog.type === 'category'
            ? `Are you sure you want to delete category '${deleteDialog.item?.name}'? Note: It cannot be deleted if it contains sub-categories.`
            : deleteDialog.type === 'sub_category'
            ? `Are you sure you want to delete sub-category '${deleteDialog.item?.name}'? Note: It cannot be deleted if it contains services.`
            : `Are you sure you want to delete service '${deleteDialog.item?.name}'? Note: It cannot be deleted if it has been linked to existing appointment sessions.`
        }
        confirmText="Delete Now"
        isDangerous={true}
        loading={deleteDialog.loading}
      />
    </div>
  );
}
