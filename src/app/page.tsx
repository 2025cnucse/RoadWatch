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

  // 마커들을 관리하기 위한 useRef (useRef는 컴포넌트 내부에서 선언되어야 합니다)
  const currentMarkersRef = useRef<window.kakao.maps.Marker[]>([]);

  // Kakao Maps SDK 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src =
      '//dapi.kakao.com/v2/maps/sdk.js?appkey=b9aa4451b97483c16c248b666965b376&autoload=false'; // API 키 확인
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => initMap()); // initMap 호출
    };
    document.head.appendChild(script);
  }, []);

  // 지도를 초기화하고, 초기 마커와 폴리곤을 그리는 함수
  const initMap = async () => {
    const container = mapRef.current;
    if (!container) return;

    const map = new window.kakao.maps.Map(container, {
      center: new window.kakao.maps.LatLng(36.35, 127.38),
      level: 9,
    });
    container.__kakao_map_instance__ = map; // 지도 인스턴스를 ref에 저장

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

          window.kakao.maps.event.addListener(polygon, 'click', () => {
              alert(`${feature.properties.SIG_KOR_NM || '알 수 없는 지역'}을 클릭했습니다.\n이 지역의 훼손 시설물 리스트를 표시할 예정입니다.`);
          });
        });
      });

      // --- 여기에 초기 마커 생성 로직을 다시 추가합니다. ---
      // initMap이 호출될 때 초기 currentDamageReports를 사용하여 마커를 그립니다.
      currentDamageReports.forEach((item) => { // 초기 데이터로 마커 그림
        let markerImageUrl: string;

        if (item.isReviewed) {
          markerImageUrl = '/yellow-check-dot.png';
        } else if (item.damageSeverity === 'High') {
          markerImageUrl = '/red-dot.png';
        } else if (item.damageSeverity === 'Medium') {
          markerImageUrl = '/yellow-dot.png';
        } else if (item.damageSeverity === 'Low') {
          markerImageUrl = '/green-dot.png';
        } else {
          markerImageUrl = '/marker-default.png';
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

        window.kakao.maps.event.addListener(marker, 'mouseover', () => {
            console.log(`마커 호버: ${item.location} - ${item.description}`);
        });
        window.kakao.maps.event.addListener(marker, 'mouseout', () => {
            console.log(`마커 마우스 아웃: ${item.location}`);
        });

        currentMarkersRef.current.push(marker); // 생성된 마커 인스턴스 저장
      });
      // --- 초기 마커 생성 로직 끝 ---

    } catch (error) {
      console.error('지도 초기화 또는 데이터 로딩 중 오류 발생:', error);
    }
  };

  // currentDamageReports가 변경될 때마다 마커를 업데이트하는 useEffect
  // 이 useEffect는 이제 initMap 이후 데이터 변경에만 반응하여 마커를 다시 그립니다.
  useEffect(() => {
    const map = mapRef.current?.__kakao_map_instance__;
    if (!map || !window.kakao) return;

    // 기존 마커 모두 제거
    currentMarkersRef.current.forEach(marker => marker.setMap(null));
    currentMarkersRef.current = []; // 배열 비우기

    // 새로운 마커 다시 그리기
    currentDamageReports.forEach((item) => {
      let markerImageUrl: string;

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
      } else {
        markerImageUrl = '/marker-default.png';
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

      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
          console.log(`마커 호버: ${item.location} - ${item.description}`);
      });
      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
          console.log(`마커 마우스 아웃: ${item.location}`);
      });

      currentMarkersRef.current.push(marker);
    });
  }, [currentDamageReports]);


  // 훼손도 업데이트 핸들러
  const handleUpdateDamageSeverity = (markerId: string, newSeverity: 'Low' | 'Medium' | 'High') => {
    setCurrentDamageReports(prevReports => {
      const updatedReports = prevReports.map(report =>
        report.id === markerId
          ? {
              ...report,
              damageSeverity: newSeverity,
              isReviewed: true, // 훼손도 변경 시 isReviewed를 true로 설정
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
    console.log(`Report ${markerId}의 훼손도가 ${newSeverity}로 최종 변경되고 확인 처리되었습니다. (isReviewed: true)`);
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