import { useMemo, useState } from "react";
import "./FixesPage.css";

//  Mock local (tu pourras remplacer par service + backend plus tard)
const MOCK_FIXES = [
  { id: "f1", repoUrl: "src/App.js", codeCorrompu: true },
  { id: "f2", repoUrl: "src/LoginForm.jsx", codeCorrompu: false },
];

const MOCK_DEPENDENCIES = [
  { id: "d1", name: "react", vulnerability: "None" },
  { id: "d2", name: "axios", vulnerability: "High - XSS" },
];

// Composant pour une ligne fichier
function FixeItem({ item }) {
  return (
    <div className="fixes-card">
        <div className="fixes-card__file">{item.repoUrl}</div>
        <div className={`fixes-card__status ${item.codeCorrompu ? "corrupted" : "ok"}`}>{item.codeCorrompu ? "Code corrompu" : "OK"}</div>
      <button className="fixes-card__btn">Apply Correction</button>
    </div>
  );
}

// Composant pour une ligne dépendance
function DependencyItem({ dep }) {
  return (
    <div className="fixes-card">
      <div className="fixes-card__file">{dep.name}</div>
      <div
        className={`fixes-card__status ${
          dep.vulnerability !== "None" ? "vulnerable" : "ok"
        }`}
      >
        {dep.vulnerability}
      </div>
      <button className="fixes-card__btn">Apply Correction</button>
    </div>
  );
}

export default function FixesPage() {
  return (
    <div className="fixes-page">
      {/* Header interne avec boutons */}
      <div className="fixes-page__header">
        <div className="fixes-page__actions">
          <button className="btn-push">Push On Github</button>
          <button className="btn-apply">Apply Correction</button>
        </div>
      </div>

    
      {/* Section 1 : Fichiers analysés */}
      <div className="fixes-section">
        <h2>Fichiers Corrompus</h2>
        <div className="fixes-list">
          {MOCK_FIXES.map((f) => (
            <FixeItem key={f.id} item={f} />
          ))}
        </div>
      </div>

      {/* Section 2 : Dépendances vulnérables */}
      <div className="fixes-section">
        <h2>Dépendances vulnérables</h2>
        <div className="fixes-list">
          {MOCK_DEPENDENCIES.map((d) => (
            <DependencyItem key={d.id} dep={d} />
          ))}
        </div>
      </div>
    </div>
  );
}


// // Composant pour chaque fichier corrigé
// function FixeItem({ item }) {
//   return (
//     <div className="fixes-item">
//       <div className="fixes-item__file">{item.repoUrl}</div>
//       <div
//         className={`fixes-item__status ${
//           item.codeCorrompu ? "corrupted" : "ok"
//         }`}
//       >
//         {item.codeCorrompu ? "Code corrompu" : "OK"}
//       </div>
//     </div>
//   );
// }

// export default function FixesPage() {

//   return (
// <div className="fixes-page">
//   <div className="fixes-header">
//     <h1>Fichiers Corrompus</h1>
//   </div>

//   {/* Partie 1 : Fichiers analysés */}
//   <div className="fixes-section">
//     <h2>Fichiers analysés</h2>
//     <div className="fixes-list">
//       {MOCK_FIXES.map((f) => (
//         <div key={f.id} className="fixes-item">
//           <div className="fixes-item__file">{f.repoUrl}</div>
//           <div className="fixes-item__status">
//             {f.codeCorrompu ? "Code corrompu" : "OK"}
//           </div>
//         </div>
//       ))}
//     </div>
//   </div>

//   {/* Partie 2 : Dépendances vulnérables */}
//   <div className="fixes-section">
//     <h2>Dépendances vulnérables</h2>
//     <div className="fixes-list">
//       {MOCK_DEPENDENCIES.map((d) => (
//         <div key={d.id} className="fixes-item">
//           <div className="fixes-item__file">{d.name}</div>
//           <div className="fixes-item__status">{d.vulnerability}</div>
//         </div>
//       ))}
//     </div>
//   </div>
// </div>
//   );
// }