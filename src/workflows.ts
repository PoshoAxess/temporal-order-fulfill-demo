import { proxyActivities, proxyLocalActivities }
    from '@temporalio/workflow';

import type * as activities from '../src/activities';
import type { Order } from '../src/interfaces/order';

const { processPayment, reserveInventory, deliverOrder } = proxyLocalActivities<typeof activities>({
    startToCloseTimeout: '5 seconds',
    retry: { nonRetryableErrorTypes: ['CreditCardExpiredException'],
        maximumAttempts: 18,
        backoffCoefficient: 25,
        maximumInterval: '8 hours'
    }
});

export async function OrderFulfillWorkflow(order: Order): Promise<string> {
    const paymentResult = await processPayment(order);
    const inventoryResult = await reserveInventory(order);
    const deliveryResult = await deliverOrder(order);
    return `Order fulfilled: ${paymentResult}, ${inventoryResult}, ${deliveryResult}`;
}
