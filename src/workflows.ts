/**
 * RideShareScooterSession workflow
 *
 * • `addDistance(feet)` — signal from the scooter firmware / mobile app  
 * • `endRide()` — signal when the user taps “End Ride”  
 * • One Stripe meter-event is posted at the end with the total charge in ¢
 */

import {
    proxyActivities,
    defineSignal,
    setHandler,
    condition,
    sleep,
    workflowInfo,
    ApplicationFailure,
  } from '@temporalio/workflow';

  import type * as activities from '../src/activities';
  
  /* ---------- Activities (implemented elsewhere) ---------- */
  const { postStripeMeterEvent } = proxyActivities<typeof activities>({
    startToCloseTimeout: '10 seconds',
    retry: { maximumAttempts: 5 },
  });
  
  /* ---------- Signals ---------- */
  export const addDistance = defineSignal<[number]>('addDistance'); // feet travelled
  export const endRide = defineSignal('endRide');
  
  /* ---------- Pricing constants (example values) ---------- */
  const UNLOCK_FEE_CENTS = 100;                 // $1.00 flat
  const DIST_RATE_CENTS_PER_FT = 0.02;          // 2¢ per foot
  const TIME_RATE_CENTS_PER_SEC = 0.03 / 60;    // 3¢ per minute
  
  /* ---------- Return type ---------- */
  interface CostBreakdown {
    totalCents: number;
    distanceFt: number;
    durationSecs: number;
    cost: { unlock: number; distance: number; time: number };
  }
  
  /* ---------- Workflow ---------- */
  export async function RideShareScooterSessionWorkflow(opts: {
    customerId: string;
    meterName: string;
    rideTimeoutSecs?: number;                   // optional max ride length
  }): Promise<CostBreakdown> {
    /* session state */
    const startedAt = Date.now();;             // UNIX ms
    let distanceFt = 0;
    let rideEnded = false;
  
    /* signal handlers */
    setHandler(addDistance, (ft) => {
      distanceFt += ft;
    });
  
    setHandler(endRide, () => {
      rideEnded = true;
    });
  
    /* optional safety timeout (e.g. 12 h) */
    if (opts.rideTimeoutSecs) {
      sleep(opts.rideTimeoutSecs * 1000).then(() => {
        if (!rideEnded) {
          rideEnded = true;                     // auto-end
        }
      });
    }
  
    /* wait for `endRide` or timeout above */
    await condition(() => rideEnded);
  
    const durationSecs = Math.ceil((Date.now() - startedAt) / 1000);
  
    /* pricing */
    const cost = {
      unlock: UNLOCK_FEE_CENTS,
      distance: Math.ceil(distanceFt * DIST_RATE_CENTS_PER_FT),
      time: Math.ceil(durationSecs * TIME_RATE_CENTS_PER_SEC),
    };
    const totalCents = cost.unlock + cost.distance + cost.time;
  
    /* bill exactly once */
    await postStripeMeterEvent({
      customerId: opts.customerId,
      meterName: opts.meterName,
      value: totalCents,
      idempotencyKey: workflowInfo().workflowId, // prevents double-billing on retry
    });
  
    return { totalCents, distanceFt, durationSecs, cost };
  }
  