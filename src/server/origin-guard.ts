export class OriginError extends Error {
  constructor() {
    super('Cross-origin requests are not allowed.');
    this.name = 'OriginError';
  }
}

export const assertSameOrigin = (request: Request): void => {
  const origin = request.headers.get('origin');
  if (!origin) throw new OriginError();

  let requestOrigin: string;
  let suppliedOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
    suppliedOrigin = new URL(origin).origin;
  } catch {
    throw new OriginError();
  }
  if (requestOrigin !== suppliedOrigin) throw new OriginError();
};
