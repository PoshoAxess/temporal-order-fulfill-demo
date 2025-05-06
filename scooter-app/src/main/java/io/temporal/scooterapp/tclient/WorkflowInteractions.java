package io.temporal.scooterapp.tclient;

import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.client.WorkflowStub;
import io.temporal.scooterapp.ui.AppController;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WorkflowInteractions {

    private static final Logger logger = LoggerFactory.getLogger(AppController.class);

    private WorkflowClient temporalClient;

    public WorkflowInteractions() {
        try {
            temporalClient = ClientProvider.getClient();
        } catch (IOException ex) {
            logger.error("Error encountered while creating the Temporal Client", ex);
        }
    }

    public void startWorkflow(String emailAddress, String scooterId) {
        String workflowId = "scooter-session-" + scooterId;
        WorkflowStub stub = temporalClient.newUntypedWorkflowStub("ScooterRideWorkflow",
            WorkflowOptions.newBuilder()
                .setWorkflowId(workflowId)
                .setTaskQueue("scooter-ride-tq")
                .build());

        ScooterRideWorkflowInput input = new ScooterRideWorkflowInput();
        input.emailAddress = emailAddress;
        input.scooterID = scooterId;
        stub.start(input);
    }

    public void sendAddDistanceSignal(String scooterId) {
        String workflowId = "scooter-session-" + scooterId;
        temporalClient.newUntypedWorkflowStub(workflowId).signal("addDistance");
    }

    public void sendEndRideSignal(String scooterId) {
        String workflowId = "scooter-session-" + scooterId;
        temporalClient.newUntypedWorkflowStub(workflowId).signal("endRide");
    }

    public int executeRunningChargeQuery(String scooterId) {
        String workflowId = "scooter-session-" + scooterId;
        int tokensConsumed = temporalClient.newUntypedWorkflowStub(workflowId).query("tokensConsumed", Integer.class);
        return tokensConsumed;
    }

    static class ScooterRideWorkflowInput {
        String emailAddress;
        String customerID;
        String scooterID;
    }
}
