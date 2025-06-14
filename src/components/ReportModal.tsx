// src/components/ReportModal.tsx
'use client';

import React from 'react';

// 마커의 상세 데이터를 담는 타입 정의 (동일)
export interface MarkerData {
  name: string; // id로 사용
  district: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  description?: string;
  facilityType?: string;
  damageSeverity?: 'Low' | 'Medium' | 'High';
  timestamp?: Date;
  isReviewed?: boolean;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  marker: MarkerData | null;
  // 훼손도 업데이트를 위한 콜백 함수 추가
  // markerId: 어떤 마커의 훼손도를 변경할지, newSeverity: 새로운 훼손도 값
  onUpdateSeverity: (markerId: string, newSeverity: 'Low' | 'Medium' | 'High') => void;
}

const damageSeverities = ['Low', 'Medium', 'High'];

export default function ReportModal({ isOpen, onClose, marker, onUpdateSeverity }: ReportModalProps) {
  if (!isOpen || !marker) return null;

  // 현재 선택된 훼손도 상태를 관리
  const [tempSeverity, setTempSeverity] = React.useState(marker.damageSeverity || 'Low'); // 임시 훼손도 상태

  // 모달이 열릴 때마다 marker prop의 damageSeverity를 tempSeverity로 초기화
  React.useEffect(() => {
    if (marker?.damageSeverity) {
      setTempSeverity(marker.damageSeverity);
    }
  }, [marker?.damageSeverity]);

  const handleDropdownChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeverity = event.target.value as 'Low' | 'Medium' | 'High';
    setTempSeverity(newSeverity); // 드롭다운 변경 시에는 임시 상태만 업데이트
  };

  const handleConfirmChange = () => {
    // '확인' 버튼 클릭 시에만 부모 컴포넌트로 변경 사항 전달
    if (marker) {
      onUpdateSeverity(marker.name, tempSeverity);
    }
    onClose(); // 변경 사항을 전달한 후 모달 닫기
  };

  return (
    // 모달 배경 (어둡게 처리된 오버레이)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* 모달 내용 컨테이너 */}
      <div
        className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative overflow-hidden"
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl z-10"
          aria-label="모달 닫기"
        >
          &times;
        </button>

        {/* 상단 이미지 영역 */}
        {marker.imageUrl && (
          <div className="w-full h-48 bg-gray-200 overflow-hidden rounded-t-lg mb-4">
            <img
              src={marker.imageUrl}
              alt="손상 이미지"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 모달 헤더 - 장소 이름 */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {marker.district} ({marker.name})
        </h2>

        {/* 상세 정보 */}
        <div className="text-sm text-gray-700 space-y-1">
          {marker.facilityType && (
            <p><strong>시설물 유형:</strong> {marker.facilityType}</p>
          )}
          <p className="flex items-center">
            <strong>손상 심각도:</strong>
            <select
              value={tempSeverity} // 임시 상태 사용
              onChange={handleDropdownChange} // 드롭다운 변경 핸들러
              className="ml-2 px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            >
              {damageSeverities.map((severityOption) => (
                <option key={severityOption} value={severityOption}>
                  {severityOption}
                </option>
              ))}
            </select>
          </p>
          <p><strong>위도:</strong> {marker.lat.toFixed(6)}</p>
          <p><strong>경도:</strong> {marker.lng.toFixed(6)}</p>
          {marker.description && (
            <p><strong>설명:</strong> {marker.description || '설명 없음'}</p>
          )}
          {marker.timestamp && (
            <p><strong>보고 시간:</strong> {marker.timestamp.toLocaleString()}</p>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-6 flex justify-end space-x-3"> {/* 버튼 간격 추가 */}
            <button
                onClick={onClose} // 취소 버튼은 그냥 모달만 닫음
                className="bg-gray-300 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
                취소
            </button>
            <button
                onClick={handleConfirmChange} // 확인 버튼 클릭 시 변경사항 반영
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                확인
            </button>
        </div>
      </div>
    </div>
  );
}