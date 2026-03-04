import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AppLayout.css";

export default function AppLayout() {
	const navigate = useNavigate();
	const [project, setProject] = useState("demo-repo");

	const projectOptions = useMemo(
		() => ["demo-repo", "payments-api", "legacy-php", "node-service"],
		[]
	);

	async function handleLogout() {
	try {
		// ⚠️ adapte l’URL à celle du backend
		await fetch("/api/logout", {
		method: "POST",          
		credentials: "include",  // important si session/cookies
		});
	} catch (e) {
		console.error("Logout error:", e);
	} finally {
		navigate("/login"); 
	}
	}

  return (
    <div className="layout">
		{/* sidebar */}
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

	   <div className="layout__main">
        <header className="header">
          <div className="header__left">
            <div className="header__pill">
				<span className="header__pillLabel">Projet :</span>
				<select
					className="header__select"
					value={project}
					onChange={(e) => setPoject(e.target.value)}
					aria-label="Sélection projet"
				>
					{projectOptions.map((p) => (
					<option key={p} value={p}>{p}</option>
					))}
				</select>
			
            </div>
          </div>
          <div className="header__right">
			<button className="header__iconBtn" type="button" onClick={handleLogout} title="Déconnexion">Deconnexion ⎋</button>
            <button className="header__profile" type="button" title="Profil">PR</button>
          </div>
        </header>

		<main className="content">
			<Outlet />
		</main>
	  </div>
    </div>
  );
}