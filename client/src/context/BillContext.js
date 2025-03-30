import { createContext, useState, useContext } from 'react';

const BillContext = createContext();

export const BillProvider = ({ children }) => {
  const [billsUpdated, setBillsUpdated] = useState(0);

  const triggerUpdate = () => {
    setBillsUpdated(prev => prev + 1);
  };

  return (
    <BillContext.Provider value={{ billsUpdated, triggerUpdate }}>
      {children}
    </BillContext.Provider>
  );
};

export const useBillContext = () => useContext(BillContext);