import requests
import json

# Test API endpoints
base_url = "http://127.0.0.1:8000/api"

def test_contracts_endpoint():
    """Test contracts endpoint without authentication"""
    try:
        response = requests.get(f"{base_url}/contracts/")
        print(f"Contracts API Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Number of contracts: {len(data)}")
            print(f"First contract: {data[0] if data else 'No contracts'}")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error testing contracts endpoint: {e}")

def test_rooms_endpoint():
    """Test rooms endpoint"""
    try:
        response = requests.get(f"{base_url}/rooms/")
        print(f"Rooms API Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Number of rooms: {len(data)}")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error testing rooms endpoint: {e}")

if __name__ == "__main__":
    print("Testing API endpoints...")
    test_contracts_endpoint()
    test_rooms_endpoint()
