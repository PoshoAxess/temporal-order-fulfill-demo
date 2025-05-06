package io.temporal.scooterapp.ui;

import com.formdev.flatlaf.FlatLightLaf;
import java.awt.Image;
import java.awt.Taskbar;
import javax.swing.JFrame;
import javax.swing.SwingUtilities;

/**
 *
 * @author Tom Wheeler
 */
public class AppUI {

    private ScooterAppMainPanel mainPanel;
    private AppController controller;
    
    public void display() {
        SwingUtilities.invokeLater(() -> createAndShowGUI());
    }
    
    private void createAndShowGUI() {
        FlatLightLaf.setup();

        final JFrame frame = new JFrame("ACME Scooter App");
        
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(450, 650);
        frame.setLocationRelativeTo(null);
        
        Image temporalLogo = Icons.getTemporalLogo();
        Taskbar taskbar = Taskbar.getTaskbar();
        taskbar.setIconImage(temporalLogo); // for mac
        frame.setIconImage(temporalLogo); // for windows
        
        controller = new AppController();
        mainPanel = new ScooterAppMainPanel(controller);
        
        frame.add(mainPanel);
        frame.pack();
        frame.setVisible(true);
    }
}
