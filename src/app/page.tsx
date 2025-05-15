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
import { AlertTriangle, SearchX } from 'lucide-react';
import { damageSeverities as damageSeverityConstants } from '@/lib/constants';

// Helper function to get Korean label for severity
const getDamageSeverityLabel = (value: DamageSeverity): string => {
  const severity = damageSeverityConstants.find(s => s.value === value);
  return severity ? severity.label : value;
}

export default function HomePage() {
  const [allReports, setAllReports] = useState<DamageReport[]>([]);
  const [displayedReports, setDisplayedReports] = useState<DamageReport[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isFiltering, setIsFiltering] = useState(false); // For AI filter operation
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data
    setAllReports(mockDamageReports);
    setDisplayedReports(mockDamageReports);
    setIsLoading(false);
  }, []);

  const handleAcknowledge = (id: string) => {
    const updateInList = (list: DamageReport[]) => list.map(report =>
      report.id === id ? { ...report, acknowledged: !report.acknowledged } : report // Toggle acknowledged state
    );
    setAllReports(prev => updateInList(prev));
    setDisplayedReports(prev => updateInList(prev));
    
    const targetReport = allReports.find(r => r.id === id);
    toast({
      title: `보고서 ${targetReport?.acknowledged ? "미확인됨" : "확인됨"}`,
      description: `보고서 ID ${id} 상태가 업데이트되었습니다.`,
      variant: "success",
    });
  };

  const handleSeverityChange = (id: string, newSeverity: DamageSeverity) => {
    const updateInList = (list: DamageReport[]) => list.map(report =>
      report.id === id ? { ...report, damageSeverity: newSeverity } : report
    );
    setAllReports(prev => updateInList(prev));
    setDisplayedReports(prev => updateInList(prev));
    toast({
      title: "손상도 업데이트됨",
      description: `보고서 ID ${id}의 손상도가 ${getDamageSeverityLabel(newSeverity)}(으)로 변경되었습니다.`,
      variant: "default",
    });
  };
  
  const imageIdsForAI = useMemo(() => allReports.map(report => report.id), [allReports]);

  const handleFilter = async (
    facilityType: FacilityType | 'all',
    damageSeverity: DamageSeverity | 'all',
    acknowledgedStatus: AcknowledgedStatus
  ) => {
    setIsFiltering(true);

    let reportsToFilter = allReports;

    const useAIFilter = facilityType !== 'all' && damageSeverity !== 'all';

    if (useAIFilter) {
      try {
        const result = await filterDamageImages({
          facilityType: facilityType as FacilityType, // AI는 영어 값을 기대
          damageSeverity: damageSeverity as DamageSeverity, // AI는 영어 값을 기대
          imageIds: imageIdsForAI,
        });

        const aiFilteredIds = new Set(result.filteredImageIds);
        reportsToFilter = allReports.filter(report => aiFilteredIds.has(report.id));
        
        toast({
          title: "AI 콘텐츠 필터 적용됨",
          description: `AI가 시설물 유형 및 손상도 기준으로 ${reportsToFilter.length}개의 보고서를 찾았습니다. 이후 확인 상태 필터가 적용됩니다.`,
          variant: "default",
        });
      } catch (error) {
        console.error("AI 필터링 오류:", error);
        toast({
          title: "AI 필터 오류",
          description: "AI를 사용하여 이미지를 필터링할 수 없습니다. 다른 필터를 전체 보고서에 적용합니다.",
          variant: "destructive",
        });
        reportsToFilter = allReports; // AI 실패 시 모든 보고서로 대체
      }
    } else {
      // AI를 사용하지 않는 경우 클라이언트 측 시설물 유형 및 손상도 필터 적용
      reportsToFilter = reportsToFilter.filter(report => {
        const facilityMatch = facilityType === 'all' || report.facilityType === facilityType;
        const severityMatch = damageSeverity === 'all' || report.damageSeverity === damageSeverity;
        return facilityMatch && severityMatch;
      });
    }

    // 현재 reportsToFilter 목록에 확인 상태 필터 적용 (항상 클라이언트 측)
    const finalFilteredReports = reportsToFilter.filter(report => {
      if (acknowledgedStatus === 'all') return true;
      return acknowledgedStatus === 'acknowledged' ? report.acknowledged : !report.acknowledged;
    });

    setDisplayedReports(finalFilteredReports);

    let toastMessage = `필터 조건에 맞는 ${finalFilteredReports.length}개의 보고서를 찾았습니다.`;
    if (facilityType === 'all' && damageSeverity === 'all' && acknowledgedStatus === 'all') {
      toastMessage = "필터가 초기화되었습니다. 모든 보고서를 표시합니다.";
    }
    
    toast({
      title: "필터 업데이트됨",
      description: toastMessage,
      variant: "default",
    });

    setIsFiltering(false);
  };

  const handleResetFilters = () => {
    setDisplayedReports(allReports); 
    toast({ title: "필터 초기화됨", description: "모든 보고서를 표시합니다.", variant: "default" });
  };

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
              <CardHeader><Skeleton className="h-6 w-2/3 mb-2" /><Skeleton className="w-full h-48" /></CardHeader>
              <CardContent className="flex-grow space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DamageFilter onFilter={handleFilter} onReset={handleResetFilters} isLoading={isFiltering} />
      
      {isFiltering && (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: displayedReports.length || mockDamageReports.length || 3 }).map((_, i) => (
             <Card key={i} className="flex flex-col h-full">
              <CardHeader><Skeleton className="h-6 w-2/3 mb-2" /><Skeleton className="w-full h-48" /></CardHeader>
              <CardContent className="flex-grow space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      )}

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

      {!isFiltering && displayedReports.length === 0 && (allReports.length > 0 || isFiltering) && (
        <Card className="mt-8">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">보고서 없음</h2>
            <p className="text-muted-foreground">
              현재 필터 조건에 맞는 손상 보고서가 없습니다. 필터 기준을 조정하거나 초기화해 보세요.
            </p>
          </CardContent>
        </Card>
      )}
      
      {!isFiltering && allReports.length === 0 && !isLoading && (
         <Card className="mt-8">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <AlertTriangle className="h-16 w-16 text-warning mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">손상 보고서 없음</h2>
            <p className="text-muted-foreground">
              시스템에 현재 손상 보고서가 없습니다. 나중에 다시 확인하거나 데이터가 처리 중인지 확인하세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
