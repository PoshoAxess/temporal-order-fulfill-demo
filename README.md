# Temporal Demo: RideShare Scooter Session (TypeScript)

### Overview
A Temporal workflow simulating a rideshare scooter session. This demo highlights Temporal's durability and signal-based interaction by modeling a pay-per-use ride. The Workflow uses Stripe for usage-based billing. See the `stripe-notes.md`
file in the `demo` directory for step-by-step instructions for Stripe setup.

This scenario is a natural fit for Temporal due to several key advantages:
* Durable state tracking: Temporal maintains state over time without requiring external persistence. The session's duration, distance, and accumulated cost are managed in-memory by the workflow and survive process restarts or crashes.
* Signal-driven interaction: Signals from the mobile app or scooter firmware (e.g., addDistance, endRide) allow real-time updates without polling or manual state reconciliation.
* Automatic timeout logic: Built-in timers (sleep) cleanly handle session expiration (e.g., abandoned scooters), without needing separate infrastructure or cron jobs.
* Exactly-once billing: Stripe’s billing API is called once and only once, even if retries or failures occur, thanks to Temporal’s built-in idempotency and retry semantics.
* Operational simplicity: No external coordination is needed to ensure billing happens only at the end, and only once. Temporal workflows encapsulate the full lifecycle.

This approach reduces infrastructure complexity, increases billing accuracy, and ensures clean separation between control flow (Temporal) and business logic (activities).

-- 


### Running this sample

