// ===============================
// FIND PARKING BUTTON
// ===============================

function goToParking() {

    document.getElementById("parking").scrollIntoView({
        behavior: "smooth"
    });

}


// ===============================
// SELECT PARKING SLOT
// ===============================

function selectSlot(slot) {

    // Remove previous selection
    document.querySelectorAll(".slot").forEach(function(button) {

        button.classList.remove("selected");

    });


    // Highlight selected slot
    document.querySelectorAll(".slot").forEach(function(button) {

        if (button.textContent.trim() === slot) {

            button.classList.add("selected");

        }

    });


    // Store selected slot
    document.getElementById("selectedSlot").value = slot;


    // Scroll to booking form
    document.getElementById("booking").scrollIntoView({
        behavior: "smooth"
    });

}// ===============================
// CONFIRM BOOKING
// ===============================

function confirmBooking() {

    const slot =
        document.getElementById("selectedSlot").value;

    const name =
        document.getElementById("userName").value.trim();

    const vehicle =
        document.getElementById("vehicleNumber").value.trim();

    const date =
        document.getElementById("parkingDate").value;

    const time =
        document.getElementById("parkingTime").value;


    // Check all fields

    if (
        slot === "" ||
        name === "" ||
        vehicle === "" ||
        date === "" ||
        time === ""
    ) {
        alert("Please fill all the details.");
        return;
    }


    // Check logged-in user

    const user =
        JSON.parse(localStorage.getItem("loggedInUser"));

    if (!user) {
        alert("Please login before booking a parking slot.");
        return;
    }


    // Get slot ID from backend

    fetch("http://127.0.0.1:5000/slots")
        .then(response => response.json())
        .then(slots => {

            const selectedSlotData =
                slots.find(s => s.slot_number === slot);

            if (!selectedSlotData) {
                alert("Parking slot not found.");
                return;
            }

            if (selectedSlotData.status !== "Available") {
                alert("This parking slot is already occupied.");
                return;
            }


            // Send booking to backend

            return fetch("http://127.0.0.1:5000/book", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: user.id,
                    slot_id: selectedSlotData.id,
                    booking_date: date + "T" + time,
                    vehicle_number: vehicle
                })
            });

        })
        .then(response => {

            if (!response) return;

            return response.json();

        })
        .then(data => {

            if (!data) return;

            if (data.message === "Parking slot booked successfully") {

                alert(
                    "BOOKING CONFIRMED!\n\n" +
                    "Name: " + name +
                    "\nVehicle: " + vehicle +
                    "\nSlot: " + slot +
                    "\nDate: " + date +
                    "\nTime: " + time
                );

                document.getElementById("selectedSlot").value = "";
                document.getElementById("userName").value = "";
                document.getElementById("vehicleNumber").value = "";
                document.getElementById("parkingDate").value = "";
                document.getElementById("parkingTime").value = "";

                loadParkingSlots();
                displayBookings();

            } else {
                alert(data.message);
            }

        })
        .catch(error => {
            console.error(error);
            alert("Cannot connect to the server.");
        });
}
// ===============================
// DISPLAY MY BOOKINGS
// ===============================
function displayBookings() {

    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!user) {
        console.log("No user logged in.");
        return;
    }

    fetch("http://127.0.0.1:5000/bookings/" + user.id)
        .then(response => response.json())
        .then(bookings => {

            console.log("My bookings:", bookings);

            const bookingList =
                document.getElementById("bookingList");

            if (!bookingList) {
                console.log("Booking list element not found.");
                return;
            }

            bookingList.innerHTML = "";

            if (bookings.length === 0) {

                bookingList.innerHTML =
                    "<p>No bookings found.</p>";

                return;
            }

            bookings.forEach(booking => {

                const bookingItem =
                    document.createElement("div");

                bookingItem.classList.add("booking-item");

                bookingItem.innerHTML = `
                    <p><strong>Booking ID:</strong> ${booking.id}</p>
                    <p><strong>Slot:</strong> A${booking.slot_id}</p>
                    <p><strong>Vehicle:</strong> ${booking.vehicle_number}</p>
                    <p><strong>Date & Time:</strong> ${booking.booking_date}</p>
                    <p><strong>Amount:</strong> ₹${booking.amount}</p>
                    <p><strong>Payment:</strong> ${booking.payment_status}</p>

                    ${booking.payment_status === "Pending" ? `
                        <button onclick="openPaymentModal(${booking.id}, ${booking.amount})">
                            Pay Now ₹${booking.amount}
                        </button>
                    ` : `
                        <p><strong>Payment Completed ✅</strong></p>
`                   }

                    <button onclick="cancelBooking(${booking.id})">
                         Cancel Booking
                    </button>
            
                    
                `;

                bookingList.appendChild(bookingItem);

            });

        })
        .catch(error => {

            console.error(error);

            alert("Cannot load booking history.");

        });
}
// ===============================
// CANCEL BOOKING
// ===============================

