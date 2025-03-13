import logging
import threading
import time
import numpy as np
from bluetooth_manager import BluetoothManager

# Logger setup
logger = logging.getLogger(__name__)

class AudioProcessor:
    """
    Handles audio processing and synchronization across multiple Bluetooth speakers.
    """
    
    def __init__(self):
        self.bluetooth_manager = BluetoothManager()
        self.playing = False
        self.paused = False
        self.playback_thread = None
        self.lock = threading.Lock()
        self.buffer_size = 1024  # Audio buffer size
        self.sample_rate = 44100  # Standard audio sample rate (44.1 kHz)
        self.chunk_delay = 0.02  # 20ms delay between chunks for synchronization
    
    def play_audio(self, speaker_addresses):
        """
        Start playing audio to the specified speakers.
        
        Args:
            speaker_addresses (list): List of speaker MAC addresses
            
        Returns:
            bool: True if playback started successfully
        """
        with self.lock:
            if self.playing:
                if self.paused:
                    # Resume playback
                    logger.info("Resuming audio playback")
                    self.paused = False
                    return True
                logger.info("Audio is already playing")
                return True
            
            # Check speakers are connected
            for address in speaker_addresses:
                if not self.bluetooth_manager.is_device_connected(address):
                    logger.error(f"Speaker {address} is not connected")
                    return False
            
            # Start playback thread
            try:
                self.playing = True
                self.paused = False
                self.playback_thread = threading.Thread(
                    target=self._audio_playback_thread,
                    args=(speaker_addresses,)
                )
                self.playback_thread.daemon = True
                self.playback_thread.start()
                logger.info(f"Started audio playback to {len(speaker_addresses)} speakers")
                return True
            except Exception as e:
                logger.error(f"Failed to start audio playback: {str(e)}")
                self.playing = False
                return False
    
    def pause_audio(self):
        """
        Pause the current audio playback.
        
        Returns:
            bool: True if paused successfully
        """
        with self.lock:
            if not self.playing:
                logger.info("No audio is currently playing")
                return False
            
            if self.paused:
                logger.info("Audio is already paused")
                return True
            
            self.paused = True
            logger.info("Paused audio playback")
            return True
    
    def stop_audio(self):
        """
        Stop the current audio playback.
        
        Returns:
            bool: True if stopped successfully
        """
        with self.lock:
            if not self.playing:
                logger.info("No audio is currently playing")
                return True
            
            self.playing = False
            self.paused = False
            # The thread will terminate itself once playing is set to False
            logger.info("Stopped audio playback")
            return True
    
    def get_status(self):
        """
        Get the current playback status.
        
        Returns:
            dict: Playback status information
        """
        with self.lock:
            return {
                "playing": self.playing,
                "paused": self.paused
            }
    
    def _audio_playback_thread(self, speaker_addresses):
        """
        Thread function for audio playback to multiple speakers.
        
        Args:
            speaker_addresses (list): List of speaker MAC addresses
        """
        logger.info("Audio playback thread started")
        
        try:
            # In a real implementation, this would read audio from a file or input device
            # Here we generate a simple sine wave as test audio
            while self.playing:
                if not self.paused:
                    # Generate a test tone (sine wave)
                    audio_chunk = self._generate_test_audio()
                    
                    # Send audio data to all speakers
                    results = {}
                    for address in speaker_addresses:
                        results[address] = self.bluetooth_manager.send_data(address, audio_chunk)
                    
                    # Log any failures
                    failed_speakers = [addr for addr, status in results.items() if not status]
                    if failed_speakers:
                        logger.warning(f"Failed to send audio to speakers: {failed_speakers}")
                    
                    # Wait a bit to maintain timing
                    time.sleep(self.chunk_delay)
                else:
                    # When paused, just wait
                    time.sleep(0.1)
        except Exception as e:
            logger.error(f"Error in audio playback thread: {str(e)}")
        finally:
            logger.info("Audio playback thread ended")
    
    def _generate_test_audio(self):
        """
        Generate a test audio chunk (sine wave).
        
        Returns:
            bytes: Audio data formatted for Bluetooth transmission
        """
        # Generate a simple sine wave at 440 Hz (A4 note)
        frequency = 440.0  # Hz
        duration = self.buffer_size / self.sample_rate  # seconds
        
        t = np.linspace(0, duration, self.buffer_size)
        wave = 0.5 * np.sin(2.0 * np.pi * frequency * t)
        
        # Convert to 16-bit PCM format (common for Bluetooth audio)
        wave = (wave * 32767).astype(np.int16)
        
        # Convert to bytes for transmission
        return wave.tobytes()
