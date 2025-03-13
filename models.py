from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime

# Setup the SQLAlchemy base
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

class Speaker(db.Model):
    """Model for Bluetooth speakers."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(100), unique=True, nullable=False)
    connected = db.Column(db.Boolean, default=False)
    last_connected = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Speaker {self.name} ({self.address})>"
    
    def to_dict(self):
        """Convert speaker object to dictionary for JSON responses."""
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "connected": self.connected,
            "last_connected": self.last_connected.isoformat() if self.last_connected else None
        }
