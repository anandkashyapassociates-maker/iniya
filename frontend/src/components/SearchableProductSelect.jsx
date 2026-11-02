import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Package, Check } from 'lucide-react';

export default function SearchableProductSelect({
  products = [],
  selectedProductId = '',
  onSelectProduct,
  placeholder = 'All Products (Search or Select)',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Selected product object
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => String(p.id) === String(selectedProductId));
  }, [products, selectedProductId]);

  // Filtered product list based on typed query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const nameMatch = p.product_name?.toLowerCase().includes(query);
      const codeMatch = p.product_code?.toLowerCase().includes(query);
      const catMatch = p.category?.name?.toLowerCase().includes(query);
      return nameMatch || codeMatch || catMatch;
    });
  }, [products, searchQuery]);

  const handleSelect = (productId) => {
    onSelectProduct(productId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelectProduct('');
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full px-3 py-2 text-xs rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
          isOpen
            ? 'border-blue-500 bg-white ring-2 ring-blue-500/10'
            : selectedProduct
            ? 'border-blue-300 bg-blue-50/50 text-slate-800'
            : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Package className={`w-3.5 h-3.5 shrink-0 ${selectedProduct ? 'text-blue-600' : 'text-slate-400'}`} />
          {selectedProduct ? (
            <div className="flex items-center gap-1.5 truncate text-left">
              <span className="font-bold text-slate-900 truncate">
                {selectedProduct.product_name}
              </span>
              {selectedProduct.product_code && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 shrink-0">
                  {selectedProduct.product_code}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedProduct && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear product filter"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-500' : ''
            }`}
          />
        </div>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full sm:min-w-[320px] bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Input Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU or code..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
            {/* Option: All Products */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-3 py-2 text-left text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                !selectedProductId
                  ? 'bg-blue-50 font-bold text-blue-700'
                  : 'hover:bg-slate-50 text-slate-700 font-medium'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>All Products (Show All Records)</span>
              </div>
              {!selectedProductId && <Check className="w-3.5 h-3.5 text-blue-600" />}
            </button>

            {filteredProducts.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-400">
                No products found matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = String(p.id) === String(selectedProductId);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`w-full px-3 py-2 text-left text-xs rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate block font-semibold">{p.product_name}</span>
                        {p.product_code && (
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-600 shrink-0">
                            {p.product_code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        {p.category?.name && <span>{p.category.name}</span>}
                        {p.business_unit && <span>• Unit: {p.business_unit}</span>}
                        {p.quantity !== undefined && (
                          <span className="font-mono text-slate-500">
                            • Stock: {p.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

