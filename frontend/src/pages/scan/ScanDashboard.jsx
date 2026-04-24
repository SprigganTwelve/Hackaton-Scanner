import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getLastScanSummary, listFindings } from "../../services/scans.services";
import { useNavigate } from "react-router-dom";
import { scan } from "../../services/projects.services.js"

import {useUserContext} from "../../context/UserContext";
import "./ScanDashboard.css";

import { getLatestAnalysisRecords } from "../../utils/getLatestAnalysisRecords.jsx";
import AnalysisFinding from '../../services/DTO/AnalysisFinding'

import UserProject from '../../services/DTO/UserProject.js'
import OwaspCategoryMap from '../../services/DTO/OwaspCategoryMap.js' 
import MappedIssue from '../../services/DTO/MappedIssue.js'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";
import { useCallback } from "react";

function Card({ title, children, className = "" }) {
  return (
    <div className={`ds-card ${className}`}>
      <div className="ds-card__title">{title}</div>
      {children}
    </div>
  );
}

function KpiCard({ title, value, sub, badge }) {
  return (
    <Card title={title} className="ds-kpi">
      <div className="ds-kpi__row">
        <div className="ds-kpi__value">{value ?? "—"}</div>
        {badge ? <span className={`ds-badge ds-badge--${badge}`}>{badge.toUpperCase()}</span> : null}
      </div>
      {sub ? <div className="ds-kpi__sub">{sub}</div> : null}
    </Card>
  );
}

function SeverityPill({ sev }) {
  const cleanSeverity = (sev || "").toLowerCase();
  const cls =
    cleanSeverity === "critical" ? "sev--critical" :
    cleanSeverity === "high" ? "sev--high" :
    cleanSeverity === "medium" ? "sev--medium" :
    "sev--low";
  const label =
    cleanSeverity === "critical" ? "CRITIQUE" :
    cleanSeverity === "high" ? "HAUTE" :
    cleanSeverity === "medium" ? "MOYENNE" :
    "BASSE";
  return <span className={`sev ${cls}`}>{label}</span>;
}




/**
 * Gauge circulaire pour afficher les diagnostics d’un projet
 * basé sur les nouvelles données fournies.
 *
 * @param {Object} props
 * @param {{
 *   score: string,
 *   quantityError: number,
 *   quantityVulnerableDependences: number,
 *   quantityRecommandedSolution: number
 * }} props.data
 */
