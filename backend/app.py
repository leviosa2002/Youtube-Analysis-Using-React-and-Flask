# app.py - Fixed Flask Backend with Debug
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
from datetime import datetime, timedelta, timezone
import isodate
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

def make_youtube_request(endpoint, params):
    """Make a request to YouTube API with error handling"""
    params['key'] = YOUTUBE_API_KEY
    
    # Debug logging
    url = f"{YOUTUBE_API_BASE}/{endpoint}"
    logger.info(f"Making API request to: {url}")
    logger.info(f"Parameters: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        logger.info(f"Response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"HTTP {response.status_code} error")
            logger.error(f"Response: {response.text}")
            return None
        
        data = response.json()
        logger.info(f"Successfully retrieved data with {len(data.get('items', []))} items")
        return data
        
    except requests.exceptions.RequestException as e:
        logger.error(f"YouTube API Error: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return None

def format_number(num):
    """Format large numbers with K, M, B suffixes"""
    if num >= 1_000_000_000:
        return f"{num / 1_000_000_000:.1f}B"
    elif num >= 1_000_000:
        return f"{num / 1_000_000:.1f}M"
    elif num >= 1_000:
        return f"{num / 1_000:.1f}K"
    return str(num)

import re
from collections import Counter

def parse_duration(duration):
    """Parse ISO 8601 duration to seconds"""
    try:
        return int(isodate.parse_duration(duration).total_seconds())
    except:
        return 0

def parse_youtube_datetime(date_string):
    """Parse YouTube datetime string to timezone-aware datetime"""
    try:
        # YouTube returns ISO format like: 2023-06-26T10:00:00Z
        if date_string.endswith('Z'):
            date_string = date_string[:-1] + '+00:00'
        return datetime.fromisoformat(date_string)
    except:
        # Fallback to UTC if parsing fails
        return datetime.now(timezone.utc)

def get_utc_now():
    """Get current UTC datetime (timezone-aware)"""
    return datetime.now(timezone.utc)

def analyze_sentiment(text):
    """Simple sentiment analysis based on keywords"""
    positive_words = ['good', 'great', 'awesome', 'amazing', 'love', 'excellent', 'perfect', 'best', 'wonderful', 'fantastic', 'nice', 'beautiful', 'cool', 'thanks', 'thank']
    negative_words = ['bad', 'hate', 'terrible', 'awful', 'worst', 'stupid', 'boring', 'sucks', 'disappointing', 'useless', 'garbage', 'trash', 'horrible']
    
    text_lower = text.lower()
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    if positive_count > negative_count:
        return 'positive'
    elif negative_count > positive_count:
        return 'negative'
    else:
        return 'neutral'

def get_video_comments_analysis(video_id, max_results=50):
    """Get and analyze video comments"""
    comments_data = make_youtube_request('commentThreads', {
        'part': 'snippet',
        'videoId': video_id,
        'maxResults': max_results,
        'order': 'relevance'
    })
    
    if not comments_data or not comments_data.get('items'):
        return None
    
    comments = []
    sentiments = []
    word_freq = Counter()
    
    for item in comments_data['items']:
        comment = item['snippet']['topLevelComment']['snippet']
        text = comment['textDisplay']
        
        # Clean text for word frequency
        clean_text = re.sub(r'[^\w\s]', '', text.lower())
        words = [word for word in clean_text.split() if len(word) > 3]
        word_freq.update(words)
        
        sentiment = analyze_sentiment(text)
        sentiments.append(sentiment)
        
        comments.append({
            'text': text[:100] + '...' if len(text) > 100 else text,
            'likeCount': comment.get('likeCount', 0),
            'sentiment': sentiment,
            'publishedAt': comment['publishedAt']
        })
    
    # Calculate sentiment distribution
    sentiment_dist = Counter(sentiments)
    
    return {
        'comments': comments[:20],  # Top 20 comments
        'sentimentDistribution': {
            'positive': sentiment_dist.get('positive', 0),
            'negative': sentiment_dist.get('negative', 0),
            'neutral': sentiment_dist.get('neutral', 0)
        },
        'topWords': dict(word_freq.most_common(10)),
        'totalComments': len(comments)
    }
    """Parse ISO 8601 duration to seconds"""
    try:
        return int(isodate.parse_duration(duration).total_seconds())
    except:
        return 0

def parse_youtube_datetime(date_string):
    """Parse YouTube datetime string to timezone-aware datetime"""
    try:
        # YouTube returns ISO format like: 2023-06-26T10:00:00Z
        if date_string.endswith('Z'):
            date_string = date_string[:-1] + '+00:00'
        return datetime.fromisoformat(date_string)
    except:
        # Fallback to UTC if parsing fails
        return datetime.now(timezone.utc)

def get_utc_now():
    """Get current UTC datetime (timezone-aware)"""
    return datetime.now(timezone.utc)

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy', 
        'timestamp': get_utc_now().isoformat(),
        'api_key_configured': bool(YOUTUBE_API_KEY),
        'api_key_length': len(YOUTUBE_API_KEY) if YOUTUBE_API_KEY else 0
    })

