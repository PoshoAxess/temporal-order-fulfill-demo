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
running the workflow. The former uniquely identifies the scooter session:

```
npm run workflow -- --scooterId=SCOOTER-1234
```

Send this one or more times during the ride:
```
npm run signal -- --scooterId=1234 --addDistance
```

```
npm run signal -- --scooterId=1234 --endRide
```

The workflow will end and the scooter will be billed for the distance traveled.

### Scenarios (TODO make specific to rideshare scooter demo)

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
