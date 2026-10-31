import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Package, ChevronDown, Check, X, Search } from 'lucide-react';

export default function ProductMultiSelectDropdown({
  products = [],
  selectedIds = [],
  onChange,
  placeholder = '-- Select Inventory Products --',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        (p.business_unit && p.business_unit.toLowerCase().includes(q))
    );
  }, [products, search]);

  const handleToggle = (id) => {
    const numId = Number(id);
    if (selectedIds.includes(numId)) {
      onChange(selectedIds.filter((item) => item !== numId));
    } else {
      onChange([...selectedIds, numId]);
    }
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    onChange(products.map((p) => p.id));
  };

  // Get selected product objects for preview pills
  const selectedProductObjects = useMemo(() => {
    return products.filter((p) => selectedIds.includes(p.id));
  }, [products, selectedIds]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full min-h-[42px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition-all select-none shadow-2xs"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
          <Package className="w-4 h-4 text-slate-400 shrink-0" />
          {selectedIds.length === 0 ? (
            <span className="text-sm text-slate-400 font-normal truncate">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                {selectedIds.length} {selectedIds.length === 1 ? 'Product Selected' : 'Products Selected'}
              </span>
              <span className="text-xs text-slate-600 truncate max-w-[190px]">
                {selectedProductObjects.map((p) => p.product_name).join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              title="Clear all selected"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Popover Dropdown with Checkboxes */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
          {/* Search Bar & Quick Actions */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] px-1 text-slate-500 font-medium">
              <span>{filteredProducts.length} items available</span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Checkbox List */}
          <div className="max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-50">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching inventory products found.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isChecked = selectedIds.includes(product.id);

                return (
                  <label
                    key={product.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors select-none ${
                      isChecked
                        ? 'bg-indigo-50/60 font-semibold text-indigo-950'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(product.id)}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="truncate">{product.product_name}</span>
                    </div>

                    {product.business_unit && (
                      <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {product.business_unit}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Selected Products Preview Chips */}
      {selectedProductObjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedProductObjects.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-xs font-medium"
            >
              <span>{p.product_name}</span>
              <button
                type="button"
                onClick={() => handleToggle(p.id)}
                className="hover:text-rose-600 cursor-pointer"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