@app.route('/api/test-channel/<channel_input>')
def test_channel_resolution(channel_input):
    """Test endpoint to debug channel ID resolution"""
    logger.info(f"Testing channel resolution for: {channel_input}")
    
    original_input = channel_input
    channel_id = channel_input
    
    # Apply the same logic as the main endpoint
    if channel_input.startswith('@'):
        channel_id = get_channel_id_from_name(channel_input[1:])
        resolution_method = "@ username search"
    elif not channel_input.startswith('UC') and len(channel_input) != 24:
        channel_id = get_channel_id_from_name(channel_input)
        resolution_method = "name search"
    else:
        resolution_method = "direct channel ID"
    
    if not channel_id:
        return jsonify({
            'success': False,
            'original_input': original_input,
            'error': f'Could not resolve channel ID for: {original_input}'
        }), 404
    
    # Test if the resolved channel ID works
    test_data = make_youtube_request('channels', {
        'part': 'snippet',
        'id': channel_id
    })
    
    if test_data and test_data.get('items'):
        channel_info = test_data['items'][0]['snippet']
        return jsonify({
            'success': True,
            'original_input': original_input,
            'resolved_channel_id': channel_id,
            'resolution_method': resolution_method,
            'channel_title': channel_info['title'],
            'channel_description': channel_info['description'][:100] + '...'
        })
    else:
        return jsonify({
            'success': False,
            'original_input': original_input,
            'resolved_channel_id': channel_id,
            'resolution_method': resolution_method,
            'error': 'Channel ID resolved but no data found'
        }), 404

def get_channel_id_from_name(name):
    """Get channel ID from channel name/username using search"""
    logger.info(f"Searching for channel: {name}")
    search_data = make_youtube_request('search', {
        'part': 'snippet',
        'q': name,
        'type': 'channel',
        'maxResults': 1
    })
    
    if search_data and search_data.get('items'):
        channel_id = search_data['items'][0]['snippet']['channelId']
        logger.info(f"Found channel ID: {channel_id} for name: {name}")
        return channel_id
    
    logger.warning(f"No channel found for name: {name}")
    return None

