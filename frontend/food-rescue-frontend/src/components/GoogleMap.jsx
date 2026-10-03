import { useEffect, useRef, useState, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Locate, MapPin, AlertTriangle, LoaderCircle } from 'lucide-react';

/**
 * Reusable Google Map component for the Food Rescue platform.
 *
 * - Loads the Maps JavaScript API once via @googlemaps/js-api-loader
 *   using VITE_GOOGLE_MAPS_API_KEY (never hardcoded).
 * - Renders a responsive, zoomable/pan-able map that fills its container.
 * - Shows donation markers from the `markers` prop (designed so the data
 *   can later come from any backend source).
 * - Each marker opens an info window with donation details.
 * - "Use My Location" uses the browser Geolocation API (with permission
 *   prompt); failures show a friendly message and never break the map.
 *
 * Marker data structure (ready for backend donations):
 *   {
 *     id: string,
 *     title: string,          // short label, e.g. food title
 *     latitude: number,
 *     longitude: number,
 *     foodName?: string,
 *     quantity?: string,      // e.g. "40 servings"
 *     expiryDate?: string,    // ISO date string
 *     donorName?: string,
 *     status?: string         // AVAILABLE | CLAIMED | EXPIRED
 *   }
 */

const DEFAULT_CENTER = { lat: -1.2921, lng: 36.8219 }; // Nairobi (seed data region)
const DEFAULT_ZOOM = 11;

const STATUS_STYLES = {
  AVAILABLE: { label: 'Available', className: 'bg-[#d8f3dc] text-[#2d6a4f]' },
  CLAIMED: { label: 'Claimed', className: 'bg-[#fde8df] text-[#c0522a]' },
  EXPIRED: { label: 'Expired', className: 'bg-gray-100 text-gray-500' },
};

