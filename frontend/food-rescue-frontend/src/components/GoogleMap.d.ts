import type { ReactNode } from 'react';

export interface DonationMarker {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
  foodName?: string;
  quantity?: string;
  expiryDate?: string;
  donorName?: string;
  status?: string;
}

export interface GoogleMapProps {
  markers?: DonationMarker[];
  height?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
  fitToMarkers?: boolean;
  onMapLoad?: (map: unknown, google: unknown) => void;
  className?: string;
}

declare const GoogleMap: (props: GoogleMapProps) => ReactNode;
export default GoogleMap;
