import os
import logging
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_socketio import SocketIO, emit
from bluetooth_manager import BluetoothManager
from audio_processor import AudioProcessor
from models import db, Speaker

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "development_secret_key")

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///bluetooth_speakers.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize database
db.init_app(app)

# Initialize SocketIO for real-time updates
socketio = SocketIO(app)

# Initialize Bluetooth manager and Audio processor
bluetooth_manager = BluetoothManager()
audio_processor = AudioProcessor()

# Create database tables
with app.app_context():
    db.create_all()
    logger.debug("Database tables created")

@app.route('/')
def index():
    """Render the main page."""
    speakers = Speaker.query.all()
    return render_template('index.html', speakers=speakers)

@app.route('/scan', methods=['POST'])
def scan_devices():
    """Scan for available Bluetooth devices."""
    try:
        devices = bluetooth_manager.scan_devices()
        return jsonify({"status": "success", "devices": devices})
    except Exception as e:
        logger.error(f"Error scanning devices: {str(e)}")
        return jsonify({"status": "error", "message": str(e)})

@app.route('/connect', methods=['POST'])
def connect_device():
    """Connect to a Bluetooth speaker."""
    data = request.json
    device_address = data.get('address')
    device_name = data.get('name')
    
    if not device_address:
        return jsonify({"status": "error", "message": "Device address is required"})
    
    try:
        # Check if already in database
        existing_speaker = Speaker.query.filter_by(address=device_address).first()
        if existing_speaker:
            if existing_speaker.connected:
                return jsonify({"status": "error", "message": "Speaker already connected"})
            
            # Try to reconnect
            success = bluetooth_manager.connect_device(device_address)
            if success:
                existing_speaker.connected = True
                db.session.commit()
                socketio.emit('speaker_update', {'status': 'connected', 'speaker': existing_speaker.to_dict()})
                return jsonify({"status": "success", "message": f"Reconnected to {device_name}"})
            else:
                return jsonify({"status": "error", "message": f"Failed to connect to {device_name}"})
        
        # New speaker
        success = bluetooth_manager.connect_device(device_address)
        if success:
            new_speaker = Speaker(name=device_name, address=device_address, connected=True)
            db.session.add(new_speaker)
            db.session.commit()
            socketio.emit('speaker_update', {'status': 'connected', 'speaker': new_speaker.to_dict()})
            return jsonify({"status": "success", "message": f"Connected to {device_name}"})
        else:
            return jsonify({"status": "error", "message": f"Failed to connect to {device_name}"})
    except Exception as e:
        logger.error(f"Error connecting to device: {str(e)}")
        return jsonify({"status": "error", "message": str(e)})

@app.route('/disconnect/<int:speaker_id>', methods=['POST'])
def disconnect_device(speaker_id):
    """Disconnect from a Bluetooth speaker."""
    speaker = Speaker.query.get(speaker_id)
    if not speaker:
        return jsonify({"status": "error", "message": "Speaker not found"})
    
    try:
        success = bluetooth_manager.disconnect_device(speaker.address)
        if success:
            speaker.connected = False
            db.session.commit()
            socketio.emit('speaker_update', {'status': 'disconnected', 'speaker': speaker.to_dict()})
            return jsonify({"status": "success", "message": f"Disconnected from {speaker.name}"})
        else:
            return jsonify({"status": "error", "message": f"Failed to disconnect from {speaker.name}"})
    except Exception as e:
        logger.error(f"Error disconnecting device: {str(e)}")
        return jsonify({"status": "error", "message": str(e)})

@app.route('/play', methods=['POST'])
def play_audio():
    """Start playing audio to all connected speakers."""
    connected_speakers = Speaker.query.filter_by(connected=True).all()
    if not connected_speakers:
        return jsonify({"status": "error", "message": "No speakers connected"})
    
    try:
        speaker_addresses = [speaker.address for speaker in connected_speakers]
        success = audio_processor.play_audio(speaker_addresses)
        if success:
            socketio.emit('playback_update', {'status': 'playing'})
            return jsonify({"status": "success", "message": "Playing audio on all connected speakers"})
        else:
            return jsonify({"status": "error", "message": "Failed to play audio"})
    except Exception as e:
        logger.error(f"Error playing audio: {str(e)}")
        return jsonify({"status": "error", "message": str(e)})

@app.route('/pause', methods=['POST'])
def pause_audio():
    """Pause audio on all connected speakers."""
    try:
        success = audio_processor.pause_audio()
        if success:
            socketio.emit('playback_update', {'status': 'paused'})
            return jsonify({"status": "success", "message": "Paused audio on all connected speakers"})
        else:
            return jsonify({"status": "error", "message": "Failed to pause audio"})
    except Exception as e:
        logger.error(f"Error pausing audio: {str(e)}")
        return jsonify({"status": "error", "message": str(e)})

@app.route('/stop', methods=['POST'])
def stop_audio():
    """Stop audio on all connected speakers."""
    try:
        success = audio_processor.stop_audio()
        if success:
            socketio.emit('playback_update', {'status': 'stopped'})
            return jsonify({"status": "success", "message": "Stopped audio on all connected speakers"})
        else:
            return jsonify({"status": "error", "message": "Failed to stop audio"})
    except Exception as e:
        logger.error(f"Error stopping audio: {str(e)}")
        return jsonify({"status": "error", "message": str(e)})

@app.route('/status')
def get_status():
    """Get the current status of all speakers."""
    try:
        speakers = Speaker.query.all()
        speaker_list = [speaker.to_dict() for speaker in speakers]
        playback_status = audio_processor.get_status()
        return jsonify({
            "status": "success", 
            "speakers": speaker_list,
            "playback": playback_status
        })
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        return jsonify({"status": "error", "message": str(e)})

@socketio.on('connect')
def handle_connect():
    """Handle client WebSocket connection."""
    logger.debug('Client connected to WebSocket')

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client WebSocket disconnection."""
    logger.debug('Client disconnected from WebSocket')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
