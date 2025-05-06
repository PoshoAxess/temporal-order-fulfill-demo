package io.temporal.scooterapp.ui;

import io.temporal.scooterapp.tclient.WorkflowInteractions;
import java.beans.PropertyChangeEvent;
import java.util.Timer;
import java.util.TimerTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AppController {

    private static final Logger logger = LoggerFactory.getLogger(AppController.class);

    private final AppModel model;
    private final WorkflowInteractions interactions;
    private Timer speedTimer;
    int feetTraveled = 0;

    public AppController() {
        interactions = new WorkflowInteractions();

        model = new AppModel(null, "NONE", false, 0, 0);
        model.addPropertyChangeListener((PropertyChangeEvent evt) -> {
            if (AppModel.PROP_NAME_CURRENT_SPEED.equals(evt.getPropertyName())) {
                speedTimer.cancel();
                if (model.isRideActive()) {
                    updateDistanceAndShowTokensUsed();
                }
            }
        });
    }

    public AppModel getModel() {
        return model;
    }

    public void startWorkflow() {
        interactions.startWorkflow(model.getEmailAddress(), model.getScooterId());

        model.setIsRideActive(true);
        updateDistanceAndShowTokensUsed();
    }

    void updateDistanceAndShowTokensUsed() {
        speedTimer = new Timer(true);
        speedTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                int tokensConsumed = interactions.executeRunningChargeQuery(model.getScooterId());
                model.setTokensUsed(tokensConsumed);

                feetTraveled += model.getCurrentSpeed();
                if (feetTraveled > 100) {
                    feetTraveled = Math.min(0, feetTraveled - 100);
                    interactions.sendAddDistanceSignal(model.getScooterId());
                }
            }
        }, 0, 500);
    }

    public void endWorkflow() {
        interactions.sendEndRideSignal(model.getScooterId());
        model.setIsRideActive(false);

        model.setScooterId(null);
        speedTimer.cancel();
    }
}