export function DiagnosticsGauge({ data }) {
  // Calcul du total pour le centre du gauge
  const total = useMemo(
    () =>
      (data?.quantityError ?? 0) +
      (data?.quantityVulnerableDependences ?? 0) +
      (data?.quantityRecommandedSolution ?? 0),
    [data]
  );

  // Construction des données pour le PieChart
  const gaugeData = useMemo(() => {
    return [
      { name: "Erreurs", value: data?.quantityError ?? 0 },
      { name: "Dépendances vulnérables", value: data?.quantityVulnerableDependences ?? 0 },
      { name: "Solutions recommandées", value: data?.quantityRecommandedSolution ?? 0 },
    ];
  }, [data]);

  return (
    <Card title={`Diagnostics (Score: ${data?.score || "-"})`} className="ds-panel">
      <div className="ds-gauge">
        <div className="ds-gauge__chart">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gaugeData}
                dataKey="value"
                startAngle={180}
                endAngle={0}
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                label={({ name, percent }) => `${name} (${Math.round(percent * 100)}%)`}
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="ds-gauge__center">
            <div className="ds-gauge__big">{total.toLocaleString()}</div>
            <div className="ds-gauge__small">Total d’éléments analysés</div>
          </div>
        </div>

        <div className="ds-gauge__list">
          {gaugeData.map((x) => {
            const pct = total > 0 ? Math.round((x.value / total) * 100) : 0;
            return (
              <div key={x.name} className="ds-gaugeRow">
                <div className="ds-gaugeRow__left">
                  <span className="ds-dot" />
                  <span className="ds-gaugeRow__pct">{pct}%</span>
                  <span className="ds-gaugeRow__label">{x.name}</span>
                </div>
                <div className="ds-gaugeRow__count">{x.value.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}



function IntegrationGitCard() {
  const [enabled, setEnabled] = useState(true);
  const [branchName, setBranchName] = useState("fix/securescan-2026-03-05");

  return (
    <Card title="Intégration Git" className="ds-panel ds-git">
      <div className="ds-git__row">
        <div className="ds-git__label">Créer branche de correction</div>
        <button
          type="button"
          className={`ds-switch ${enabled ? "ds-switch--on" : ""}`}
          onClick={() => setEnabled((v) => !v)}
          aria-label="toggle"
        >
          <span className="ds-switch__thumb" />
        </button>
      </div>

      <div className="ds-field">
        <div className="ds-field__label">Nom de branche</div>
        <input
          className="ds-input"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          disabled={!enabled}
        />
      </div>

      <button type="button" className="ds-btn" disabled={!enabled}>
        Push on Github
      </button>

      <div className="ds-muted ds-mt8">
        (Backend) Ce bouton appellera plus tard: <code>POST /api/scans/:id/apply-fixes</code>
      </div>
    </Card>
  );
}



/**
 * Component displaying a table of findings from an analysis.
 * @param {Object} props
 * @param {
 *  ? {
  *     owasp: OwaspCategoryMap,   // OWASP categories mapped to findings
  *     analysisRecord: { 
  *       id: string,              // Analysis record ID
  *       project_id: number,      // ID of the project analyzed
  *       score?: string           // Optional score: A, B, C, D
  *     },
  *     eslint: MappedIssue[],    // Array of ESLint findings
  *     npmAudit: any             // NPM audit result, can be null
  *   }
  * } props.scanResult
 * @param { AnalysisFinding[] | null } props.findings - Array of findings to display in the table.
 * @returns { JSX.Element } The rendered findings table.
 */
function FindingsTable({ findings, scanResult }) {
  
  const filteredSecurityScanResult = findings ?? scanResult ?? {}
  console.log({ findings , scanResult })

  return (
    <Card title="Diagnostics" className="ds-panel ds-tablePanel">

      <div className="ds-table">
        <div className="ds-row ds-row--head">
          <div>Sévérité</div>
          <div>Diagnostic</div>
          <div>Fichier</div>
          <div>Outil</div>
          <div>OWASP</div>
          <div></div>
        </div>

        {
          Array.isArray(findings)  ? 
              findings.length === 0 ? (
                <div className="ds-empty">Aucun résultat</div>
              ) : (
                findings.map((value) => (
                  <div key={ value.findingId || `${value.filePath}:${value.fingerprint}:${value.ruleId}`} className="ds-row">
                    <div><SeverityPill sev={value.severity} /></div>
                    <div className="ds-diag">
                      <div className="ds-diag__title">{value.ruleName ?? value.ruleId ?? "Finding"}</div>
                      <div className="ds-diag__desc">{value.solution ?? ""}</div>
                    </div>
                    <div className="ds-file">{value.filePath}{value.line ? `:${f.line}` : ""}</div>
                    <div className="ds-tool">{value.toolName ?? "—"}</div>
                    <div className="ds-owasp">{value.owaspCategory.join(" - ") ?? "—"}</div>
                    <div className="ds-actions">
                      <button className="ds-miniBtn" type="button">Détails</button>
                      <button className="ds-miniBtn ds-miniBtn--primary" type="button">Correctif</button>
                    </div>
                  </div>
                ))
              )
            : <></>
        }

      </div>
    </Card>
  );
}



export default function ScanDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { projects = [], selectedProjectId } = useUserContext();
  
  const [kpi, setKpi] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);

  /** @type {[AnalysisFinding[] | null]} */
  const [findings, setFindings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [scanning, setScanning] = useState(false);

  // --- Selection du projet ---
  useEffect(() => {
    if (!projects || projects.length === 0) return;

    const projectId = searchParams.get('projectId') ?? selectedProjectId?.trim();
    const foundProject = projects.find(p => String(p.projectId) === String(projectId)) ?? projects[projects.length - 1];
    console.log("-----CURRENT PROJECT-------------", foundProject)
    setCurrentProject(foundProject);
  }, [projects, searchParams, selectedProjectId]);



  // --- Fetch KPIs et findings ---
  useEffect(() => {
    if (!currentProject?.projectId) 
      return;

    setLoading(true);
    setErr(null);
    
    const latestAnalysis = getLatestAnalysisRecords([currentProject])[0]?.latestAnalysis;
    loadData(latestAnalysis?.id)
  }, [currentProject]);

  // --- Scan ---
  useEffect(() => {
    async function makeScan() {
      if (!scanning || !currentProject?.projectId)
        return;

      console.log("-----SCAN STRATED ....")
      try {
        const { results } = await scan({
          projectId: currentProject.projectId,
          repoUrl: currentProject.url,
          isZip: currentProject.isUploaded
        });
        console.log("SCAN RESULT")
        setScanResult(results);
      }
      catch (e) {
        setErr(e);
      }
      finally {
        setScanning(false);
      }
      console.log("-------SCAN ENDED ....")
      loadData()
    }
    makeScan();
  }, [scanning, currentProject]);

    useEffect(()=>{
    console.log("----USEEFFECT FINDINGS UPDATED-------------", findings)
  }, [findings])
  //-- Callabcks

  const loadData = useCallback(async(analysisId)=>{
      await Promise.all([
        getLastScanSummary(analysisId),
        listFindings(analysisId)
      ])
        .then(([kpiData, findingsData]) => {
          setKpi(kpiData);
          setFindings(
            findingsData?.success && Array.isArray(findingsData.data) ? 
              findingsData?.data 
              : null
          );
          console.log("---LOADING DATA------", findingsData)
        })
        .catch(e => setErr(e))
        .finally(() => setLoading(false));
  },[currentProject, setKpi, setFindings, setLoading])


  // --- Loading / Errors ---
  if (loading) return <div className="ds-loading">Chargement…</div>;
  if (err) return <div className="ds-loading">Erreur: {String(err.message || err)}</div>;
  if (!kpi) return <div className="ds-loading">Aucune donnée</div>;

  // --- KPIs ---
  const grade = kpi.score ?? '??';
  const totalErrors = kpi.quantityError ?? 0;
  const totalVulnerableDeps = kpi.quantityVulnerableDependences ?? 0;
  const totalRecommandedSolution = kpi.quantityRecommandedSolution ?? 0;

  return (
    <div className="ds">
      <div className="ds-topbar">
        <div className="ds-topbar__title">Dashboard</div>
        <div className="ds-topbar__actions">
          <button className="ds-topBtn ds-topBtn--primary" type="button">Générer rapport</button>
          <button className="ds-topBtn ds-topBtn--primary" type="button" onClick={() => setScanning(true)}>Scan</button>
          <button className="ds-topBtn ds-topBtn--primary" type="button" onClick={() => navigate("/new-project")}>Ajouter nouveau projet +</button>
        </div>
      </div>

      <div className="ds-kpis">
        <KpiCard title="Score de sécurité globale" value={grade} />
        <KpiCard title="Erreurs détectées" value={totalErrors} badge={totalErrors > 40 ? 'Critical' : null} />
        <KpiCard title="Dépendances vulnérables" value={totalVulnerableDeps} sub="Infos générales" />
        <KpiCard title="Correctifs recommandés" value={totalRecommandedSolution} sub="Applicable" />
      </div>

      <div className="ds-mainGrid">
        <DiagnosticsGauge data={kpi} />
        <IntegrationGitCard />
      </div>

      <FindingsTable 
        findings={findings}
        scanResult={scanResult}
      />
    </div>
  );
}