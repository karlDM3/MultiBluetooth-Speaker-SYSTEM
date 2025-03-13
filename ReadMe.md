# MultiBluetooth Speaker System

A cross-platform software solution that allows one device to connect to multiple Bluetooth speakers simultaneously for synchronized audio playback across all connected speakers.

![MultiBluetooth Speaker System](https://img.shields.io/badge/Multiple-Speakers-blue) ![Platform](https://img.shields.io/badge/Platform-Cross--Platform-green) ![Status](https://img.shields.io/badge/Status-Development-yellow)

## Features

- **Multi-Speaker Connection**: Connect up to 8 Bluetooth speakers simultaneously from a single device
- **Synchronized Audio**: Play audio in perfect sync across all connected speakers
- **Real-time Monitoring**: View the status and connection health of all speakers
- **User-friendly Interface**: Simple web interface to control your speaker network
- **Cross-Platform Compatibility**: Works on multiple operating systems
- **Integrated Listening Server**: Monitor and control your audio system remotely

## How It Works

The MultiBluetooth Speaker System uses a Flask-based web application with WebSocket support to:

1. Scan for available Bluetooth speakers in the vicinity
2. Connect to multiple speakers simultaneously
3. Distribute audio data to all connected speakers with precise timing for synchronized playback
4. Provide real-time status updates and controls through an intuitive web interface

## Requirements

- Python 3.6+
- Flask and Flask-SocketIO
- PyBluez (for Bluetooth connectivity)
- NumPy (for audio processing)
- Modern web browser
- Bluetooth-enabled device (computer or smartphone)

## Installation

```bash
# Clone the repository
git clone https://github.com/karldm3/multibluetooth-speaker-system.git
cd multibluetooth-speaker-system

# Install Python dependencies
pip install -r requirements.txt

# Install system dependencies for PyBluez
# For Ubuntu/Debian:
sudo apt-get install libbluetooth-dev

# For macOS:
brew install bluez

# For Windows:
# PyBluez should work with the standard Windows Bluetooth stack
```

## Usage

1. Start the application:
   ```bash
   python main.py
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

3. Use the web interface to:
   - Scan for available Bluetooth speakers
   - Connect to desired speakers
   - Control audio playback (play, pause, stop)
   - Monitor the status of all connected speakers

## Development

The system architecture consists of:

- **Flask Web Application**: Provides the user interface and API endpoints
- **Bluetooth Manager**: Handles device discovery, connections, and data transmission
- **Audio Processor**: Manages audio synchronization and distribution to multiple speakers
- **Database**: Stores speaker information and connection history

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- Support for custom audio files and streaming services
- Advanced audio synchronization algorithms
- Mobile app interface
- Support for speaker grouping and zone control
- Audio visualization features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [PyBluez](https://github.com/pybluez/pybluez) for Bluetooth functionality
- [Flask](https://flask.palletsprojects.com/) for the web framework
- [Socket.IO](https://socket.io/) for real-time communication
- [Thato_Popotwane](https://www.facebook.com/share/18nf8vSm2e/?mibextid=wwXIfr) for proposing the idea/mind behind the idea
---

*Note: This project is in development stage. For optimal performance, ensure all speakers support the same Bluetooth profiles and codecs.*