function cancelBooking(bookingId) {

    if (!confirm("Are you sure you want to cancel this booking?")) {
        return;
    }

    fetch("http://127.0.0.1:5000/cancel-booking/" + bookingId, {
        method: "DELETE"
    })
    .then(response => response.json())
    .then(data => {

        if (data.message === "Booking cancelled successfully") {

            alert("Booking cancelled successfully!");

            loadParkingSlots();
            displayBookings();

        } else {

            alert(data.message);

        }

    })
    .catch(error => {

        console.error(error);
        alert("Unable to cancel booking.");

    });
}
// ===============================
// OPEN LOGIN
// ===============================
document.querySelector(".login-btn").onclick = function() {
    document.getElementById("authModal").style.display = "flex";
};

// ===============================
// CLOSE LOGIN
// ===============================
function closeAuth() {
    document.getElementById("authModal").style.display = "none";
}
// ===============================
// SHOW REGISTER
// ===============================
function showRegister() {

    document.getElementById("authTitle").textContent = "Register";

    document.querySelector("#authModal button").textContent = "Register";

    document.getElementById("authName").style.display = "block";

    document.getElementById("authSwitch").innerHTML =
        'Already have an account? <span onclick="showLogin()">Login</span>';
}

// ===============================
// SHOW LOGIN
// ===============================
function showLogin() {

    document.getElementById("authTitle").textContent = "Login";

    document.querySelector("#authModal button").textContent = "Login";

    document.getElementById("authName").style.display = "block";

    document.getElementById("authSwitch").innerHTML =
        'Don\'t have an account? <span onclick="showRegister()">Register</span>';
}
// ===============================
// LOGIN / REGISTER
// ===============================
function handleAuth() {

    const title = document.getElementById("authTitle").textContent;

    const name = document.getElementById("authName").value.trim();
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value.trim();

    if (email === "" || password === "") {
        alert("Please enter your email and password.");
        return;
    }

    // REGISTER
    if (title === "Register") {

        if (name === "") {
            alert("Please enter your name.");
            return;
        }

        fetch("http://127.0.0.1:5000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
               name: name,
               email: email,
            password: password
            })
        })
        .then(response => response.json())
        .then(data => {

           if (data.message === "Registration successful") {
              alert("Registration successful! You can now login.");
              showLogin();

              document.getElementById("authName").value = "";
              document.getElementById("authEmail").value = "";
              document.getElementById("authPassword").value = "";
            } else {
                alert(data.message);
            }

        })
        .catch(error => {
            console.error(error);
            alert("Cannot connect to the server.");
        });
    } else {

    
    // LOGIN

    fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {

        if (data.message === "Login successful") {

           alert("Login successful! Welcome " + data.user.name + ".");

           localStorage.setItem("loggedInUser", JSON.stringify(data.user));

           if (data.user.role === "admin") {

              window.location.href = "admin.html";

            } else if (data.user.role === "staff") {

                 window.location.href = "backend/staff.html";

            } else {

               updateAuthNav();
               updateDashboard();
               closeAuth();

            }

           // ROLE-BASED REDIRECTION

           if (data.user.role === "staff") {
              window.location.href = "staff.html";
            }

            else if (data.user.role === "admin") {
               window.location.href = "backend/admin.html";
            }

        } else {
           alert(data.message);
        }

    })
    .catch(error => {
       console.error(error);
       alert("Cannot connect to the server.");
    });
}
}   
// UPDATE USER DASHBOARD
function updateDashboard() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const dashboard = document.getElementById("dashboard");
    const navUserName = document.getElementById("navUserName");

    if (user) {
        dashboard.style.display = "block";

        document.getElementById("dashboardName").textContent =
            user.name || "User";

        document.getElementById("dashboardEmail").textContent =
            user.email || "Not available";

        navUserName.textContent = "Hi, " + (user.name || "User");
    } else {
        dashboard.style.display = "none";
        navUserName.textContent = "";
    }
}