function formatExpiry(iso) {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusStyle(status) {
  return STATUS_STYLES[status] ?? { label: status ?? 'Unknown', className: 'bg-gray-100 text-gray-600' };
}

export default function GoogleMap({
  markers = [],
  height = '100%',
  zoom = DEFAULT_ZOOM,
  center,
  fitToMarkers = true,
  onMapLoad,
  className = '',
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const libraryRef = useRef(null); // { maps, marker, core } from importLibrary()

  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState(null);
  const [geoState, setGeoState] = useState('idle'); // idle | locating | located | error
  const [geoMessage, setGeoMessage] = useState('');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // ---------- Map initialization (once) ----------
  useEffect(() => {
    let cancelled = false;

    if (!apiKey) {
      setLoadState('error');
      setLoadError(
        'Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to the frontend .env file and restart the dev server.'
      );
      return undefined;
    }

    setOptions({ key: apiKey, v: 'weekly' });

    Promise.all([importLibrary('maps'), importLibrary('marker'), importLibrary('core')])
      .then(([maps, marker, core]) => ({ maps, marker, core }))
      .then((libraries) => {
        if (cancelled || !mapRef.current) return;

        libraryRef.current = libraries;
        const { maps } = libraries;

        const initialCenter = center ?? DEFAULT_CENTER;
        const map = new maps.Map(mapRef.current, {
          center: initialCenter,
          zoom,
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new maps.InfoWindow();
        setLoadState('ready');
        onMapLoad?.(map, libraries);
      })
      .catch((err) => {
        console.error('Google Maps failed to load:', err);
        if (cancelled) return;
        setLoadState('error');
        setLoadError(
          'Google Maps could not be loaded. Check the API key, billing, and that the Maps JavaScript API is enabled for this key.'
        );
      });

    return () => {
      cancelled = true;
      // Clean up markers created for this component instance
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // ---------- Donation markers ----------
  useEffect(() => {
    const map = mapInstanceRef.current;
    const libraries = libraryRef.current;
    if (!map || !libraries || loadState !== 'ready') return;
    const { maps, marker: markerLib, core } = libraries;

    // Remove existing donation markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const geolocated = markers.filter(
      (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number'
    );

    const infoWindow = infoWindowRef.current;
    const bounds = new core.LatLngBounds();

    geolocated.forEach((marker) => {
      const position = { lat: marker.latitude, lng: marker.longitude };
      if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return;

      const gMarker = new markerLib.Marker({
        position,
        map,
        title: marker.title ?? marker.foodName ?? 'Food donation',
      });

      const st = statusStyle(marker.status);
      const content = `
        <div style="font-family: 'Inter', system-ui, sans-serif; padding: 4px 2px; min-width: 190px;">
          <div style="font-weight: 600; font-size: 14px; color: #1c1c1e; margin-bottom: 6px;">
            ${escapeHtml(marker.foodName ?? marker.title ?? 'Food donation')}
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">
            <span style="font-size:11px; font-weight:600; padding:2px 8px; border-radius:9999px; ${st.className}">${st.label}</span>
          </div>
          <table style="width:100%; font-size:12px; color:#6b7280; border-collapse:collapse;">
            ${row('Quantity', marker.quantity)}
            ${row('Expires', formatExpiry(marker.expiryDate))}
            ${row('Donor', marker.donorName)}
            ${row('Pickup', marker.title !== marker.foodName ? marker.title : undefined)}
          </table>
        </div>
      `;

      gMarker.addListener('click', () => {
        infoWindow.setContent(content);
        infoWindow.open(map, gMarker);
      });

      bounds.extend(position);
      markersRef.current.push(gMarker);
    });

    if (fitToMarkers && geolocated.length > 0) {
      map.fitBounds(bounds);
    } else if (center) {
      map.setCenter(center);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, loadState, center, fitToMarkers]);

  // ---------- Geolocation ----------
  const locateUser = useCallback(() => {
    const map = mapInstanceRef.current;
    const libraries = libraryRef.current;
    if (!map || !libraries) return;
    const { maps, marker, core } = libraries;

    if (!('geolocation' in navigator)) {
      setGeoState('error');
      setGeoMessage('Location is not supported by this browser.');
      return;
    }

    setGeoState('locating');
    setGeoMessage('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const position = { lat: latitude, lng: longitude };

        map.setCenter(position);
        map.setZoom(14);

        if (userMarkerRef.current) {
          userMarkerRef.current.setMap(null);
        }
        userMarkerRef.current = new marker.Marker({
          position,
          map,
          title: 'Your location',
          icon: {
            path: core.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#2d6a4f',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        });

        setGeoState('located');
        setGeoMessage('Showing your current location.');
      },
      (err) => {
        setGeoState('error');
        if (err.code === err.PERMISSION_DENIED) {
          setGeoMessage('Location permission was denied. Showing the default map area instead.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoMessage('Your location is currently unavailable. Showing the default map area instead.');
        } else if (err.code === err.TIMEOUT) {
          setGeoMessage('Location request timed out. Showing the default map area instead.');
        } else {
          setGeoMessage('Could not determine your location. Showing the default map area instead.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // ---------- Render ----------
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white ${className}`} style={{ height }}>
      {/* Map canvas */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Loading state */}
      {loadState === 'loading' && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[#d8f3dc]/40">
          <div className="text-center">
            <LoaderCircle size={32} className="text-[#2d6a4f] mx-auto mb-2 animate-spin" />
            <p className="text-sm text-[#6b7280]">Loading map...</p>
          </div>
        </div>
      )}

      {/* Configuration / load error */}
      {loadState === 'error' && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[#fde8df]/60 p-6">
          <div className="text-center max-w-md">
            <AlertTriangle size={32} className="text-[#c0522a] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#1c1c1e] mb-1">Map unavailable</p>
            <p className="text-xs text-[#6b7280]">{loadError}</p>
          </div>
        </div>
      )}

      {/* Geolocation status message */}
      {geoState === 'located' && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-center pointer-events-none">
          <span className="bg-[#d8f3dc] text-[#2d6a4f] text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
            <MapPin size={12} className="inline mr-1" />
            {geoMessage}
          </span>
        </div>
      )}
      {geoState === 'error' && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-center pointer-events-none">
          <span className="bg-[#fde8df] text-[#c0522a] text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
            <AlertTriangle size={12} className="inline mr-1" />
            {geoMessage}
          </span>
        </div>
      )}

      {/* Use My Location button */}
      <button
        type="button"
        onClick={locateUser}
        disabled={loadState !== 'ready' || geoState === 'locating'}
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-xl bg-white text-[#2d6a4f] border border-gray-200 shadow-sm px-3 py-2 text-xs font-medium hover:bg-[#d8f3dc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Locate size={14} />
        {geoState === 'locating' ? 'Locating...' : 'Use My Location'}
      </button>
    </div>
  );
}

// ---------- helpers ----------
function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function row(label, value) {
  if (value == null || value === '') return '';
  return `<tr>
    <td style="padding:2px 8px 2px 0; white-space:nowrap; font-weight:500; color:#1c1c1e;">${label}</td>
    <td style="padding:2px 0;">${escapeHtml(value)}</td>
  </tr>`;
}
