import { getCachedBlackboardRequest } from './requestCache';
import { logBlackboardDiagnostics } from '../utils/diagnostics';

const BLACKBOARD_JSON_ACCEPT = 'application/json';

function previewBody(body: string): string {
  // Keep errors readable in the sidebar and console
  // Blackboard error pages can be huge blobs of html or xml
  return body.replace(/\s+/g, ' ').trim().slice(0, 140);
}

function formatStatus(status: number, statusText: string): string {
  return statusText ? `${status} ${statusText}` : `${status}`;
}

function blackboardHint(
  body: string,
  contentType: string,
  redirected: boolean
): string {
  // Blackboard often returns login pages and xml error documents
  // A short hint makes those failures easier to identify
  if (redirected)
    return ' Blackboard may have redirected this request to a sign-in or error page';
  if (/sign[\s-]?in|login|authenticate|session/i.test(body))
    return ' Blackboard may need a fresh sign-in';
  if (contentType.includes('html') || contentType.includes('xml'))
    return ' Blackboard returned a page instead of API data';
  return '';
}

function withHint(base: string, hint: string): string {
  return hint ? `${base}.${hint}` : base;
}

interface BlackboardFetchOptions {
  cacheKey?: string;
  cacheTtlMs?: number;
}

export default async function fetchBlackboardJson<T>(
  url: string,
  context: string,
  options: BlackboardFetchOptions = {}
): Promise<T> {
  // Default to the url as the cache key
  // Specific callers can override this when a stable logical key reads better
  const cacheKey = options.cacheKey || url;
  const cacheTtlMs = options.cacheTtlMs || 0;

  return getCachedBlackboardRequest(cacheKey, cacheTtlMs, async () => {
    logBlackboardDiagnostics('api request', {
      context,
      cacheKey,
      cacheTtlMs,
      url,
    });

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: BLACKBOARD_JSON_ACCEPT,
      },
    });

    const body = await response.text();
    const trimmed = body.trim();
    const contentType = response.headers.get('content-type') || 'unknown';
    const hint = blackboardHint(trimmed, contentType, response.redirected);

    // Blackboard should answer these REST calls with JSON
    if (!response.ok) {
      throw new Error(
        `${withHint(
          `${context} failed (${formatStatus(response.status, response.statusText)})`,
          hint
        )}: ${previewBody(trimmed)}`
      );
    }

    // Empty payloads hide the real failure and break downstream parsing
    if (!trimmed) {
      throw new Error(`${context} returned an empty response.${hint}`);
    }

    try {
      const parsed = JSON.parse(trimmed) as T;
      logBlackboardDiagnostics('api response', {
        context,
        status: response.status,
        contentType,
      });
      return parsed;
    } catch {
      // XML or HTML usually means Blackboard served an error page instead of API data
      if (trimmed.startsWith('<')) {
        throw new Error(
          `${withHint(
            `${context} returned non-JSON content (${contentType})`,
            hint
          )}: ${previewBody(trimmed)}`
        );
      }
      throw new Error(
        `${withHint(
          `${context} returned invalid JSON (${contentType})`,
          hint
        )}: ${previewBody(trimmed)}`
      );
    }
  });
}
