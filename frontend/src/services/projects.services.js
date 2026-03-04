// src/services/projects.services.js
import { api } from "./API";
import * as mock from "./projects.mock";

const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

export async function listProjects() {
  if (useMocks) return mock.listProjects();
  return api.get("/api/users/projects");
}

export async function getProjectAnalysis(projectId) {
  if (useMocks) return mock.getProjectAnalysis(projectId);
  return api.get(`/api/users/projects/${projectId}/analysis`);
}