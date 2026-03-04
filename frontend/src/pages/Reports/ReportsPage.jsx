
import { useMemo, useState, useEffect } from "react";
import { listReports, downloadReport } from "../../services/reports.services"; // <-- ton service
import "./ReportsPage.css";

function formatDateFR(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function monthKey(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabelFR(key) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }).replace(".", "");
}

function DownloadIcon() {
  return <span className="rp-dlIcon" aria-hidden="true">⭳</span>;
}

function ReportItem({ item, onDownloadPdf }) {
  return (
    <div className="rp-item">
      <div className="rp-item__left">
        <button
          type="button"
          className="rp-item__circle rp-item__circleBtn"
          onClick={() => onDownloadPdf(item)}
          aria-label="Télécharger le rapport PDF"
          title="Télécharger le rapport PDF"
        >
          <DownloadIcon />
        </button>

        <div className="rp-item__meta">
          <div className="rp-item__title">
            <span className="rp-item__label">Repository :</span>{" "}
            <span className="rp-item__url">{item.repoUrl}</span>
          </div>
          <div className="rp-item__sub">
            Date : {formatDateFR(item.date)} • commit : {item.commit}
          </div>
        </div>
      </div>

      <div className="rp-item__actions">
        <span className="rp-formatPill" title="Format du rapport">PDF</span>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [month, setMonth] = useState("");

  useEffect(() => {
    async function fetchReports() {
      try {
        const data = await listReports(); // ou passer analysisId si nécessaire
        setReports(data);

        if (data.length > 0) setMonth(monthKey(data[0].date));
      } catch (err) {
        console.error(err);
      }
    }
    fetchReports();
  }, []);

  const monthOptions = useMemo(() => {
    const keys = Array.from(new Set(reports.map((r) => monthKey(r.date))));
    keys.sort((a, b) => (a < b ? 1 : -1)); // desc
    return keys;
  }, [reports]);

  const filtered = useMemo(() => {
    return reports
      .filter((r) => monthKey(r.date) === month)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [reports, month]);

  async function onDownloadPdf(item) {
    try {
      await downloadReport(item.scanId, item.id); 
    } catch (err) {
      console.error(err);
      alert("Erreur lors du téléchargement du PDF : " + err.message);
    }
  }

  return (
    <div className="rp">
      <div className="rp__top">
        <div>
          <h1 className="rp__title">Historique des rapports</h1>
          <p className="rp__subtitle">Consultez l’historique de vos rapports</p>

          <div className="rp__filters">
            <div className="rp-month">
              <span className="rp-month__icon" aria-hidden="true">📅</span>
              <select className="rp-select" value={month} onChange={(e) => setMonth(e.target.value)}>
                {monthOptions.map((k) => (
                  <option key={k} value={k}>{monthLabelFR(k)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="rp-card">
        <div className="rp-card__head">SecureScan rapport de sécurité</div>

        <div className="rp-list">
          {filtered.length === 0 ? (
            <div className="rp-empty">Aucun rapport pour ce mois.</div>
          ) : (
            filtered.map((r) => (
              <ReportItem key={r.id} item={r} onDownloadPdf={onDownloadPdf} />
            ))
          )}
        </div>

        <div className="rp-hint">💡 Télécharger vos rapports pour les consulter.</div>
      </div>
    </div>
  );
}


// import { useMemo, useState } from "react";
// import "./ReportsPage.css";

// // ✅ Mock local (tu pourras remplacer par service + backend plus tard)
// const [reports, setReports] = useState([]);
// //modif
// useEffect(() => {
//   async function fetchReports() {
//     try {
//       // Ici tu peux utiliser listReports(item.scanId) ou listReports() selon backend
//       const data = await listReports(someAnalysisId); 
//       setReports(data);
//     } catch (err) {
//       console.error(err);
//     }
//   }
//   fetchReports();
// }, []);
// //modif


// function formatDateFR(iso) {
//   const d = new Date(iso);
//   return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
// }

// function monthKey(iso) {
//   const d = new Date(iso);
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   return `${y}-${m}`;
// }

// function monthLabelFR(key) {
//   const [y, m] = key.split("-");
//   const d = new Date(Number(y), Number(m) - 1, 1);
//   return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }).replace(".", "");
// }

// function DownloadIcon() {
//   return (
//     <span className="rp-dlIcon" aria-hidden="true">
//       ⭳
//     </span>
//   );
// }

// function ReportItem({ item, onDownloadPdf }) {
//   return (
//     <div className="rp-item">
//       <div className="rp-item__left">
//         <button
//           type="button"
//           className="rp-item__circle rp-item__circleBtn"
//           onClick={() => onDownloadPdf(item)}
//           aria-label="Télécharger le rapport PDF"
//           title="Télécharger le rapport PDF"
//         >
//           <DownloadIcon />
//         </button>

//         <div className="rp-item__meta">
//           <div className="rp-item__title">
//             <span className="rp-item__label">Repository :</span>{" "}
//             <span className="rp-item__url">{item.repoUrl}</span>
//           </div>
//           <div className="rp-item__sub">
//             Date : {formatDateFR(item.date)} • commit : {item.commit}
//           </div>
//         </div>
//       </div>

//       <div className="rp-item__actions">
//         <span className="rp-formatPill" title="Format du rapport">
//           PDF
//         </span>
//       </div>
//     </div>
//   );
// }

// export default function ReportsPage() {
//   // Ici on simule un dataset global ; plus tard tu remplaceras par un fetch:
//   // GET /api/reports?month=YYYY-MM ou GET /api/scans/:id/report
//   const [month, setMonth] = useState(() => monthKey(MOCK_REPORTS[0].date));

//   const monthOptions = useMemo(() => {
//     const keys = Array.from(new Set(MOCK_REPORTS.map((r) => monthKey(r.date))));
//     keys.sort((a, b) => (a < b ? 1 : -1)); // desc
//     return keys;
//   }, []);

//   const filtered = useMemo(() => {
//     return MOCK_REPORTS
//       .filter((r) => monthKey(r.date) === month)
//       .sort((a, b) => (a.date < b.date ? 1 : -1));
//   }, [month]);

//   //modif
//   async function onDownloadPdf(item) {
//     // ✅ Plus tard: window.open(`/api/scans/${item.scanId}/report?format=pdf`)
//     try {
//       // scanId = analysisId côté backend
//       await downloadReport(item.scanId, item.id); 
//     } catch (err) {
//       console.error(err);
//       alert("Erreur lors du téléchargement du PDF : " + err.message);
//     }
//   }
//   //modif
//   return (
//     <div className="rp">
//       <div className="rp__top">
//         <div>
//           <h1 className="rp__title">Historique des rapports</h1>
//           <p className="rp__subtitle">Consultez l’historique de vos rapports</p>

//           <div className="rp__filters">
//             <div className="rp-month">
//               <span className="rp-month__icon" aria-hidden="true">📅</span>
//               <select className="rp-select" value={month} onChange={(e) => setMonth(e.target.value)}>
//                 {monthOptions.map((k) => (
//                   <option key={k} value={k}>
//                     {monthLabelFR(k)}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="rp-card">
//         <div className="rp-card__head">SecureScan rapport de sécurité</div>

//         <div className="rp-list">
//           {filtered.length === 0 ? (
//             <div className="rp-empty">Aucun rapport pour ce mois.</div>
//           ) : (
//             filtered.map((r) => (
//               <ReportItem
//                 key={r.id}
//                 item={r}
//                 onDownloadPdf={onDownloadPdf}
//               />
//             ))
//           )}
//         </div>

//         <div className="rp-hint">💡 Télécharger vos rapports pour les consulter.</div>
//       </div>
//     </div>
//   );
// }