'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FacilityType, DamageSeverity } from '@/types';
import { facilityTypes, damageSeverities } from '@/lib/constants'; // Updated import
import { FilterIcon, RotateCcwIcon } from 'lucide-react';

interface DamageFilterProps {
  onFilter: (facilityType: FacilityType | 'all', damageSeverity: DamageSeverity | 'all') => void;
  onReset: () => void;
  isLoading: boolean;
}

export function DamageFilter({ onFilter, onReset, isLoading }: DamageFilterProps) {
  const [facilityType, setFacilityType] = useState<FacilityType | 'all'>('all');
  const [damageSeverity, setDamageSeverity] = useState<DamageSeverity | 'all'>('all');

  const handleFilter = () => {
    onFilter(facilityType, damageSeverity);
  };

  const handleReset = () => {
    setFacilityType('all');
    setDamageSeverity('all');
    onReset();
  }

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <FilterIcon className="mr-2 h-6 w-6 text-primary" />
          Filter Damage Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <Label htmlFor="facilityType" className="text-sm font-medium">Facility Type</Label>
            <Select value={facilityType} onValueChange={(value) => setFacilityType(value as FacilityType | 'all')}>
              <SelectTrigger id="facilityType" className="mt-1">
                <SelectValue placeholder="Select facility type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {facilityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="damageSeverity" className="text-sm font-medium">Damage Severity</Label>
            <Select value={damageSeverity} onValueChange={(value) => setDamageSeverity(value as DamageSeverity | 'all')}>
              <SelectTrigger id="damageSeverity" className="mt-1">
                <SelectValue placeholder="Select damage severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {damageSeverities.map(severity => (
                  <SelectItem key={severity} value={severity}>{severity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleFilter} disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? 'Filtering...' : 'Apply Filters'}
            </Button>
            <Button onClick={handleReset} variant="outline" className="w-full md:w-auto" title="Reset Filters">
              <RotateCcwIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
