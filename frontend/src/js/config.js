export async function loadConfig() {
  const res = await fetch("/config.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load config.json (${res.status})`);
  }
  return await res.json();
}