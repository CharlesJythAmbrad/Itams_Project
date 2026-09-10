import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DataTablePagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate pagination items with ellipses
  const getPageNumbers = () => {
    if (totalPages <= 1) {
      return [1]
    }

    const delta = 1 // number of pages around current page
    const range = []
    const rangeWithDots = []

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    // Remove duplicates
    return Array.from(new Set(rangeWithDots))
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-b-[5px]">
      {/* Showing X to Y of Z entries */}
      <div className="text-xs text-muted-foreground text-center sm:text-left">
        Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
        <span className="font-semibold text-foreground">{endItem}</span> of{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> results
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Page */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs font-medium rounded-[5px] gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || totalPages <= 1}
          title="Previous Page"
        >
          <ChevronLeft className="size-3.5" />
          <span>Prev</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`dots-${index}`}
                  className="size-8 flex items-center justify-center text-xs text-muted-foreground select-none"
                >
                  ...
                </span>
              )
            }

            const isCurrent = currentPage === page

            return (
              <Button
                key={page}
                variant={isCurrent ? "default" : "outline"}
                size="sm"
                className={`size-8 p-0 rounded-[5px] text-xs transition-colors ${
                  isCurrent
                    ? "bg-red-700 hover:bg-red-800 text-white font-semibold dark:bg-red-600 shadow-xs"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground border-zinc-200 dark:border-zinc-800"
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          })}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs font-medium rounded-[5px] gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          title="Next Page"
        >
          <span>Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default DataTablePagination
