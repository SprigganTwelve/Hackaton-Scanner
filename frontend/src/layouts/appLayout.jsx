import { Outlet, NavLink } from "react-router-dom";

export default function appLayout(){
    return(
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
            <aside style={{ padding: 16, borderRight: "1px solid #eee" }}>
                <H2>Secure Scan</H2>
                <NAV style={{ display: "grid", gap: 8 }}>
                    <NavLink to="/new-scan">Nouveau Scan</NavLink>
                    <NavLink to="/scans/1">Dashboard</NavLink>
                    <NavLink to="/scans/1/Findings">Findings</NavLink>
                    <NavLink to="/scans/1/Fixes">Correction</NavLink>
                    <NavLink to="/scans/1/Reports">Rapport</NavLink>
                </NAV>
            </aside>
            <main style={{ padding: 24 }}>
                <Outlet />
            </main>
        </div>

    )
}