
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { mockDamageReports } from '@/lib/mock-data';
import type { DamageReport, FacilityType, DamageSeverity, AcknowledgedStatus } from '@/types';
import { DamageFilter } from '@/components/damage-filter';
import { DamageReportCard } from '@/components/damage-report-card';
import { filterDamageImages } from '@/ai/flows/filter-damage-images';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle, SearchX } from 'lucide-react';
import { facilityTypes, damageSeverities as damageSeverityConstants } from '@/lib/constants'; // Renamed import for clarity

// Helper function to get Korean label for severity
const getDamageSeverityLabel = (value: DamageSeverity): string => {
  const severity = damageSeverityConstants.find(s => s.value === value);
  return severity ? severity.label : value;
};

// Helper function to get Korean label for facility type
const getFacilityTypeLabel = (value: FacilityType): string => {
  const facility = facilityTypes.find(f => f.value === value);
  return facility ? facility.label : value;
};

export default function HomePage() {
  const [allReports, setAllReports] = useState<DamageReport[]>([]);
  const [displayedReports, setDisplayedReports] = useState<DamageReport[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isFiltering, setIsFiltering] = useState(false); // For AI filter operation
  const { toast } = useToast();

  const [currentFilters, setCurrentFilters] = useState<{
    facilityType: FacilityType | 'all';
    damageSeverity: DamageSeverity | 'all';
    acknowledgedStatus: AcknowledgedStatus;
  }>({ facilityType: 'all', damageSeverity: 'all', acknowledgedStatus: 'all' });

  const allReportsRef = useRef<DamageReport[]>(allReports);
  const currentFiltersRef = useRef(currentFilters);

  useEffect(() => {
    allReportsRef.current = allReports;
  }, [allReports]);

  useEffect(() => {
    currentFiltersRef.current = currentFilters;
  }, [currentFilters]);

  const applyClientSideFilters = useCallback((reportsToFilter: DamageReport[], filters: typeof currentFilters) => {
    return reportsToFilter.filter(report => {
      const facilityMatch = filters.facilityType === 'all' || report.facilityType === filters.facilityType;
      const severityMatch = filters.damageSeverity === 'all' || report.damageSeverity === filters.damageSeverity;
      let acknowledgedMatch = true;
      if (filters.acknowledgedStatus !== 'all') {
        acknowledgedMatch = filters.acknowledgedStatus === 'acknowledged' ? report.acknowledged : !report.acknowledged;
      }
      return facilityMatch && severityMatch && acknowledgedMatch;
    });
  }, []);

  useEffect(() => {
    // Simulate fetching initial data
    setAllReports(mockDamageReports);
    // Apply initial filters (which are 'all') to the mock data
    setDisplayedReports(applyClientSideFilters(mockDamageReports, currentFiltersRef.current));
    setIsLoading(false);
  }, [applyClientSideFilters]); // applyClientSideFilters is stable due to useCallback

  useEffect(() => {
    const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const generateNewDamageReport = (existingCount: number): DamageReport => {
      const newIdSuffix = Date.now() + Math.random().toString(36).substring(2, 5);
      const id = `report-new-${newIdSuffix}`;
      const randomFacilityType = getRandomElement(facilityTypes.map(ft => ft.value as FacilityType));
      const randomDamageSeverity = getRandomElement(damageSeverityConstants.map(ds => ds.value as DamageSeverity));
      return {
        id,
        facilityType: randomFacilityType,
        damageSeverity: randomDamageSeverity,
        imageUrl: `https://placehold.co/${600 + existingCount * 7}x${400 + existingCount * 4}.png`,
        gcsUrl: `gs://roadwatch-bucket/${id}.jpg`,
        timestamp: new Date(),
        location: `새로운 위치 ${existingCount + 100}`,
        description: `[새 보고서] ${getFacilityTypeLabel(randomFacilityType)}에 새로운 손상이 발견되었습니다. 손상 정도: ${getDamageSeverityLabel(randomDamageSeverity)}.`,
        acknowledged: false,
      };
    };

    const intervalId = setInterval(() => {
      if (allReportsRef.current.length >= 25) { // Limit total reports for demo
        // clearInterval(intervalId); // Optionally stop adding
        return;
      }

      const newReport = generateNewDamageReport(allReportsRef.current.length);
      
      const updatedAllReportsList = [newReport, ...allReportsRef.current];
      setAllReports(updatedAllReportsList);
      
      // Re-apply current client-side filters to the updated list
      setDisplayedReports(applyClientSideFilters(updatedAllReportsList, currentFiltersRef.current));

      toast({
        title: "✨ 새로운 보고서 추가됨",
        description: `ID ${newReport.id} (${getFacilityTypeLabel(newReport.facilityType)}) 보고서가 목록에 추가되었습니다.`,
        variant: "success",
      });
    }, 15000); // Add a new report every 15 seconds

    return () => clearInterval(intervalId);
  }, [applyClientSideFilters, toast]); // Stable dependencies

  const handleAcknowledge = (id: string) => {
    const updatedAllReports = allReports.map(report =>
      report.id === id ? { ...report, acknowledged: !report.acknowledged } : report
    );
    setAllReports(updatedAllReports);
    setDisplayedReports(applyClientSideFilters(updatedAllReports, currentFiltersRef.current)); // Re-apply filters
    
    const targetReport = updatedAllReports.find(r => r.id === id);
    toast({
      title: `보고서 ${targetReport?.acknowledged ? "확인됨" : "미확인됨"}`,
      description: `보고서 ID ${id} 상태가 업데이트되었습니다.`,
      variant: targetReport?.acknowledged ? "success" : "default",
    });
  };

  const handleSeverityChange = (id: string, newSeverity: DamageSeverity) => {
    const updatedAllReports = allReports.map(report =>
      report.id === id ? { ...report, damageSeverity: newSeverity } : report
    );
    setAllReports(updatedAllReports);
    setDisplayedReports(applyClientSideFilters(updatedAllReports, currentFiltersRef.current)); // Re-apply filters

    toast({
      title: "손상도 업데이트됨",
      description: `보고서 ID ${id}의 손상도가 ${getDamageSeverityLabel(newSeverity)}(으)로 변경되었습니다.`,
      variant: "default",
    });
  };
  
  const imageIdsForAI = useMemo(() => allReports.map(report => report.id), [allReports]);

  const handleFilter = async (
    facilityTypeFilter: FacilityType | 'all',
    damageSeverityFilter: DamageSeverity | 'all',
    acknowledgedStatusFilter: AcknowledgedStatus
  ) => {
    setIsFiltering(true);
    const newFilterSettings = { 
      facilityType: facilityTypeFilter, 
      damageSeverity: damageSeverityFilter, 
      acknowledgedStatus: acknowledgedStatusFilter 
    };
    setCurrentFilters(newFilterSettings);

    let reportsToProcess = [...allReports]; // Start with all current reports
    let filteredReportsByContent = reportsToProcess;

    const useAIFilter = facilityTypeFilter !== 'all' && damageSeverityFilter !== 'all';

    if (useAIFilter) {
      try {
        const result = await filterDamageImages({
          facilityType: facilityTypeFilter as FacilityType,
          damageSeverity: damageSeverityFilter as DamageSeverity,
          imageIds: imageIdsForAI, // imageIdsForAI is derived from allReports
        });

        const aiFilteredIds = new Set(result.filteredImageIds);
        filteredReportsByContent = allReports.filter(report => aiFilteredIds.has(report.id));
        
        toast({
          title: "AI 콘텐츠 필터 적용됨",
          description: `AI가 시설물 유형 및 손상도 기준으로 ${filteredReportsByContent.length}개의 보고서를 찾았습니다. 이후 확인 상태 필터가 적용됩니다.`,
          variant: "default",
        });
      } catch (error) {
        console.error("AI 필터링 오류:", error);
        toast({
          title: "AI 필터 오류",
          description: "AI 필터링 중 오류가 발생했습니다. 클라이언트 필터를 적용합니다.",
          variant: "destructive",
        });
        // Fallback to client-side filtering for content if AI fails
        filteredReportsByContent = allReports.filter(report => {
          const facilityMatch = facilityTypeFilter === 'all' || report.facilityType === facilityTypeFilter;
          const severityMatch = damageSeverityFilter === 'all' || report.damageSeverity === damageSeverityFilter;
          return facilityMatch && severityMatch;
        });
      }
    } else {
      // AI not used, apply client-side content filters (facility type and severity)
      filteredReportsByContent = allReports.filter(report => {
        const facilityMatch = facilityTypeFilter === 'all' || report.facilityType === facilityTypeFilter;
        const severityMatch = damageSeverityFilter === 'all' || report.damageSeverity === damageSeverityFilter;
        return facilityMatch && severityMatch;
      });
    }

    // Apply acknowledged status filter to the result of content filtering (AI or client-based)
    const finalFilteredReports = filteredReportsByContent.filter(report => {
      if (newFilterSettings.acknowledgedStatus === 'all') return true;
      return newFilterSettings.acknowledgedStatus === 'acknowledged' ? report.acknowledged : !report.acknowledged;
    });

    setDisplayedReports(finalFilteredReports);

    let toastMessage = `필터 조건에 맞는 ${finalFilteredReports.length}개의 보고서를 찾았습니다.`;
    if (facilityTypeFilter === 'all' && damageSeverityFilter === 'all' && acknowledgedStatusFilter === 'all') {
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
    const resetFilters = { facilityType: 'all', damageSeverity: 'all', acknowledgedStatus: 'all' } as const;
    setCurrentFilters(resetFilters);
    setDisplayedReports(applyClientSideFilters(allReports, resetFilters)); 
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
             <Card key={`skeleton-filtering-${i}`} className="flex flex-col h-full">
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
              시스템에 현재 손상 보고서가 없습니다. 새 보고서가 곧 추가될 수 있으니 잠시 후 다시 확인해주세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
