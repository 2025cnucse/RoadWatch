// src/app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MarkerData } from '@/components/ReportModal';
import { mockDamageReports } from '@/lib/mock-data';
import type { DamageReport } from '@/types'; // DamageReport 타입 임포트

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

  const [currentDamageReports, setCurrentDamageReports] = useState<DamageReport[]>(mockDamageReports);

  const currentMarkersRef = useRef<any[]>([]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src =
      '//dapi.kakao.com/v2/maps/sdk.js?appkey=bcb988d7f31bf0c78599c87b7c852005&autoload=false'; // API 키 확인
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => initMap()); // initMap 호출
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
    (container as any).__kakao_map_instance__ = map;

    try {
      const res = await fetch('/sig.json');
      const geojson = await res.json();

      geojson.features.forEach((feature: any) => {
        const coords = feature.geometry.coordinates;
        const code = feature.properties?.SIG_CD || '';
        const isTarget = code === '30200';

        const polygons: any[][] = [];

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

          window.kakao.maps.event.addListener(polygon, 'click', () => {
              alert(`${feature.properties.SIG_KOR_NM || '알 수 없는 지역'}을 클릭했습니다.\n이 지역의 훼손 시설물 리스트를 표시할 예정입니다.`);
          });
        });
      });

      currentDamageReports.forEach((item) => {
        let markerImageUrl: string = '/marker-default.png';

        if (item.isReviewed) {
          markerImageUrl = '/yellow-check-dot.png';
        } else if (item.damageSeverity === 'High') {
          markerImageUrl = '/red-dot.png';
        } else if (item.damageSeverity === 'Medium') {
          markerImageUrl = '/yellow-dot.png';
        } else if (item.damageSeverity === 'Low') {
          markerImageUrl = '/green-dot.png';
        }

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
            imageUrl: item.imageUrl,
            description: item.description,
            facilityType: item.facilityType,
            damageSeverity: item.damageSeverity,
            timestamp: item.timestamp,
          });
          setModalOpen(true);
        });

        currentMarkersRef.current.push(marker);
      });

    } catch (error) {
      console.error('지도 초기화 또는 데이터 로딩 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    const map = (mapRef.current as any)?.__kakao_map_instance__;
    if (!map || !window.kakao) return;

    currentMarkersRef.current.forEach(marker => marker.setMap(null));
    currentMarkersRef.current = [];

    currentDamageReports.forEach((item) => {
      let markerImageUrl: string = '/marker-default.png';

        if (item.isReviewed) {
            if(item.damageSeverity == 'High'){
            markerImageUrl = '/red-check-dot.png';
            }
            else if(item.damageSeverity == 'Medium'){
            markerImageUrl = '/yellow-check-dot.png';
            }
            else if(item.damageSeverity == 'Low'){
            markerImageUrl = '/green-check-dot.png';
            }
        } else if (item.damageSeverity === 'High') {
            markerImageUrl = '/red-dot.png';
        } else if (item.damageSeverity === 'Medium') {
            markerImageUrl = '/yellow-dot.png';
        } else if (item.damageSeverity === 'Low') {
            markerImageUrl = '/green-dot.png';
        }

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
          imageUrl: item.imageUrl,
          description: item.description,
          facilityType: item.facilityType,
          damageSeverity: item.damageSeverity,
          timestamp: item.timestamp,
        });
        setModalOpen(true);
      });

      currentMarkersRef.current.push(marker);
    });
  }, [currentDamageReports]);

  const handleUpdateDamageSeverity = (markerId: string, newSeverity: 'Low' | 'Medium' | 'High') => {
    setCurrentDamageReports(prevReports => {
      const updatedReports = prevReports.map(report =>
        report.id === markerId
          ? {
              ...report,
              damageSeverity: newSeverity,
              isReviewed: true,
            }
          : report
      );
      setSelectedMarker(prevMarker =>
        prevMarker && prevMarker.name === markerId
          ? { ...prevMarker, damageSeverity: newSeverity, isReviewed: true }
          : prevMarker
      );
      return updatedReports;
    });
  };

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
      <ReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        marker={selectedMarker}
        onUpdateSeverity={handleUpdateDamageSeverity}
      />
    </>
  );
}