export type OrderSubmissionResult = { mode: 'demo' };

export async function createOrder(): Promise<OrderSubmissionResult> {
  return { mode: 'demo' };
}
