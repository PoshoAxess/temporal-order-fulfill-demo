package io.temporal.scooterapp.ui;

import java.awt.Image;
import java.net.URL;
import javax.swing.ImageIcon;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Icons {

    private static final Logger logger = LoggerFactory.getLogger(Icons.class);
    
    static Image getTemporalLogo() {
        return createIcon("/icon-logo-temporal-128.png", "Temporal logo").getImage();
    }
   
    static ImageIcon createApproveIcon() {
        return createIcon("/icon-approve.png", "Bank Icon");
    }
    
    static ImageIcon createUnavailableIcon() {
        return  createIcon("/icon-red-x.png", "Red X");
    }
    
    static ImageIcon createAvailableIcon() {
        return createIcon("/icon-green-checkmark.png", "Green checkmark");
    }
    
    static ImageIcon createIcon(String path, String description) {
        URL imageUrl = Icons.class.getResource(path);
        if (imageUrl != null) {
            return new ImageIcon(imageUrl, description);
        }

        logger.error("Couldn't find file at path: " + path);
        return null;
    }
}
