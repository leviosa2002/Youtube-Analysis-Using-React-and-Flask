# YouTube Analytics Dashboard

A comprehensive full-stack YouTube analytics application built with React.js frontend and Flask backend. Analyze YouTube channels, videos, and trending content with advanced data visualizations and sentiment analysis.

## 🚀 Features

### 📊 Channel Analytics
- Complete channel metadata (subscribers, views, video count, country, creation date)
- Interactive trend visualization with line charts
- Recent videos performance metrics
- Content duration distribution analysis
- Engagement rate tracking across videos

### 🎬 Video Analytics
- Detailed video statistics (views, likes, comments, duration, engagement rate)
- Performance metrics (views/hour, like rate, comment rate)
- **AI-powered sentiment analysis** of comments (Positive/Neutral/Negative)
- Word frequency analysis from comments
- Related videos from the same channel
- Interactive bar charts and pie charts

### 🔥 Trending Analysis
- Top trending videos from the past 48 hours
- **Multi-country support** (12 regions: US, UK, Canada, India, Japan, etc.)
- Sortable table by views, likes, comments, and view velocity
- View velocity analysis (views per hour)
- Content category breakdown
- Regional performance insights

### 🎨 Advanced Visualizations
- **15+ chart types** using Recharts
- Area charts, pie charts, bar charts, line charts
- Gradient fills and professional styling
- Responsive design for all screen sizes
- Interactive tooltips and hover effects

## 🛠️ Tech Stack

### Backend
- **Flask** (Python web framework)
- **YouTube Data API v3** (free tier)
- **Flask-CORS** for cross-origin requests
- **python-dotenv** for environment variables
- **isodate** for duration parsing
- **requests** for API calls

### Frontend
- **React.js** with hooks
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **Axios** for API calls

## 📋 Prerequisites

- Python 3.8+
- Node.js 14+
- YouTube Data API v3 key (free from Google Cloud Console)

## ⚙️ Installation & Setup

### 1. Get YouTube API Key
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials (API key)
5. Copy the API key

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
Edit .env file and add your YouTube API key:
envYOUTUBE_API_KEY=your_youtube_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
Start the Flask server:
bashpython app.py
3. Frontend Setup
bashcd frontend
npm install
npm start
🌐 Usage

Backend: http://localhost:5000
Frontend: http://localhost:3000

Channel Analysis

Enter channel URL: https://youtube.com/@MrBeast
Or channel ID: UCX6OQ3DkcsbYNE6H8uQQuVA

Video Analysis

Enter video URL: https://youtube.com/watch?v=dQw4w9WgXcQ
Or video ID: dQw4w9WgXcQ

Trending Analysis

Select from 12 countries/regions
View top 30 trending videos
Sort by various metrics

📡 API Endpoints
Backend REST API
GET  /api/health                    # Health check
GET  /api/channel/<channel_id>      # Channel analytics
GET  /api/video/<video_id>          # Video analytics
GET  /api/trending                  # Trending videos (US)
GET  /api/trending/<region_code>    # Trending videos by region
Example API Calls
bashcurl http://localhost:5000/api/health
curl http://localhost:5000/api/channel/UCX6OQ3DkcsbYNE6H8uQQuVA
curl http://localhost:5000/api/video/dQw4w9WgXcQ
curl http://localhost:5000/api/trending/IN
🎯 Key Features Explained
Smart URL/ID Extraction
Supports various YouTube URL formats:

https://youtube.com/@channelname
https://youtube.com/channel/UCxxxx
https://youtube.com/watch?v=xxxxx
https://youtu.be/xxxxx
Direct IDs

Sentiment Analysis

Analyzes comment text for sentiment
Keywords-based classification
Visual breakdown with charts
Sample comments with sentiment labels

View Velocity

Formula: Total Views ÷ Hours Since Published
Shows trending momentum
Categories: Viral (10K+/h), Hot (5-10K/h), Rising (1-5K/h), Steady (<1K/h)

Multi-Region Support
Available regions: 🇺🇸 US, 🇬🇧 UK, 🇨🇦 Canada, 🇦🇺 Australia, 🇩🇪 Germany, 🇫🇷 France, 🇯🇵 Japan, 🇰🇷 South Korea, 🇮🇳 India, 🇧🇷 Brazil, 🇲🇽 Mexico, 🇷🇺 Russia
📊 Data Insights
Channel Metrics

Subscriber growth trends
Average views per video
Content duration preferences
Engagement rate analysis
Upload frequency patterns

Video Metrics

Real-time view velocity
Like-to-view ratio
Comment engagement
Audience sentiment
Performance benchmarking

Trending Metrics

Regional content preferences
Viral content characteristics
Engagement distribution
Category performance
Peak performance times

🔧 Configuration
Environment Variables
env# Backend (.env)
YOUTUBE_API_KEY=your_api_key
FLASK_ENV=development
FLASK_DEBUG=True
HOST=0.0.0.0
PORT=5000

# Frontend (.env.local)
REACT_APP_API_URL=http://localhost:5000/api
API Rate Limits

YouTube Data API: 10,000 units/day (free tier)
Channel request: ~4 units
Video request: ~4 units
Trending request: ~100 units

🚨 Troubleshooting
Common Issues
403 Forbidden Error

Check API key validity
Ensure YouTube Data API v3 is enabled
Verify billing is enabled in Google Cloud

CORS Errors

Ensure Flask-CORS is installed
Check frontend API URL configuration

No Trending Data

Try different regions
Check API quota usage
Verify API key restrictions

Channel Not Found

Try channel ID instead of custom URL
Check for typos in URL/ID
Some private channels may not be accessible

📈 Performance

Frontend: Optimized React components with lazy loading
Backend: Efficient API calls with caching mechanisms
API Usage: Smart quota management
Responsive: Works on desktop, tablet, and mobile

🤝 Contributing

Fork the repository
Create feature branch (git checkout -b feature/AmazingFeature)
Commit changes (git commit -m 'Add AmazingFeature')
Push to branch (git push origin feature/AmazingFeature)
Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments

YouTube Data API v3 for data access
Recharts for beautiful visualizations
Tailwind CSS for styling
Lucide React for icons
