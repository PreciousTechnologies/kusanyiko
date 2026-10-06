import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TableSkeleton } from './skeleton-loaders';
import { EmptyState } from './ui-bits';
import { springs } from '../lib/motion-tokens';
import { cn } from '../lib/utils';

export interface ColumnDef {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean; // default true
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface DataTableProps<T = any> {
  columns: ColumnDef[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  initialSortColumn?: string;
  initialSortDirection?: 'asc' | 'desc';
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  emptyTitle?: string;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = 'Search records...',
  searchFilter,
  initialSortColumn,
  initialSortDirection = 'asc',
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  emptyTitle = 'No Records Found',
  emptyMessage = 'No matching entries found.',
  actions,
  toolbar,
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(initialSortColumn || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    initialSortColumn ? initialSortDirection : null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // 1. Search Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const q = searchQuery.toLowerCase().trim();
    if (searchFilter) {
      return data.filter((row) => searchFilter(row, q));
    }

    return data.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some((nested) =>
            String(nested).toLowerCase().includes(q)
          );
        }
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [data, searchQuery, searchFilter]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // 3. Pagination
  const totalEntries = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  // Handle Sort Toggle (3 states: asc -> desc -> unsorted)
  const handleSort = (key: string) => {
    if (sortColumn !== key) {
      setSortColumn(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else if (sortDirection === 'desc') {
      setSortColumn(null);
      setSortDirection(null);
    }
    setCurrentPage(1);
  };

  // Generate pagination page numbers window
  const paginationRange = useMemo(() => {
    const delta = 1;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (typeof i === 'number') {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      }
    });

    return rangeWithDots;
  }, [totalPages, safeCurrentPage]);

  if (loading) {
    return <TableSkeleton rows={pageSize} />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table Toolbar & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-8 text-xs sm:text-sm rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_15%,transparent)] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[var(--foreground)] p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      </div>

      {/* Main Table Structure */}
      {paginatedData.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--secondary)_40%,transparent)] text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                  {columns.map((col) => {
                    const isSortable = col.sortable !== false;
                    const isSorted = sortColumn === col.key;

                    return (
                      <th
                        key={col.key}
                        onClick={() => isSortable && handleSort(col.key)}
                        className={cn(
                          'py-3 px-4 font-semibold whitespace-nowrap',
                          isSortable && 'cursor-pointer hover:text-[var(--primary)] transition-colors',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.className
                        )}
                      >
                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5',
                            col.align === 'right' && 'justify-end',
                            col.align === 'center' && 'justify-center'
                          )}
                        >
                          <span>{col.label}</span>
                          {isSortable && (
                            <span className="inline-flex">
                              {isSorted ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-[var(--primary)]" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5 text-[var(--primary)]" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  {actions && (
                    <th className="py-3 px-4 text-right whitespace-nowrap">
                      <span>Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[13px]">
                {paginatedData.map((row, idx) => (
                  <motion.tr
                    key={row.id ?? idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.snappy, delay: idx * 0.03 }}
                    className="row-hover transition-colors"
                  >
                    {columns.map((col) => {
                      const val = row[col.key];
                      const rendered = col.render ? col.render(val, row) : val;

                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'py-3.5 px-4 text-[var(--foreground)] align-middle',
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center',
                            typeof val === 'number' && 'tnum',
                            col.className
                          )}
                        >
                          {rendered ?? '-'}
                        </td>
                      );
                    })}

                    {actions && (
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Windowed Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-[var(--border)] bg-[var(--card)] text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong className="tnum text-[var(--foreground)]">{(safeCurrentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong className="tnum text-[var(--foreground)]">
                  {Math.min(safeCurrentPage * pageSize, totalEntries)}
                </strong>{' '}
                of <strong className="tnum text-[var(--foreground)]">{totalEntries}</strong> entries
              </span>

              {/* Page size selector */}
              <div className="flex items-center gap-1.5 ml-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-7 px-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-xs hover:border-[color-mix(in_srgb,var(--primary)_60%,transparent)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center gap-1 max-w-full overflow-x-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  title="Previous page"
                  aria-label="Previous page"
                  className="w-8 h-8 shrink-0 rounded-lg border border-[color-mix(in_srgb,var(--primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] active:scale-95 disabled:bg-[var(--card)] disabled:text-muted-foreground disabled:border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--card)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_40%,transparent)]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {paginationRange.map((page, pIdx) => {
                  if (page === '...') {
                    return (
                      <span key={`dots-${pIdx}`} className="px-1 text-muted-foreground">
                        …
                      </span>
                    );
                  }

                  const pageNum = Number(page);
                  const isActive = pageNum === safeCurrentPage;

                  return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-8 h-8 shrink-0 rounded-lg text-xs font-semibold transition-all tnum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_40%,transparent)]',
                      isActive
                        ? 'bg-[var(--primary)] text-white shadow-sm ring-1 ring-[var(--primary)]'
                        : 'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_70%,transparent)] hover:text-[var(--primary)]'
                    )}
                  >
                    {pageNum}
                  </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  title="Next page"
                  aria-label="Next page"
                  className="w-8 h-8 shrink-0 rounded-lg border border-[color-mix(in_srgb,var(--primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] active:scale-95 disabled:bg-[var(--card)] disabled:text-muted-foreground disabled:border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--card)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_40%,transparent)]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
