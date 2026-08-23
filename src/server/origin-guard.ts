import 'server-only';

export class OriginError extends Error {
  constructor() {
    super('Cross-origin requests are not allowed.');
    this.name = 'OriginError';
  }
}

export const assertSameOrigin = (request: Request): void => {
  const origin = request.headers.get('origin');
  if (!origin) throw new OriginError();

  let trustedOrigin: string;
  let suppliedOrigin: string;
  try {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configuredSiteUrl) {
      const configuredUrl = new URL(configuredSiteUrl);
      if (
        (configuredUrl.protocol !== 'http:' && configuredUrl.protocol !== 'https:') ||
        configuredUrl.username ||
        configuredUrl.password ||
        configuredUrl.search ||
        configuredUrl.hash
      ) {
        throw new Error('Invalid public site URL.');
      }
      trustedOrigin = configuredUrl.origin;
    } else {
      if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
        throw new Error('Public site URL is required.');
      }
      trustedOrigin = new URL(request.url).origin;
    }
    suppliedOrigin = new URL(origin).origin;
  } catch {
    throw new OriginError();
  }
  if (trustedOrigin !== suppliedOrigin) throw new OriginError();
};
