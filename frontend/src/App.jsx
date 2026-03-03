import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import NewScanPage from "./pages/NewScan/NewScanPage";
import FindingsPage from "./pages/Findings/Findings";
import ScanDashboard from "./pages/scan/ScanDashboard";
import AppLayout from "./layouts/appLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/new-scan" replace /> },

      { path: "new-scan", element: <NewScanPage /> },

      { path: "scans/:scanId", element: <ScanDashboard /> },

      { path: "scans/:scanId/findings", element: <FindingsPage /> },

      // à ajouter plus tard :
      // { path: "scans/:scanId/fixes", element: <FixesPage /> },
      // { path: "scans/:scanId/reports", element: <ReportsPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}