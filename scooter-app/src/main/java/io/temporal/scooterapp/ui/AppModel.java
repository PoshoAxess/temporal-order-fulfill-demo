package io.temporal.scooterapp.ui;

import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeSupport;

public class AppModel {
    
    private String emailAddress;
    private String scooterId;
    private boolean rideActive;
    private int tokensUsed;
    private int currentSpeed;


    public static final String PROP_NAME_EMAIL_ADDRESS = "emailAddress";
    public static final String PROP_NAME_SCOOTER_ID = "scooterId";
    public static final String PROP_NAME_RIDE_ACTIVE = "rideActive";
    public static final String PROP_NAME_CURRENT_SPEED = "currentSpeed";
    public static final String PROP_NAME_TOKENS_USED = "tokensUsed";

    private final PropertyChangeSupport pcs;
    
    public AppModel(String emailAddress, String scooterId, boolean isRideActive, int tokensUsed, int currentSpeed) {
        this.emailAddress = emailAddress;
        this.scooterId = scooterId;
        this.rideActive = isRideActive;
        this.tokensUsed = tokensUsed;
        this.currentSpeed = currentSpeed;
        
        this.pcs = new PropertyChangeSupport(this);
    }

    public String getEmailAddress() {
        return emailAddress;
    }

    public void setEmailAddress(String emailAddress) {
        if (this.emailAddress != null && this.emailAddress.equals(emailAddress)) {
            return;
        }

        String oldEmailAddress= this.emailAddress;
        this.emailAddress = emailAddress;
        pcs.firePropertyChange(PROP_NAME_EMAIL_ADDRESS, oldEmailAddress, emailAddress);
    }

    public String getScooterId() {
        return scooterId;
    }

    public void setScooterId(String scooterId) {
        if (this.scooterId != null && this.scooterId.equals(scooterId)) {
            return;
        }

        String oldScooterId = this.scooterId;
        this.scooterId = scooterId;
        pcs.firePropertyChange(PROP_NAME_SCOOTER_ID, oldScooterId, scooterId);
    }

    public boolean isRideActive() {
        return rideActive;
    }

    public void setIsRideActive(boolean isRideActive) {
        if (this.rideActive == isRideActive) {
            return;
        }

        String oldRideActive = this.scooterId;
        this.rideActive = isRideActive;
        pcs.firePropertyChange(PROP_NAME_RIDE_ACTIVE, oldRideActive, rideActive);
        this.rideActive = isRideActive;
    }

    public int getTokensUsed() {
        return tokensUsed;
    }

    public void setTokensUsed(int tokensUsed) {
        if (this.tokensUsed == tokensUsed) {
            return;
        }

        int oldTokensUsed = this.tokensUsed;
        this.tokensUsed = tokensUsed;
        pcs.firePropertyChange(PROP_NAME_TOKENS_USED, oldTokensUsed, tokensUsed);
    }
    

    public int getCurrentSpeed() {
        return currentSpeed;
    }

    public void setCurrentSpeed(int currentSpeed) {
        if (currentSpeed < 0 || currentSpeed > 50) {
            // out of range
            return;
        }
        
        if (this.currentSpeed == currentSpeed) {
            return;
        }

        int oldSpeed = this.currentSpeed;
        this.currentSpeed = currentSpeed;
        pcs.firePropertyChange(PROP_NAME_CURRENT_SPEED, oldSpeed, currentSpeed);
    }
    
    
    public void addPropertyChangeListener(PropertyChangeListener listener) {
        pcs.addPropertyChangeListener(listener);
    }
    
    public void removePropertyChangeListener(PropertyChangeListener listener) {
        pcs.removePropertyChangeListener(listener);
    }
}
