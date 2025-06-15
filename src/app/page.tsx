'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MarkerData } from '@/components/ReportModal';
import { mockDamageReports } from '@/lib/mock-data';
import type { DamageReport } from '@/types';

// Kakao Maps API를 사용하기 위해 window 객체에 kakao 네임스페이스를 정의합니다.
declare global {
  interface Window {
    kakao: any;
    __kakao_map_instance__?: any; // 지도 인스턴스를 저장하기 위한 확장 필드
  }
}

// ReportModal 컴포넌트는 클라이언트 사이드에서만 렌더링되도록 dynamic import를 사용합니다.
const ReportModal = dynamic(() => import('@/components/ReportModal'), { ssr: false });

/**
 * 지도와 손상 보고 관련 로직을 처리하는 메인 페이지 컴포넌트입니다.
 */
export default function MapPage() {
  // State 및 Ref 변수 선언
  const mapRef = useRef<HTMLDivElement>(null); // 지도를 담을 div 요소에 대한 참조
  const [modalOpen, setModalOpen] = useState(false); // 모달 창의 열림/닫힘 상태
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null); // 사용자가 클릭한 마커의 상세 데이터
  const [currentDamageReports, setCurrentDamageReports] = useState<DamageReport[]>(mockDamageReports); // 현재 지도에 표시될 손상 보고 데이터 목록
  const currentMarkersRef = useRef<any[]>([]); // 현재 지도에 그려진 마커 인스턴스들을 저장하는 배열

  /**
   * Kakao Maps SDK 스크립트를 동적으로 로드합니다.
   * 이 `useEffect`는 컴포넌트가 처음 마운트될 때 한 번만 실행됩니다.
   */
  useEffect(() => {
    const script = document.createElement('script');
    script.src =
      `//dapi.kakao.com/v2/maps/sdk.js?appkey=bcb988d7f31bf0c78599c87b7c852005&autoload=false`;
    script.async = true;
    script.onload = () => {
      // 스크립트 로드가 완료되면, Kakao Maps API를 초기화하고 지도를 생성합니다.
      window.kakao.maps.load(() => initMap());
    };
    document.head.appendChild(script);
  }, []);

  /**
   * confidence(신뢰도) 값에 따라 적절한 마커 이미지 URL을 반환하는 헬퍼 함수입니다.
   * @param confidence - 훼손 신뢰도 (0-100 사이의 숫자)
   * @returns 신뢰도 구간에 맞는 마커 이미지 파일 경로
   */
  const getMarkerImageUrlByConfidence = (confidence?: number): string => {
    if (confidence !== undefined) {
      if (confidence <= 20) return '/red-dot.png';     // 신뢰도 낮음 (빨강)
      if (confidence <= 50) return '/yellow-dot.png';  // 신뢰도 중간 (노랑)
      return '/green-dot.png';   // 신뢰도 높음 (초록)
    }
    return '/marker-default.png'; // 신뢰도 값 없을 시 기본 마커
  };

  /**
   * 지도를 초기화하고, 행정구역 경계(Polygon)를 그리는 함수입니다.
   * 지도 인스턴스가 없을 때만 실행됩니다.
   */
  const initMap = async () => {
    const container = mapRef.current;
    // 지도 컨테이너가 없거나, 이미 지도 인스턴스가 생성되었다면 함수를 종료합니다.
    if (!container || container.__kakao_map_instance__) return;

    // 지도 생성
    const map = new window.kakao.maps.Map(container, {
      center: new window.kakao.maps.LatLng(36.35, 127.38), // 초기 중심 좌표 (대전)
      level: 9, // 초기 줌 레벨
    });
    container.__kakao_map_instance__ = map; // 생성된 지도 인스턴스를 나중에 참조할 수 있도록 저장

    try {
      // 행정구역 경계 데이터를 불러옵니다.
      const res = await fetch('/sig.json');
      const geojson = await res.json();

      // geojson 데이터를 순회하며 각 행정구역에 대한 폴리곤을 생성합니다.
      geojson.features.forEach((feature: any) => {
        const coords = feature.geometry.coordinates;
        const code = feature.properties?.SIG_CD || '';
        const isTarget = code === '30200'; // 특정 지역(예: 유성구)인지 확인
        const polygons: any[] = [];

        // Polygon, MultiPolygon 타입에 맞춰 좌표 데이터를 가공합니다.
        if (feature.geometry.type === 'Polygon') {
          polygons.push(
            coords[0].map((coord: number[]) => new window.kakao.maps.LatLng(coord[1], coord[0]))
          );
        } else if (feature.geometry.type === 'MultiPolygon') {
          coords.forEach((polygon: number[][][]) => {
            polygons.push(
              polygon[0].map((coord: number[]) => new window.kakao.maps.LatLng(coord[1], coord[0]))
            );
          });
        }

        // 가공된 좌표로 폴리곤을 그리고 지도에 이벤트를 등록합니다.
        polygons.forEach((path) => {
          const polygon = new window.kakao.maps.Polygon({
            map, path, strokeWeight: 2, strokeColor: '#004c80', strokeOpacity: 0.8,
            fillColor: isTarget ? '#f08080' : '#fff', fillOpacity: 0.5,
          });
          // 마우스 오버/아웃/클릭 이벤트 처리
          window.kakao.maps.event.addListener(polygon, 'mouseover', () => polygon.setOptions({ fillColor: '#add8e6', fillOpacity: 0.7 }));
          window.kakao.maps.event.addListener(polygon, 'mouseout', () => polygon.setOptions({ fillColor: isTarget ? '#f08080' : '#fff', fillOpacity: 0.5 }));
          window.kakao.maps.event.addListener(polygon, 'click', () => alert(`${feature.properties.SIG_KOR_NM || '알 수 없는 지역'}을 클릭했습니다.`));
        });
      });

      // 초기 손상 데이터를 기반으로 마커를 지도에 표시합니다.
      updateMarkers(map, currentDamageReports);

    } catch (error) {
      console.error('지도 초기화 또는 데이터 로딩 중 오류 발생:', error);
    }
  };

  /**
   * 지도에 표시된 마커들을 업데이트(다시 그리는) 함수입니다.
   * @param map - 마커를 표시할 지도 인스턴스
   * @param reports - 지도에 표시할 손상 보고 데이터 배열
   */
  const updateMarkers = (map: any, reports: DamageReport[]) => {
    // 기존에 그려진 마커들을 모두 지도에서 제거합니다.
    currentMarkersRef.current.forEach(marker => marker.setMap(null));
    currentMarkersRef.current = []; // 마커 참조 배열을 비웁니다.

    // confidence가 70 초과인 데이터는 필터링하여 지도에 표시하지 않습니다.
    const filteredReports = reports.filter(
      (report) => report.confidence === undefined || report.confidence <= 70
    );

    // 필터링된 데이터를 순회하며 각 위치에 마커를 생성합니다.
    filteredReports.forEach((item) => {
      // 신뢰도 값에 따라 마커 이미지 URL을 결정합니다.
      const markerImageUrl = getMarkerImageUrlByConfidence(item.confidence);

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

      // 데이터의 검토 여부(`isReviewed`)에 따라 마커의 투명도를 조절합니다.
      if (item.isReviewed) {
        marker.setOpacity(0.25); // 검토 완료 시 반투명
      } else {
        marker.setOpacity(1); // 미검토 시 불투명
      }

      // 각 마커에 클릭 이벤트를 등록합니다.
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 클릭된 마커의 데이터를 state에 저장하여 모달창으로 전달합니다.
        setSelectedMarker({
          name: item.id, district: item.location, lat: item.lat, lng: item.lng,
          imageUrl: item.imageUrl, description: item.description, facilityType: item.facilityType,
          damageSeverity: item.damageSeverity, timestamp: item.timestamp,
          confidence: item.confidence, isReviewed: item.isReviewed,
        });
        setModalOpen(true); // 모달창을 엽니다.
      });

      // 생성된 마커 인스턴스를 나중에 제어할 수 있도록 배열에 추가합니다.
      currentMarkersRef.current.push(marker);
    });
  };

  /**
   * `currentDamageReports` 데이터가 변경될 때마다 마커를 다시 그리도록 하는 `useEffect` 입니다.
   */
  useEffect(() => {
    const map = mapRef.current?.__kakao_map_instance__;
    if (!map || !window.kakao) return;
    updateMarkers(map, currentDamageReports);
  }, [currentDamageReports]); // `currentDamageReports`가 변경될 때마다 이펙트가 실행됩니다.

  /**
   * 모달에서 '확인'을 눌렀을 때 호출되는 핸들러 함수입니다.
   * 특정 보고서의 손상도를 업데이트하고, 검토 상태(`isReviewed`)를 true로 변경합니다.
   * @param markerId - 수정할 보고서의 ID
   * @param newSeverity - 새로 지정된 손상도 ('Low', 'Medium', 'High')
   */
  const handleUpdateDamageSeverity = (markerId: string, newSeverity: 'Low' | 'Medium' | 'High') => {
    setCurrentDamageReports(prevReports => {
      const updatedReports = prevReports.map(report =>
        report.id === markerId
          ? { ...report, damageSeverity: newSeverity, isReviewed: true }
          : report
      );
      // 모달에 표시되는 데이터도 동기화합니다.
      setSelectedMarker(prevMarker =>
        prevMarker && prevMarker.name === markerId
          ? { ...prevMarker, damageSeverity: newSeverity, isReviewed: true }
          : prevMarker
      );
      return updatedReports; // 새로운 데이터 배열을 반환하여 state를 업데이트합니다.
    });
  };

  // 화면에 렌더링될 JSX
  return (
    <>
      {/* 지도가 그려질 div 요소 */}
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 50 }}>
      <button
        onClick={() => window.location.href = '/listPage'}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
      >
        탐지결과 한눈에보기
      </button>
    </div>
      <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />

      {/* 마커 상세 정보 및 수정 모달 */}
      <ReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        marker={selectedMarker}
        onUpdateSeverity={handleUpdateDamageSeverity}
      />
    </>
  );
}