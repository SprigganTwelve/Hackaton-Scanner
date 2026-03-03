import { Outlet, NavLink } from "react-router-dom";

export default function AppLayout(){
    return(
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
            <aside style={{ padding: 16, borderRight: "1px solid #eee" }}>
                <h2>Secure Scan</h2>
                <nav style={{ display: "grid", gap: 8 }}>
                    <NavLink to="/new-scan">Nouveau Scan</NavLink>
					<NavLink to="/scans/1">Dashboard</NavLink>
					<NavLink to="/scans/1/findings">Findings</NavLink>
					<NavLink to="/scans/1/fixes">Correction</NavLink>
					<NavLink to="/scans/1/reports">Rapport</NavLink>
                </nav>
            </aside>
            <main style={{ padding: 24 }}>
                <Outlet />
            </main>
        </div>

    )
}