import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NewScanPage from "./pages/NewScan/NewScanPage";

const router = createBrowserRouter([
    {
        path:"/",
        element: <AppLayout />,
        children: [
            {path:"new-scan", element:<NewScanPage/>}
        ]
    }
])
export default function app(){
    return <RouterProvider router={router} />
 
}