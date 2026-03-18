
import requests
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNmMzMzZGU4LTAzOTQtNDA5ZS05YWIyLTY1YjBhZjVkNjcyMiIsImVtYWlsIjoiZTJlLWxpZmVjeWNsZUB0ZXN0LmNvbSIsInJvbGUiOiJNQU5BR0VSIiwiZmFybUlkIjoiYTEwZWExYzYtOGQ2MS00NzhkLWIwYjAtZGY4NjgzNjU0M2UwIiwibW9kdWxlcyI6WyJub3RpZmljYXRpb25zIiwiaGVhbHRoIiwiYWktYXNzaXN0YW50IiwiZm9vZC10eXBlcyIsImZpc2gtdHlwZXMiLCJhbmFseXRpY3MiLCJhY2NvdW50aW5nIiwic2FsZXMiLCJpbnZlbnRvcnkiLCJoYXJ2ZXN0IiwicHJvY3VyZW1lbnQiLCJ0YW5rcyIsImRhc2hib2FyZCJdLCJpYXQiOjE3NzI2OTI1NTMsImV4cCI6MjEzMjY5MjU1M30.B17o9vVP8e5agC5Uge0OeTp__cY02EqqtLeu0tx8svM"
batch_id = "8b787e62-f173-464a-83c7-eebf80f86efb"
url = f"https://yousseftallal-fishfarm-backend-api.hf.space/api/v1/tanks/growth/batch/{batch_id}"

headers = {
    "Authorization": f"Bearer {token}"
}

response = requests.get(url, headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print(json.dumps(response.json(), indent=2))
else:
    print(response.text)
