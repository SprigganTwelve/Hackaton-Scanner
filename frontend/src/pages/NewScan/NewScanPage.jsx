// src/pages/NewScan/NewScanPage
import { useMemo, useRef, useState } from "react";
import "./NewScanPage.css";
import CodeScannerTool from "../../enums/CodeScannerTool";

import { useNavigate } from "react-router-dom";
import { addProjetWithUrl, addProjectWithZip, scan } from "../../services/projects.services";

import {useUserContext} from '../../context/UserContext'

const PROVIDERS = [
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
  { value: "other", label: "Autre" },
];

const TOOLS = [
  { id: CodeScannerTool.SEMGREP, name: "Semgrep", tag: "SAST", desc: "Analyse statique du code" },
  { id: CodeScannerTool.NPM_AUDIT, name: "npm audit", tag: "Dépendances", desc: "Audit des dépendances npm" },
  { id: CodeScannerTool.ESLINT, name: "ESLint", tag: "SAST", desc: "Règles de sécurité ESLint" },
];


const FIXED_SCAN_TOOLS = [
  CodeScannerTool.SEMGREP,
  CodeScannerTool.NPM_AUDIT,
  CodeScannerTool.ESLINT,
];


function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

function ToolCard({ tool, enabled, onToggle }) {
  return (
    <button
      type="button"
      className={`toolCard ${enabled ? "toolCard--enabled" : ""}`}
      onClick={() => onToggle(tool.id)}
    >
      <div className="toolCard__top">
        <div className="toolCard__name">{tool.name}</div>
        <Pill>{tool.tag}</Pill>
      </div>
      <div className="toolCard__desc">{tool.desc}</div>
    </button>
  );
}

export default function NewScanPage() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate()

  const { setProjects } = useUserContext()

	const [sourceType, setSourceType] = useState("git"); // "git" | "zip"
	const [provider, setProvider] = useState("github");
	const [branch, setBranch] = useState("main");

 	const [name, setName] = useState("");
	const [repoUrl, setRepoUrl] = useState("");
	const [gitAccessToken, setGitAccessToken] = useState("");

  const [zipFile, setZipFile] = useState(null);

