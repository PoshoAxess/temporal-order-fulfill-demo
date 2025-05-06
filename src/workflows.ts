/**
 * RideShareScooterSession workflow
 *
 * • `addDistance(feet)` — signal from the scooter firmware / mobile app  
 * • `endRide()` — signal when the user taps “End Ride”  
 * • One Stripe meter-event is posted at the end with the total charge (as a # of tokens consumed)
 */
import {
    proxyActivities,
    defineSignal,
	defineQuery,
    setHandler,
    condition,
    sleep,
    workflowInfo,
    ApplicationFailure,
  } from '@temporalio/workflow';

import type * as activities from '../src/activities';

// Define Signals and Queries
export const addDistanceSignal = defineSignal('addDistance');
export const endRideSignal = defineSignal('endRide');
export const tokensConsumedQuery = defineQuery('tokensConsumed');

// --- Input type ---
interface RideDetails {
	emailAddress: string; // what the user provides to us
	scooterId: string;
	customerId?: string;  // what we look up from Stripe (based on the email address)
}

// Workflow function (result is the # of tokens consumed during the ride)
export async function ScooterRideWorkflow(input: RideDetails): Promise<number> {
  let tokensConsumed = 0;
  let hasRideEnded = false;

  const { FindStripeCustomerID, BeginRide, PostTimeCharge, PostDistanceCharge, EndRide } = proxyActivities<typeof activities>({
    startToCloseTimeout: '1 minute',
  });

  // handle 'tokensConsumed' Query (returns # of tokens consumed so far during this ride)
  setHandler(tokensConsumedQuery, () => {
    return tokensConsumed;
  });

  // handle 'addDistance' Signal (consume some tokens for distance traveled)
  let pendingDistances: number[] = [];
  setHandler(addDistanceSignal, () => {
    pendingDistances.push(1); // 1 is a count, not a value (it represents 100 feet of travel)
  });

  // handle 'endRide' Signal (ends the Workflow Execution)
  setHandler(endRideSignal, () => {
    hasRideEnded = true;
  });

  // Activity 1: Use the provided email address to look up the Stripe customer ID 
  const stripeCustomerId = await FindStripeCustomerID(input);
  input.customerId = stripeCustomerId;

  // Activity 2: Begin ride (this incurs a fee to unlock the scooter)
  const beginRideOutput = await BeginRide(input);
  tokensConsumed += beginRideOutput;

  // Activity 3: Every 15 seconds, post a charge for time on the scooter
  while (!hasRideEnded) {
    // Post time-based charge
    const postTimeChargeOutput = await PostTimeCharge(input);
    tokensConsumed += postTimeChargeOutput;

    // Actiivity 4: post a charge for distance (in response to the signal received)
    while (pendingDistances.length > 0) {
      pendingDistances.shift();
      const postDistanceChargeOutput = await PostDistanceCharge(input);
      tokensConsumed += postDistanceChargeOutput;
    }

    // Wait for either EndRide signal (end) or 15 seconds (charge for more time)
    const sleepPromise = sleep(15 * 1000);
    await Promise.race([sleepPromise, waitForSignalOrEnd()]);
  }

  // Activity 5: End the ride (in response to the Signal received)  
  const endRideOutput = await EndRide(input);
  console.log(`Ride ended: ${endRideOutput}`);

  return tokensConsumed;

  // resolve immediately if ride ended
  function waitForSignalOrEnd(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (hasRideEnded) resolve();
    });
  }
}
