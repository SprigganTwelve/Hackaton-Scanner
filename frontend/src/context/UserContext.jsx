import React, { createContext, useContext, useState } from 'react';

import UserProject from '../services/DTO/UserProject'

const UserContext = createContext();


const UserContextProvider = ({ children }) => {
  // projects state
  /** @type { [UserProject] } */
  const [projects, setProjects] = useState([]); // The array of project
  const [selectedProjectId, setSelectedProjectId]   =  useState(() => localStorage.getItem("projectId") || "");     // the selected project

  return (
    <UserContext.Provider value={{ projects, setProjects, selectedProjectId, setSelectedProjectId }}>
      {children}
    </UserContext.Provider>
  );
};


/**
 * Custom hook to consume the UserContext
 * @returns {{ projects: any[], setProjects: function }} context value
 */
const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};

export { useUserContext };
export default UserContextProvider;