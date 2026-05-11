"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sun, CloudSun, Cloud, CloudFog, CloudRain, CloudSnow, 
  CloudLightning, Search, Loader2, Wind, Droplets, MapPin,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Open-Meteo WMO Weather codes
const getWeatherIcon = (code: number, className: string = "") => {
  if (code === 0) return <Sun className={cn("text-yellow-400", className)} />;
  if (code === 1 || code === 2) return <CloudSun className={cn("text-yellow-200", className)} />;
  if (code === 3) return <Cloud className={cn("text-gray-400", className)} />;
  if (code === 45 || code === 48) return <CloudFog className={cn("text-gray-400", className)} />;
  if (code >= 51 && code <= 57) return <CloudRain className={cn("text-blue-400", className)} />;
  if (code >= 61 && code <= 67) return <CloudRain className={cn("text-blue-500", className)} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={cn("text-sky-300", className)} />;
  if (code >= 80 && code <= 82) return <CloudRain className={cn("text-blue-600", className)} />;
  if (code >= 85 && code <= 86) return <CloudSnow className={cn("text-sky-400", className)} />;
  if (code >= 95 && code <= 99) return <CloudLightning className={cn("text-purple-500", className)} />;
  return <Sun className={cn("text-yellow-400", className)} />;
};

const getWeatherDescription = (code: number) => {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Unknown";
};

export function WeatherApp() {
  const [query, setQuery] = useState("");
  const defaultLoc = { name: "New York", lat: 40.7143, lon: -74.006 };
  const [location, setLocation] = useState<{name: string, lat: number, lon: number} | null>(defaultLoc);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Auto-detect location on load based on IP or just default to something
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            name: "Current Location",
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        () => {
          // Do nothing, already defaults to New York
        }
      );
    }
  }, []);

  const fetchWeather = React.useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`);
      const data = await res.json();
      setWeather(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchWeather(location.lat, location.lon);
    }
  }, [location, fetchWeather]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchLoading(true);
    
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error(e);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectLocation = (result: any) => {
    setLocation({
      name: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}, ${result.country}`,
      lat: result.latitude,
      lon: result.longitude
    });
    setQuery("");
    setSearchResults([]);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center px-4 bg-slate-800/80 backdrop-blur-sm z-20 shrink-0">
        <form onSubmit={handleSearch} className="relative w-full max-w-sm ml-auto mr-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search city..." 
              className="w-full bg-slate-950/50 border border-slate-700/50 rounded-full py-1.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value === "") setSearchResults([]);
              }}
            />
            {searchLoading && <Loader2 className="absolute right-3 text-slate-400 animate-spin" size={14} />}
          </div>
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 py-1">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectLocation(result)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700/50 flex items-center gap-2 text-sm transition-colors"
                >
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    <span className="font-medium text-slate-200">{result.name}</span>
                    <span className="text-slate-400 ml-1">
                      {result.admin1 ? `${result.admin1}, ` : ''}{result.country}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {loading && !weather ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
          <p className="text-slate-400">Loading weather data...</p>
        </div>
      ) : weather && location ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            
            {/* Current Weather Hero */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-8">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                  <MapPin size={24} className="text-blue-400" />
                  {location.name}
                </h1>
                <p className="text-slate-400 text-lg">{getWeatherDescription(weather.current.weather_code)}</p>
                <div className="text-7xl font-light text-white mt-4 tracking-tighter">
                  {Math.round(weather.current.temperature_2m)}°
                </div>
              </div>
              
              <div className="text-slate-200 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                {getWeatherIcon(weather.current.weather_code, "w-40 h-40")}
              </div>
            </div>

            {/* Current Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
                <div className="text-slate-400 text-sm mb-2 flex items-center gap-1.5"><Wind size={16} /> Wind</div>
                <div className="text-xl font-medium">{weather.current.wind_speed_10m} <span className="text-sm text-slate-400">km/h</span></div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
                <div className="text-slate-400 text-sm mb-2 flex items-center gap-1.5"><Droplets size={16} /> Humidity</div>
                <div className="text-xl font-medium">{weather.current.relative_humidity_2m}%</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
                <div className="text-slate-400 text-sm mb-2 flex items-center gap-1.5"><Cloud size={16} /> Cloud Cover</div>
                <div className="text-xl font-medium">{weather.current.cloud_cover}%</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
                <div className="text-slate-400 text-sm mb-2 flex items-center gap-1.5"><Sun size={16} /> Feels Like</div>
                <div className="text-xl font-medium">{Math.round(weather.current.apparent_temperature)}°</div>
              </div>
            </div>

            {/* Daily Forecast */}
            {weather.daily && (
              <div className="mt-4 bg-slate-800/50 rounded-3xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-medium text-slate-200 mb-6 flex items-center gap-2">
                  <CalendarDays size={18} className="text-blue-400" />
                  7-Day Forecast
                </h3>
                <div className="flex flex-col gap-4">
                  {weather.daily.time.map((time: string, i: number) => {
                    const date = new Date(time);
                    const isToday = i === 0;
                    return (
                      <div key={time} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0 last:pb-0">
                        <div className="flex-1 text-slate-300 font-medium">
                          {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                        <div className="flex-1 flex justify-center text-slate-200">
                          {getWeatherIcon(weather.daily.weather_code[i], "w-8 h-8")}
                        </div>
                        <div className="flex-1 flex justify-end gap-3 text-sm">
                          <span className="font-medium text-white">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                          <span className="text-slate-400">{Math.round(weather.daily.temperature_2m_min[i])}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
          <Cloud size={48} className="mb-4 opacity-50" />
          <p>Please enter a location to view the weather.</p>
        </div>
      )}
    </div>
  );
}
