// src/components/ReportModal.tsx
'use client';

import React from 'react';

// 마커의 상세 데이터를 담는 타입 정의
export interface MarkerData {
  name: string;
  district: string;
  lat: number;
  lng: number;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  marker: MarkerData | null;
}

export default function ReportModal({ isOpen, onClose, marker }: ReportModalProps) {
  // 모달이 열리지 않았거나 marker 데이터가 없으면 아무것도 렌더링하지 않음
  if (!isOpen || !marker) return null;

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
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h2>📍 {marker.district}</h2>
        <p><strong>장소 이름:</strong> {marker.name}</p>
        <p><strong>위도:</strong> {marker.lat}</p>
        <p><strong>경도:</strong> {marker.lng}</p>
        <button onClick={onClose} style={{ marginTop: '10px' }}>닫기</button>
      </div>
    </div>
  );
}
