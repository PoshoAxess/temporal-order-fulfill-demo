import { Client } from '@temporalio/client';
import { ScooterRideWorkflow } from './workflows';

export interface ScooterSessionParams {
  scooterId: string;
  emailAddress: string;
  customerId?: string;
  meterName: string;
  rideTimeoutSecs?: number;
}

export async function runWorkflow(
  client: Client,
  taskQueue: string,
  params: ScooterSessionParams
): Promise<void> {
  try {
	const result = await client.workflow.execute(ScooterRideWorkflow, {
	  taskQueue,
	  workflowId: `scooter-session-${params.scooterId}`,
	  args: [params],
	});

		console.log(`Scooter session workflow succeeded:`, result);
	} catch (error) {
		console.error(`Scooter session workflow failed:`, error);
	}
}
