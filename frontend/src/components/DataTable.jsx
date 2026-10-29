import React from 'react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function DataTable({
  columns,
  data = [],
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no items to show.',
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  pagination,
  onPageChange,
  extraHeaderActions,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header controls */}
      {(onSearchChange || extraHeaderActions) && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {onSearchChange && (
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          )}
          {extraHeaderActions && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {extraHeaderActions}
            </div>
          )}
        </div>
      )}

      {/* Table content */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <LoadingState message="Loading data..." />
        ) : !data.length ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {columns.map((col, idx) => (
                  <th key={idx} className={`py-3.5 px-4 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`py-3.5 px-4 text-slate-700 align-middle ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination controls */}
      {pagination && pagination.total > 0 && (
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{pagination.from || 1}</span> to{' '}
            <span className="font-semibold text-slate-800">{pagination.to || data.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.total}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-slate-700">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

