import { readFile } from "node:fs/promises";
import path from "node:path";

const TRAFFIC_SOURCES_PATH = path.resolve(process.cwd(), "data", "trafficSources.json");

export async function listTrafficSources() {
  const content = await readFile(TRAFFIC_SOURCES_PATH, "utf8");
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [];
}

export async function getTrafficSourceById(id) {
  const sources = await listTrafficSources();
  return sources.find((source) => source.id === id) || null;
}

export async function getManualTrafficSources() {
  const sources = await listTrafficSources();
  return sources.filter((source) => source.spendMethod === "manual");
}

export async function getApiTrafficSources() {
  const sources = await listTrafficSources();
  return sources.filter((source) => source.spendMethod === "api");
}

export function isManualTrafficSource(trafficSource) {
  return trafficSource?.spendMethod === "manual";
}

export function isApiTrafficSource(trafficSource) {
  return trafficSource?.spendMethod === "api";
}
