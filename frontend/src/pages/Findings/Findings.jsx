import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getProjectAnalysis } from "../../services/projects.services";
import { listFindings } from "../../services/scans.services";

export default function FindingsPage() {
  const { projectId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Récupérer l'analyse liée au projet
        const analysisRes = await getProjectAnalysis(projectId);
        // selon ce que renvoie ton backend / service
        const analysisId =
          analysisRes?.analysisRecordId ||
          analysisRes?.data?.analysisRecordId ||
          analysisRes?.data?.id;

        if (!analysisId) {
          throw new Error("Aucune analyse trouvée pour ce projet");
        }

        // 2) Récupérer les findings pour cette analyse
        const findingsRes = await listFindings(analysisId);

        const findings =
          Array.isArray(findingsRes) ? findingsRes :
          Array.isArray(findingsRes?.data) ? findingsRes.data :
          findingsRes?.items ?? [];

        if (!cancelled) {
          setItems(findings);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p>Erreur : {String(error.message || error)}</p>;

  return (
    <div>
      <h1>Findings</h1>
      {items.length === 0 ? (
        <p>Aucun finding pour ce projet.</p>
      ) : (
        <pre>{JSON.stringify(items, null, 2)}</pre>
      )}
    </div>
  );
}