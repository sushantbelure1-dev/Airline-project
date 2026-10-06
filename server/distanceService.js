// Comprehensive airport coordinates database for automatic Haversine distance calculation
export const AIRPORT_COORDINATES = {
  // Jalgaon & Maharashtra
  "JLG": { name: "Jalgaon Airport", city: "Jalgaon", lat: 20.9634, lon: 75.6267 },
  "BOM": { name: "Chhatrapati Shivaji Maharaj Intl", city: "Mumbai", lat: 19.0896, lon: 72.8656 },
  "PNQ": { name: "Pune Airport", city: "Pune", lat: 18.5822, lon: 73.9197 },
  "NAG": { name: "Dr. Babasaheb Ambedkar Intl", city: "Nagpur", lat: 21.0922, lon: 79.0472 },
  "IXU": { name: "Aurangabad (Chhatrapati Sambhajinagar)", city: "Aurangabad", lat: 19.8631, lon: 75.3981 },
  "NDC": { name: "Shri Guru Gobind Singh Ji Airport", city: "Nanded", lat: 19.1837, lon: 77.3190 },
  "KLH": { name: "Kolhapur Airport", city: "Kolhapur", lat: 16.6644, lon: 74.2891 },
  
  // Metro & Major Indian Hubs
  "DEL": { name: "Indira Gandhi Intl", city: "Delhi", lat: 28.5562, lon: 77.1000 },
  "BLR": { name: "Kempegowda Intl", city: "Bengaluru", lat: 13.1986, lon: 77.7066 },
  "HYD": { name: "Rajiv Gandhi Intl", city: "Hyderabad", lat: 17.2403, lon: 78.4294 },
  "CCU": { name: "Netaji Subhash Chandra Bose Intl", city: "Kolkata", lat: 22.6547, lon: 88.4467 },
  "MAA": { name: "Chennai Intl", city: "Chennai", lat: 12.9941, lon: 80.1709 },
  "AMD": { name: "Sardar Vallabhbhai Patel Intl", city: "Ahmedabad", lat: 23.0734, lon: 72.6347 },
  "GOI": { name: "Manohar Intl (Mopa) / Dabolim", city: "Goa", lat: 15.7667, lon: 73.8667 },
  "JAI": { name: "Jaipur Intl", city: "Jaipur", lat: 26.8242, lon: 75.8122 },
  "LKO": { name: "Chaudhary Charan Singh Intl", city: "Lucknow", lat: 26.7606, lon: 80.8893 },
  "COK": { name: "Cochin Intl", city: "Kochi", lat: 10.1520, lon: 76.3920 },
  "PAT": { name: "Jay Prakash Narayan Airport", city: "Patna", lat: 25.5913, lon: 85.0880 },
  "BBI": { name: "Biju Patnaik Intl", city: "Bhubaneswar", lat: 20.2444, lon: 85.8178 },
  "IDR": { name: "Devi Ahilya Bai Holkar Airport", city: "Indore", lat: 22.7217, lon: 75.8011 },
  "BDQ": { name: "Vadodara Airport", city: "Vadodara", lat: 22.3361, lon: 73.2263 },
  "STV": { name: "Surat Airport", city: "Surat", lat: 21.1141, lon: 72.7417 }
};

// Haversine formula to compute great-circle distance between two GPS coordinates in Kilometers
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in KM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);
  // Airline flight paths include airway turns and routing overhead (~8% added to geodesic)
  return Math.max(50, Math.round(distanceKm * 1.08));
}

// Extract code if format is "JLG (Jalgaon)" or just "JLG"
export function extractAirportCode(input) {
  if (!input) return "";
  const match = input.match(/\b([A-Z]{3})\b/);
  return match ? match[1] : input.trim().toUpperCase();
}

export function getAutoDistance(sourceStr, destinationStr) {
  const srcCode = extractAirportCode(sourceStr);
  const destCode = extractAirportCode(destinationStr);

  const src = AIRPORT_COORDINATES[srcCode];
  const dest = AIRPORT_COORDINATES[destCode];

  if (src && dest) {
    return calculateHaversineDistance(src.lat, src.lon, dest.lat, dest.lon);
  }
  return null;
}