// Run dashboard update
updateDashboard();
// UPDATE BOOKING COUNT
function updateBookingCount() {

    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!user) {
        document.getElementById("bookingCount").textContent = "0";
        return;
    }

    fetch("http://127.0.0.1:5000/bookings/" + user.id)
        .then(response => response.json())
        .then(bookings => {

            document.getElementById("bookingCount").textContent = bookings.length;

        })
        .catch(error => {

            console.error(error);
            document.getElementById("bookingCount").textContent = "0";

        });
}

updateBookingCount();
function logoutUser() {
    localStorage.removeItem("loggedInUser");
    updateAuthNav();

    document.getElementById("dashboard").style.display = "none";

    document.getElementById("dashboardName").textContent = "Guest";
    document.getElementById("dashboardEmail").textContent = "Not logged in";

    alert("You have been logged out.");
}
// UPDATE LOGIN / LOGOUT BUTTON
function updateAuthNav() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const authNavLink = document.getElementById("authNavLink");

    if (!authNavLink) return;

    if (user) {
        authNavLink.textContent = "Logout";
        authNavLink.onclick = logoutUser;
    } else {
        authNavLink.textContent = "Login";
        authNavLink.onclick = function() {
            document.getElementById("authModal").style.display = "flex";
            showLogin();
        };
    }
}

updateAuthNav();
// LOAD PARKING SLOTS FROM BACKEND
function loadParkingSlots() {

    fetch("http://127.0.0.1:5000/slots")
        .then(response => response.json())
        .then(slots => {

            const parkingGrid = document.querySelector(".parking-grid");

            parkingGrid.innerHTML = "";

            slots.forEach(slot => {

                const button = document.createElement("button");

                button.textContent = slot.slot_number;
                button.classList.add("slot");

                if (slot.status === "Available") {

                    button.classList.add("available");

                    button.onclick = function() {
                        selectSlot(slot.slot_number);
                    };

                } else {

                    button.classList.add("occupied");
                    button.disabled = true;

                }

                parkingGrid.appendChild(button);

            });

        })
        .catch(error => {
            console.error(error);
            alert("Cannot load parking slots.");
        });
}

loadParkingSlots();
window.addEventListener("DOMContentLoaded", function() {
    loadParkingSlots();
    displayBookings();
    loadPrediction();

    setInterval(loadParkingSlots, 5000);
});
console.log("SCRIPT LOADED");

window.addEventListener("load", function () {
    console.log("PAGE LOADED");
    loadParkingSlots();
});
function openPaymentModal(bookingId, amount) {

    document.getElementById("paymentAmount").textContent = "₹" + amount;
    document.getElementById("paymentQR").src =
        "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi%3A%2F%2Fpay%3Fpa%3Dsmartparking%40upi%26pn%3DSmart%2520Parking%26am%3D" + amount + "%26cu%3DINR";

    document.getElementById("paymentDoneBtn").onclick = function() {

        fetch("http://127.0.0.1:5000/payment/" + bookingId, {
            method: "POST"
        })
        .then(response => response.json())
        .then(data => {

            if (data.message === "Payment successful") {

                alert("Payment successful!");

                closePaymentModal();

                displayBookings();

            } else {

                alert(data.message);

            }

        })
        .catch(error => {

            console.error(error);
            alert("Payment failed.");

        });

    };

    document.getElementById("paymentModal").style.display = "flex";
}


function closePaymentModal() {

    document.getElementById("paymentModal").style.display = "none";

}
function loadPrediction() {

    const currentHour = new Date().getHours();

    fetch("http://127.0.0.1:5000/ml-prediction/" + currentHour)
        .then(response => response.json())
        .then(data => {

            document.getElementById("predictedOccupied").textContent =
                data.predicted_occupied;

            document.getElementById("predictedAvailable").textContent =
                data.predicted_available;

        })
        .catch(error => {
            console.error("Prediction error:", error);
        });
}