The sample is configured by default to connect to a [local Temporal Server](https://docs.temporal.io/cli#starting-the-temporal-server) running on localhost:7233

```
temporal server start-dev
```

To instead connect to Temporal Cloud, set the following environment variables, replacing them with your own Temporal Cloud credentials.

With mTLS:

```bash
TEMPORAL_ADDRESS=testnamespace.sdvdw.tmprl.cloud:7233
TEMPORAL_NAMESPACE=testnamespace.sdvdw
TEMPORAL_CLIENT_CERT_PATH="/path/to/file.pem"
TEMPORAL_CLIENT_KEY_PATH="/path/to/file.key"
```

With API key:
```bash
TEMPORAL_ADDRESS=us-west-2.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=testnamespace.sdvdw
TEMPORAL_API_KEY="your-api-key"
# ensure TEMPORAL_CLIENT_CERT_PATH and TEMPORAL_CLIENT_KEY_PATH are not set
```

`npm install` to install dependencies.

Run `npm run start` to start the Worker. (You can also get [Nodemon](https://www.npmjs.com/package/nodemon) to watch for changes and restart the worker automatically by running `npm run start.watch`.)

You must specify the `--scooterId` and `--emailAddress` arguments when 
running the workflow. The former uniquely identifies the scooter session.

## Demonstration scenario summary
Before performing any demonstration, you must do some one-time setup
in Stripe, as [documented in these instructions](../demo/stripe-notes.md)
to establish the Customer, Product, Meter, and Subscription associated 
with usage-based billing in Stripe. 

For all scenarios below, you will have at least two terminal windows
(or tabs). In each, set the `STRIPE_API_KEY` environment variable to
your Stripe secret API key.

In the first terminal, run the `npm install` command to install the
dependencies and `npm run start` to start the Worker, as described
above. In the second, follow the steps below to demonstrate a specific 
scenario.


### Happy Path
In this scenario, everything works as expected on the first try. There 
are no failures. The e-mail address must correspond to the one you set
up in Stripe, as per [these instructions](../demo/stripe-notes.md).

```command
npm run workflow -- --scooterId=1230 --emailAddress=maria@example.com
```

This starts the Workflow Execution, which bills the user some number 
of tokens for an initial "unlock the scooter" charge and consumes some
additional number of tokens for each subsequent 15 seconds of use. 

In a third terminal (where you need not set `STRIPE_API_KEY`, send the 
`addDistance` Signal one or more times during the ride (this represents
the scooter having traveled 100 feet, consuming some number of tokens 
that are then reported to Stripe's usage-based billing):

```command
npm run signal -- --scooterId=1230 --addDistance
```

When you are ready to end the ride, send the `endRide` signal. This will 
cause the Workflow Execution to end, at which point no additional tokens
will be consumed.

```command
npm run signal -- --scooterId=1230 --endRide
```


### Network Outage
In this scenario, the first Activity in the Workflow (which calls a 
Stripe API to look up the customer ID corresponding to the email 
address used to start the Workflow Execution) initially fails due 
to a (simulated) network outage. On the fourth attempt, the failure
resolves itself, after which the Activity will succeed.

The steps for this scenario are identical to the ones above, except 
for the scooter ID (the `FindStripeCustomerID` Activity will simulate
this outage only when invoked with a scooter ID of `1234`. 


**Start the Workflow Execution**
```command
npm run workflow -- --scooterId=1234 --emailAddress=maria@example.com
```

**Add 100 feet of distance traveled**
```command
npm run signal -- --scooterId=1234 --addDistance
```

**End the ride**
```command
npm run signal -- --scooterId=1234 --endRide
```

### Non-Retryable Failure
In this scenario, the Activity that invokes a Stripe API to look up 
the Customer ID corresponding to the email address fails because there 
is no record for that customer in Stripe. Unlike a network outage,
we'd prefer to end the Workflow Execution in this case instead of 
retrying the call again and again. 

Temporal's Retry Policies support not only defining the cadence of 
retry attempts, but also designating certain error types as non-retryable. 
The specific exception type in this scenario is `CustomerNotFoundException`
(defined in the `src/activities.ts` file) and the Retry Policy defined in 
`src/workflows.ts` specifies this type of exception as non-retryable.

**Start the Workflow Execution with an invalid e-mail address**
```command
npm run workflow -- --scooterId=1235 --emailAddress=bogus@example.com
```


### Discover a latent bug in the application
In this scenario, the `BeginRide` Activity that assesses the initial 
charge for unlocking the scooter attempts to do some validation on the 
scooter ID. The comment above the relevant line of code states that 
the scooter ID (a string) must consist only of digits, but the regular 
expression that performs this validation has a typo. It checks that 
each character is in the range 0-8 instead of 0-9, so it incorrectly
fails if the scooter ID contains a 9.

You can use this scenario to demonstrate how you can fix a bug in the 
application code, even for a Workflow Execution already in progress.
We especially recommend using the Temporal Web UI here, since its 
**Pending Activities** tab will show the error that's causing the
Activity Execution to fail and will also identify the specific line 
of code responsible.


**Start the Workflow Execution with a scooter ID that triggers the bug**
```command
npm run workflow -- --scooterId=1239 --emailAddress=maria@example.com
```

Wait for the Activity to fail, use the Temporal Web UI to identify the 
source of the failurem, and then fix the bug by changing `0-8` in the 
regex to `0-9`. Afterwards, you should find that the Activity will 
succeed upon the next retry attempt. 


### Possible Scenarios (WIP; TODO make specific to rideshare scooter demo)

See `demo` folder for different scenarios that will be live-coded into `workflows.ts`:

1. Happy path (`demo/workflows1.ts`)
2. API Downtime (uncomment inventory code)
3. Invalid order troubleshooting, set cc expiry in `starter.ts` to `12/23`
4. Human in the loop, send `approveOrder` signal (`demo/workflows2.ts`)
5. Approve or expire order (`demo/workflows3.ts`)
6. Bug in workflow, add `throw Error('workflow bug!')` in workflow code
7. Generate invalid orders `npm run workflow -- --numOrders 50 --invalidPercentage 20` (note the `--` to pass args to the script)
    - This will generate 50 orders with 20% invalid orders
    - Uncomment bug fix in `api.ts` and run again to fix workflows

### TODO
* Figure out the scenarios to demo at the conference
* Haven't checked the workflow code in detail
