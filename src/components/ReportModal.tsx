// src/components/ReportModal.tsx
'use client';

import React from 'react';

// 마커의 상세 데이터를 담는 타입 정의 (이전에 추가된 속성 포함)
export interface MarkerData {
  name: string; // id로 사용
  district: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  description?: string;
  facilityType?: string;
  damageSeverity?: 'Low' | 'Medium' | 'High'; // 훼손도 타입 명확화
  timestamp?: Date;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  marker: MarkerData | null;
  // 훼손도 업데이트를 위한 콜백 함수 추가
  // markerId: 어떤 마커의 훼손도를 변경할지, newSeverity: 새로운 훼손도 값
  onUpdateSeverity: (markerId: string, newSeverity: 'Low' | 'Medium' | 'High') => void;
}

const damageSeverities = ['Low', 'Medium', 'High']; // 드롭다운에 표시할 훼손도 옵션

export default function ReportModal({ isOpen, onClose, marker, onUpdateSeverity }: ReportModalProps) {
  if (!isOpen || !marker) return null;

  // 현재 선택된 훼손도 상태를 관리
  const [currentSeverity, setCurrentSeverity] = React.useState(marker.damageSeverity || 'Low');

  // 모달이 열릴 때마다 marker prop의 damageSeverity를 currentSeverity로 업데이트
  React.useEffect(() => {
    if (marker?.damageSeverity) {
      setCurrentSeverity(marker.damageSeverity);
    }
  }, [marker?.damageSeverity]);

  const handleSeverityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeverity = event.target.value as 'Low' | 'Medium' | 'High';
    setCurrentSeverity(newSeverity); // UI 상태 업데이트
    // 부모 컴포넌트로 변경된 훼손도 전달 (mockDamageReports 업데이트용)
    if (marker) {
      onUpdateSeverity(marker.name, newSeverity); // marker.name은 id로 사용되고 있습니다.
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', maxWidth: '400px', minWidth: '300px' }}>
        <h2>📍 {marker.district}</h2>
        <p><strong>장소 이름:</strong> {marker.name}</p>
        {marker.facilityType && <p><strong>시설물 유형:</strong> {marker.facilityType}</p>}
        <p>
          <strong>손상 심각도:</strong>
          <select value={currentSeverity} onChange={handleSeverityChange} style={{ marginLeft: '10px', padding: '5px' }}>
            {damageSeverities.map((severityOption) => (
              <option key={severityOption} value={severityOption}>
                {severityOption}
              </option>
            ))}
          </select>
        </p>
        <p><strong>위도:</strong> {marker.lat}</p>
        <p><strong>경도:</strong> {marker.lng}</p>
        {marker.description && <p><strong>설명:</strong> {marker.description}</p>}
        {marker.timestamp && <p><strong>보고 시간:</strong> {marker.timestamp.toLocaleString()}</p>}

        {marker.imageUrl && (
          <div style={{ marginTop: '15px' }}>
            <img
              src={marker.imageUrl}
              alt="손상 이미지"
              style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
            />
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: '20px', padding: '8px 15px', cursor: 'pointer' }}>닫기</button>
      </div>
    </div>
  );
}