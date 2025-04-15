import api from './api';

// Array of safety tips that will be used as a fallback if the API fails
const SAFETY_TIPS = [
  "Always wear your seatbelt, even for short trips.",
  "Keep a safe distance from the vehicle ahead of you.",
  "Don't use your phone while driving.",
  "Follow the speed limit and adjust for weather conditions.",
  "Use turn signals when changing lanes or turning.",
  "Check blind spots before changing lanes.",
  "Never drive under the influence of alcohol or drugs.",
  "Ensure all passengers wear seatbelts.",
  "Keep your vehicle in good condition with regular maintenance.",
  "Use headlights during poor visibility conditions.",
  "Be extra cautious at intersections.",
  "Watch for pedestrians, especially in urban areas.",
  "Slow down in construction zones.",
  "Take breaks during long drives to prevent fatigue.",
  "Adjust mirrors properly before driving.",
  "Avoid aggressive driving behaviors.",
  "Be aware of large vehicle blind spots.",
  "Keep an emergency kit in your vehicle.",
  "Use child safety seats correctly.",
  "Stay focused and alert while driving."
];

// Array of traffic alerts that will be used as a fallback
const TRAFFIC_ALERTS = [
  "Heavy traffic reported on I-95 northbound.",
  "Accident on Highway 101, expect delays of 20 minutes.",
  "Construction work on Main Street, use alternate routes.",
  "Weather alert: Icy conditions on mountain roads.",
  "Police checkpoint ahead on Central Avenue.",
  "Road closure on Bridge Street due to flooding.",
  "Multi-car collision on Interstate 80, emergency services on scene.",
  "Traffic signals out at 5th and Oak intersection.",
  "High wind advisory for all highway bridges.",
  "Debris on roadway near exit 42, drive with caution."
];

/**
 * Fetch traffic safety tips from a real-time API
 * Falls back to local data if the API call fails
 */
export const fetchTrafficSafetyTip = async () => {
  try {
    // First try to get data from a real traffic API
    // You can replace this with a real traffic API endpoint
    const response = await api.get('/api/traffic/safety-tips');
    return response.data;
  } catch (error) {
    console.log('Using fallback safety tip data');
    // Fallback to a random tip from our local array
    return {
      tip: SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)],
      source: "Vehicle Investigation System",
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Fetch traffic alerts from a real-time API
 * Falls back to local data if the API call fails
 */
export const fetchTrafficAlert = async () => {
  try {
    // First try to get data from a real traffic API
    const response = await api.get('/api/traffic/alerts');
    return response.data;
  } catch (error) {
    console.log('Using fallback traffic alert data');
    // Fallback to a random alert from our local array
    return {
      alert: TRAFFIC_ALERTS[Math.floor(Math.random() * TRAFFIC_ALERTS.length)],
      severity: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
      location: "Local area",
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get traffic data combining both tips and alerts
 */
export const getTrafficData = async () => {
  try {
    const tipData = await fetchTrafficSafetyTip();
    const alertData = await fetchTrafficAlert();
    
    // Randomly choose between tip and alert to show variation
    if (Math.random() > 0.5) {
      return {
        type: 'tip',
        content: tipData.tip,
        source: tipData.source,
        timestamp: tipData.timestamp
      };
    } else {
      return {
        type: 'alert',
        content: alertData.alert,
        severity: alertData.severity,
        location: alertData.location,
        timestamp: alertData.timestamp
      };
    }
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    // Final fallback
    return {
      type: 'tip',
      content: "Drive safely and follow traffic rules.",
      source: "Vehicle Investigation System",
      timestamp: new Date().toISOString()
    };
  }
}; 