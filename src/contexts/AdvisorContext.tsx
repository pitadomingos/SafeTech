
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdvisorContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const AdvisorContext = createContext<AdvisorContextType | undefined>(undefined);

export const AdvisorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(prev => !prev);

  return (
    <AdvisorContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </AdvisorContext.Provider>
  );
};

export const useAdvisor = () => {
  const context = useContext(AdvisorContext);
  if (context === undefined) {
    throw new Error('useAdvisor must be used within an AdvisorProvider');
  }
  return context;
};
