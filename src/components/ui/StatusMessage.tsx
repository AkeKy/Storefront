type StatusMessageProps =
  | { state: 'loading'; title?: string; description?: string }
  | { state: 'empty'; title?: string; description?: string }
  | { state: 'error'; title?: string; description?: string; onRetry?: () => void };

const defaults = {
  loading: {
    title: 'Loading products',
    description: 'Finding the right gear for your setup.',
  },
  empty: {
    title: 'No products found',
    description: 'Try adjusting your search or filters.',
  },
  error: {
    title: 'We could not load products',
    description: 'Please check your connection and try again.',
  },
};

export function StatusMessage(props: StatusMessageProps) {
  const copy = defaults[props.state];
  const title = props.title ?? copy.title;
  const description = props.description ?? copy.description;
  const role = props.state === 'error' ? 'alert' : props.state === 'loading' ? 'status' : undefined;

  return (
    <section
      className="surface-card mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center"
      role={role}
      aria-live={props.state === 'empty' ? 'polite' : undefined}
    >
      {props.state === 'loading' && (
        <span
          className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"
          aria-hidden="true"
        />
      )}
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {props.state === 'error' && props.onRetry && (
        <button className="btn-primary mt-6" type="button" onClick={props.onRetry}>
          Try again
        </button>
      )}
    </section>
  );
}