@app.route('/api/channel/<channel_input>')
def get_channel_analytics(channel_input):
    logger.info(f"Fetching channel analytics for: {channel_input}")
    
    channel_id = channel_input
    
    # Handle different input formats
    if channel_input.startswith('@'):
        # Handle @username format
        channel_id = get_channel_id_from_name(channel_input[1:])
    elif not channel_input.startswith('UC') and len(channel_input) != 24:
        # Doesn't look like a channel ID, try searching by name
        channel_id = get_channel_id_from_name(channel_input)
    
    if not channel_id:
        return jsonify({'error': f'Channel "{channel_input}" not found'}), 404
    
    # Get channel details using the resolved channel ID
    channel_data = make_youtube_request('channels', {
        'part': 'snippet,statistics,brandingSettings',
        'id': channel_id
    })
    
    if not channel_data or not channel_data.get('items'):
        return jsonify({'error': f'Channel data not found for ID: {channel_id}'}), 404
    
    channel = channel_data['items'][0]
    snippet = channel['snippet']
    stats = channel['statistics']
    
    # Get recent videos for trend analysis using the resolved channel_id
    videos_data = make_youtube_request('search', {
        'part': 'snippet',
        'channelId': channel_id,  # Use resolved channel_id
        'type': 'video',
        'order': 'date',
        'maxResults': 10
    })
    
    video_stats = []
    if videos_data and videos_data.get('items'):
        video_ids = [item['id']['videoId'] for item in videos_data['items']]
        video_details = make_youtube_request('videos', {
            'part': 'statistics,contentDetails',
            'id': ','.join(video_ids)
        })
        
        if video_details:
            for i, video in enumerate(video_details['items']):
                video_stats.append({
                    'title': videos_data['items'][i]['snippet']['title'],
                    'publishedAt': videos_data['items'][i]['snippet']['publishedAt'],
                    'views': int(video['statistics'].get('viewCount', 0)),
                    'likes': int(video['statistics'].get('likeCount', 0)),
                    'comments': int(video['statistics'].get('commentCount', 0)),
                    'duration': parse_duration(video['contentDetails']['duration'])
                })
    
    # Enhanced channel analytics
    avg_views_per_video = sum([v['views'] for v in video_stats]) / len(video_stats) if video_stats else 0
    avg_engagement = sum([(v['likes'] + v['comments']) / max(v['views'], 1) * 100 for v in video_stats]) / len(video_stats) if video_stats else 0
    
    # Video duration analysis
    duration_analysis = {'short': 0, 'medium': 0, 'long': 0}
    for video in video_stats:
        if video['duration'] < 300:
            duration_analysis['short'] += 1
        elif video['duration'] < 1200:
            duration_analysis['medium'] += 1
        else:
            duration_analysis['long'] += 1

    result = {
        'channel': {
            'id': channel_id,  # Use the resolved channel_id
            'title': snippet['title'],
            'description': snippet['description'][:200] + '...' if len(snippet['description']) > 200 else snippet['description'],
            'customUrl': snippet.get('customUrl', ''),
            'publishedAt': snippet['publishedAt'],
            'country': snippet.get('country', 'Unknown'),
            'thumbnails': snippet['thumbnails'],
            'subscriberCount': int(stats.get('subscriberCount', 0)),
            'videoCount': int(stats.get('videoCount', 0)),
            'viewCount': int(stats.get('viewCount', 0)),
            'subscriberCountFormatted': format_number(int(stats.get('subscriberCount', 0))),
            'viewCountFormatted': format_number(int(stats.get('viewCount', 0)))
        },
        'recentVideos': video_stats,
        'trendData': [
            {'date': (get_utc_now() - timedelta(days=i)).strftime('%Y-%m-%d'), 
             'views': sum([v['views'] for v in video_stats[-i-1:]] if i < len(video_stats) else [0])}
            for i in range(7, -1, -1)
        ],
        'enhancedAnalytics': {
            'avgViewsPerVideo': round(avg_views_per_video),
            'avgEngagementRate': round(avg_engagement, 2),
            'contentDistribution': duration_analysis,
            'topPerformingVideo': max(video_stats, key=lambda x: x['views']) if video_stats else None
        }
    }
    
    return jsonify(result)

