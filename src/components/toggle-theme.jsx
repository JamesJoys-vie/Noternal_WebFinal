import { useTheme } from '../contexts/theme-context';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="flex justify-between items-center w-full">
      <span className="font-semibold text-[#3a2a7a] dark:text-gray-200 transition-colors">
        Switch theme
      </span>
      <button 
        onClick={toggleTheme}
        className="w-12 h-6 rounded-full relative p-0.5 border transition-colors duration-200 bg-gray-300 dark:bg-[#5d3fd3] border-gray-300 dark:border-[#5d3fd3]"
      >
        <div 
          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
            isDarkMode ? 'translate-x-6' : 'translate-x-0'
          }`} 
        />
      </button>
    </div>
  );
};

export default ThemeToggle;
