/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(12);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const [noteColor, setNoteColor] = useState('white');
  const toggleTheme = () => setIsDarkMode(prev => !prev);
  const colorPalette = {
    yellow: { 
      bg: 'bg-[#faf8d1]', 
      text: 'text-gray-900',
    },
    white: { 
      bg: 'bg-white dark:bg-[#1f2025]', 
      text: 'text-gray-900 dark:text-gray-100', 
    },
    pink: { 
      bg: 'bg-[#f8b3b3]', 
      text: 'text-gray-900', 
    },
    purple: { 
      bg: 'bg-[#ccd0fa]', 
      text: 'text-gray-900', 
    },
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, 
                                    fontSize, setFontSize,
                                    noteColor, setNoteColor, colorPalette 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