@app.route('/api/video/<video_id>')
def get_video_analytics(video_id):
    logger.info(f"Fetching video analytics for: {video_id}")
    
    # Get video details
    video_data = make_youtube_request('videos', {
        'part': 'snippet,statistics,contentDetails',
        'id': video_id
    })
    
    if not video_data or not video_data.get('items'):
        logger.error(f"Video not found: {video_id}")
        return jsonify({'error': 'Video not found or API error'}), 404
    
    video = video_data['items'][0]
    snippet = video['snippet']
    stats = video['statistics']
    content = video['contentDetails']
    
    views = int(stats.get('viewCount', 0))
    likes = int(stats.get('likeCount', 0))
    comments = int(stats.get('commentCount', 0))
    
    # Calculate engagement rate
    engagement_rate = ((likes + comments) / views * 100) if views > 0 else 0
    
    # Get related videos from same channel
    channel_videos = make_youtube_request('search', {
        'part': 'snippet',
        'channelId': snippet['channelId'],
        'type': 'video',
        'order': 'relevance',
        'maxResults': 5
    })
    
    related_videos = []
    if channel_videos and channel_videos.get('items'):
        for item in channel_videos['items']:
            if item['id']['videoId'] != video_id:
                related_videos.append({
                    'id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'thumbnail': item['snippet']['thumbnails']['medium']['url']
                })
    
    # Get comments analysis
    comments_analysis = get_video_comments_analysis(video_id)
    
    # Enhanced analytics
    upload_frequency = 0
    if channel_videos and len(channel_videos['items']) > 1:
        latest = parse_youtube_datetime(channel_videos['items'][0]['snippet']['publishedAt'])
        oldest = parse_youtube_datetime(channel_videos['items'][-1]['snippet']['publishedAt'])
        days_diff = (latest - oldest).days
        upload_frequency = len(channel_videos['items']) / max(days_diff, 1) if days_diff > 0 else 0

    result = {
        'video': {
            'id': video_id,
            'title': snippet['title'],
            'description': snippet['description'][:300] + '...' if len(snippet['description']) > 300 else snippet['description'],
            'channelTitle': snippet['channelTitle'],
            'channelId': snippet['channelId'],
            'publishedAt': snippet['publishedAt'],
            'thumbnails': snippet['thumbnails'],
            'duration': parse_duration(content['duration']),
            'viewCount': views,
            'likeCount': likes,
            'commentCount': comments,
            'viewCountFormatted': format_number(views),
            'likeCountFormatted': format_number(likes),
            'commentCountFormatted': format_number(comments),
            'engagementRate': round(engagement_rate, 2)
        },
        'analytics': {
            'viewsPerHour': round(views / ((get_utc_now() - parse_youtube_datetime(snippet['publishedAt'])).total_seconds() / 3600), 2) if views > 0 else 0,
            'likesToViewsRatio': round((likes / views * 100), 2) if views > 0 else 0,
            'commentsToViewsRatio': round((comments / views * 100), 2) if views > 0 else 0,
            'uploadFrequency': round(upload_frequency, 2)
        },
        'relatedVideos': related_videos[:3],
        'commentsAnalysis': comments_analysis
    }
    
    return jsonify(result)