//   const [enabledTools, setEnabledTools] = useState(() => new Set(TOOLS.map((t) => t.id)));
  const [autoDetected, setAutoDetected] = useState({
    language: "Node.js + TypeScript",
    framework: "Express.js",
    packageManager: "npm",
  });

  const canLaunch = useMemo(() => {
    if (sourceType === "git") return repoUrl.trim().length > 0;
    return !!zipFile;
  }, [sourceType, repoUrl, zipFile]);

  function toggleTool(id) {
    setEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onPickZip() {
    fileInputRef.current?.click();
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] || null;
    setZipFile(f);
  }

  const handleLaunch = async () => {
    try {
      let result;
      
      //Add project to bdd (backend)
      if(sourceType === 'git')
      {
        result = await addProjetWithUrl({
          name: repoUrl.split('/').pop()?.replace(/\.git$/, ''),
          repoUrl,
          token: gitAccessToken,
        });
      }
      else if(sourceType === 'zip')
      {
        if(zipFile)
        {
          const formdata = new FormData()
          formdata.append('file', zipFile)
          result = await addProjectWithZip(formdata);
        }
        else{
          alert('Vous devez upload un fichier')
          return;
        }
      }

      

      if (result?.success === false) {
        alert(result?.message || "Création projet impossible")
        return;
      }

      alert(result?.message || "Projet créé !")
      console.log("ADD PROJECT - new: ", result.data)
      console.log("ADD PROJECT - RESULT: ", result)
      
      setProjects(projects => ([...projects, result.data]))

	    const projectId  = result.data.projectId
      navigate(`/scans?projectId=${projectId}`)
    } 
    catch (e) {
      console.error(e);
      alert("Erreur serveur lors de la création du projet")
    }
  };

  return (
    <div className="ns">
      <div className="ns__header">
        <div>
          <h1 className="ns__title">Nouveau scan de sécurité</h1>
          <p className="ns__subtitle">Soumettez votre projet pour une analyse complète de sécurité</p>
        </div>
      </div>

      <div className="ns__grid">
        {/* LEFT */}
        <div className="card card--big">
          <div className="card__title">Source du projet</div>

          <div className="sourceToggle">
            <button
              type="button"
              className={`sourceToggle__btn ${sourceType === "git" ? "isActive" : ""}`}
              onClick={() => {
                setSourceType("git")
              }}
            >
              <div className="sourceToggle__icon">⎇</div>
              <div className="sourceToggle__text">
                <div className="sourceToggle__name">Repository Git</div>
                <div className="sourceToggle__hint">GitHub, GitLab ou autre</div>
              </div>
            </button>

            <button
              type="button"
              className={`sourceToggle__btn ${sourceType === "zip" ? "isActive" : ""}`}
              onClick={() => setSourceType("zip")}
            >
              <div className="sourceToggle__icon">⤓</div>
              <div className="sourceToggle__text">
                <div className="sourceToggle__name">Upload ZIP</div>
                <div className="sourceToggle__hint">Archive de votre projet</div>
              </div>
            </button>
          </div>

          {/* Git form */}
          {sourceType === "git" && (
            <div className="form">
              <div className="form__label">Provider Git</div>
              <select className="input" value={provider} onChange={(e) => setProvider(e.target.value)}>
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>

              <div className="form__label">URL du repository</div>
              <input
                className="input"
                placeholder="https://github.com/acme/payments-api"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />

              <div className="form__label">Branche (optionnel)</div>
              <input className="input" placeholder="main" value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>
          )}

          {/* ZIP form */}
          {sourceType === "zip" && (
            <div className="zipBox">
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={onFileChange}
                style={{ display: "none" }}
              />

              <div className="zipBox__row">
                <button type="button" className="btn btn--ghost" onClick={onPickZip}>
                  Choisir un ZIP
                </button>
                <div className="zipBox__file">
                  {zipFile ? (
                    <>
                      <span className="zipBox__fileName">{zipFile.name}</span>
                      <span className="zipBox__fileMeta">
                        ({Math.round(zipFile.size / 1024)} KB)
                      </span>
                    </>
                  ) : (
                    <span className="zipBox__filePlaceholder">Aucun fichier sélectionné</span>
                  )}
                </div>
              </div>

              <div className="zipBox__hint">
                Astuce : évite d’inclure `node_modules/` dans l’archive.
              </div>
            </div>
          )}

          <div className="card card--inner">
            <div className="card__title">Détection automatique</div>
            <div className="detectRow">
              <div className="detectItem">
                <div className="detectItem__k">Langage détecté</div>
                <div className="detectItem__v">{autoDetected.language}</div>
              </div>
              <div className="detectItem">
                <div className="detectItem__k">Framework</div>
                <div className="detectItem__v">{autoDetected.framework}</div>
              </div>
              <div className="detectItem">
                <div className="detectItem__k">Package manager</div>
                <div className="detectItem__v">{autoDetected.packageManager}</div>
              </div>
            </div>

            <div className="mutedNote">
              Les outils CLI s’exécutent côté serveur, les résultats JSON sont parsés et stockés.
            </div>
          </div>

          <button type="button" className="btn_launchScan" onClick={handleLaunch}>
            ▶ Ajouter projet
          </button>
        </div>

        {/* RIGHT */}
        <div className="card">
          <div className="card__title">Outils activés</div>
          <div className="tools">
				{
          TOOLS.filter((t) => FIXED_SCAN_TOOLS.includes(t.id)).map((t) => (
            <div 
              key={t.id}
              className="toolCard toolCard--enabled"
              style={{ cursor: "default" }}
            >
              <div className="toolCard__top">
                <div className="toolCard__name">{t.name}</div>
                <Pill>{t.tag}</Pill>
              </div>
              <div className="toolCard__desc">{t.desc}</div>
            </div>
          ))
        }
			</div>

        </div>
      </div>
    </div>
  );
}