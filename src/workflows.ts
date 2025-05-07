/**
 * RideShareScooterSession workflow
 *
 * • `addDistance(feet)` — signal from the scooter firmware / mobile app  
 * • `endRide()` — signal when the user taps "End Ride"  
 * • One Stripe meter-event is posted at the end with the total charge (as a # of tokens consumed)
 */
import {
    proxyActivities,
    defineSignal,
    defineQuery,
    setHandler,
    sleep,
    ApplicationFailure,
} from '@temporalio/workflow';

import type * as activities from '../src/activities';
import { RideDetails, RideStatus } from './interfaces/workflow';

// Define Signals and Queries
export const addDistanceSignal = defineSignal('addDistance');
export const endRideSignal = defineSignal('endRide');
export const tokensConsumedQuery = defineQuery('tokensConsumed');
export const getRideDetailsQuery = defineQuery('getRideDetails');

// Workflow function (result is the # of tokens consumed during the ride)
export async function ScooterRideWorkflow(input: RideDetails): Promise<number> {
  let hasRideEnded = false;
  let rideStatus: RideStatus = {
    phase: 'INITIALIZING',
    startedAt: new Date().toISOString(),
    lastMeterAt: new Date().toISOString(),
    distanceFt: 0,
    tokens: {
      unlock: 0,
      time: 0,
      distance: 0,
      total: 0
    },
    pricing: {
      pricePerThousand: input.pricePerThousand ?? 25,
      currency: input.currency ?? 'USD'
    }
  };

  const { FindStripeCustomerID, BeginRide, PostTimeCharge, PostDistanceCharge, EndRide } = proxyActivities<typeof activities>({
    startToCloseTimeout: '1 minute',
    retry: {
      initialInterval: '1s',
      backoffCoefficient: 2.0,
      maximumInterval: '100s',
      nonRetryableErrorTypes: ['CustomerNotFoundException'],
    },
  });

  try {
    // handle 'tokensConsumed' Query (returns # of tokens consumed so far during this ride)
    setHandler(tokensConsumedQuery, () => {
      return rideStatus.tokens.total;
    });

    // handle 'getRideDetails' Query (returns current ride status)
    setHandler(getRideDetailsQuery, () => {
      return {
        ...input,
        status: rideStatus
      };
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
    rideStatus.tokens.unlock = beginRideOutput;
    rideStatus.tokens.total += beginRideOutput;
    rideStatus.phase = 'ACTIVE';

    // Activity 3: Every 15 seconds, post a charge for time on the scooter
    while (!hasRideEnded) {
      // Post time-based charge
      const postTimeChargeOutput = await PostTimeCharge(input);
      rideStatus.tokens.time += postTimeChargeOutput;
      rideStatus.tokens.total += postTimeChargeOutput;

      // Activity 4: post a charge for distance (in response to the signal received)
      while (pendingDistances.length > 0) {
        pendingDistances.shift();
        const postDistanceChargeOutput = await PostDistanceCharge(input);
        rideStatus.tokens.distance += postDistanceChargeOutput;
        rideStatus.tokens.total += postDistanceChargeOutput;
        rideStatus.distanceFt += 100; // Increment distance by 100 feet for each signal
      }

      // Wait for either EndRide signal (end) or 15 seconds (charge for more time)
      const sleepPromise = sleep(15 * 1000);
      await Promise.race([sleepPromise, waitForSignalOrEnd()]);
    }

    // Activity 5: End the ride (in response to the Signal received)  
    const endRideOutput = await EndRide(input);
    console.log(`Ride ended: ${endRideOutput}`);
    rideStatus.phase = 'ENDED';

    return rideStatus.tokens.total;
  } catch (error) {
    rideStatus.phase = 'FAILED';
    rideStatus.lastError = error instanceof Error ? error.message : String(error);
    throw new ApplicationFailure('Ride workflow failed unrecoverably');
  }

  // resolve immediately if ride ended
  function waitForSignalOrEnd(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (hasRideEnded) resolve();
    });
  }
}
