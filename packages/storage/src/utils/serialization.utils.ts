let toonModule: any = null;

/**
 * Dynamically imports the TOON serializer if available.
 */
async function getToon() {
  if (!toonModule) {
    try {
      toonModule = await import('@toon-format/toon');
    } catch {
      // Silent JSON fallback
    }
  }
  return toonModule;
}

/**
 * Serializes data into a string using TOON (if requested and available) or JSON.
 */
export async function serializeData<T>(data: T, useToon = false): Promise<string> {
  if (useToon) {
    const toon = await getToon();
    if (toon) {
      return toon.encode(data);
    }
  }
  return JSON.stringify(data);
}

/**
 * Deserializes a string into data using TOON (if requested and available) or JSON.
 */
export async function deserializeData<T>(text: string, useToon = false): Promise<T> {
  if (useToon) {
    const toon = await getToon();
    if (toon) {
      return toon.decode(text) as T;
    }
  }
  return JSON.parse(text) as T;
}
