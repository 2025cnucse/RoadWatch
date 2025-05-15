
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { mockDamageReports } from '@/lib/mock-data';
import type { DamageReport, FacilityType, DamageSeverity, AcknowledgedStatus, ModelType } from '@/types';
import { DamageFilter } from '@/components/damage-filter';
import { DamageReportCard } from '@/components/damage-report-card';
import { filterDamageImages } from '@/ai/flows/filter-damage-images';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle, SearchX } from 'lucide-react';
import { facilityTypes, damageSeverities as damageSeverityConstants, modelOptions } from '@/lib/constants';

const getDamageSeverityLabel = (value: DamageSeverity): string => {
  const severity = damageSeverityConstants.find(s => s.value === value);
  return severity ? severity.label : value;
};

const getFacilityTypeLabel = (value: FacilityType): string => {
  const facility = facilityTypes.find(f => f.value === value);
  return facility ? facility.label : value;
};

const getModelLabel = (value: ModelType): string => {
  const model = modelOptions.find(m => m.value === value);
  return model ? model.label : value;
};

export default function HomePage() {
  const [allReports, setAllReports] = useState<DamageReport[]>([]);
  const [displayedReports, setDisplayedReports] = useState<DamageReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const { toast } = useToast();

  const [currentFilters, setCurrentFilters] = useState<{
    facilityType: FacilityType | 'all';
    damageSeverity: DamageSeverity | 'all';
    acknowledgedStatus: AcknowledgedStatus;
    model: ModelType;
  }>({ facilityType: 'all', damageSeverity: 'all', acknowledgedStatus: 'all', model: 'YOLOv12' });

  const allReportsRef = useRef<DamageReport[]>(allReports);
  const currentFiltersRef = useRef(currentFilters);

  useEffect(() => {
    allReportsRef.current = allReports;
  }, [allReports]);

  useEffect(() => {
    currentFiltersRef.current = currentFilters;
  }, [currentFilters]);
  
  useEffect(() => {
    setAllReports(mockDamageReports);
    let initialDisplay = [...mockDamageReports];
    if (currentFiltersRef.current.model === 'YOLOv8') {
        initialDisplay = initialDisplay.filter(report => !report.isAugmented);
    }
    // Apply other initial filters (facility, severity, acknowledged - all are 'all' initially)
     initialDisplay = initialDisplay.filter(report => {
        const facilityMatch = currentFiltersRef.current.facilityType === 'all' || report.facilityType === currentFiltersRef.current.facilityType;
        const severityMatch = currentFiltersRef.current.damageSeverity === 'all' || report.damageSeverity === currentFiltersRef.current.damageSeverity;
        let acknowledgedMatch = true;
        if (currentFiltersRef.current.acknowledgedStatus !== 'all') {
            acknowledgedMatch = currentFiltersRef.current.acknowledgedStatus === 'acknowledged' ? report.acknowledged : !report.acknowledged;
        }
        return facilityMatch && severityMatch && acknowledgedMatch;
    });
    setDisplayedReports(initialDisplay);
    setIsLoading(false);
  }, []);


  // useEffect(() => {
  //   const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  //   const generateNewDamageReport = (existingCount: number): DamageReport => {
  //     const newIdSuffix = Date.now() + Math.random().toString(36).substring(2, 5);
  //     const id = `report-new-${newIdSuffix}`;
  //     const randomFacilityType = getRandomElement(facilityTypes.map(ft => ft.value as FacilityType));
  //     const randomDamageSeverity = getRandomElement(damageSeverityConstants.map(ds => ds.value as DamageSeverity));
  //     return {
  //       id,
  //       facilityType: randomFacilityType,
  //       damageSeverity: randomDamageSeverity,
  //       imageUrl: `https://placehold.co/${600 + existingCount * 7}x${400 + existingCount * 4}.png`,
  //       gcsUrl: `gs://roadwatch-bucket/${id}.jpg`,
  //       timestamp: new Date(),
  //       location: `새로운 위치 ${existingCount + 100}`,
  //       description: `[새 보고서] ${getFacilityTypeLabel(randomFacilityType)}에 새로운 손상이 발견되었습니다. 손상 정도: ${getDamageSeverityLabel(randomDamageSeverity)}.`,
  //       acknowledged: false,
  //       isAugmented: Math.random() > 0.5, // New reports can also be augmented
  //     };
  //   };

  //   const intervalId = setInterval(() => {
  //     if (allReportsRef.current.length >= 25) { 
  //       return;
  //     }

  //     const newReport = generateNewDamageReport(allReportsRef.current.length);
      
  //     const updatedAllReportsList = [newReport, ...allReportsRef.current];
  //     setAllReports(updatedAllReportsList);
      
  //     // Re-apply current client-side filters to the updated list, including model filter
  //     let currentlyDisplayed = updatedAllReportsList;
  //     if (currentFiltersRef.current.model === 'YOLOv8') {
  //         currentlyDisplayed = currentlyDisplayed.filter(r => !r.isAugmented);
  //     }
  //     currentlyDisplayed = currentlyDisplayed.filter(report => {
  //       const facilityMatch = currentFiltersRef.current.facilityType === 'all' || report.facilityType === currentFiltersRef.current.facilityType;
  //       const severityMatch = currentFiltersRef.current.damageSeverity === 'all' || report.damageSeverity === currentFiltersRef.current.damageSeverity;
  //       let acknowledgedMatch = true;
  //       if (currentFiltersRef.current.acknowledgedStatus !== 'all') {
  //           acknowledgedMatch = currentFiltersRef.current.acknowledgedStatus === 'acknowledged' ? report.acknowledged : !report.acknowledged;
  //       }
  //       return facilityMatch && severityMatch && acknowledgedMatch;
  //     });
  //     setDisplayedReports(currentlyDisplayed);

  //     toast({
  //       title: "✨ 새로운 보고서 추가됨",
  //       description: `ID ${newReport.id} (${getFacilityTypeLabel(newReport.facilityType)}) 보고서가 목록에 추가되었습니다.`,
  //       variant: "success",
  //     });
  //   }, 15000); 

  //   return () => clearInterval(intervalId);
  // }, [toast]);

  const handleAcknowledge = (id: string) => {
    const updatedAllReports = allReportsRef.current.map(report =>
      report.id === id ? { ...report, acknowledged: !report.acknowledged } : report
    );
    setAllReports(updatedAllReports);

    // Re-apply all current filters after acknowledging
    let currentlyDisplayed = [...updatedAllReports];
    if (currentFiltersRef.current.model === 'YOLOv8') {
        currentlyDisplayed = currentlyDisplayed.filter(r => !r.isAugmented);
    }
    currentlyDisplayed = currentlyDisplayed.filter(report => {
      const facilityMatch = currentFiltersRef.current.facilityType === 'all' || report.facilityType === currentFiltersRef.current.facilityType;
      const severityMatch = currentFiltersRef.current.damageSeverity === 'all' || report.damageSeverity === currentFiltersRef.current.damageSeverity;
      let acknowledgedMatch = true;
      if (currentFiltersRef.current.acknowledgedStatus !== 'all') {
          acknowledgedMatch = currentFiltersRef.current.acknowledgedStatus === 'acknowledged' ? report.acknowledged : !report.acknowledged;
      }
      return facilityMatch && severityMatch && acknowledgedMatch;
    });
    setDisplayedReports(currentlyDisplayed);
    
    const targetReport = updatedAllReports.find(r => r.id === id);
    toast({
      title: `보고서 ${targetReport?.acknowledged ? "확인됨" : "미확인됨"}`,
      description: `보고서 ID ${id} 상태가 업데이트되었습니다.`,
      variant: targetReport?.acknowledged ? "success" : "default",
    });
  };

  const handleSeverityChange = (id: string, newSeverity: DamageSeverity) => {
    const updatedAllReports = allReportsRef.current.map(report =>
      report.id === id ? { ...report, damageSeverity: newSeverity } : report
    );
    setAllReports(updatedAllReports);
    
    // Re-apply all current filters after severity change
    let currentlyDisplayed = [...updatedAllReports];
     if (currentFiltersRef.current.model === 'YOLOv8') {
        currentlyDisplayed = currentlyDisplayed.filter(r => !r.isAugmented);
    }
    currentlyDisplayed = currentlyDisplayed.filter(report => {
      const facilityMatch = currentFiltersRef.current.facilityType === 'all' || report.facilityType === currentFiltersRef.current.facilityType;
      const severityMatch = currentFiltersRef.current.damageSeverity === 'all' || report.damageSeverity === currentFiltersRef.current.damageSeverity;
      let acknowledgedMatch = true;
      if (currentFiltersRef.current.acknowledgedStatus !== 'all') {
          acknowledgedMatch = currentFiltersRef.current.acknowledgedStatus === 'acknowledged' ? report.acknowledged : !report.acknowledged;
      }
      return facilityMatch && severityMatch && acknowledgedMatch;
    });
    setDisplayedReports(currentlyDisplayed);

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
    acknowledgedStatusFilter: AcknowledgedStatus,
    modelFilter: ModelType
  ) => {
    setIsFiltering(true);
    const newFilterSettings = { 
      facilityType: facilityTypeFilter, 
      damageSeverity: damageSeverityFilter, 
      acknowledgedStatus: acknowledgedStatusFilter,
      model: modelFilter,
    };
    setCurrentFilters(newFilterSettings);

    let reportsForFurtherFiltering: DamageReport[];
    const useAIFilter = facilityTypeFilter !== 'all' && damageSeverityFilter !== 'all';

    if (useAIFilter) {
      try {
        const result = await filterDamageImages({
          facilityType: facilityTypeFilter as FacilityType,
          damageSeverity: damageSeverityFilter as DamageSeverity,
          imageIds: imageIdsForAI,
        });

        const aiFilteredIds = new Set(result.filteredImageIds);
        reportsForFurtherFiltering = allReports.filter(report => aiFilteredIds.has(report.id));
        
        toast({
          title: "AI 콘텐츠 필터 적용됨",
          description: `AI가 시설물 유형 및 손상도 기준으로 ${reportsForFurtherFiltering.length}개의 보고서를 찾았습니다. 이후 모델 및 확인 상태 필터가 적용됩니다.`,
          variant: "default",
        });
      } catch (error) {
        console.error("AI 필터링 오류:", error);
        toast({
          title: "AI 필터 오류",
          description: "AI 필터링 중 오류가 발생했습니다. 클라이언트 필터를 적용합니다.",
          variant: "destructive",
        });
        reportsForFurtherFiltering = allReports.filter(report => 
          (facilityTypeFilter === 'all' || report.facilityType === facilityTypeFilter) &&
          (damageSeverityFilter === 'all' || report.damageSeverity === damageSeverityFilter)
        );
      }
    } else {
      reportsForFurtherFiltering = allReports.filter(report => 
        (facilityTypeFilter === 'all' || report.facilityType === facilityTypeFilter) &&
        (damageSeverityFilter === 'all' || report.damageSeverity === damageSeverityFilter)
      );
    }

    // Apply model filter
    if (modelFilter === 'YOLOv8') {
      reportsForFurtherFiltering = reportsForFurtherFiltering.filter(report => !report.isAugmented);
    }
    // YOLOv12 shows all augmented/non-augmented

    // Apply acknowledged status filter
    const finalFilteredReports = reportsForFurtherFiltering.filter(report => {
      if (acknowledgedStatusFilter === 'all') return true;
      return acknowledgedStatusFilter === 'acknowledged' ? report.acknowledged : !report.acknowledged;
    });

    setDisplayedReports(finalFilteredReports);

    let toastMessage = `${getModelLabel(modelFilter)} 모델 활성. 필터 조건에 맞는 ${finalFilteredReports.length}개의 보고서를 찾았습니다.`;
    if (facilityTypeFilter === 'all' && damageSeverityFilter === 'all' && acknowledgedStatusFilter === 'all') {
      toastMessage = `${getModelLabel(modelFilter)} 모델 활성. 필터가 대부분 초기화되었습니다. 해당 모델 기준으로 보고서를 표시합니다.`;
    }
    
    toast({
      title: "필터 업데이트됨",
      description: toastMessage,
      variant: "default",
    });

    setIsFiltering(false);
  };

  const handleResetFilters = () => {
    const defaultModel: ModelType = 'YOLOv12';
    const resetSettings = {
      facilityType: 'all',
      damageSeverity: 'all',
      acknowledgedStatus: 'all',
      model: defaultModel,
    } as const;
    setCurrentFilters(resetSettings);

    let reportsToDisplay = [...allReports];
    if (defaultModel === 'YOLOv8') { // Apply default model logic
      reportsToDisplay = reportsToDisplay.filter(report => !report.isAugmented);
    }
    // Other filters (facility, severity, acknowledged) are 'all', so no further filtering.
    setDisplayedReports(reportsToDisplay);
    toast({ title: "필터 초기화됨", description: `모든 필터가 초기화되고 ${getModelLabel(defaultModel)} 모델이 선택되었습니다.`, variant: "default" });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Skeleton className="h-10 w-full" />
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

      {!isFiltering && displayedReports.length === 0 && (allReports.length > 0 || currentFilters.facilityType !== 'all' || currentFilters.damageSeverity !== 'all' || currentFilters.acknowledgedStatus !== 'all' ) && (
        <Card className="mt-8">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">보고서 없음</h2>
            <p className="text-muted-foreground">
              현재 선택된 모델 및 필터 조건에 맞는 손상 보고서가 없습니다. 모델 또는 필터 기준을 조정하거나 초기화해 보세요.
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
