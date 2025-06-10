// src/app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MarkerData } from '@/components/ReportModal';
import { mockDamageReports } from '@/lib/mock-data'; // mockDamageReports를 불러옵니다.

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

  // mockDamageReports 상태를 관리하여 UI 업데이트 및 데이터 반영
  // 이 배열의 상태가 변경되면 지도의 마커도 다시 그려질 수 있습니다.
  const [currentDamageReports, setCurrentDamageReports] = useState(mockDamageReports);

  useEffect(() => {
    const script = document.createElement('script');
    script.src =
      '//dapi.kakao.com/v2/maps/sdk.js?appkey=b9aa4451b97483c16c248b666965b376&autoload=false';
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => initMap(currentDamageReports)); // 초기 로드 시 데이터 전달
    };
    document.head.appendChild(script);
  }, []); // 의존성 배열에 currentDamageReports를 포함하지 않아 초기 한 번만 실행되도록 유지

  // currentDamageReports가 변경될 때마다 지도를 다시 그리거나 마커를 업데이트하는 useEffect 추가
  useEffect(() => {
    // 지도 객체가 이미 초기화되었는지 확인
    if (window.kakao && window.kakao.maps && mapRef.current && mapRef.current.__kakao_map_instance__) {
        const map = mapRef.current.__kakao_map_instance__; // 이전에 저장해둔 지도 인스턴스 사용
        // 기존 마커 모두 제거 (또는 업데이트 로직)
        // 실제 앱에서는 마커 관리 로직이 더 필요할 수 있습니다 (예: Map 인스턴스에 마커를 저장해두고 관리)
        map.removeOverlayAndMarkers && map.removeOverlayAndMarkers(); // 기존 마커 제거 함수가 있다면 호출

        // 새로운 마커 다시 그리기
        currentDamageReports.forEach((item) => {
            let markerImageUrl = '/marker-default.png';
            if (item.damageSeverity === 'High') markerImageUrl = '/red-dot.png';
            else if (item.damageSeverity === 'Medium') markerImageUrl = '/yellow-dot.png';
            else if (item.damageSeverity === 'Low') markerImageUrl = '/green-dot.png';

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
        });
    }
    // 지도 초기화 함수는 useEffect 내부가 아닌 별도로 정의하는 것이 좋습니다.
  }, [currentDamageReports]); // currentDamageReports가 변경될 때마다 이 useEffect 실행

  const initMap = async (initialReports: typeof mockDamageReports) => { // 데이터 인자로 받기
    const container = mapRef.current;
    if (!container) return;

    const map = new window.kakao.maps.Map(container, {
      center: new window.kakao.maps.LatLng(36.35, 127.38),
      level: 9,
    });
    container.__kakao_map_instance__ = map; // 지도 인스턴스를 ref에 저장하여 나중에 접근

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
              // 폴리곤 클릭 시 해당 지역에 해당하는 마커 정보를 찾아서 모달에 전달
              const relatedReport = currentDamageReports.find(report => report.location.includes('유성구')); // 더 정교한 매칭 필요
              if (relatedReport) {
                  setSelectedMarker({
                      name: relatedReport.id,
                      district: relatedReport.location,
                      lat: relatedReport.lat,
                      lng: relatedReport.lng,
                      imageUrl: relatedReport.imageUrl,
                      description: relatedReport.description,
                      facilityType: relatedReport.facilityType,
                      damageSeverity: relatedReport.damageSeverity,
                      timestamp: relatedReport.timestamp,
                  });
                  setModalOpen(true);
              } else {
                  alert(`${feature.properties.SIG_KOR_NM || '알 수 없는 지역'}을 클릭했습니다.`);
              }
          });
        });
      });

      // 초기 마커 생성 (currentDamageReports 사용)
      initialReports.forEach((item) => {
        let markerImageUrl = '/marker-default.png';
        if (item.damageSeverity === 'High') markerImageUrl = '/red-dot.png';
        else if (item.damageSeverity === 'Medium') markerImageUrl = '/yellow-dot.png';
        else if (item.damageSeverity === 'Low') markerImageUrl = '/green-dot.png';

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
      });

    } catch (error) {
      console.error('지도 초기화 또는 데이터 로딩 중 오류 발생:', error);
    }
  };

  // 훼손도 업데이트 핸들러
  const handleUpdateDamageSeverity = (markerId: string, newSeverity: 'Low' | 'Medium' | 'High') => {
    setCurrentDamageReports(prevReports => {
      const updatedReports = prevReports.map(report =>
        report.id === markerId
          ? { ...report, damageSeverity: newSeverity }
          : report
      );
      // selectedMarker도 업데이트하여 모달에 변경된 훼손도가 바로 반영되도록 함
      setSelectedMarker(prevMarker =>
        prevMarker && prevMarker.name === markerId
          ? { ...prevMarker, damageSeverity: newSeverity }
          : prevMarker
      );
      return updatedReports;
    });
    // 실제 데이터베이스가 있다면 여기에 API 호출 로직을 추가해야 합니다.
    console.log(`Report ${markerId}의 훼손도가 ${newSeverity}로 변경되었습니다.`);
  };


  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
      <ReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        marker={selectedMarker}
        onUpdateSeverity={handleUpdateDamageSeverity} // 콜백 함수 전달
      />
    </>
  );
}