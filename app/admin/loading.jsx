export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-8 max-w-7xl mx-auto w-full">
      {/* Título y Subtítulo Skeleton */}
      <div className="border-b border-navy-800 pb-6 mb-10">
        <div className="h-8 bg-navy-900 w-64 rounded-lg mb-4"></div>
        <div className="h-4 bg-navy-900 w-96 rounded"></div>
      </div>

      {/* Tarjetas KPI o Grid de elementos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-navy-800"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-navy-800 rounded w-1/2"></div>
              <div className="h-8 bg-navy-800 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Contenedor Principal (Tabla o Listado) */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden mt-8">
        <div className="border-b border-navy-800 p-4">
          <div className="h-6 bg-navy-800 rounded w-48"></div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded bg-navy-800"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-navy-800 rounded w-48"></div>
                  <div className="h-3 bg-navy-800 rounded w-32"></div>
                </div>
              </div>
              <div className="h-8 w-24 bg-navy-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
