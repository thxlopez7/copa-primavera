export default function FixtureLoading() {
  return (
    <div className="min-h-screen bg-navy-950 p-6 md:p-12 animate-pulse">
      {/* Cabecera Skeleton */}
      <div className="max-w-7xl mx-auto mb-10 text-center">
        <div className="w-16 h-16 bg-navy-900 rounded-2xl mx-auto mb-4"></div>
        <div className="h-10 bg-navy-900 w-64 mx-auto rounded-lg mb-2"></div>
        <div className="h-4 bg-navy-900 w-96 mx-auto rounded"></div>
      </div>
      
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Grupos Skeleton */}
        <div>
          <div className="h-8 bg-navy-900 w-48 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-navy-900 h-64 rounded-2xl border border-navy-800"></div>
            ))}
          </div>
        </div>

        {/* Eliminatorias Skeleton */}
        <div>
          <div className="h-8 bg-navy-900 w-64 rounded mb-6"></div>
          <div className="flex gap-8 overflow-hidden">
            {[1, 2, 3].map(col => (
              <div key={col} className="w-64 flex-shrink-0 flex flex-col justify-around gap-4 h-96">
                {[...Array(Math.pow(2, 3 - col))].map((_, i) => (
                  <div key={i} className="h-24 bg-navy-900 rounded-xl border border-navy-800"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
