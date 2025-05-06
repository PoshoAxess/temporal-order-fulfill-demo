# **Scooter GUI Application**

## **Setup**

### **1. Prerequisites**

* Java 11 or higher
* Apache Maven

---

## **Compiling and Running the Application**

### **1. Compile the Application**

Use Maven to compile the code:

```bash
mvn compile
```

### **2. Start the GUI**

```bash
mvn exec:java -Dexec.mainClass="io.temporal.scooterapp.Main"
```

This launches a GUI that you can use to begin a scooter ride
and see the status of that ride. 

As an alternative, you can just run `./launch-gui.sh`, which
runs the command above.
