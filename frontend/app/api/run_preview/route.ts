import { NextRequest, NextResponse } from "next/server";

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

function normalizeRunPreview(item: Record<string, unknown>) {
  return {
    ...item,
    id: item._id,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = new URLSearchParams();

    const experimentoPreviewId = searchParams.get("experimento_preview_id");
    const operarios = searchParams.get("operarios");

    if (experimentoPreviewId) params.set("experimento_preview_id", experimentoPreviewId);
    if (operarios) params.set("operarios", operarios);

    const path = params.toString().length > 0 ? `/run_preview/?${params.toString()}` : "/run_preview/";
    const response = await proxyRequest(path);
    const data = await response.json();
    return NextResponse.json(Array.isArray(data) ? data.map(normalizeRunPreview) : data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Error fetching run previews:", error);
    return NextResponse.json({ error: "No se pudieron obtener los run previews" }, { status: 500 });
  }
}
