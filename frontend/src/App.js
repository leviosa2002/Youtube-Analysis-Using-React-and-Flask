import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from 'recharts';
import { Search, TrendingUp, Video, Users, Eye, ThumbsUp, MessageCircle, Clock, Globe, Calendar, Activity, BarChart3, Play, Smile, Frown, Meh, Flag, Award, Zap, Youtube } from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Utility Functions
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

const timeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  if (diffInHours < 720) return `${Math.floor(diffInHours / 168)}w ago`;
  return `${Math.floor(diffInHours / 720)}mo ago`;
};

const extractId = (input, type) => {
  if (!input) return '';
  input = input.trim();
  
  if (type === 'video') {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^[a-zA-Z0-9_-]{11}$/
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
  } else if (type === 'channel') {
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_.-]+)/,
      /^UC[a-zA-Z0-9_-]{22}$/,
      /^@[a-zA-Z0-9_.-]+$/
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
  }
  return input;
};

// API Service
const api = {
  getChannel: async (channelId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/channel/${channelId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Channel not found`);
      }
      return response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please ensure the backend is running.');
      }
      throw error;
    }
  },
  
  getVideo: async (videoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/video/${videoId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Video not found`);
      }
      return response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please ensure the backend is running.');
      }
      throw error;
    }
  },
  
  getTrending: async (region = 'US') => {
    try {
      const response = await fetch(`${API_BASE_URL}/trending/${region}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch trending data`);
      }
      return response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please ensure the backend is running.');
      }
      throw error;
    }
  },

  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <div className="text-red-600 mb-4">{message}</div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

const MetricCard = ({ icon: Icon, label, value, subtitle, color = "blue", trend }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">{trend}</span>
          </div>
        )}
      </div>
      <Icon className="h-8 w-8 text-blue-500" />
    </div>
  </div>
);

