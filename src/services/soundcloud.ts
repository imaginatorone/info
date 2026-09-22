export interface SoundCloudEmbed {
  title: string;
  html: string;
  width: number | string;
  height: number;
  provider_name: string;
}

export async function getSoundCloudEmbed(url: string, signal?: AbortSignal) {
  const endpoint = new URL("https://soundcloud.com/oembed");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("url", url);

  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`SoundCloud oEmbed request failed: ${response.status}`);
  }

  return response.json() as Promise<SoundCloudEmbed>;
}
