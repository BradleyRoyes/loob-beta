import React, { createContext, useContext, useState } from "react";

const AnalysisDataContext = createContext();

export const useAnalysisData = () => useContext(AnalysisDataContext);

export const AnalysisDataProvider = ({ children = {} }) => {
  const [analysisData, setAnalysisData] = useState({});

  return (
    <AnalysisDataContext.Provider value={{ analysisData, setAnalysisData }}>
      {children}
    </AnalysisDataContext.Provider>
  );
};
