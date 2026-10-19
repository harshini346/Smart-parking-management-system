from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="user")


class ParkingSlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slot_number = db.Column(db.String(20), unique=True, nullable=False)
    status = db.Column(db.String(20), default="Available")


class Booking(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, nullable=False)

    slot_id = db.Column(db.Integer, nullable=False)

    booking_date = db.Column(db.String(50), nullable=False)

    vehicle_number = db.Column(db.String(20), nullable=False)

    status = db.Column(db.String(20), default="Booked")

    amount = db.Column(db.Float, default=50.0)

    payment_status = db.Column(db.String(20), default="Pending")
    
class ParkingIssue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_name = db.Column(db.String(100), nullable=False)
    slot_number = db.Column(db.String(20), nullable=False)
    issue_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default="Reported")