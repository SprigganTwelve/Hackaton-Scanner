import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useMemo, useState,useEffect } from "react";
import { useNavigate} from "react-router-dom";
import { api } from "../services/API"


import { useUserContext } from '../context/UserContext'


import "./AppLayout.css";
import { listProjects } from "../services/projects.services";


export default function AppLayout() {
	const navigate = useNavigate();
	const {
		projects,
		setProjects,
		selectedProjectId,
		setSelectedProjectId
	} = useUserContext();
	const projectOptions = useMemo(() => projects, [projects]);

	useEffect(() => {
		(async () => {
			const res = await listProjects();

			// res peut être: {projects:[...]} ou directement [...]
			const items = res?.data ??  [];

			setProjects(items);

			// si rien sélectionné, on prend le 1er
			if (!selectedProjectId && items.length) {
				const firstId = String(items[0].id ?? items[0].projectId ?? items[0].originalName);
				setSelectedProjectId(firstId)
				localStorage.setItem("projectId", firstId);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function handleLogout() {
		try {
			// ⚠️ adapte l’URL à celle du backend
			await fetch("/api/logout", {
				method: "POST",          
				credentials: "include",  // important si session/cookies
			});
		}
		catch (e) {
			console.error("Logout error:", e);
		}
		finally {
			navigate("/login"); 
		}
	}

  return (
    <div className="layout">
		{/* sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar__title">SecureScan</h2>

        <nav className="sidebar__nav">
          	<NavLink className="sidebar__link" to="/scans">Dashboard</NavLink>
			<NavLink className="sidebar__link" to="/new-project">Nouveau Projet</NavLink>
          	<NavLink className="sidebar__link" to="/scans/:projectId/:analysisId/findings">Findings</NavLink>
			<NavLink className="sidebar__link" to="/scans/:projectId/fixes">Corrections</NavLink>
			<NavLink className="sidebar__link" to="/scans/:projectId/reports">Rapport</NavLink>
			{/* <NavLink className="sidebar__link" to="/settings">Paramètres</NavLink> */}

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
					value={selectedProjectId}
					onChange={(e) => {
						setSelectedProjectId(e.target.value);
						console.log("SELECTED PROJECT: ", e.target.value)
						localStorage.setItem("projectId", e.target.value);
					}}
					aria-label="Sélection projet"
				>
					{(projects??[]).map((p) => {
						const id = p.projectId;
						const label = p.name ?? p.repoUrl ?? `Projet ${id}`;
						return (
							<option key={id} value={id}>
								{label}
							</option>
						);
					})}
				</select>
			
            </div>
          </div>
          <div className="header__right">
			<button className="header__iconBtn" type="button" onClick={handleLogout} title="Déconnexion">Deconnexion ⎋</button>
            <button className="header__profile" type="button" title="Profil" aria-label="Profil">
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
					d="M20 21a8 8 0 10-16 0"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					/>
					<path
					d="M12 13a5 5 0 100-10 5 5 0 000 10z"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					/>
				</svg>
			</button>
          </div>
        </header>

		<main className="content">
			<Outlet />
		</main>
	  </div>
    </div>
  );
}