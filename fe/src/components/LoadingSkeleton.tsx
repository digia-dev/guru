export function CardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
      <div className="h-7 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto animate-pulse">
      <div className="h-10 bg-gray-100 border-b"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex border-b last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 p-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm animate-pulse flex justify-between">
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-7 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-32 mb-6"></div>
      <div className="h-52 bg-gray-100 rounded"></div>
    </div>
  );
}
