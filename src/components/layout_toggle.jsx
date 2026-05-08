import { Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline';
import { useLayout } from '../contexts/layout_context';

export function LayoutToggle() {
  const { viewMode, toggleViewMode } = useLayout();

  return (
    <button 
      onClick={toggleViewMode}
      className="w-16 h-16 bg-[#5d3fd3] rounded-full text-white shadow-xl flex items-center justify-center hover:bg-[#4a32a8] transition-all"
    >
      {viewMode === 'grid' ? (
        <TableCellsIcon className="w-8 h-8" /> 
      ) : (
        <Squares2X2Icon className="w-8 h-8" /> 
      )}
    </button>
  );
}