@app.route('/api/trending')
@app.route('/api/trending/<region_code>')
def get_trending_analysis(region_code='US'):
    logger.info(f"Fetching trending analysis for region: {region_code}")
    
    # Try different approaches for trending videos
    # Method 1: Most popular videos (global)
    trending_data = make_youtube_request('videos', {
        'part': 'snippet,statistics,contentDetails',
        'chart': 'mostPopular',
        'regionCode': region_code.upper(),
        'maxResults': 50
    })
    
    if not trending_data or not trending_data.get('items'):
        logger.warning("No trending data from mostPopular chart, trying search method")
        
        # Method 2: Recent popular videos via search
        one_day_ago = (get_utc_now() - timedelta(days=1)).isoformat()
        trending_data = make_youtube_request('search', {
            'part': 'snippet',
            'type': 'video',
            'order': 'viewCount',
            'publishedAfter': one_day_ago,
            'maxResults': 50,
            'regionCode': region_code.upper()
        })
        
        if not trending_data or not trending_data.get('items'):
            return jsonify({'error': 'No trending data available. This might be due to API quotas or restrictions.'}), 404
        
        # Get video statistics for search results
        video_ids = [item['id']['videoId'] for item in trending_data['items']]
        video_details = make_youtube_request('videos', {
            'part': 'statistics,contentDetails',
            'id': ','.join(video_ids)
        })
        
        if not video_details:
            return jsonify({'error': 'Failed to fetch video details'}), 500
        
        # Combine search results with video details
        trending_videos = []
        for i, item in enumerate(trending_data['items']):
            if i < len(video_details['items']):
                video = video_details['items'][i]
                views = int(video['statistics'].get('viewCount', 0))
                published = parse_youtube_datetime(item['snippet']['publishedAt'])
                hours_since_publish = (get_utc_now() - published).total_seconds() / 3600
                
                trending_videos.append({
                    'id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'channelTitle': item['snippet']['channelTitle'],
                    'publishedAt': item['snippet']['publishedAt'],
                    'thumbnails': item['snippet']['thumbnails'],
                    'viewCount': views,
                    'likeCount': int(video['statistics'].get('likeCount', 0)),
                    'commentCount': int(video['statistics'].get('commentCount', 0)),
                    'viewCountFormatted': format_number(views),
                    'viewVelocity': round(views / hours_since_publish, 2) if hours_since_publish > 0 else 0,
                    'duration': parse_duration(video['contentDetails']['duration'])
                })
    else:
        # Method 1 worked - process mostPopular results
        trending_videos = []
        for item in trending_data['items']:
            snippet = item['snippet']
            stats = item['statistics']
            content = item['contentDetails']
            
            views = int(stats.get('viewCount', 0))
            published = parse_youtube_datetime(snippet['publishedAt'])
            hours_since_publish = (get_utc_now() - published).total_seconds() / 3600
            
            trending_videos.append({
                'id': item['id'],
                'title': snippet['title'],
                'channelTitle': snippet['channelTitle'],
                'publishedAt': snippet['publishedAt'],
                'thumbnails': snippet['thumbnails'],
                'viewCount': views,
                'likeCount': int(stats.get('likeCount', 0)),
                'commentCount': int(stats.get('commentCount', 0)),
                'viewCountFormatted': format_number(views),
                'viewVelocity': round(views / hours_since_publish, 2) if hours_since_publish > 0 else 0,
                'duration': parse_duration(content['duration'])
            })
    
    # Sort by view velocity (views per hour)
    trending_videos.sort(key=lambda x: x['viewVelocity'], reverse=True)
    
    # Enhanced category analysis
    categories = {}
    for video in trending_videos:
        duration = video['duration']
        if duration < 300:  # < 5 min
            category = 'Short'
        elif duration < 1200:  # < 20 min
            category = 'Medium'
        else:
            category = 'Long'
        
        if category not in categories:
            categories[category] = {'count': 0, 'totalViews': 0, 'avgEngagement': 0}
        categories[category]['count'] += 1
        categories[category]['totalViews'] += video['viewCount']
        categories[category]['avgEngagement'] += (video['likeCount'] + video['commentCount']) / max(video['viewCount'], 1) * 100
    
    # Calculate averages
    for category in categories:
        categories[category]['avgEngagement'] = categories[category]['avgEngagement'] / categories[category]['count']
    
    # Engagement analysis
    engagement_ranges = {'Low (0-2%)': 0, 'Medium (2-5%)': 0, 'High (5%+)': 0}
    for video in trending_videos:
        engagement_rate = (video['likeCount'] + video['commentCount']) / max(video['viewCount'], 1) * 100
        if engagement_rate < 2:
            engagement_ranges['Low (0-2%)'] += 1
        elif engagement_rate < 5:
            engagement_ranges['Medium (2-5%)'] += 1
        else:
            engagement_ranges['High (5%+)'] += 1
    
    result = {
        'trendingVideos': trending_videos[:30],  # Limit to top 30
        'region': region_code.upper(),
        'summary': {
            'totalVideos': len(trending_videos),
            'totalViews': sum([v['viewCount'] for v in trending_videos]),
            'averageViews': sum([v['viewCount'] for v in trending_videos]) // len(trending_videos) if trending_videos else 0,
            'topPerformer': trending_videos[0] if trending_videos else None,
            'avgEngagement': sum([(v['likeCount'] + v['commentCount']) / max(v['viewCount'], 1) * 100 for v in trending_videos]) / len(trending_videos) if trending_videos else 0
        },
        'categoryBreakdown': [
            {'category': cat, 'count': data['count'], 'avgViews': data['totalViews'] // data['count'], 'avgEngagement': round(data['avgEngagement'], 2)}
            for cat, data in categories.items()
        ],
        'engagementDistribution': [
            {'range': range_name, 'count': count}
            for range_name, count in engagement_ranges.items()
        ]
    }
    
    return jsonify(result)

if __name__ == '__main__':
    if not YOUTUBE_API_KEY:
        print("❌ Error: YOUTUBE_API_KEY environment variable is required")
        print("📝 Please check your .env file")
        exit(1)
    
    print(f"🚀 Starting YouTube Analytics API server...")
    print(f"🔑 API Key configured: {'✅' if YOUTUBE_API_KEY else '❌'}")
    print(f"🔑 API Key length: {len(YOUTUBE_API_KEY)} characters")
    print(f"🌐 Server will run on: http://localhost:5000")
    print(f"🔍 Health check: http://localhost:5000/api/health")
    print(f"🧪 Test endpoint: http://localhost:5000/api/test-video/dQw4w9WgXcQ")
    
    app.run(debug=True, host='0.0.0.0', port=5000)