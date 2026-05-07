export const FilterMenu = ({ availableLabels, activeFilters, toggleFilter }) => {
  return (
    <div className="absolute right-full mr-4 top-0 w-64 bg-white dark:bg-[#2b2d36] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 z-50 flex flex-wrap gap-2 animate-in fade-in slide-in-from-right-2">
      
      {availableLabels.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 w-full text-center py-2">
          No labels created yet.
        </p>
      ) : (
        availableLabels.map(label => {
          const isActive = activeFilters.includes(label);
          
          return (
            <button
              key={label}
              onClick={() => toggleFilter(label)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                isActive 
                  ? 'bg-[#5d3fd3] text-white border-[#5d3fd3] shadow-md' // Selected state
                  : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700' // Unselected state
              }`}
            >
              {label}
            </button>
          );
        })
      )}
    </div>
  );
};
