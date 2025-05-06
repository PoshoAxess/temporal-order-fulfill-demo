import * as activity from '@temporalio/activity';

const stripeApiKey = process.env["STRIPE_API_KEY"];
if (!stripeApiKey) {
	throw new ReferenceError(`STRIPE_API_KEY environment variable is not defined`);
}
const stripe = require('stripe')(
	stripeApiKey,
	{ apiVersion: '2025-04-30.preview' }
);

// These define how many tokens are consumed for different aspects of the ride
const TokensForUnlock = 10;
const TokensForTime = 2;
const TokensForDistance = 5;

// Type used as input to the workflow
export interface RideDetails {
	emailAddress: string;
	customerId?: string;
	scooterId?: string;
}

export async function FindStripeCustomerID(data: RideDetails): Promise<string> {
	const email = data.emailAddress;
	console.log(`Searching for Stripe customer with email: ${email}`);

	const customers = await stripe.customers.search({
		query: `email:'${email}'`,
	});

	if (customers.data.length > 0) {
		const customer = customers.data[0];
		return customer.id;
	} else {
		console.log(`No customer found with email: ${email}`);
		throw new Error(`No customer found with email: ${email}`);
	}
}

export async function BeginRide(data: RideDetails): Promise<number> {
	await PostStripeMeterEvent(data.customerId!, TokensForUnlock);
	return TokensForUnlock;
}

export async function PostTimeCharge(data: RideDetails): Promise<number> {
	await PostStripeMeterEvent(data.customerId!, TokensForTime);
	return TokensForTime;
}

export async function PostDistanceCharge(data: RideDetails): Promise<number> {
	await PostStripeMeterEvent(data.customerId!, TokensForDistance);
	return TokensForDistance;
}

export async function EndRide(data: RideDetails): Promise<void> {
	console.log('Ride ending');
}

async function PostStripeMeterEvent(stripeCustomerId: string, tokensConsumed: number): Promise<void> {
	console.log(`Posting ${tokensConsumed} tokens consumed to Stripe for customer ${stripeCustomerId}`);

	try {
		await stripe.billing.meterEvents.create({
			event_name: 'tokens_consumed',
			payload: {
				value: tokensConsumed.toString(),
				stripe_customer_id: stripeCustomerId,
			},
			identifier: `ride_${stripeCustomerId}_${Date.now()}`, // TW: Seems like a poor choice of idempotency key
		});
	} catch (err: any) {
		console.error(`Stripe error: ${err.message}`);
		throw err;
	}
}

