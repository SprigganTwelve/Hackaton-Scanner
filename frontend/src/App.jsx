import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import NewScanPage from "./pages/NewScan/NewScanPage";
import FindingsPage from "./pages/Findings/Findings";
import ScanDashboard from "./pages/scan/ScanDashboard";
import ReportsPage from "./pages/Reports/ReportsPage"
import AppLayout from "./layouts/appLayout";
import FixesPage from "./pages/Fixes/FixesPage";

//-------------------Ajouté pour Login et Register -----------------

import LoginPage from "./pages/Login/Login";
import RegisterPage from "./pages/Register/Register";

//------------------------------------------------------------------

const router = createBrowserRouter([

  //------------------------------------------------------------------------------------
  { path: "/login", element: <LoginPage /> },         //Ajouté pour Login et Register
  { path: "/register", element: <RegisterPage /> },   //Ajouté pour Login et Register
  //------------------------------------------------------------------------------------

  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/new-scan" replace /> },

      { path: "new-scan", element: <NewScanPage /> },

      { path: "scans/:scanId", element: <ScanDashboard /> },

      { path: "scans/:scanId/findings", element: <FindingsPage /> },

	    { path: "scans/:scanId/reports", element: <ReportsPage /> },
      
      { path: "scans/:scanId/fixes", element: <FixesPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}