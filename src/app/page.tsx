'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=a42968a24e434cf08183dbf676af5036&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => initMap());
    };
    document.head.appendChild(script);
  }, []);

  const initMap = async () => {
    const container = mapRef.current;
    if (!container) return;

    const map = new window.kakao.maps.Map(container, {
      center: new window.kakao.maps.LatLng(36.35, 127.38), // 대전 중심
      level: 9,
    });

    try {
      const res = await fetch('/sig.json');
      const geojson = await res.json();

      geojson.features.forEach((feature: any) => {
        const coords = feature.geometry.coordinates;

        // Polygon과 MultiPolygon 처리
        const polygons: window.kakao.maps.LatLng[][] = [];

        if (feature.geometry.type === 'Polygon') {
          polygons.push(coords[0].map((coord: number[]) => new window.kakao.maps.LatLng(coord[1], coord[0])));
        } else if (feature.geometry.type === 'MultiPolygon') {
          coords.forEach((polygon: number[][][]) => {
            polygons.push(polygon[0].map((coord: number[]) => new window.kakao.maps.LatLng(coord[1], coord[0])));
          });
        }

        polygons.forEach(path => {
          new window.kakao.maps.Polygon({
            map,
            path,
            strokeWeight: 2,
            strokeColor: '#004c80',
            strokeOpacity: 0.8,
            fillColor: '#fff',
            fillOpacity: 0.5,
          });
        });
      });
    } catch (error) {
      console.error('GeoJSON 로딩 실패:', error);
    }
  };

  return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />;
}
