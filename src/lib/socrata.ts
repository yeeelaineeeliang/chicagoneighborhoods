const SOCRATA_BASE = "https://data.cityofchicago.org/resource";

export async function socrataFetch(
  endpoint: string,
  params: Record<string, string>
) {
  const url = new URL(`${SOCRATA_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = {};
  if (process.env.SOCRATA_APP_TOKEN) {
    headers["X-App-Token"] = process.env.SOCRATA_APP_TOKEN;
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Socrata API error: ${res.status}`);
  }

  return res.json();
}
