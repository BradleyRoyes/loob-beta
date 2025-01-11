import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderProps {
  onBackClick?: () => void;
  toggleView?: () => void;
  preserveState?: boolean;
  onProfileClick?: () => void;
  onConfigureClick?: () => void;
}

const HeaderContext = createContext<{
  headerProps: HeaderProps;
  setHeaderProps: React.Dispatch<React.SetStateAction<HeaderProps>>;
}>({
  headerProps: {},
  setHeaderProps: () => {},
});

export const useHeaderContext = () => useContext(HeaderContext);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [headerProps, setHeaderProps] = useState<HeaderProps>({});

  return (
    <HeaderContext.Provider value={{ headerProps, setHeaderProps }}>
      {children}
    </HeaderContext.Provider>
  );
};