// Enhanced View Velocity Chart Component
const EnhancedViewVelocityChart = ({ trendingVideos, velocityAnalysis }) => {
  // Prepare enhanced chart data with more detailed metrics
  const velocityData = trendingVideos.slice(0, 10).map((video, index) => ({
    rank: index + 1,
    title: video.title.substring(0, 40) + '...',
    velocity: video.viewVelocity,
    dailyVelocity: video.dailyVelocity,
    category: video.velocityCategory,
    hoursOld: video.hoursOld,
    views: video.viewCount / 1000000,
    velocityScore: video.velocityScore,
    id: video.id,
    channelTitle: video.channelTitle,
    publishedAt: video.publishedAt,
    engagement: ((video.likeCount + video.commentCount) / video.viewCount * 100).toFixed(1),
    color: video.velocityCategory === 'Viral' ? '#EF4444' :
           video.velocityCategory === 'Hot' ? '#F97316' :
           video.velocityCategory === 'Rising' ? '#EAB308' : '#6B7280'
  }));

  const velocityRangeData = velocityAnalysis.velocityRanges.map(range => ({
    range: range.range.split(' ')[0], // Just the category name
    count: range.count,
    color: range.range.includes('Viral') ? '#EF4444' :
           range.range.includes('Hot') ? '#F97316' :
           range.range.includes('Rising') ? '#EAB308' : '#6B7280'
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Enhanced Velocity Comparison */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            View Velocity Analysis (Top 10)
          </div>
          <div className="text-sm text-gray-500">
            Updated {timeAgo(new Date())}
          </div>
        </h3>
        <div className="space-y-4">
          {velocityData.map((video, index) => (
            <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    index === 0 ? 'bg-red-100 text-red-800' :
                    index === 1 ? 'bg-orange-100 text-orange-800' :
                    index === 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    video.category === 'Viral' ? 'bg-red-100 text-red-800' :
                    video.category === 'Hot' ? 'bg-orange-100 text-orange-800' :
                    video.category === 'Rising' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {video.category}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-800`}>
                    {video.engagement}% engagement
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{timeAgo(video.publishedAt)}</span>
                  <a 
                    href={`https://youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title="Watch on YouTube"
                  >
                    <Video className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-4 mb-3">
                <div className="flex-grow">
                  <div className="text-sm font-medium text-gray-800 mb-1 line-clamp-2" title={video.title}>
                    {video.title}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {video.channelTitle}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="text-xs font-medium text-red-600">{formatNumber(video.velocity)}</div>
                  <div className="text-xs text-red-500">views/hour</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded">
                  <div className="text-xs font-medium text-orange-600">{formatNumber(video.dailyVelocity)}</div>
                  <div className="text-xs text-orange-500">views/day</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-xs font-medium text-blue-600">{video.velocityScore}/100</div>
                  <div className="text-xs text-blue-500">velocity score</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="text-xs font-medium text-purple-600">{formatNumber(video.views)}M</div>
                  <div className="text-xs text-purple-500">total views</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative pt-1">
                  <div className="text-xs text-gray-500 mb-1">Velocity Rank</div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                    <div
                      className="rounded"
                      style={{ 
                        width: `${(video.velocity / velocityData[0].velocity * 100)}%`,
                        backgroundColor: video.color
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatNumber(video.velocity)} views/hour</span>
                    <span>{Math.round(video.velocity / velocityData[0].velocity * 100)}% of #1</span>
                  </div>
                </div>
                <div className="relative pt-1">
                  <div className="text-xs text-gray-500 mb-1">Time Online</div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                    <div
                      className="rounded bg-green-500"
                      style={{ 
                        width: `${Math.min((video.hoursOld / 72) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{video.hoursOld} hours</span>
                    <span>{Math.round(video.hoursOld / 72 * 100)}% of 72h</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Velocity Categories Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-500" />
          Velocity Categories Distribution
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={velocityRangeData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              label={({ range, percent, count }) => `${range} ${count} (${(percent * 100).toFixed(0)}%)`}
            >
              {velocityRangeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Velocity Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">
              {velocityAnalysis.averageVelocity.toFixed(0)}
            </div>
            <div className="text-xs text-yellow-700">Avg Velocity/hour</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">
              {velocityAnalysis.maxVelocity.toFixed(0)}
            </div>
            <div className="text-xs text-red-700">Peak Velocity/hour</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Channel Analysis Component
const ChannelAnalysis = ({ channelId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getChannel(channelId);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (channelId) fetchData();
  }, [channelId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!data) return null;

  const { channel, recentVideos, trendData, enhancedAnalytics } = data;

  // Enhanced chart data
  const engagementTrendData = recentVideos && recentVideos.length > 0 ? recentVideos.map((video, index) => ({
    name: `Video ${index + 1}`,
    engagement: video.views > 0 ? ((video.likes + video.comments) / video.views * 100).toFixed(2) : 0,
    views: video.views / 1000,
    likes: video.likes,
    comments: video.comments,
    title: video.title ? video.title.substring(0, 30) + '...' : 'Unknown'
  })) : [];

  const contentDistributionData = enhancedAnalytics && enhancedAnalytics.contentDistribution ? [
    { name: 'Short (<5min)', value: enhancedAnalytics.contentDistribution.short || 0, color: '#FF6B6B' },
    { name: 'Medium (5-20min)', value: enhancedAnalytics.contentDistribution.medium || 0, color: '#4ECDC4' },
    { name: 'Long (>20min)', value: enhancedAnalytics.contentDistribution.long || 0, color: '#45B7D1' }
  ] : [];

  const viewsVsEngagementData = recentVideos && recentVideos.length > 0 ? recentVideos.map((video, index) => ({
    name: `V${index + 1}`,
    views: video.views / 1000,
    engagement: video.views > 0 ? ((video.likes + video.comments) / video.views * 100) : 0,
    title: video.title.substring(0, 25) + '...'
  })) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Search
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Channel Analytics</h2>
      </div>

      {/* Channel Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
        <div className="flex items-start space-x-4">
          <img
            src={channel.thumbnails.medium.url}
            alt={channel.title}
            className="w-24 h-24 rounded-full shadow-lg"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{channel.title}</h1>
            <p className="text-gray-600 mb-4">{channel.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created: {new Date(channel.publishedAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                {channel.country}
              </div>
              {channel.customUrl && (
                <div className="flex items-center">
                  <span className="text-blue-600 font-medium">@{channel.customUrl}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          label="Subscribers"
          value={channel.subscriberCountFormatted}
          subtitle={`${channel.subscriberCount.toLocaleString()} total`}
        />
        <MetricCard
          icon={Eye}
          label="Total Views"
          value={channel.viewCountFormatted}
          subtitle={`${channel.viewCount.toLocaleString()} total`}
        />
        <MetricCard
          icon={Video}
          label="Videos"
          value={channel.videoCount.toLocaleString()}
          subtitle="Total uploads"
        />
        <MetricCard
          icon={Activity}
          label="Avg Engagement"
          value={enhancedAnalytics ? `${enhancedAnalytics.avgEngagementRate}%` : '0%'}
          subtitle="Per video"
        />
      </div>

      {/* Advanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* View Trends - Enhanced Area Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            View Trends (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke="#3B82F6" fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Content Distribution - Enhanced Pie */}
        {contentDistributionData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
              Content Duration Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                >
                  {contentDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Views vs Engagement Analysis */}
        <div className="col-span-2 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-purple-500" />
            Views vs Engagement Analysis
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Video Performance */}
            <div>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-600">
                  Compare video performance by views and engagement rate. Higher engagement indicates stronger viewer interaction.
                </div>
              </div>

              <div className="space-y-3 overflow-auto max-h-[500px] pr-2">
                {viewsVsEngagementData.slice(0, 5).map((video, index) => (
                  <div 
                    key={index}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          index === 0 ? 'bg-purple-100 text-purple-800' :
                          index === 1 ? 'bg-blue-100 text-blue-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          video.engagement > 5 ? 'bg-green-100 text-green-800' :
                          video.engagement > 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {video.engagement.toFixed(1)}% engagement
                        </span>
                      </div>
                      <a 
                        href={`https://youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Watch on YouTube"
                      >
                        <Video className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="text-sm font-medium text-gray-800 mb-3 line-clamp-2" title={video.title}>
                      {video.title}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="text-xs font-medium text-purple-600">{formatNumber(video.views)}K</div>
                        <div className="text-xs text-purple-500">views</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-xs font-medium text-blue-600">{video.engagement.toFixed(1)}%</div>
                        <div className="text-xs text-blue-500">engagement rate</div>
                      </div>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                        <div
                          className="bg-purple-500 rounded"
                          style={{ width: `${Math.min((video.views / viewsVsEngagementData[0].views) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Views Rank</span>
                        <span>{formatNumber(video.views)}K</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Performance Distribution */}
            <div>
              <ResponsiveContainer width="100%" height={500}>
                <ComposedChart 
                  data={viewsVsEngagementData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${formatNumber(value)}K`}
                    label={{ value: 'Views (K)', angle: -90, position: 'insideLeft', offset: 10 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                    label={{ value: 'Engagement %', angle: 90, position: 'insideRight', offset: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px', 
                      padding: '12px',
                      border: '1px solid #E5E7EB'
                    }}
                    formatter={(value, name) => [
                      name === 'views' ? `${formatNumber(value)}K` : `${value.toFixed(2)}%`,
                      name === 'views' ? 'Views' : 'Engagement'
                    ]}
                    labelFormatter={(label) => viewsVsEngagementData.find(d => d.name === label)?.title || label}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="views" 
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  >
                    {viewsVsEngagementData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.engagement > 5 ? '#10B981' :
                          entry.engagement > 2 ? '#FBBF24' :
                          '#EF4444'
                        }
                      />
                    ))}
                  </Bar>
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs">
                <div className="p-2 rounded-lg bg-green-50">
                  <div className="font-medium text-green-800">High</div>
                  <div className="text-green-600">{'>'}5% engagement</div>
                </div>
                <div className="p-2 rounded-lg bg-yellow-50">
                  <div className="font-medium text-yellow-800">Medium</div>
                  <div className="text-yellow-600">2-5% engagement</div>
                </div>
                <div className="p-2 rounded-lg bg-red-50">
                  <div className="font-medium text-red-800">Low</div>
                  <div className="text-red-600">{'<'}2% engagement</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            Performance Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="text-gray-700 font-medium">Avg Views per Video</span>
              <span className="font-bold text-blue-600">
                {enhancedAnalytics ? formatNumber(enhancedAnalytics.avgViewsPerVideo) : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-gray-700 font-medium">Avg Engagement Rate</span>
              <span className="font-bold text-green-600">
                {enhancedAnalytics ? `${enhancedAnalytics.avgEngagementRate}%` : '0%'}
              </span>
            </div>
            {enhancedAnalytics && enhancedAnalytics.topPerformingVideo && (
              <div className="border-t pt-4">
                <div className="flex items-center mb-2">
                  <Zap className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-gray-700 font-medium">Top Performing Video:</span>
                </div>
                <p className="font-medium text-sm text-gray-800 mb-1">
                  {enhancedAnalytics.topPerformingVideo.title}
                </p>
                <div className="text-sm text-gray-500">
                  {formatNumber(enhancedAnalytics.topPerformingVideo.views)} views
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Videos Grid */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Video className="h-5 w-5 mr-2 text-red-500" />
          Recent Videos Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentVideos && recentVideos.slice(0, 9).map((video, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm mb-3 line-clamp-2 text-gray-800 flex-grow">{video.title}</h4>
                <a 
                  href={`https://youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-700 transition-colors"
                  title="Watch on YouTube"
                >
                  <Video className="h-4 w-4" />
                </a>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-gray-600">Views:</span>
                  <span className="font-bold text-blue-600">{formatNumber(video.views)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-gray-600">Likes:</span>
                  <span className="font-bold text-green-600">{formatNumber(video.likes)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="text-gray-600">Comments:</span>
                  <span className="font-bold text-purple-600">{formatNumber(video.comments)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-gray-600">Engagement:</span>
                  <span className="font-bold text-yellow-600">
                    {video.views > 0 ? ((video.likes + video.comments) / video.views * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Video Analysis Component
const VideoAnalysis = ({ videoId, onBack }) => {
  // State variables for managing data, loading status, and errors
  const [data, setData] = useState(null); // 'data' will hold the fetched video analysis results
  const [loading, setLoading] = useState(true); // 'loading' indicates if data is being fetched
  const [error, setError] = useState(null);   // 'error' stores any error message during fetching

  // Function to fetch video analysis data from the API
  const fetchData = async () => {
    try {
      setLoading(true); // Set loading to true to show spinner
      setError(null);   // Clear any previous errors
      const result = await api.getVideo(videoId); // Call your API to get video data
      setData(result);  // Store the fetched data in the 'data' state
    } catch (err) {
      setError(err.message); // If an error occurs, set the error message
    } finally {
      setLoading(false); // Regardless of success or failure, set loading to false
    }
  };

  // useEffect hook to trigger data fetching when videoId changes
  useEffect(() => {
    if (videoId) fetchData(); // Fetch data only if a videoId is provided
  }, [videoId]); // Dependency array: re-run effect when videoId changes

  // Conditional rendering based on loading, error, or data availability
  if (loading) return <LoadingSpinner />; // Show a loading spinner if data is being fetched
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />; // Show error message with a retry option if an error occurs
  if (!data) return null; // If no data and not loading/error, render nothing (e.g., initial state or invalid videoId)

  // Destructure data for easier access
  const { video, analytics, relatedVideos, commentsAnalysis } = data;

  // Prepare data for the Engagement Breakdown - for direct comparison of Likes/Comments (not views)
  const engagementComparisonData = [
    { name: 'Likes', value: video.likeCount, color: '#10B981', percentage: (video.likeCount / video.viewCount * 100).toFixed(2) },
    { name: 'Comments', value: video.commentCount, color: '#F59E0B', percentage: (video.commentCount / video.viewCount * 100).toFixed(2) }
  ];

  // Calculate total engagements for the engagement breakdown card (includes views for total)
  const totalEngagements = video.viewCount + video.likeCount + video.commentCount; // Sum of all engagement actions


  // Prepare data for the Performance Metrics section
  const performanceData = [
    { metric: 'Views/Hour', value: analytics.viewsPerHour, color: '#3B82F6', isPercentage: false },
    { metric: 'Like Rate %', value: analytics.likesToViewsRatio, color: '#10B981', isPercentage: true },
    { metric: 'Comment Rate %', value: analytics.commentsToViewsRatio, color: '#F59E0B', isPercentage: true },
    { metric: 'Engagement %', value: video.engagementRate, color: '#8B5CF6', isPercentage: true }
  ];

  // Prepare data for Sentiment Analysis chart (Pie/Bar Chart)
  const sentimentData = commentsAnalysis && commentsAnalysis.sentimentDistribution ? [
    { name: 'Positive', value: commentsAnalysis.sentimentDistribution.positive || 0, color: '#10B981' },
    { name: 'Neutral', value: commentsAnalysis.sentimentDistribution.neutral || 0, color: '#6B7280' },
    { name: 'Negative', value: commentsAnalysis.sentimentDistribution.negative || 0, color: '#EF4444' }
  ] : []; // If commentsAnalysis or sentimentDistribution is missing, set to empty array

  // Calculate overall sentiment insight for the comments analysis card
  const getSentimentInsight = (sentimentDistribution) => {
    if (!sentimentDistribution || !commentsAnalysis.totalComments) return "No comment data available.";
    const { positive, neutral, negative } = sentimentDistribution;
    const total = commentsAnalysis.totalComments;

    const positivePercent = (positive / total) * 100;
    const negativePercent = (negative / total) * 100;

    if (positivePercent > 60 && negativePercent < 20) {
      return "Overall sentiment is strongly positive, indicating high viewer satisfaction.";
    } else if (negativePercent > 40) {
      return "Significant negative sentiment detected. Consider reviewing comments for common issues.";
    } else if (positivePercent > negativePercent) {
      return "Generally positive feedback, with some mixed reactions.";
    } else {
      return "Mixed sentiment observed. A balanced view of the video's reception.";
    }
  };
  const sentimentInsight = getSentimentInsight(commentsAnalysis?.sentimentDistribution);


  // Prepare data for Word Cloud (Top Words in Comments)
  const wordCloudData = commentsAnalysis && commentsAnalysis.topWords ? Object.entries(commentsAnalysis.topWords).map(([word, count]) => ({
    text: word,
    value: count,
    color: `hsl(${Math.random() * 360}, 70%, 60%)` // Assign a random HSL color to each word
  })) : []; // If commentsAnalysis or topWords is missing, set to empty array

  // Construct YouTube video URL
  const youtubeVideoUrl = `https://www.youtube.com/watch?v=${videoId}`;


  // Start of the main component rendering
  return (
    <div className="space-y-6"> {/* Main container with vertical spacing */}
      <div className="flex items-center justify-between"> {/* Header with back button and title */}
        <button
          onClick={onBack} // Call onBack prop when button is clicked
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors" // Styling for back button
        >
          ← Back to Search
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Video Analytics</h2> {/* Component title */}
      </div>

      {/* Video Header Section */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg shadow-md p-6"> {/* Styled background and padding */}
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6"> {/* Responsive layout for video thumbnail and details */}
          <img
            src={video.thumbnails.medium.url} // Video thumbnail source
            alt={video.title} // Alt text for accessibility
            className="w-full md:w-64 h-40 object-cover rounded-lg shadow-lg" // Image styling
          />
          <div className="flex-1"> {/* Container for video title, description, and metadata */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1> {/* Video title */}
            <p className="text-gray-600 mb-4">{video.description}</p> {/* Video description */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500"> {/* Container for video metadata tags */}
              <div className="flex items-center bg-white px-3 py-1 rounded-full"> {/* Channel title tag */}
                <Users className="h-4 w-4 mr-1" /> {/* Icon for channel */}
                {video.channelTitle}
              </div>
              <div className="flex items-center bg-white px-3 py-1 rounded-full"> {/* Published date tag */}
                <Calendar className="h-4 w-4 mr-1" /> {/* Icon for calendar */}
                {new Date(video.publishedAt).toLocaleDateString()} {/* Formatted published date */}
              </div>
              <div className="flex items-center bg-white px-3 py-1 rounded-full"> {/* Video duration tag */}
                <Clock className="h-4 w-4 mr-1" /> {/* Icon for clock */}
                {formatDuration(video.duration)} {/* Formatted video duration */}
              </div>
              {/* New: YouTube Video Link */}
              <a
                href={youtubeVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700 transition-colors"
              >
                <Youtube className="h-4 w-4 mr-1" />
                Watch on YouTube
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Section - Grid of Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Responsive grid for metric cards */}
        <MetricCard
          icon={Eye} // Icon for views
          label="Views"
          value={video.viewCountFormatted} // Formatted view count
          subtitle={`${video.viewCount.toLocaleString()} total`} // Total raw view count
        />
        <MetricCard
          icon={ThumbsUp} // Icon for likes
          label="Likes"
          value={video.likeCountFormatted} // Formatted like count
          subtitle={`${analytics.likesToViewsRatio}% rate`} // Like-to-views ratio
        />
        <MetricCard
          icon={MessageCircle} // Icon for comments
          label="Comments"
          value={video.commentCountFormatted} // Formatted comment count
          subtitle={`${analytics.commentsToViewsRatio}% rate`} // Comment-to-views ratio
        />
        <MetricCard
          icon={Activity} // Icon for engagement
          label="Engagement"
          value={`${video.engagementRate}%`} // Engagement rate
          subtitle="Overall rate"
        />
      </div>

      {/* Advanced Charts Grid - Adjusted to 2x2 layout for core charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Grid for 2x2 layout */}

        {/* Views vs Performance Analysis Card (now just a list) */}
        <div className="bg-white rounded-lg shadow-md p-6"> {/* Card styling */}
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between"> {/* Section title */}
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-500" /> {/* Icon */}
              Views vs Performance Metrics
            </div>
            <div className="text-sm text-gray-500">
              Updated {timeAgo(video.publishedAt)} {/* Time since published */}
            </div>
          </h3>
          {/* Left Side - Performance Metrics List */}
          <div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-4">
              <div className="text-xs text-gray-600">
                Compare video performance metrics and engagement rates.
              </div>
            </div>
            <div className="space-y-3"> {/* Vertical spacing for metric items */}
              {performanceData.map((metric, index) => ( // Map through performance data to display each metric
                <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-lg transition-all duration-300"> {/* Metric card styling */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-medium px-3 py-1 rounded-full"
                      style={{ backgroundColor: `${metric.color}1A`, color: metric.color }} // Dynamic background and text color using inline style
                    >
                      {metric.metric}
                    </span>
                    <span className="text-lg font-bold text-gray-700">
                      {/* Conditional rendering for value formatting: add % if isPercentage is true */}
                      {typeof metric.value === 'number'
                        ? `${metric.value.toFixed(1)}${metric.isPercentage ? '%' : ''}` // Format number and add % if it's a percentage
                        : metric.value} {/* Use raw value if not a number */}
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                      <div
                        className="rounded"
                        style={{
                          // For percentage values, clamp to 100%. For raw views, scale relative to the highest view count.
                          width: `${metric.isPercentage
                            ? Math.min(metric.value, 100) // For percentages, cap at 100
                            : (metric.value / Math.max(...performanceData.map(d => d.isPercentage ? 0 : d.value))) * 100 // Scale non-percentages
                            }%`,
                          backgroundColor: metric.color // Dynamic bar color
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center text-xs"> {/* Summary metrics below list */}
            <div className="p-2 rounded-lg bg-blue-50">
              <div className="font-medium text-blue-800">Views/Hour</div>
              <div className="text-blue-600">{analytics.viewsPerHour} views</div>
            </div>
            <div className="p-2 rounded-lg bg-purple-50">
              <div className="font-medium text-purple-800">Engagement Rate</div>
              <div className="text-purple-600">{video.engagementRate}%</div>
            </div>
          </div>
        </div>

        {/* Engagement Breakdown - Redesigned for Clarity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-500" />
            Engagement Breakdown
          </h3>
          <div className="flex flex-col space-y-4">
            {/* Main Views Metric - Highlighted */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-blue-800">
                {video.viewCountFormatted}
              </div>
              <div className="text-sm text-blue-600">Total Views</div>
            </div>

            {/* Bar Chart for Likes & Comments (absolute numbers) */}
            <ResponsiveContainer width="100%" height={150}> {/* Smaller height for focused chart */}
              <BarChart data={engagementComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={formatNumber} /> {/* Format Y-axis numbers */}
                <Tooltip formatter={(value, name) => [formatNumber(value), name]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {engagementComparisonData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Detailed Engagement Rates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {engagementComparisonData.map((entry, index) => (
                <div key={`detail-${index}`} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center text-sm font-medium mb-1">
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                    {entry.name}:
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {formatNumber(entry.value)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.percentage}% of views
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600 text-center mt-2">
              Engagement metrics relative to total views.
            </p>
          </div>
        </div>

        {/* Enhanced Sentiment Analysis - Conditional Rendering */}
        {commentsAnalysis && sentimentData.length > 0 && ( // Render only if commentsAnalysis exists and there's sentiment data
          <div className="bg-white rounded-lg shadow-md p-6"> {/* Card styling */}
            <h3 className="text-lg font-semibold mb-4 flex items-center"> {/* Chart title */}
              <MessageCircle className="h-5 w-5 mr-2 text-purple-500" /> {/* Icon */}
              Comments Sentiment Analysis
            </h3>
            {/* New: Sentiment Insight */}
            <div className="mb-4 bg-purple-50 text-purple-800 text-sm p-3 rounded-lg border border-purple-100">
                <p className="font-medium">Overall Insight:</p>
                <p>{sentimentInsight}</p>
            </div>
            {/* Consolidated Bar Chart */}
            <ResponsiveContainer width="100%" height={250}> {/* Increased height for single chart */}
              <BarChart data={sentimentData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}> {/* Bar chart for sentiment */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} /> {/* Grid lines, only horizontal */}
                <XAxis dataKey="name" axisLine={false} tickLine={false} /> {/* X-axis data key, simplified */}
                <YAxis axisLine={false} tickLine={false} tickFormatter={formatNumber} /> {/* Y-axis, simplified */}
                <Tooltip formatter={(value, name) => [formatNumber(value), name]} /> {/* Tooltip */}
                <Bar dataKey="value" radius={[4, 4, 0, 0]}> {/* Bar styling */}
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} /> // Dynamic color for each bar
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* New: Sentiment Breakdown Summary */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                {sentimentData.map((entry, index) => (
                    <div key={`sentiment-summary-${index}`} className="p-2 rounded-lg" style={{ backgroundColor: `${entry.color}1A`, color: entry.color }}>
                        <div className="font-bold">{entry.value}</div>
                        <div>{entry.name}</div>
                    </div>
                ))}
            </div>
          </div>
        )} {/* Closing bracket for the conditional rendering of Sentiment Analysis block */}

        {/* Top Words in Comments - Enhanced - Conditional Rendering */}
        {commentsAnalysis && wordCloudData.length > 0 && ( // Render only if commentsAnalysis exists and there's word cloud data
          <div className="bg-white rounded-lg shadow-md p-6"> {/* Card styling */}
            <h3 className="text-lg font-semibold mb-4 flex items-center"> {/* Section title */}
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-500" /> {/* Icon */}
              Most Used Words in Comments
            </h3>

            <div className="space-y-4"> {/* Vertical spacing for content */}
              {/* Top Words Cards - Grid */}
              <div className="grid grid-cols-2 gap-4"> {/* Grid for top word cards */}
                {wordCloudData.slice(0, 6).map((word, index) => ( // Map through top 6 words
                  <div
                    key={index}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-lg transition-all duration-300" // Card styling
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-full ${
                          index === 0 ? 'bg-indigo-100 text-indigo-800' :
                          index === 1 ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`} // Conditional styling for ranking
                      >
                        #{index + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {word.value} occurrences
                      </span>
                    </div>
                    <div className="text-lg font-medium text-gray-800 mb-2">
                      {word.text} {/* The word itself */}
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-50">
                            Frequency
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                        <div
                          style={{
                            width: `${(word.value / wordCloudData[0].value) * 100}%`, // Calculate width based on proportion to most frequent word
                            backgroundColor: word.color // Dynamic bar color
                          }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded" // Bar styling
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )} {/* Closing bracket for the conditional rendering of Top Words block */}
      </div> {/* Closing div for Advanced Charts Grid */}

      {/* Enhanced Comments Insights - Conditional Rendering */}
      {commentsAnalysis && commentsAnalysis.sentimentDistribution && ( // Render only if commentsAnalysis and sentimentDistribution exist
        <div className="bg-white rounded-lg shadow-md p-6"> {/* Card styling */}
          <h3 className="text-lg font-semibold mb-4 flex items-center"> {/* Section title */}
            <Activity className="h-5 w-5 mr-2 text-blue-500" /> {/* Icon */}
            Comments Insights Dashboard
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"> {/* Grid for sentiment summary cards */}
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg"> {/* Positive comments card */}
              <Smile className="h-10 w-10 text-green-600 mx-auto mb-3" /> {/* Icon */}
              <div className="text-3xl font-bold text-green-600">
                {commentsAnalysis.sentimentDistribution.positive || 0} {/* Positive comment count */}
              </div>
              <div className="text-sm text-green-700 font-medium">Positive Comments</div>
              <div className="text-xs text-green-600 mt-1">
                {commentsAnalysis.totalComments > 0 ?
                  `${((commentsAnalysis.sentimentDistribution.positive / commentsAnalysis.totalComments) * 100).toFixed(1)}%` : '0%' // Percentage of positive comments
                }
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg"> {/* Neutral comments card */}
              <Meh className="h-10 w-10 text-gray-600 mx-auto mb-3" /> {/* Icon */}
              <div className="text-3xl font-bold text-gray-600">
                {commentsAnalysis.sentimentDistribution.neutral || 0} {/* Neutral comment count */}
              </div>
              <div className="text-sm text-gray-700 font-medium">Neutral Comments</div>
              <div className="text-xs text-gray-600 mt-1">
                {commentsAnalysis.totalComments > 0 ?
                  `${((commentsAnalysis.sentimentDistribution.neutral / commentsAnalysis.totalComments) * 100).toFixed(1)}%` : '0%' // Percentage of neutral comments
                }
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg"> {/* Negative comments card */}
              <Frown className="h-10 w-10 text-red-600 mx-auto mb-3" /> {/* Icon */}
              <div className="text-3xl font-bold text-red-600">
                {commentsAnalysis.sentimentDistribution.negative || 0} {/* Negative comment count */}
              </div>
              <div className="text-sm text-red-700 font-medium">Negative Comments</div>
              <div className="text-xs text-red-600 mt-1">
                {commentsAnalysis.totalComments > 0 ?
                  `${((commentsAnalysis.sentimentDistribution.negative / commentsAnalysis.totalComments) * 100).toFixed(1)}%` : '0%' // Percentage of negative comments
                }
              </div>
            </div>
          </div>

          {/* Recent Comments Sample - Conditional Rendering */}
          {commentsAnalysis.comments && commentsAnalysis.comments.length > 0 && ( // Render only if comments exist
            <div>
              <h4 className="font-semibold mb-3 flex items-center"> {/* Sub-section title */}
                <MessageCircle className="h-4 w-4 mr-2" /> {/* Icon */}
                Recent Comments Sample:
              </h4>
              <div className="space-y-3 max-h-80 overflow-y-auto"> {/* Scrollable container for comments */}
                {commentsAnalysis.comments.slice(0, 6).map((comment, index) => ( // Map through recent 6 comments
                  <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"> {/* Comment card styling */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        comment.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        comment.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}> {/* Sentiment tag styling */}
                        {comment.sentiment.toUpperCase()} {/* Display sentiment */}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" /> {/* Like icon */}
                        {comment.likeCount || 0} {/* Like count */}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p> {/* Comment text */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Related Videos Section - Conditional Rendering */}
      {relatedVideos && relatedVideos.length > 0 && ( // Render only if relatedVideos exist
        <div className="bg-white rounded-lg shadow-md p-6"> {/* Card styling */}
          <h3 className="text-lg font-semibold mb-4 flex items-center"> {/* Section title */}
            <Video className="h-5 w-5 mr-2 text-red-500" /> {/* Icon */}
            Related Videos from Channel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Responsive grid for related videos */}
            {relatedVideos.map((video) => ( // Map through related videos
              <div key={video.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow"> {/* Related video card styling */}
                <img
                  src={video.thumbnail} // Thumbnail source
                  alt={video.title} // Alt text
                  className="w-full h-32 object-cover rounded mb-3" // Image styling
                />
                <h4 className="font-medium text-sm line-clamp-2 text-gray-800">{video.title}</h4> {/* Video title */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div> // Closing div for main container
  );
};

// Enhanced Trending Analysis Component
const TrendingAnalysis = ({ onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('viewVelocity');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRegion, setSelectedRegion] = useState('IN');

  const regions = [
    { code: 'IN', name: '🇮🇳 India', flag: '🇮🇳' },
    { code: 'GB', name: '🇬🇧 United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: '🇨🇦 Canada', flag: '🇨🇦' },
    { code: 'AU', name: '🇦🇺 Australia', flag: '🇦🇺' },
    { code: 'DE', name: '🇩🇪 Germany', flag: '🇩🇪' },
    { code: 'FR', name: '🇫🇷 France', flag: '🇫🇷' },
    { code: 'JP', name: '🇯🇵 Japan', flag: '🇯🇵' },
    { code: 'KR', name: '🇰🇷 South Korea', flag: '🇰🇷' },
    { code: 'US', name: '🇺🇸 United States', flag: '🇺🇸' },
    { code: 'BR', name: '🇧🇷 Brazil', flag: '🇧🇷' },
    { code: 'MX', name: '🇲🇽 Mexico', flag: '🇲🇽' },
    { code: 'RU', name: '🇷🇺 Russia', flag: '🇷🇺' }
  ];

  const fetchData = async (region = selectedRegion) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getTrending(region);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedRegion);
  }, [selectedRegion]);

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => fetchData(selectedRegion)} />;
  if (!data) return null;

  const { trendingVideos, summary, categoryBreakdown, engagementDistribution, region } = data;

  const sortedVideos = [...trendingVideos].sort((a, b) => {
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    return (a[sortBy] - b[sortBy]) * multiplier;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Enhanced chart data
  // Usage in your TrendingAnalysis component:
// Replace the existing view velocity chart section with:
<EnhancedViewVelocityChart 
  trendingVideos={sortedVideos} 
  velocityAnalysis={data.velocityAnalysis} 
/>  
  const viewVelocityData = sortedVideos.slice(0, 10).map((video, index) => ({
    name: `${index + 1}. ${video.title.substring(0, 20)}...`,
    velocity: video.viewVelocity,
    views: video.viewCount / 1000000,
    engagement: ((video.likeCount + video.commentCount) / video.viewCount * 100).toFixed(2)
  }));

  const engagementByCategory = categoryBreakdown.map(cat => ({
    category: cat.category,
    engagement: cat.avgEngagement || 0,
    count: cat.count,
    avgViews: cat.avgViews / 1000
  }));

  const currentRegion = regions.find(r => r.code === selectedRegion);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Search
        </button>
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Trending Analysis</h2>
          <span className="text-lg bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full font-medium">
            {currentRegion?.flag} {region}
          </span>
        </div>
      </div>

      {/* Enhanced Region Selector */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Flag className="h-5 w-5 mr-2 text-blue-500" />
          Select Region for Trending Analysis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {regions.map((reg) => (
            <button
              key={reg.code}
              onClick={() => handleRegionChange(reg.code)}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                selectedRegion === reg.code
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
              }`}
            >
              <div className="text-lg mb-1">{reg.flag}</div>
              <div className="text-xs">{reg.name.split(' ')[1] || reg.name.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <MetricCard
          icon={Video}
          label="Trending Videos"
          value={summary.totalVideos}
          subtitle="In region"
        />
        <MetricCard
          icon={Eye}
          label="Total Views"
          value={formatNumber(summary.totalViews)}
          subtitle="Combined views"
        />
        <MetricCard
          icon={BarChart3}
          label="Average Views"
          value={formatNumber(summary.averageViews)}
          subtitle="Per video"
        />
        <MetricCard
          icon={TrendingUp}
          label="Top Velocity"
          value={summary.topPerformer?.viewVelocity.toFixed(0) || '0'}
          subtitle="Views/hour"
        />
        <MetricCard
          icon={Activity}
          label="Avg Engagement"
          value={`${summary.avgEngagement?.toFixed(1) || 0}%`}
          subtitle="Like + Comment rate"
        />
      </div>

      {/* Advanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Duration vs Engagement */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Content Duration vs Engagement
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={engagementByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="engagement" fill="#10B981" name="Avg Engagement %" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} name="Video Count" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Distribution - Enhanced Donut */}
        {engagementDistribution && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-500" />
              Engagement Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ range, percent }) => `${range.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                >
                  {engagementDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#10B981'][index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* View Velocity Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6 col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              View Velocity Analysis (Top 10)
            </div>
            <div className="text-sm text-gray-500">
              Updated {timeAgo(new Date())}
            </div>
          </h3>
          <div className="space-y-4">
            {sortedVideos.slice(0, 10).map((video, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      index === 0 ? 'bg-red-100 text-red-800' :
                      index === 1 ? 'bg-orange-100 text-orange-800' :
                      index === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      video.velocityCategory === 'Viral' ? 'bg-red-100 text-red-800' :
                      video.velocityCategory === 'Hot' ? 'bg-orange-100 text-orange-800' :
                      video.velocityCategory === 'Rising' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {video.velocityCategory}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                      {((video.likeCount + video.commentCount) / video.viewCount * 100).toFixed(1)}% engagement
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{timeAgo(video.publishedAt)}</span>
                    <a 
                      href={`https://youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Watch on YouTube"
                    >
                      <Video className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-4 mb-3">
                  <div className="flex-grow">
                    <div className="text-sm font-medium text-gray-800 mb-1 line-clamp-2" title={video.title}>
                      {video.title}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {video.channelTitle}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-xs font-medium text-red-600">{formatNumber(video.viewVelocity)}</div>
                    <div className="text-xs text-red-500">views/hour</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-xs font-medium text-blue-600">{video.velocityScore}/100</div>
                    <div className="text-xs text-blue-500">velocity score</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="text-xs font-medium text-purple-600">{formatNumber(video.viewCount / 1000000)}M</div>
                    <div className="text-xs text-purple-500">total views</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative pt-1">
                    <div className="text-xs text-gray-500 mb-1">Velocity Rank</div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                      <div
                        className="rounded"
                        style={{ 
                          width: `${(video.viewVelocity / sortedVideos[0].viewVelocity * 100)}%`,
                          backgroundColor: video.velocityCategory === 'Viral' ? '#EF4444' :
                                           video.velocityCategory === 'Hot' ? '#F97316' :
                                           video.velocityCategory === 'Rising' ? '#EAB308' : '#6B7280'
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatNumber(video.viewVelocity)} views/hour</span>
                      <span>{Math.round(video.viewVelocity / sortedVideos[0].viewVelocity * 100)}% of #1</span>
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        </div>




        {/* Category Performance Area Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indigo-500" />
            Category Performance Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={categoryBreakdown}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stackId="1" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCount)" />
              <Area type="monotone" dataKey="avgEngagement" stackId="2" stroke="#10B981" fillOpacity={1} fill="url(#colorEngagement)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Enhanced Trending Videos Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            Trending Videos Leaderboard
          </h3>
          <div className="flex space-x-3">
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="border-2 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="viewVelocity">🚀 View Velocity</option>
              <option value="viewCount">👁️ Total Views</option>
              <option value="likeCount">👍 Likes</option>
              <option value="commentCount">💬 Comments</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Rank</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Video</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Channel</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Views</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Likes</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Comments</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Velocity</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Engagement</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Watch</th>
              </tr>
            </thead>
            <tbody>
              {sortedVideos.slice(0, 25).map((video, index) => {
                const engagementRate = ((video.likeCount + video.commentCount) / video.viewCount * 100).toFixed(2);
                const isTopPerformer = index < 3;
                return (
                  <tr key={video.id} className={`border-b hover:bg-blue-50 transition-colors ${isTopPerformer ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-4 text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={video.thumbnails.default.url}
                          alt={video.title}
                          className="w-20 h-14 object-cover rounded-lg shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-2 text-gray-800 mb-1">{video.title}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {timeAgo(video.publishedAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-700">{video.channelTitle}</td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-blue-600">
                      {video.viewCountFormatted}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-green-600">
                      {formatNumber(video.likeCount)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-purple-600">
                      {formatNumber(video.commentCount)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-orange-600">
                      {video.viewVelocity.toFixed(0)}/h
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-gray-600">
                      {formatDuration(video.duration)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        engagementRate > 5 ? 'bg-green-100 text-green-800' :
                        engagementRate > 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {engagementRate}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <a 
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Watch on YouTube"
                      >
                        <Video className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Performance Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <Award className="h-5 w-5 mr-2 text-purple-500" />
          Regional Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {summary.topPerformer?.viewVelocity.toFixed(0) || '0'}
            </div>
            <div className="text-sm text-purple-700 font-medium">Peak Velocity (views/hour)</div>
            <div className="text-xs text-gray-500 mt-2 line-clamp-2">
              {summary.topPerformer?.title.substring(0, 50) + '...' || 'N/A'}
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-2">👑</div>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatNumber(Math.max(...trendingVideos.map(v => v.viewCount)))}
            </div>
            <div className="text-sm text-blue-700 font-medium">Highest View Count</div>
            <div className="text-xs text-gray-500 mt-2">
              Single video performance in {currentRegion?.name.split(' ')[1] || currentRegion?.name}
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {Math.max(...trendingVideos.map(v => ((v.likeCount + v.commentCount) / v.viewCount * 100))).toFixed(1)}%
            </div>
            <div className="text-sm text-green-700 font-medium">Best Engagement Rate</div>
            <div className="text-xs text-gray-500 mt-2">
              Most interactive content
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// Main App Component
const YouTubeAnalyticsApp = () => {
  const [activeView, setActiveView] = useState('search');
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState('channel');
  const [currentId, setCurrentId] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await api.checkHealth();
      setIsConnected(connected);
    };
    checkConnection();
  }, []);

  const handleSearch = () => {
    if (!searchInput.trim()) {
      alert('Please enter a YouTube URL or ID');
      return;
    }
    
    const id = extractId(searchInput, searchType);
    if (!id) {
      alert(`Please enter a valid YouTube ${searchType} URL or ID\n\nExamples:\n${searchType === 'channel' ? '• https://youtube.com/@MrBeast\n• UCX6OQ3DkcsbYNE6H8uQQuVA' : '• https://youtube.com/watch?v=dQw4w9WgXcQ\n• dQw4w9WgXcQ'}`);
      return;
    }
    
    if (searchType === 'video' && id.length !== 11) {
      alert('Video IDs should be exactly 11 characters long');
      return;
    }
    
    if (searchType === 'channel' && searchInput.includes('watch?v=')) {
      alert('This looks like a video URL. Please switch to "Video Analysis" or use a channel URL instead.');
      return;
    }
    
    setCurrentId(id);
    setActiveView(searchType === 'channel' ? 'channel' : 'video');
  };

  const resetToSearch = () => {
    setActiveView('search');
    setCurrentId(null);
    setSearchInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">YouTube Analytics</h1>
                  <p className="text-xs text-gray-500">Advanced Data Insights</p>
                </div>
              </div>
              {!isConnected && (
                <div className="flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm animate-pulse">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Backend Offline
                </div>
              )}
            </div>
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveView('search')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeView === 'search' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Search className="h-4 w-4 inline mr-2" />
                Search
              </button>
              <button
                onClick={() => setActiveView('trending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeView === 'trending' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-2" />
                Trending
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'search' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Analyze YouTube Content
              </h2>
              <p className="text-lg text-gray-600">
                Get comprehensive analytics for any YouTube channel or video with advanced insights
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="space-y-6">
                <div className="flex justify-center space-x-8">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="channel"
                      checked={searchType === 'channel'}
                      onChange={(e) => setSearchType(e.target.value)}
                      className="mr-3 w-4 h-4"
                    />
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="font-medium">Channel Analysis</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="video"
                      checked={searchType === 'video'}
                      onChange={(e) => setSearchType(e.target.value)}
                      className="mr-3 w-4 h-4"
                    />
                    <div className="flex items-center">
                      <Video className="h-5 w-5 mr-2 text-red-500" />
                      <span className="font-medium">Video Analysis</span>
                    </div>
                  </label>
                </div>

                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={`Enter YouTube ${searchType} URL or ID...`}
                    className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center font-medium shadow-lg hover:shadow-xl"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Analyze
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Examples:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="font-medium text-blue-600 mb-2">📺 Channel URLs:</p>
                      <p className="text-gray-600 mb-1">https://youtube.com/@MrBeast</p>
                      <p className="text-gray-600">UCX6OQ3DkcsbYNE6H8uQQuVA</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="font-medium text-red-600 mb-2">🎬 Video URLs:</p>
                      <p className="text-gray-600 mb-1">https://youtube.com/watch?v=dQw4w9WgXcQ</p>
                      <p className="text-gray-600">dQw4w9WgXcQ</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'channel' && currentId && (
          <ChannelAnalysis channelId={currentId} onBack={resetToSearch} />
        )}

        {activeView === 'video' && currentId && (
          <VideoAnalysis videoId={currentId} onBack={resetToSearch} />
        )}

        {activeView === 'trending' && (
          <TrendingAnalysis onBack={() => setActiveView('search')} />
        )}
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="p-2 bg-red-500 rounded-lg mr-3">
                <Play className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">YouTube Analytics Dashboard</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Built with React.js & Flask | Powered by YouTube Data API v3
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="bg-blue-100 rounded-lg p-3 mb-2 mx-auto w-fit">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Channel Analytics</p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 rounded-lg p-3 mb-2 mx-auto w-fit">
                  <Video className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Video Analytics</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-lg p-3 mb-2 mx-auto w-fit">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Trending Analysis</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-lg p-3 mb-2 mx-auto w-fit">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Real-time Data</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default YouTubeAnalyticsApp;