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
  SlidersHorizontal,
  CalendarPlus,
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
  }, [selectedCategoryId, toast]);

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

  // Selected object references for headers
  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const activeSubCategoryObj = useMemo(
    () => subCategories.find((s) => s.id === selectedSubCategoryId) || null,
    [subCategories, selectedSubCategoryId]
  );

  const selectedServiceObj = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  const handleProceedToCreateAppointment = () => {
    if (!selectedServiceId) {
      toast.warning('Please select a service in Column 3 first.');
      return;
    }
    navigate(
      `/admin/appointments/create?category_id=${selectedCategoryId || ''}&sub_category_id=${selectedSubCategoryId || ''}&service_id=${selectedServiceId}`,
      {
        state: {
          category_id: selectedCategoryId,
          sub_category_id: selectedSubCategoryId,
          service_id: selectedServiceId,
        },
      }
    );
  };

  // ==========================================
  // Form A: Category Submit (Create / Update)
  // ==========================================
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

  // ==========================================
  // Form B: Sub-Category Submit (Create / Update)
  // ==========================================
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

  // ==========================================
  // Form C: Service Submit (Create / Update)
  // ==========================================
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

  // ==========================================
  // Delete Confirmation Handlers
  // ==========================================
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
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Services & Categories Management</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              3-Tier Clinical Catalog
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure clinic categories, sub-categories, billable clinical services, and pricing for appointments.
          </p>
        </div>

        {/* Stats Badges & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{categories.length} Categories</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>{subCategories.length} Sub-Categories</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{services.length} Services</span>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/admin/appointments')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            <span>Back to Appointments</span>
          </button>
        </div>
      </div>

      {/* 3-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ========================================================= */}
        {/* COLUMN 1: CATEGORIES                                      */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[480px] overflow-hidden">
          {/* Column Header */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 font-display">1. Categories</h2>
                  <p className="text-[11px] text-slate-500">Tier 1 • Department Level</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryModalOpen(true);
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Column List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-1 text-blue-500" />
                <span className="text-xs">Loading categories...</span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Layers className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-600">No categories found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Category" to create one.</p>
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
                    className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5 min-w-0">
                        {/* Radio selection indicator */}
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-slate-300 bg-white group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        <div className="min-w-0">
                          <h4
                            className={`text-xs font-bold leading-tight truncate ${
                              isSelected ? 'text-blue-950 font-display' : 'text-slate-800'
                            }`}
                          >
                            {cat.name}
                          </h4>
                          {cat.description && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {cat.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-2 mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-700 text-[10px] font-semibold">
                              {subCount} {subCount === 1 ? 'Sub-Category' : 'Sub-Categories'}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 text-[10px] rounded font-medium ${
                                cat.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {cat.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Edit & Delete Actions */}
                      <div className="flex items-center space-x-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(cat);
                            setCategoryModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
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
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[480px] overflow-hidden">
          {/* Column Header */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 font-display">2. Sub-Categories</h2>
                  <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {activeCategoryObj ? `Under: ${activeCategoryObj.name}` : 'Select a Category'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingSubCategory(null);
                  setSubCategoryModalOpen(true);
                }}
                disabled={!selectedCategoryId}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sub-Category</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={subCategorySearch}
                onChange={(e) => setSubCategorySearch(e.target.value)}
                placeholder="Search sub-categories..."
                disabled={!selectedCategoryId}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Column List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!selectedCategoryId ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Layers className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-600">No Category Selected</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select a category from Column 1 to view its sub-categories.
                </p>
              </div>
            ) : filteredSubCategories.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <FolderTree className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-600">No sub-categories in this category</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Sub-Category" to create one.</p>
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
                    className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5 min-w-0">
                        {/* Radio selection indicator */}
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-slate-300 bg-white group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        <div className="min-w-0">
                          <h4
                            className={`text-xs font-bold leading-tight truncate ${
                              isSelected ? 'text-indigo-950 font-display' : 'text-slate-800'
                            }`}
                          >
                            {sub.name}
                          </h4>
                          {sub.description && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {sub.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-2 mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100/70 text-indigo-700 text-[10px] font-semibold">
                              {svcCount} {svcCount === 1 ? 'Service' : 'Services'}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 text-[10px] rounded font-medium ${
                                sub.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {sub.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Edit & Delete Actions */}
                      <div className="flex items-center space-x-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubCategory(sub);
                            setSubCategoryModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
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
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Delete Sub-Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[480px] overflow-hidden">
          {/* Column Header */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 font-display">3. Clinical Services</h2>
                  <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {activeSubCategoryObj ? `Under: ${activeSubCategoryObj.name}` : 'Select Sub-Category'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingService(null);
                  setServiceModalOpen(true);
                }}
                disabled={!selectedSubCategoryId}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services or pricing..."
                disabled={!selectedSubCategoryId}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Column List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!selectedSubCategoryId ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <FolderTree className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-600">No Sub-Category Selected</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select a sub-category from Column 2 to view its services.
                </p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Sparkles className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-600">No services in this sub-category</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Service" to add one.</p>
              </div>
            ) : (
              filteredServices.map((svc) => {
                const isSelected = selectedServiceId === svc.id;

                return (
                  <div
                    key={svc.id}
                    onClick={() => handleSelectService(svc.id)}
                    className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5 min-w-0">
                        {/* Radio selection indicator */}
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600'
                              : 'border-slate-300 bg-white group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        <div className="min-w-0">
                          <h4
                            className={`text-xs font-bold leading-tight truncate ${
                              isSelected ? 'text-emerald-950 font-display' : 'text-slate-800'
                            }`}
                          >
                            {svc.name}
                          </h4>

                          {/* Price Tag in Bold Green */}
                          <div className="mt-1 flex items-center space-x-1 text-emerald-700 font-bold text-sm">
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span>{Number(svc.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>

                          {svc.description && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {svc.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-2 mt-2">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 text-[10px] rounded font-medium ${
                                svc.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {svc.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Edit & Delete Actions */}
                      <div className="flex items-center space-x-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingService(svc);
                            setServiceModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
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
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar: Create Appointment with Selected Service */}
      <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <span>Book Appointment with Selected Service</span>
              {selectedServiceObj && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Ready to Book
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-600 truncate mt-0.5">
              {selectedServiceObj ? (
                <>
                  <span className="font-semibold text-slate-800">{activeCategoryObj?.name || 'Category'}</span>
                  <span className="mx-1.5 text-slate-400 font-bold">→</span>
                  <span className="font-semibold text-slate-800">{activeSubCategoryObj?.name || 'Sub-Category'}</span>
                  <span className="mx-1.5 text-slate-400 font-bold">→</span>
                  <span className="font-bold text-emerald-700">{selectedServiceObj.name}</span>
                  <span className="ml-2 font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    ₹{Number(selectedServiceObj.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </>
              ) : selectedCategoryId && selectedSubCategoryId ? (
                <span className="text-amber-600 font-medium">Please select a Clinical Service in Column 3 to proceed.</span>
              ) : selectedCategoryId ? (
                <span className="text-slate-500">Please select a Sub-Category and Service to proceed.</span>
              ) : (
                <span className="text-slate-400">Select Category, Sub-Category, and Service in the 3 columns above.</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleProceedToCreateAppointment}
            disabled={!selectedServiceId}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Create Appointment</span>
          </button>
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
        onConfirm={handleConfirmDelete}
        title={
          deleteDialog.type === 'category'
            ? 'Delete Main Category'
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

