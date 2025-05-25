'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';


export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();


    const map = new window.kakao.maps.Map(container, {
      center: new window.kakao.maps.LatLng(36.35, 127.38),
      level: 9,
    });

        const isTarget = code === '30200'; 

        const polygons: window.kakao.maps.LatLng[][] = [];

        if (feature.geometry.type === 'Polygon') {
          polygons.push(coords[0].map((coord: number[]) => new window.kakao.maps.LatLng(coord[1], coord[0])));
        } else if (feature.geometry.type === 'MultiPolygon') {
          coords.forEach((polygon: number[][][]) => {
            polygons.push(polygon[0].map((coord: number[]) => new window.kakao.maps.LatLng(coord[1], coord[0])));
          });
        }

        polygons.forEach(path => {
          const polygon = new window.kakao.maps.Polygon({
            map,
            path,
            strokeWeight: 2,
            strokeColor: '#004c80',
            strokeOpacity: 0.8,
            fillColor: isTarget ? '#f08080' : '#fff',
            fillOpacity: 0.5,
          });

          // hover 시 색상 변경
          window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
            polygon.setOptions({
              fillColor: '#add8e6',
              fillOpacity: 0.7,
            });
          });

          window.kakao.maps.event.addListener(polygon, 'mouseout', () => {
            polygon.setOptions({
              fillColor: isTarget ? '#f08080' : '#fff', 
              fillOpacity: 0.5,
            });
          });

          window.kakao.maps.event.addListener(polygon, 'click', () => {
            router.push(`/listPage?region=${encodeURIComponent(name)}`);
          });
        });
      });
    } catch (error) {
      console.error('GeoJSON 로딩 실패:', error);
    }
  };

  return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />;
}
