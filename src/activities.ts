import * as activity from '@temporalio/activity';
import { StripeMeterEvent } from './interfaces/meterevent';

export async function postStripeMeterEvent(event: StripeMeterEvent): Promise<string> {
  const { attempt } = activity.Context.current().info;

  // // Simulate Stripe service downtime for the first 3 attempts
  // if (attempt <= 3) {
  //   console.log(`Stripe billing API unavailable (attempt ${attempt})`);
  //   await new Promise((resolve) => setTimeout(resolve, 5000)); // simulate delay
  //   throw new Error('Stripe service temporarily unavailable');
  // }

  console.log(`Posting Stripe meter event: 
    Customer: ${event.customerId}, 
    Meter: ${event.meterName}, 
    Amount (¢): ${event.value}, 
    Idempotency Key: ${event.idempotencyKey}`
  );

  // Simulated successful post
  await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate API latency
  return `Stripe meter event posted for customer ${event.customerId}`;
}

function simulateDelay(sleepMs: number): Promise<void> {
  // take sleepMs as input and introduce variance of +/- 20%
  const variance = sleepMs * 0.2;
  sleepMs += Math.floor(Math.random() * 2 * variance) - variance;
  console.log(`Simulating delay of ${sleepMs}ms`);
  return new Promise((resolve) => setTimeout(resolve, sleepMs));
}

export class CreditCardExpiredException extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = CreditCardExpiredException.name;
  }
}