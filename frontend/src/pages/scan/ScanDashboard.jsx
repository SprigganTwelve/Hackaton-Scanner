import { useEffect, useState } from "react";
import { createScanFromRepo } from "../../services/scans.services";
import { useParams } from "react-router-dom";

export default function ScanDashboard() {
    return (
    <div>
        <h1>Soumission de projet</h1>
        <p>URL Git ou upload ZIP (à implémenter).</p>
    </div>
  );
}