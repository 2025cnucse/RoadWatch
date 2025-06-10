// app/test-modal/page.tsx
'use client';

import { useState } from 'react';
// import { ReportModal } from '@/components/ReportModal';
// ListPage나 MapPage에서 쓰던 mock 데이터 import
import { mockDamageReports } from '@/lib/mock-data';

export default function TestModalPage() {
  const [open, setOpen] = useState(false);
  // mock 데이터 중 첫 번째 리포트를 가져옴
  const testReport = mockDamageReports[0];

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">🚧 ReportModal 테스트 페이지</h1>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => setOpen(true)}
      >
        모달 열어 보기
      </button>

      <ReportModal
        report={testReport}
        open={open}
        onOpenChange={(isOpen) => setOpen(isOpen)}
        onAcknowledge={(id) => console.log('확인 토글:', id)}
        onSeverityChange={(id, severity) =>
          console.log('손상도 변경:', id, severity)
        }
      />
    </div>
  );
}
