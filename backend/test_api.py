import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('YOUTUBE_API_KEY')

if not api_key:
    print("❌ No API key found in .env file")
    exit()

print(f"🔑 Testing API key: {api_key[:20]}...")

url = "https://www.googleapis.com/youtube/v3/videos"
params = {
    'part': 'snippet',
    'id': 'dQw4w9WgXcQ',
    'key': api_key
}

try:
    response = requests.get(url, params=params)
    print(f"📡 Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success! Found video: {data['items'][0]['snippet']['title']}")
    else:
        print(f"❌ Error: {response.text}")
        
except Exception as e:
    print(f"❌ Request failed: {e}")