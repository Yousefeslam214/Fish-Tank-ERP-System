import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Heart,
  Search,
  AlertTriangle,
  Book,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { User, Farm } from '../types';
import { mockDiseases, mockHealthRecords, mockTanks } from '../mockData';

interface HealthLibraryProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function HealthLibrary({ user, selectedFarm }: HealthLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredDiseases = mockDiseases.filter(disease => {
    const matchesSearch = disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          disease.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeverity = severityFilter === 'all' || disease.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const healthRecords = selectedFarm
    ? mockHealthRecords.filter(hr => {
        const tank = mockTanks.find(t => t.id === hr.tankId);
        return tank?.farmId === selectedFarm.id;
      })
    : mockHealthRecords;

  const activeCases = healthRecords.filter(hr => !hr.resolved).length;
  const totalMortality = healthRecords.reduce((sum, hr) => sum + hr.mortality, 0);
  const mortalityRate = selectedFarm 
    ? ((totalMortality / mockTanks.filter(t => t.farmId === selectedFarm.id).reduce((sum, t) => sum + t.currentCount, 0)) * 100).toFixed(2)
    : '0';

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentDisease = selectedDisease 
    ? mockDiseases.find(d => d.id === selectedDisease)
    : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Health Management Library</h1>
          <p className="text-gray-600">Disease information and health records</p>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Active Cases</CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{activeCases}</div>
            <p className="text-xs text-gray-600 mt-1">Under treatment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Mortality</CardTitle>
            <TrendingUp className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalMortality}</div>
            <p className="text-xs text-gray-600 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Mortality Rate</CardTitle>
            <Heart className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{mortalityRate}%</div>
            <p className="text-xs text-green-600 mt-1">Within normal range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Health Score</CardTitle>
            <Heart className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">8.5/10</div>
            <p className="text-xs text-gray-600 mt-1">Excellent condition</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="library" className="space-y-4">
        <TabsList>
          <TabsTrigger value="library">
            <Book className="w-4 h-4 mr-2" />
            Disease Library
          </TabsTrigger>
          <TabsTrigger value="records">
            <Calendar className="w-4 h-4 mr-2" />
            Health Records
          </TabsTrigger>
        </TabsList>

        {/* Disease Library */}
        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search diseases or symptoms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={severityFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSeverityFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={severityFilter === 'critical' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSeverityFilter('critical')}
                  >
                    Critical
                  </Button>
                  <Button
                    variant={severityFilter === 'high' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSeverityFilter('high')}
                  >
                    High
                  </Button>
                  <Button
                    variant={severityFilter === 'medium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSeverityFilter('medium')}
                  >
                    Medium
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Disease List */}
                <div className="space-y-2">
                  {filteredDiseases.map(disease => (
                    <div
                      key={disease.id}
                      onClick={() => setSelectedDisease(disease.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDisease === disease.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm">{disease.name}</p>
                        <Badge className={getSeverityColor(disease.severity)} variant="outline">
                          {disease.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        {disease.symptoms.length} symptoms
                      </p>
                    </div>
                  ))}
                </div>

                {/* Disease Details */}
                <div className="lg:col-span-2">
                  {currentDisease ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{currentDisease.name}</CardTitle>
                          <Badge className={getSeverityColor(currentDisease.severity)}>
                            {currentDisease.severity} Severity
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm mb-2">Common Symptoms</h4>
                          <ul className="space-y-1">
                            {currentDisease.symptoms.map((symptom, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                {symptom}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-3 border-t">
                          <h4 className="text-sm mb-2">Treatment Protocol</h4>
                          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                            {currentDisease.treatment}
                          </p>
                        </div>

                        <div className="pt-3 border-t">
                          <h4 className="text-sm mb-2">Preventive Measures</h4>
                          <ul className="space-y-1">
                            {currentDisease.preventiveMeasures.map((measure, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                                {measure}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-3 border-t">
                          <Button className="w-full">
                            Download Treatment Guide (PDF)
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg">
                      <div className="text-center p-8">
                        <Book className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">Select a disease to view details</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Records */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Treatment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthRecords.map(record => {
                  const disease = mockDiseases.find(d => d.id === record.diseaseId);
                  const tank = mockTanks.find(t => t.id === record.tankId);
                  
                  return (
                    <div key={record.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm">{disease?.name}</p>
                            <Badge variant={record.resolved ? 'default' : 'destructive'}>
                              {record.resolved ? 'Resolved' : 'Active'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {tank?.name} • {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{record.affectedCount} affected</p>
                          <p className="text-xs text-red-600">{record.mortality} mortality</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-3 border-t">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Treatment Applied</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">
                            {record.treatmentApplied}
                          </p>
                        </div>
                        {record.notes && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Notes</p>
                            <p className="text-sm text-gray-700">
                              {record.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {healthRecords.length === 0 && (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No health records found</p>
                    <p className="text-sm text-gray-500 mt-1">Your fish are healthy!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mortality Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mortality Distribution by Tank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTanks.filter(t => !selectedFarm || t.farmId === selectedFarm.id).map(tank => {
                  const tankRecords = healthRecords.filter(hr => hr.tankId === tank.id);
                  const tankMortality = tankRecords.reduce((sum, hr) => sum + hr.mortality, 0);
                  const mortalityPercent = ((tankMortality / tank.initialCount) * 100).toFixed(2);

                  return (
                    <div key={tank.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">{tank.name}</p>
                          <p className="text-xs text-gray-600">{tank.species}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{tankMortality} fish</p>
                          <p className="text-xs text-gray-600">{mortalityPercent}%</p>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            Number(mortalityPercent) > 5 ? 'bg-red-600' :
                            Number(mortalityPercent) > 2 ? 'bg-orange-600' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(Number(mortalityPercent) * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
