import random
from sklearn.linear_model import LinearRegression

# Sample parking data
# X = hour of the day
# y = number of occupied slots

hours = [[8], [10], [12], [14], [16], [18], [20]]
occupied_slots = [5, 8, 14, 10, 7, 16, 12]

# Create ML model
model = LinearRegression()

# Train the model
model.fit(hours, occupied_slots)


def predict_occupied_slots(hour):
    prediction = model.predict([[hour]])[0]

    # Keep prediction within 0-20 slots
    prediction = max(0, min(20, round(prediction)))

    return prediction


# Test prediction
current_hour = random.randint(8, 20)

predicted = predict_occupied_slots(current_hour)

available = 20 - predicted

print("Current hour:", current_hour)
print("Predicted occupied slots:", predicted)
print("Predicted available slots:", available)