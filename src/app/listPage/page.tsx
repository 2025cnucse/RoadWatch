
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { mockDamageReports } from '@/lib/mock-data';
import type { DamageReport, FacilityType, DamageSeverity, AcknowledgedStatus, ModelType } from '@/types';
import { DamageFilter } from '@/components/damage-filter';
import { DamageReportCard } from '@/components/damage-report-card';
import { ImageUploadForm } from '@/components/image-upload-form';
import { filterDamageImages } from '@/ai/flows/filter-damage-images';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle, SearchX, Download, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { facilityTypes, damageSeverities as damageSeverityConstants, modelOptions } from '@/lib/constants';
import { format } from 'date-fns';

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
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
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

    // 아래 새 보고서 생성 시뮬레이션은 주석 처리
    /*
    const intervalId = setInterval(() => {
      const newReport = generateNewDamageReport(allReportsRef.current.length + 1);
      const updatedAllReportsList = [newReport, ...allReportsRef.current];
      setAllReports(updatedAllReportsList); // allReports 상태 업데이트

      // 현재 필터를 사용하여 displayedReports 업데이트
      let currentlyDisplayed = [...updatedAllReportsList];
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
      setDisplayedReports(currentlyDisplayed); // displayedReports 상태 업데이트

      toast({
        title: "새로운 손상 보고서 감지됨 (시뮬레이션)",
        description: `ID ${newReport.id} (${getFacilityTypeLabel(newReport.facilityType)}) 보고서가 목록에 추가되었습니다.`,
        variant: "success",
      });
    }, 15000); // 15초마다 새 보고서 추가

    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 인터벌 정리
    */
  }, []);

  const handleImageUpload = (file: File, isAugmented: boolean, imageDataUri: string) => {
    const newReportId = `report-uploaded-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const defaultFacilityType = facilityTypes[0]?.value || 'Other';
    const defaultSeverity = damageSeverityConstants[0]?.value || 'Low';

    const newReport: DamageReport = {
      id: newReportId,
      facilityType: defaultFacilityType as FacilityType,
      damageSeverity: defaultSeverity as DamageSeverity,
      imageUrl: imageDataUri,
      timestamp: new Date(),
      location: `업로드된 이미지: ${file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name}`,
      description: `사용자가 업로드한 손상 보고서입니다. 증강 데이터 여부: ${isAugmented ? '예' : '아니오'}.`,
      acknowledged: false,
      isAugmented: isAugmented,
    };

    const updatedAllReportsList = [newReport, ...allReportsRef.current];
    setAllReports(updatedAllReportsList);

    let currentlyDisplayed = [...updatedAllReportsList];
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
    setIsUploadDialogOpen(false); // Close dialog on successful upload

    toast({
      title: "✅ 새 보고서 추가됨",
      description: `ID ${newReport.id} (${getFacilityTypeLabel(newReport.facilityType)}) 보고서가 목록에 추가되었습니다.`,
      variant: "success",
    });
  };


  const handleAcknowledge = (id: string) => {
    const updatedAllReports = allReportsRef.current.map(report =>
      report.id === id ? { ...report, acknowledged: !report.acknowledged } : report
    );
    setAllReports(updatedAllReports);

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

    if (modelFilter === 'YOLOv8') {
      reportsForFurtherFiltering = reportsForFurtherFiltering.filter(report => !report.isAugmented);
    }

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

    let reportsToDisplay = [...allReportsRef.current]; 
    if (defaultModel === 'YOLOv8') { 
      reportsToDisplay = reportsToDisplay.filter(report => !report.isAugmented);
    }
    setDisplayedReports(reportsToDisplay);
    toast({ title: "필터 초기화됨", description: `모든 필터가 초기화되고 ${getModelLabel(defaultModel)} 모델이 선택되었습니다.`, variant: "default" });
  };

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
      "ID", "시설물 유형", "손상 정도", "발생 시각", "위치", "설명", "확인 여부", "증강 데이터 여부"
    ];

    const csvRows = displayedReports.map(report => {
      const facilityLabel = getFacilityTypeLabel(report.facilityType);
      const severityLabel = getDamageSeverityLabel(report.damageSeverity);
      const acknowledgedLabel = report.acknowledged ? '확인됨' : '미확인';
      const augmentedLabel = report.isAugmented ? '예' : '아니오';
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
        acknowledgedLabel,
        augmentedLabel
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
      <div className="flex justify-between items-center mb-4">
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UploadCloud className="mr-2 h-4 w-4" />
              새 보고서 업로드
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UploadCloud className="mr-2 h-5 w-5 text-primary" />
                새로운 손상 보고서 업로드
              </DialogTitle>
            </DialogHeader>
            <ImageUploadForm onImageUpload={handleImageUpload} />
          </DialogContent>
        </Dialog>
        
        <Button onClick={handleDownloadCsv} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          결과 다운로드 (CSV)
        </Button>
      </div>

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
