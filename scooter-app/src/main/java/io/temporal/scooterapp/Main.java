package io.temporal.scooterapp;

import io.temporal.scooterapp.ui.AppUI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;



public class Main {

    private static final Logger logger = LoggerFactory.getLogger(Main.class);

    public static void main(String[] args) {
        try {
            logger.info("Starting application");

            logger.debug("Launching the GUI");
            AppUI gui = new AppUI();
            gui.display();
        } catch (Exception e) {
            logger.error("Error encountered while running the application", e);
        }
    }
}
