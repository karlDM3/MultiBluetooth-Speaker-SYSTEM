import logging
import time
import threading

# PyBluez is required for Bluetooth connectivity
try:
    import bluetooth
except ImportError:
    logging.error("PyBluez is not installed. Please install it using: pip install pybluez")
    # Define a mock bluetooth module for development if PyBluez is not available
    class MockBluetooth:
        @staticmethod
        def discover_devices(duration=8, lookup_names=True):
            # Return mock devices for development
            return [
                ("00:11:22:33:44:55", "Mock Speaker 1"),
                ("AA:BB:CC:DD:EE:FF", "Mock Speaker 2"),
                ("11:22:33:44:55:66", "Mock Speaker 3")
            ]
        
        @staticmethod
        def BluetoothSocket(protocol):
            class MockSocket:
                def connect(self, address):
                    time.sleep(1)  # Simulate connection delay
                    # 80% chance of successful connection
                    if address[0] in ["00:11:22:33:44:55", "AA:BB:CC:DD:EE:FF"]:
                        return True
                    raise Exception("Connection failed")
                
                def send(self, data):
                    return len(data)
                
                def close(self):
                    pass
            
            return MockSocket()
        
        RFCOMM = "RFCOMM"
    
    bluetooth = MockBluetooth()

# Logger setup
logger = logging.getLogger(__name__)

class BluetoothManager:
    """Manages Bluetooth device connections and communications."""
    
    def __init__(self):
        self.connected_devices = {}  # Maps addresses to socket objects
        self.lock = threading.Lock()  # For thread safety with connections
    
    def scan_devices(self, duration=8):
        """
        Scan for available Bluetooth devices.
        
        Args:
            duration (int): Duration of the scan in seconds
            
        Returns:
            list: List of dictionaries containing device information
        """
        logger.info(f"Scanning for Bluetooth devices for {duration} seconds...")
        try:
            # PyBluez discover_devices returns a list of tuples (address, name)
            device_list = bluetooth.discover_devices(duration=duration, lookup_names=True)
            
            # Format the found devices for easy processing
            devices = [
                {"address": address, "name": name or "Unknown Device"}
                for address, name in device_list
            ]
            
            logger.info(f"Found {len(devices)} Bluetooth devices")
            return devices
        except Exception as e:
            logger.error(f"Error scanning for Bluetooth devices: {str(e)}")
            raise Exception(f"Failed to scan for devices: {str(e)}")
    
    def connect_device(self, address):
        """
        Connect to a Bluetooth device by its address.
        
        Args:
            address (str): MAC address of the Bluetooth device
            
        Returns:
            bool: True if connected successfully, False otherwise
        """
        logger.info(f"Connecting to device: {address}")
        
        with self.lock:
            # Check if device is already connected
            if address in self.connected_devices:
                logger.warning(f"Device {address} is already connected")
                return True
            
            try:
                # Create a new Bluetooth socket
                socket = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
                
                # Connect to the device
                socket.connect((address, 1))  # Usually RFCOMM channel 1 for audio
                
                # Store the connection
                self.connected_devices[address] = socket
                
                logger.info(f"Successfully connected to {address}")
                return True
            except Exception as e:
                logger.error(f"Failed to connect to {address}: {str(e)}")
                return False
    
    def disconnect_device(self, address):
        """
        Disconnect from a Bluetooth device.
        
        Args:
            address (str): MAC address of the Bluetooth device
            
        Returns:
            bool: True if disconnected successfully, False otherwise
        """
        logger.info(f"Disconnecting from device: {address}")
        
        with self.lock:
            if address not in self.connected_devices:
                logger.warning(f"Device {address} is not connected")
                return True
            
            try:
                # Close the socket
                self.connected_devices[address].close()
                # Remove from connected devices
                del self.connected_devices[address]
                
                logger.info(f"Successfully disconnected from {address}")
                return True
            except Exception as e:
                logger.error(f"Failed to disconnect from {address}: {str(e)}")
                return False
    
    def send_data(self, address, data):
        """
        Send data to a connected Bluetooth device.
        
        Args:
            address (str): MAC address of the Bluetooth device
            data (bytes): Data to send
            
        Returns:
            bool: True if data sent successfully, False otherwise
        """
        with self.lock:
            if address not in self.connected_devices:
                logger.error(f"Cannot send data: Device {address} is not connected")
                return False
            
            try:
                # Send data via the socket
                self.connected_devices[address].send(data)
                return True
            except Exception as e:
                logger.error(f"Failed to send data to {address}: {str(e)}")
                # On error, try to reconnect
                try:
                    self.connected_devices[address].close()
                except:
                    pass
                del self.connected_devices[address]
                return False
    
    def send_to_all(self, data):
        """
        Send data to all connected devices.
        
        Args:
            data (bytes): Data to send
            
        Returns:
            dict: Dictionary mapping device addresses to success status
        """
        results = {}
        for address in list(self.connected_devices.keys()):
            results[address] = self.send_data(address, data)
        return results
    
    def get_connected_devices(self):
        """
        Get a list of all connected device addresses.
        
        Returns:
            list: List of connected device addresses
        """
        with self.lock:
            return list(self.connected_devices.keys())
    
    def is_device_connected(self, address):
        """
        Check if a specific device is connected.
        
        Args:
            address (str): MAC address of the Bluetooth device
            
        Returns:
            bool: True if device is connected, False otherwise
        """
        with self.lock:
            return address in self.connected_devices
    
    def disconnect_all(self):
        """
        Disconnect all connected devices.
        
        Returns:
            bool: True if all disconnections were successful
        """
        success = True
        for address in list(self.connected_devices.keys()):
            if not self.disconnect_device(address):
                success = False
        return success
