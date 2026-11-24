export async function fetchJsonWithRetry<T>(
  input: string,
  init?: RequestInit,
  retries = 2
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (init?.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    try {
      const res = await fetch(input, init);
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `Request failed (${res.status})`);
      }
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      if (init?.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      lastError = err;
      // Only retry on transient network TypeError (e.g. dev server restart)
      const isNetworkFailure = err instanceof TypeError;
      if (!isNetworkFailure || attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Network request failed.');
}
