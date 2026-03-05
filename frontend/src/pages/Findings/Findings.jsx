import { useEffect, useState } from "react";
// import { listFindings } from "../../services/scans.services";
import { useParams } from "react-router-dom";
// import { api } from "../../services/api"

export default function FindingsPage() {
  const { scanId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    listFindings(scanId)
      .then(setItems)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p>Erreur: {String(error.message || error)}</p>;

  return (
    <div>
      <h1>Findings</h1>
      <pre>{JSON.stringify(items, null, 2)}</pre>
    </div>
  );
}