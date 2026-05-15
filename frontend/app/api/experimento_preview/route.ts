import { NextResponse } from "next/server";

const configuredBaseUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

function getBaseUrls(): string[] {
  const candidates = [configuredBaseUrl, "http://localhost:8000", "http://backend:8000"];
  const values = candidates.filter((value): value is string => Boolean(value));
  return Array.from(new Set(values));
}

async function proxyRequest(path: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (const baseUrl of getBaseUrls()) {
    try {
      return await fetch(`${baseUrl}${path}`, init);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No backend URL available");
}

function normalizeExperimentoPreview(item: Record<string, unknown>) {
  return {
    ...item,
    id: item._id,
  };
}

export async function GET() {
  try {
    const response = await proxyRequest("/experimento_preview/");
    const data = await response.json();
    return NextResponse.json(Array.isArray(data) ? data.map(normalizeExperimentoPreview) : data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Error fetching experimento previews:", error);
    return NextResponse.json({ error: "No se pudieron obtener los experimentos" }, { status: 500 });
  }
}
