import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getScanSummary, listFindings } from "../../services/scans.services";
import { useNavigate } from "react-router-dom";
// import pour searchbar
import { useOutletContext } from "react-router-dom";
import "./ScanDashboard.css";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";

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
  const s = (sev || "").toLowerCase();
  const cls =
    s === "critical" ? "sev--critical" :
    s === "high" ? "sev--high" :
    s === "medium" ? "sev--medium" :
    "sev--low";
  const label =
    s === "critical" ? "CRITIQUE" :
    s === "high" ? "HAUTE" :
    s === "medium" ? "MOYENNE" :
    "BASSE";
  return <span className={`sev ${cls}`}>{label}</span>;
}

function DiagnosticsGauge({ summary }) {
  // On calcule un “total” à afficher au centre.
  const total = useMemo(() => {
    const sev = summary?.severities || {};
    return (sev.critical ?? 0) + (sev.high ?? 0) + (sev.medium ?? 0) + (sev.low ?? 0);
  }, [summary]);

  // On prend OWASP sous 2 formats possibles:
  // 1) tableau [{code,label,count}]
  // 2) objet {A03: 6, A05: 7}
  const owaspList = useMemo(() => {
    const o = summary?.owasp;
    if (!o) return [];
    if (Array.isArray(o)) {
      return o.map((x) => ({
        code: x.code,
        label: x.label || x.code,
        count: Number(x.count) || 0,
      }));
    }
    return Object.entries(o).map(([code, count]) => ({
      code,
      label: code,
      count: Number(count) || 0,
    }));
  }, [summary]);

  const top4 = useMemo(() => {
    const sorted = [...owaspList].sort((a, b) => b.count - a.count);
    return sorted.slice(0, 4);
  }, [owaspList]);

  const sumTop = useMemo(() => top4.reduce((acc, x) => acc + x.count, 0), [top4]);

  // Data pour un demi-gauge : on prend "valeur" + "reste" à modifier
  const gaugeData = useMemo(() => {
    const value = sumTop;
    const rest = Math.max(0, total - value);
    return [
      { name: "top", value },
      { name: "rest", value: rest },
    ];
  }, [sumTop, total]);

  return (
    <Card title="Diagnostics par Catégories" className="ds-panel">
      <div className="ds-gauge">
        <div className="ds-gauge__chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                dataKey="value"
                startAngle={180}
                endAngle={0}
                innerRadius="72%"
                outerRadius="92%"
                paddingAngle={2}
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="ds-gauge__center">
            <div className="ds-gauge__big">{total.toLocaleString()}</div>
            <div className="ds-gauge__small">Erreurs classées par catégorie OWASP 2025</div>
          </div>
        </div>

        <div className="ds-gauge__list">
          {top4.length === 0 ? (
            <div className="ds-muted">Aucune catégorie OWASP</div>
          ) : (
            top4.map((x) => {
              const pct = total > 0 ? Math.round((x.count / total) * 100) : 0;
              return (
                <div key={x.code} className="ds-gaugeRow">
                  <div className="ds-gaugeRow__left">
                    <span className="ds-dot" />
                    <span className="ds-gaugeRow__pct">{pct}%</span>
                    <span className="ds-gaugeRow__label">{x.label}</span>
                  </div>
                  <div className="ds-gaugeRow__count">{x.count.toLocaleString()}</div>
                </div>
              );
            })
          )}
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

function FindingsTable({ findings }) {
  const [q, setQ] = useState("");
  const [sev, setSev] = useState("all");
  const [lang, setLang] = useState("all");

  const filtered = useMemo(() => {
    return (findings || [])
      .filter((f) => {
        const txt = `${f.title ?? ""} ${f.description ?? ""} ${f.file ?? ""} ${f.tool ?? ""} ${f.owasp ?? ""}`.toLowerCase();
        return txt.includes(q.trim().toLowerCase());
      })
      .filter((f) => (sev === "all" ? true : (f.severity || "").toLowerCase() === sev))
      // lang = placeholder (le backend pourra fournir language plus tard)
      .filter(() => (lang === "all" ? true : true));
  }, [findings, q, sev, lang]);

  return (
    <Card title="Diagnostics" className="ds-panel ds-tablePanel">
      <div className="ds-tableTop">
        <div className="ds-search">
          <span className="ds-search__icon">⌕</span>
          <input
            className="ds-search__input"
            placeholder="Rechercher fichier, règle, CVE..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="ds-filters">
          <select className="ds-select" value={sev} onChange={(e) => setSev(e.target.value)}>
            <option value="all">Sévérité</option>
            <option value="critical">Critique</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>

          <select className="ds-select" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="all">Langages</option>
            <option value="js">JS/TS</option>
            <option value="php">PHP</option>
            <option value="py">Python</option>
          </select>
        </div>
      </div>

      <div className="ds-table">
        <div className="ds-row ds-row--head">
          <div>Sévérité</div>
          <div>Diagnostic</div>
          <div>Fichier</div>
          <div>Outil</div>
          <div>OWASP</div>
          <div></div>
        </div>

        {filtered.length === 0 ? (
          <div className="ds-empty">Aucun résultat</div>
        ) : (
          filtered.map((f) => (
            <div key={f.id || `${f.file}:${f.line}:${f.title}`} className="ds-row">
              <div><SeverityPill sev={f.severity} /></div>
              <div className="ds-diag">
                <div className="ds-diag__title">{f.title || "Finding"}</div>
                <div className="ds-diag__desc">{f.description || ""}</div>
              </div>
              <div className="ds-file">{f.file}{f.line ? `:${f.line}` : ""}</div>
              <div className="ds-tool">{f.tool || "—"}</div>
              <div className="ds-owasp">{f.owasp || "—"}</div>
              <div className="ds-actions">
                <button className="ds-miniBtn" type="button">Détails</button>
                <button className="ds-miniBtn ds-miniBtn--primary" type="button">Correctif</button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export default function ScanDashboard() {
  const { scanId } = useParams();
  const [summary, setSummary] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!scanId) return;
    setLoading(true);
    setErr(null);

    Promise.all([getScanSummary(scanId), listFindings(scanId)])
      .then(([s, f]) => {
        setSummary(s);
        setFindings(Array.isArray(f) ? f : []);
      })
      .catch((e) => setErr(e))
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) return <div className="ds-loading">Chargement…</div>;
  if (err) return <div className="ds-loading">Erreur: {String(err.message || err)}</div>;
  if (!summary) return <div className="ds-loading">Aucune donnée</div>;

  // KPIs : on supporte plusieurs shapes possibles (mock vs back final)
  const grade = summary.grade ?? summary.scoreGrade ?? "—";
  const totalErrors = summary?.stats?.totalErrors ?? summary?.errorsDetected ?? 0;
  const vulnerableDeps = summary?.stats?.vulnerableDependencies ?? summary?.vulnerableDependencies ?? 0;
  const recFixes = summary?.stats?.recommendedFixes ?? summary?.recommendedFixes ?? 0;

  return (
    <div className="ds">
      <div className="ds-topbar">
        <div className="ds-topbar__title">Dashboard</div>
        <div className="ds-topbar__actions">
          <button className="ds-topBtn ds-topBtn--primary" type="button" onClick={() => navigate("/new-scan")}>Nouveau Scan +</button>
        </div>
      </div>

      <div className="ds-kpis">
        <KpiCard title="Score de sécurité globale" value={grade} />
        <KpiCard title="Erreurs détectées" value={totalErrors} badge={summary?.severities?.critical ? "critical" : null} />
        <KpiCard title="Dépendances vulnérables" value={vulnerableDeps} sub="+5 nouveaux" />
        <KpiCard title="Correctifs recommandés" value={recFixes} sub="+5 nouveaux" />
      </div>

      <div className="ds-mainGrid">
        <DiagnosticsGauge summary={summary} />
        <IntegrationGitCard />
      </div>

      <FindingsTable findings={findings} />
    </div>
  );
}