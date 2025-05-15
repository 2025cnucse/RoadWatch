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
      title: `Report ${targetReport?.acknowledged ? "Unacknowledged" : "Acknowledged"}`,
      description: `Report ID ${id} status has been updated.`,
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
      title: "Severity Updated",
      description: `Report ID ${id} severity changed to ${newSeverity}.`,
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
          facilityType: facilityType as FacilityType,
          damageSeverity: damageSeverity as DamageSeverity,
          imageIds: imageIdsForAI,
        });

        const aiFilteredIds = new Set(result.filteredImageIds);
        reportsToFilter = allReports.filter(report => aiFilteredIds.has(report.id));
        
        toast({
          title: "AI Content Filter Applied",
          description: `AI found ${reportsToFilter.length} reports based on facility and severity. Acknowledged status filter applied subsequently.`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error filtering images with AI:", error);
        toast({
          title: "AI Filter Error",
          description: "Could not filter images using AI. Applying other filters on all reports.",
          variant: "destructive",
        });
        reportsToFilter = allReports; // Fallback to all reports if AI fails
      }
    } else {
      // Apply client-side facility type and severity filters if AI is not used
      reportsToFilter = reportsToFilter.filter(report => {
        const facilityMatch = facilityType === 'all' || report.facilityType === facilityType;
        const severityMatch = damageSeverity === 'all' || report.damageSeverity === damageSeverity;
        return facilityMatch && severityMatch;
      });
    }

    // Apply acknowledged status filter (always client-side on the current set of reportsToFilter)
    const finalFilteredReports = reportsToFilter.filter(report => {
      if (acknowledgedStatus === 'all') return true;
      return acknowledgedStatus === 'acknowledged' ? report.acknowledged : !report.acknowledged;
    });

    setDisplayedReports(finalFilteredReports);

    let toastMessage = `Found ${finalFilteredReports.length} reports matching your criteria.`;
    if (facilityType === 'all' && damageSeverity === 'all' && acknowledgedStatus === 'all') {
      toastMessage = "Filters Cleared. Showing all reports.";
    }
    
    toast({
      title: "Filters Updated",
      description: toastMessage,
      variant: "default",
    });

    setIsFiltering(false);
  };

  const handleResetFilters = () => {
    // This will trigger handleFilter with 'all' for all parameters via the DamageFilter component's reset
    // so no need to directly call setDisplayedReports(allReports) here if DamageFilter calls onFilter on reset.
    // However, to be safe and ensure immediate UI update if DamageFilter's onReset doesn't call onFilter immediately:
    setDisplayedReports(allReports); 
    toast({ title: "Filters Reset", description: "Showing all reports.", variant: "default" });
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

      {!isFiltering && displayedReports.length === 0 && (allReports.length > 0 || isFiltering) && ( // Show only if there were reports to filter or if filtering is active
        <Card className="mt-8">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">No Reports Found</h2>
            <p className="text-muted-foreground">
              There are no damage reports matching your current filters. Try adjusting your filter criteria or resetting them.
            </p>
          </CardContent>
        </Card>
      )}
      
      {!isFiltering && allReports.length === 0 && !isLoading && (
         <Card className="mt-8">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <AlertTriangle className="h-16 w-16 text-warning mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">No Damage Reports Available</h2>
            <p className="text-muted-foreground">
              The system currently has no damage reports. Check back later or ensure data is being processed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
