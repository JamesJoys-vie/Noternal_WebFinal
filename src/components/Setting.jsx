import ThemeToggle from './toggle_theme';
import { useTheme } from '../contexts/theme_context';

export const SettingsMenu = () => {
  const { noteColor, setNoteColor, colorPalette } = useTheme();
  const choices = ['yellow', 'white', 'pink', 'purple'];
  const { fontSize, setFontSize } = useTheme();

  const handleChange = (e) => {
    const val = e.target.value;
      if (/^[0-9]*\.?[0-9]*$/.test(val)) {
        setFontSize(val);
    }
  };

  const handleBlur = () => {
    const num = parseFloat(fontSize);

    if (isNaN(num) || num < 10 || num > 20) {
      setFontSize("12");
    }
  };

  return (
    <div className="absolute right-20 top-16 w-52 border-2 rounded-xl p-5 shadow-xl z-50 flex flex-col gap-6 transition-colors duration-300 bg-white dark:bg-[#2b2d36] border-[#d9cbff] dark:border-[#5d3fd3]">
      
      <ThemeToggle />

      {/* Font Size */}
      <div className="flex justify-between items-center">
        <span className="font-semibold text-[#3a2a7a] dark:text-gray-200 transition-colors">Font size</span>
        <input 
          type="text" 
          value={fontSize}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-14 py-1.5 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#3a2a7a] dark:focus:ring-[#5d3fd3] transition-colors bg-[#cbb5ff] dark:bg-[#1f2128] text-[#3a2a7a] dark:text-white"
        />
      </div>

      {/* Note Color */}
      <div className="flex flex-col items-center mt-2">
        <span className="font-semibold text-[#3a2a7a] dark:text-gray-200 mb-3 transition-colors">Note color</span>
        <div className="grid grid-cols-2 gap-4">
          {choices.map((key) => {
            // Pull specific style data for each circle
            const option = colorPalette[key];
            const isSelected = noteColor === key;

            return (
              <button
                key={key}
                onClick={() => setNoteColor(key)}
                className={`
                  ${option.bg}
                  w-14 h-14 rounded-full border-4 shadow-inner 
                  relative group transition-all duration-200 ease-out
                  hover:scale-110 hover:shadow-lg
                  ${isSelected ? 'border-[#616ebe]' : 'border-[#616ebe]/50'}
                `}>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
