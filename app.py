from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, ParkingSlot, Booking, ParkingIssue
from ml_prediction import predict_occupied_slots
from models import User

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///smart_parking.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


@app.route("/")
def home():
    return "Smart Parking Backend is Running!"

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({"message": "Email already registered"}), 400

    new_user = User(
        name=name,
        email=email,
        password=password
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Registration successful"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.password != password:
        return jsonify({"message": "Incorrect password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200
@app.route('/bookings/<int:user_id>', methods=['GET'])
def get_bookings(user_id):
    bookings = Booking.query.filter_by(user_id=user_id).all()

    result = []

    for booking in bookings:
        result.append({
          "id": booking.id,
          "slot_id": booking.slot_id,
          "booking_date": booking.booking_date,
          "vehicle_number": booking.vehicle_number,
          "amount": booking.amount,
          "payment_status": booking.payment_status
        })

    return jsonify(result), 200

@app.route("/ml-prediction/<int:hour>", methods=["GET"])
def ml_prediction(hour):
    predicted_occupied = predict_occupied_slots(hour)
    predicted_available = 20 - predicted_occupied

    return jsonify({
        "hour": hour,
        "predicted_occupied": predicted_occupied,
        "predicted_available": predicted_available
    }), 200
    
@app.route('/dashboard', methods=['GET'])
def dashboard():
    total_slots = ParkingSlot.query.count()
    available_slots = ParkingSlot.query.filter_by(status="Available").count()
    occupied_slots = ParkingSlot.query.filter_by(status="Occupied").count()
    total_bookings = Booking.query.count()

    return jsonify({
        "total_slots": total_slots,
        "available_slots": available_slots,
        "occupied_slots": occupied_slots,
        "total_bookings": total_bookings
    }), 200

@app.route('/payment/<int:booking_id>', methods=['POST'])
def payment(booking_id):
    booking = Booking.query.get(booking_id)

    if not booking:
        return jsonify({"message": "Booking not found"}), 404

    booking.payment_status = "Paid"
    db.session.commit()

    return jsonify({
        "message": "Payment successful",
        "booking_id": booking.id,
        "amount": booking.amount,
        "payment_status": booking.payment_status
    }), 200

@app.route("/book", methods=["POST"])
def book_slot():
    data = request.get_json()

    user_id = data.get("user_id")
    slot_id = data.get("slot_id")
    booking_date = data.get("booking_date")
    vehicle_number = data.get("vehicle_number")

    slot = ParkingSlot.query.get(slot_id)

    if not slot:
        return jsonify({"message": "Parking slot not found"}), 404

    if slot.status != "Available":
        return jsonify({"message": "Parking slot is already booked"}), 400

    booking = Booking(
    user_id=user_id,
    slot_id=slot_id,
    booking_date=booking_date,
    vehicle_number=vehicle_number,
    status="Booked"
)

    slot.status = "Occupied"

    db.session.add(booking)
    db.session.commit()

    return jsonify({
        "message": "Parking slot booked successfully",
        "slot": slot.slot_number
    }), 201
@app.route("/slots", methods=["GET"])
def get_slots():
    slots = ParkingSlot.query.all()

    return jsonify([
        {
            "id": slot.id,
            "slot_number": slot.slot_number,
            "status": slot.status
        }
        for slot in slots
    ])

@app.route("/iot/update", methods=["POST"])
def iot_update():
    data = request.get_json()

    slot_id = data.get("slot_id")
    status = data.get("status")

    slot = ParkingSlot.query.get(slot_id)

    if not slot:
        return jsonify({"message": "Slot not found"}), 404

    slot.status = status
    db.session.commit()

    return jsonify({
        "message": "Slot status updated",
        "slot": slot.slot_number,
        "status": slot.status
    }), 200

@app.route("/cancel-booking/<int:booking_id>", methods=["DELETE"])
def cancel_booking(booking_id):

    booking = Booking.query.get(booking_id)

    if not booking:
        return jsonify({"message": "Booking not found"}), 404

    slot = ParkingSlot.query.get(booking.slot_id)

    if slot:
        slot.status = "Available"

    db.session.delete(booking)
    db.session.commit()

    return jsonify({
        "message": "Booking cancelled successfully"
    }), 200

with app.app_context():
    db.create_all()

    if ParkingSlot.query.count() == 0:
        for i in range(1, 21):
            slot = ParkingSlot(slot_number=f"A{i}", status="Available")
            db.session.add(slot)

        db.session.commit()

@app.route("/report-issue", methods=["POST"])
def report_issue():

    data = request.get_json()

    staff_name = data.get("staff_name")
    slot_number = data.get("slot_number")
    issue_type = data.get("issue_type")
    description = data.get("description")

    if not staff_name or not slot_number or not issue_type or not description:
        return jsonify({
            "message": "All issue details are required"
        }), 400

    issue = ParkingIssue(
        staff_name=staff_name,
        slot_number=slot_number,
        issue_type=issue_type,
        description=description
    )

    db.session.add(issue)
    db.session.commit()

    return jsonify({
        "message": "Parking problem reported successfully",
        "issue_id": issue.id
    }), 201
@app.route("/admin/users/count", methods=["GET"])
def get_user_count():

    total_users = User.query.count()

    return jsonify({
        "total_users": total_users
    }), 200

@app.route("/admin/bookings", methods=["GET"])
def get_all_bookings():

    bookings = Booking.query.all()

    result = []

    for booking in bookings:

        user = User.query.get(booking.user_id)
        slot = ParkingSlot.query.get(booking.slot_id)

        result.append({
            "id": booking.id,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "slot_number": slot.slot_number if slot else "Unknown",
            "booking_date": booking.booking_date,
            "vehicle_number": booking.vehicle_number,
            "amount": booking.amount,
            "payment_status": booking.payment_status,
            "status": booking.status
        })

    return jsonify(result), 200

@app.route("/issues", methods=["GET"])
def get_issues():

    issues = ParkingIssue.query.order_by(ParkingIssue.id.desc()).all()

    return jsonify([
        {
            "id": issue.id,
            "staff_name": issue.staff_name,
            "slot_number": issue.slot_number,
            "issue_type": issue.issue_type,
            "description": issue.description,
            "status": issue.status
        }
        for issue in issues
    ]), 200
    
@app.route("/issues/<int:issue_id>/status", methods=["PUT"])
def update_issue_status(issue_id):

    data = request.get_json()

    new_status = data.get("status")

    if new_status not in ["Reported", "In Progress", "Resolved"]:
        return jsonify({
            "message": "Invalid status"
        }), 400

    issue = ParkingIssue.query.get(issue_id)

    if not issue:
        return jsonify({
            "message": "Issue not found"
        }), 404

    issue.status = new_status

    db.session.commit()

    return jsonify({
        "message": "Issue status updated successfully",
        "issue_id": issue.id,
        "status": issue.status
    }), 200

if __name__ == "__main__":
    app.run(debug=True)