import requests
import random
import time

API_URL = "http://127.0.0.1:5000/iot/update"

while True:

    slot_id = random.randint(1, 20)

    if random.choice([True, False]):
        status = "Occupied"
    else:
        status = "Available"

    data = {
        "slot_id": slot_id,
        "status": status
    }

    response = requests.post(API_URL, json=data)

    if response.status_code == 200:
        result = response.json()

        print(
            result["slot"],
            "->",
            result["status"]
        )
    else:
        print("Failed to update slot")

    time.sleep(5)