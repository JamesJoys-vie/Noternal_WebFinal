/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState('grid');

  const toggleViewMode = () => {
    setViewMode(prev => (prev === 'grid' ? 'list' : 'grid'));
  };

  return (
    <LayoutContext.Provider value={{ viewMode, toggleViewMode }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
