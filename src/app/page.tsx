'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MarkerData } from '@/components/ReportModal';
import { mockDamageReports } from '@/lib/mock-data';

declare global {
  interface Window {
    kakao: any;
  }
}

const ReportModal = dynamic(() => import('@/components/ReportModal'), { ssr: false });

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src =
      '//dapi.kakao.com/v2/maps/sdk.js?appkey=a42968a24e434cf08183dbf676af5036&autoload=false';
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
      const res = await fetch('/sig.json');
      const geojson = await res.json();

      geojson.features.forEach((feature: any) => {
        const coords = feature.geometry.coordinates;
        const code = feature.properties?.SIG_CD || '';
        const isTarget = code === '30200';

        const polygons: window.kakao.maps.LatLng[][] = [];

        if (feature.geometry.type === 'Polygon') {
          polygons.push(
            coords[0].map(
              (coord: number[]) =>
                new window.kakao.maps.LatLng(coord[1], coord[0])
            )
          );
        } else if (feature.geometry.type === 'MultiPolygon') {
          coords.forEach((polygon: number[][][]) => {
            polygons.push(
              polygon[0].map(
                (coord: number[]) =>
                  new window.kakao.maps.LatLng(coord[1], coord[0])
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
        });
      });

      mockDamageReports.forEach((item) => {
        let markerImageUrl = '/marker-default.png';
        if (item.importance === 'high') markerImageUrl = '/red-dot.png';
        else if (item.importance === 'middle') markerImageUrl = '/yellow-dot.png';
        else if (item.importance === 'low') markerImageUrl = '/green-dot.png';

        const markerImage = new window.kakao.maps.MarkerImage(
          markerImageUrl,
          new window.kakao.maps.Size(35, 35)
        );

        const marker = new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(item.lat, item.lng),
          title: item.location,
          image: markerImage,
        });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          setSelectedMarker({
            name: item.id,
            district: item.location,
            lat: item.lat,
            lng: item.lng,
          });
          setModalOpen(true);
        });
      });
    } catch (error) {
      console.error('지도 초기화 또는 마커 로딩 중 오류 발생:', error);
    }
  };

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
      <ReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        marker={selectedMarker}
      />
    </>
  );
}
