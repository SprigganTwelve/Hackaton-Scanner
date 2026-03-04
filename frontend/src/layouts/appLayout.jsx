import { Outlet, NavLink } from "react-router-dom";
import "./AppLayout.css";

export default function AppLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2 className="sidebar__title">SecureScan</h2>

        <nav className="sidebar__nav">
          <NavLink className="sidebar__link" to="/scans/1">Dashboard</NavLink>
		      <NavLink className="sidebar__link" to="/new-scan">Nouveau scan</NavLink>
          <NavLink className="sidebar__link" to="/scans/1/findings">Findings</NavLink>
          <NavLink className="sidebar__link" to="/scans/1/fixes">Corrections</NavLink>
          <NavLink className="sidebar__link" to="/scans/1/reports">Rapport</NavLink>
          <NavLink className="sidebar__link" to="/settings">Paramètres</NavLink>

          <div className="sidebar__spacer" />

        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}