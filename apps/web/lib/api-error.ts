export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string | Array<{ msg?: string }> };
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    if (Array.isArray(payload.detail)) {
      return payload.detail.map((item) => item.msg ?? JSON.stringify(item)).join("; ");
    }
  } catch {
    // ignore parse errors
  }
  return `${fallback} (${response.status})`;
}
