'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    script.src =
      '//dapi.kakao.com/v2/maps/sdk.js?appkey=a42968a24e434cf08183dbf676af5036&autoload=false&libraries=clusterer';
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
      center: new window.kakao.maps.LatLng(36.35, 127.38),
      level: 9,
    });

    try {
      // 🔶 Polygon 표시
      const res = await fetch('/sig.json');
      const geojson = await res.json();

      geojson.features.forEach((feature: any) => {
        const coords = feature.geometry.coordinates;
        const name = feature.properties?.SIG_KOR_NM || 'unknown';
        const code = feature.properties?.SIG_CD || '';
        const isTarget = code === '30200';

        const polygons: window.kakao.maps.LatLng[][] = [];

        if (feature.geometry.type === 'Polygon') {
          polygons.push(
            coords[0].map(
              (coord: number[]) => new window.kakao.maps.LatLng(coord[1], coord[0])
            )
          );
        } else if (feature.geometry.type === 'MultiPolygon') {
          coords.forEach((polygon: number[][][]) => {
            polygons.push(
              polygon[0].map(
                (coord: number[]) => new window.kakao.maps.LatLng(coord[1], coord[0])
              )
            );
          });
        }

        polygons.forEach((path) => {
          const polygon = new window.kakao.maps.Polygon({
            map,
            path,
            strokeWeight: 2,
            strokeColor: '#004c80',
            strokeOpacity: 0.8,
            fillColor: isTarget ? '#f08080' : '#fff',
            fillOpacity: 0.5,
          });

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

      // 🔷 마커 생성
      const imageRes = await fetch('/images.json');
      const imageData = await imageRes.json();

      const markers = imageData.map(
        (item: { name: string; lat: number; lng: number; district: string }) => {
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(item.lat, item.lng),
            title: item.district, // ✅ 구 이름으로 설정
          });

          return { marker, district: item.district };
        }
      );

      // 🔷 클러스터러 생성
      const clusterer = new window.kakao.maps.MarkerClusterer({
        map: map,
        averageCenter: true,
        minLevel: 1,
        disableClickZoom: true,
      });

      clusterer.addMarkers(markers.map((m) => m.marker));

      window.kakao.maps.event.addListener(
        clusterer,
        'clusterclick',
        (cluster: any) => {
          const clusterMarkers = cluster.getMarkers();
          if (clusterMarkers.length > 0) {
            const district = clusterMarkers[0].getTitle();
            router.push(`/listPage?region=${encodeURIComponent(district)}`);
          }
        }
      );
    } catch (error) {
      console.error('GeoJSON 또는 마커 로딩 실패:', error);
    }
  };

  return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />;
}
