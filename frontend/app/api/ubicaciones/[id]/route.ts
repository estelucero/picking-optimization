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

function normalizeUbicacion(item: Record<string, unknown>) {
  return {
    ...item,
    id: item.id ?? item._id,
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = await Promise.resolve(params);
    const response = await proxyRequest(`/ubicaciones/${id}`);
    const data = await response.json();
    return NextResponse.json(normalizeUbicacion(data), { status: response.status });
  } catch (error) {
    console.error("Error fetching ubicacion:", error);
    return NextResponse.json({ error: "No se pudo obtener la distribucion" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const response = await proxyRequest(`/ubicaciones/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(normalizeUbicacion(data), { status: response.status });
  } catch (error) {
    console.error("Error updating ubicacion:", error);
    return NextResponse.json({ error: "No se pudo actualizar la distribucion" }, { status: 500 });
  }
}
