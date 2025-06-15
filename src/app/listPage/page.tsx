'use client';

import { useState, useEffect, useMemo } from 'react';
import { mockDamageReports } from '@/lib/mock-data';
import type { DamageReport, FacilityType, DamageSeverity, AcknowledgedStatus } from '@/types';
import { DamageFilter } from '@/components/damage-filter';
import { DamageReportCard } from '@/components/damage-report-card';
import { filterDamageImages } from '@/ai/flows/filter-damage-images';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle, SearchX, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { facilityTypes, damageSeverities } from '@/lib/constants';
import { format } from 'date-fns';

// Helper functions
const getDamageSeverityLabel = (value: DamageSeverity): string => {
  const severity = damageSeverities.find(s => s.value === value);
  return severity ? severity.label : value;
};

const getFacilityTypeLabel = (value: FacilityType): string => {
  const facility = facilityTypes.find(f => f.value === value);
  return facility ? facility.label : value;
};

const sortBySeverity = (reports: DamageReport[]) => {
  const severityOrder = { High: 3, Medium: 2, Low: 1 };
  return [...reports].sort((a, b) => severityOrder[b.damageSeverity] - severityOrder[a.damageSeverity]);
};

export default function ListPage() {
  const [allReports, setAllReports] = useState<DamageReport[]>([]);
  const [displayedReports, setDisplayedReports] = useState<DamageReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const { toast } = useToast();

  const [currentFilters, setCurrentFilters] = useState<{
    facilityType: FacilityType | 'all';
    damageSeverity: DamageSeverity | 'all';
    acknowledgedStatus: AcknowledgedStatus;
  }>({
    facilityType: 'all',
    damageSeverity: 'all',
    acknowledgedStatus: 'unacknowledged',
  });

  // Initialize data
  useEffect(() => {
    setAllReports(mockDamageReports);
    const initialDisplay = mockDamageReports.filter(report => !report.acknowledged);
    setDisplayedReports(sortBySeverity(initialDisplay));
    setIsLoading(false);
  }, []);

  // Apply filters to reports
  const applyFilters = (
    reports: DamageReport[],
    filters: typeof currentFilters
  ): DamageReport[] => {
    return reports.filter(report => {
      const facilityMatch = filters.facilityType === 'all' || report.facilityType === filters.facilityType;
      const severityMatch = filters.damageSeverity === 'all' || report.damageSeverity === filters.damageSeverity;
      
      let acknowledgedMatch = true;
      if (filters.acknowledgedStatus !== 'all') {
        acknowledgedMatch = filters.acknowledgedStatus === 'acknowledged' ? report.acknowledged : !report.acknowledged;
      }
      
      return facilityMatch && severityMatch && acknowledgedMatch;
    });
  };

  // Handle acknowledgment toggle
  const handleAcknowledge = (id: string) => {
    const updatedReports = allReports.map(report =>
      report.id === id ? { ...report, acknowledged: !report.acknowledged } : report
    );
    setAllReports(updatedReports);

    const filteredReports = applyFilters(updatedReports, currentFilters);
    setDisplayedReports(sortBySeverity(filteredReports));

    const targetReport = updatedReports.find(r => r.id === id);
    toast({
      title: `보고서 ${targetReport?.acknowledged ? "정상으로 분류됨" : "훼손으로 분류됨"}`, /// 확인/미확인에서 변경함.
      description: `보고서 ID ${id} 상태가 업데이트되었습니다.`,
      variant: targetReport?.acknowledged ? "success" : "default",
    });
  };

  // Handle severity change
  const handleSeverityChange = (id: string, newSeverity: DamageSeverity) => {
    const updatedReports = allReports.map(report =>
      report.id === id ? { ...report, damageSeverity: newSeverity } : report
    );
    setAllReports(updatedReports);
    
    const filteredReports = applyFilters(updatedReports, currentFilters);
    setDisplayedReports(sortBySeverity(filteredReports));

    toast({
      title: "손상도 업데이트됨",
      description: `보고서 ID ${id}의 손상도가 ${getDamageSeverityLabel(newSeverity)}(으)로 변경되었습니다.`,
      variant: "default",
    });
  };
  
  const imageIdsForAI = useMemo(() => allReports.map(report => report.id), [allReports]);

  // Handle filter application
  const handleFilter = async (
    facilityTypeFilter: FacilityType | 'all',
    damageSeverityFilter: DamageSeverity | 'all',
    acknowledgedStatusFilter: AcknowledgedStatus
  ) => {
    setIsFiltering(true);
    const newFilterSettings = { 
      facilityType: facilityTypeFilter, 
      damageSeverity: damageSeverityFilter, 
      acknowledgedStatus: acknowledgedStatusFilter,
    };
    setCurrentFilters(newFilterSettings);

    let filteredReports: DamageReport[];
    const useAIFilter = facilityTypeFilter !== 'all' && damageSeverityFilter !== 'all';
    
    if (useAIFilter) {
      try {
        const result = await filterDamageImages({
          facilityType: facilityTypeFilter as FacilityType,
          damageSeverity: damageSeverityFilter as DamageSeverity,
          imageIds: imageIdsForAI,
        });

        const aiFilteredIds = new Set(result.filteredImageIds);
        filteredReports = allReports.filter(report => aiFilteredIds.has(report.id));
        
        toast({
          title: "AI 콘텐츠 필터 적용됨",
          description: `AI가 시설물 유형 및 손상도 기준으로 ${filteredReports.length}개의 보고서를 찾았습니다.`,
          variant: "default",
        });
      } catch (error) {
        console.error("AI 필터링 오류:", error);
        toast({
          title: "AI 필터 오류",
          description: "AI 필터링 중 오류가 발생했습니다. 클라이언트 필터를 적용합니다.",
          variant: "destructive",
        });
        filteredReports = applyFilters(allReports, newFilterSettings);
      }
    } else {
      filteredReports = applyFilters(allReports, newFilterSettings);
    }

    // Apply acknowledgment filter
    if (acknowledgedStatusFilter !== 'all') {
      filteredReports = filteredReports.filter(report => 
        acknowledgedStatusFilter === 'acknowledged' ? report.acknowledged : !report.acknowledged
      );
    }

    setDisplayedReports(sortBySeverity(filteredReports));

    let toastMessage = `필터 조건에 맞는 ${filteredReports.length}개의 보고서를 찾았습니다.`;
    if (facilityTypeFilter === 'all' && damageSeverityFilter === 'all' && acknowledgedStatusFilter === 'all') {
      toastMessage = "모든 필터가 초기화되었습니다.";
    }
    
    toast({
      title: "필터 업데이트됨",
      description: toastMessage,
      variant: "default",
    });

    setIsFiltering(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetSettings = {
      facilityType: 'all' as const,
      damageSeverity: 'all' as const,
      acknowledgedStatus: 'unacknowledged' as const,
    };
    setCurrentFilters(resetSettings);

    const filteredReports = applyFilters(allReports, resetSettings);
    setDisplayedReports(sortBySeverity(filteredReports));
    
    toast({ 
      title: "필터 초기화됨", 
      description: "모든 필터가 초기화되었습니다.", 
      variant: "default" 
    });
  };

  // Download CSV
  const handleDownloadCsv = () => {
    if (displayedReports.length === 0) {
      toast({
        title: "다운로드할 데이터 없음",
        description: "현재 표시된 보고서가 없어 CSV 파일을 생성할 수 없습니다.",
        variant: "warning",
      });
      return;
    }

    const headers = [
      "ID", "시설물 유형", "손상 정도", "발생 시각", "위치", "설명", "확인 여부"
    ];

    const csvRows = displayedReports.map(report => {
      const facilityLabel = getFacilityTypeLabel(report.facilityType);
      const severityLabel = getDamageSeverityLabel(report.damageSeverity);
      const acknowledgedLabel = report.acknowledged ? '정상으로 분류됨' : '훼손으로 분류됨';    // 확인/미확인 -> 정상으로 분류/훼손으로 분류
      const formattedTimestamp = format(new Date(report.timestamp), 'yyyy-MM-dd HH:mm:ss');

      const escapeCsvField = (field: string | undefined) => {
        if (field === undefined || field === null) return '';
        let escaped = field.toString().replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
          escaped = `"${escaped}"`;
        }
        return escaped;
      };
      
      return [
        report.id,
        facilityLabel,
        severityLabel,
        formattedTimestamp,
        escapeCsvField(report.location),
        escapeCsvField(report.description),
        acknowledgedLabel
      ].join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'roadwatch_reports.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "✅ CSV 다운로드 시작됨",
        description: `${displayedReports.length}개의 보고서가 CSV 파일로 다운로드됩니다.`,
        variant: "success",
      });
    } else {
      toast({
        title: "CSV 다운로드 실패",
        description: "브라우저에서 파일 다운로드를 지원하지 않습니다.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/3" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col h-full">
              <CardHeader>
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="w-full h-48" />
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 50 }}>
      <button
        onClick={() => window.location.href = '/'}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
      >
         지도 보기
      </button>
    </div>
    <div className="space-y-8">
      {/* Download Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={handleDownloadCsv} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          결과 다운로드 (CSV)
        </Button>
      </div>
</div>
      {/* Filter Component */}
      <DamageFilter onFilter={handleFilter} onReset={handleResetFilters} isLoading={isFiltering} />
      
      {/* Loading State During Filtering */}
      {isFiltering && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: displayedReports.length || 6 }).map((_, i) => (
            <Card key={`skeleton-filtering-${i}`} className="flex flex-col h-full">
              <CardHeader>
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="w-full h-48" />
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Report Cards */}
      {!isFiltering && displayedReports.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedReports.map(report => (
            <DamageReportCard 
              key={report.id} 
              report={report} 
              onAcknowledge={handleAcknowledge}
              onSeverityChange={handleSeverityChange} 
            />
          ))}
        </div>
      )}

      {/* No Results State */}
      {!isFiltering && displayedReports.length === 0 && allReports.length > 0 && (
        <Card className="mt-8">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">보고서 없음</h2>
            <p className="text-muted-foreground">
              현재 선택된 필터 조건에 맞는 손상 보고서가 없습니다. 필터 기준을 조정하거나 초기화해 보세요.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* No Data State */}
      {!isFiltering && allReports.length === 0 && !isLoading && (
        <Card className="mt-8">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <AlertTriangle className="h-16 w-16 text-warning mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">손상 보고서 없음</h2>
            <p className="text-muted-foreground">
              시스템에 현재 손상 보고서가 없습니다. 새 보고서가 곧 추가될 수 있으니 잠시 후 다시 확인해주세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}