import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Fish, Plus, Edit, Trash2, X, AlertCircle, Wheat } from 'lucide-react';
import { User, Farm } from '../types';
import { mockFarms } from '../mockData';

interface FishTypeManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

interface FeedingRateMatrix {
  weight_ranges: Array<{ min: number; max: number }>;
  temperatures: number[];
  rates: number[][];
}

interface MealFrequencyRule {
  maxWeight: number | null;
  mealsPerDay: number;
}

interface ProteinRequirement {
  minWeight: number | null;
  maxWeight: number | null;
  proteinPercentage: number;
}

// Mock Food Types for selection
const mockFoodTypes = [
  { id: '1', name: 'High Protein Tilapia Feed 32%' },
  { id: '2', name: 'Fingerling Starter 38%' },
  { id: '3', name: 'Grower Feed 28%' },
  { id: '4', name: 'Finisher Feed 25%' }
];

const criticalParameterOptions = ['Temperature', 'DO', 'pH', 'NH3', 'NH4', 'NO2', 'NO3', 'Salinity'];

export default function FishTypeManagement({ user, selectedFarm }: FishTypeManagementProps) {
  const currentFarm = selectedFarm || mockFarms[0];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Mock fish types with new fields
  const fishTypes = [
    {
      id: '1',
      name: 'Nile Tilapia',
      scientificName: 'Oreochromis niloticus',
      arabicName: 'البلطي النيلي',
      tempMin: 20,
      tempOptimal: 28,
      tempMax: 32,
      doMin: 3,
      doSafe: 5,
      phMin: 6.5,
      phMax: 8.5,
      nh3Safe: 0.02,
      nh3Critical: 0.05,
      no2Max: 0.2,
      fcrMin: 1.2,
      fcrMax: 1.8,
      survivalRate: 85,
      isActive: true,
      criticalParameters: ['DO', 'NH3', 'Temperature'],
      allowedFoodTypes: ['1', '3', '4']
    }
  ];

  const [formData, setFormData] = useState({
    name: '',
    scientificName: '',
    arabicName: '',
    description: '',
    tempMin: 20,
    tempOptimal: 28,
    tempMax: 32,
    doMin: 3,
    doSafe: 5,
    phMin: 6.5,
    phMax: 8.5,
    nh3Safe: 0.02,
    nh3Critical: 0.05,
    no2Max: 0.2,
    no3Max: 40,
    fcrMin: 1.2,
    fcrMax: 1.8,
    survivalRate: 85,
    targetSGR: 2.0,
    isActive: true,
    notes: '',
    criticalParameters: [] as string[],
    allowedFoodTypes: [] as string[]
  });

  // Feeding Rate Matrix State
  const [feedingRateMatrix, setFeedingRateMatrix] = useState<FeedingRateMatrix>({
    weight_ranges: [
      { min: 10, max: 15 },
      { min: 15, max: 20 },
      { min: 20, max: 30 }
    ],
    temperatures: [18, 23, 26, 30],
    rates: [
      [2.0, 3.0, 4.25, 4.5],
      [2.0, 2.75, 4.0, 4.25],
      [1.8, 2.5, 3.75, 4.0]
    ]
  });

  // Meal Frequency Rules State
  const [mealFrequencyRules, setMealFrequencyRules] = useState<MealFrequencyRule[]>([
    { maxWeight: 5, mealsPerDay: 6 },
    { maxWeight: 10, mealsPerDay: 5 },
    { maxWeight: 25, mealsPerDay: 4 },
    { maxWeight: 50, mealsPerDay: 3 },
    { maxWeight: null, mealsPerDay: 2 }
  ]);

  // Protein Requirements State
  const [proteinRequirements, setProteinRequirements] = useState<ProteinRequirement[]>([
    { minWeight: 0, maxWeight: 10, proteinPercentage: 35 },
    { minWeight: 10, maxWeight: 50, proteinPercentage: 32 },
    { minWeight: 50, maxWeight: 200, proteinPercentage: 30 },
    { minWeight: 200, maxWeight: null, proteinPercentage: 28 }
  ]);

  const handleEdit = (fishType: any) => {
    setFormData(fishType);
    setEditingId(fishType.id);
    setShowCreateModal(true);
  };

  const handleSave = () => {
    console.log('Saving fish type:', {
      ...formData,
      feedingRateMatrix,
      mealFrequencyRules,
      proteinRequirements
    });
    setShowCreateModal(false);
    setEditingId(null);
  };

  const toggleCriticalParameter = (param: string) => {
    const current = formData.criticalParameters;
    if (current.includes(param)) {
      setFormData({
        ...formData,
        criticalParameters: current.filter(p => p !== param)
      });
    } else {
      setFormData({
        ...formData,
        criticalParameters: [...current, param]
      });
    }
  };

  const toggleAllowedFoodType = (foodTypeId: string) => {
    const current = formData.allowedFoodTypes;
    if (current.includes(foodTypeId)) {
      setFormData({
        ...formData,
        allowedFoodTypes: current.filter(id => id !== foodTypeId)
      });
    } else {
      setFormData({
        ...formData,
        allowedFoodTypes: [...current, foodTypeId]
      });
    }
  };

  // Feeding Rate Matrix Handlers
  const addWeightRange = () => {
    setFeedingRateMatrix({
      ...feedingRateMatrix,
      weight_ranges: [...feedingRateMatrix.weight_ranges, { min: 0, max: 0 }],
      rates: [...feedingRateMatrix.rates, new Array(feedingRateMatrix.temperatures.length).fill(0)]
    });
  };

  const removeWeightRange = (index: number) => {
    setFeedingRateMatrix({
      ...feedingRateMatrix,
      weight_ranges: feedingRateMatrix.weight_ranges.filter((_, i) => i !== index),
      rates: feedingRateMatrix.rates.filter((_, i) => i !== index)
    });
  };

  const updateRate = (weightIndex: number, tempIndex: number, value: number) => {
    const newRates = [...feedingRateMatrix.rates];
    newRates[weightIndex][tempIndex] = value;
    setFeedingRateMatrix({ ...feedingRateMatrix, rates: newRates });
  };

  // Meal Frequency Handlers
  const addMealFrequencyRule = () => {
    setMealFrequencyRules([...mealFrequencyRules, { maxWeight: 0, mealsPerDay: 3 }]);
  };

  const removeMealFrequencyRule = (index: number) => {
    setMealFrequencyRules(mealFrequencyRules.filter((_, i) => i !== index));
  };

  const updateMealFrequencyRule = (index: number, field: 'maxWeight' | 'mealsPerDay', value: number | null) => {
    const newRules = [...mealFrequencyRules];
    newRules[index][field] = value as any;
    setMealFrequencyRules(newRules);
  };

  // Protein Requirements Handlers
  const addProteinRequirement = () => {
    setProteinRequirements([...proteinRequirements, { minWeight: 0, maxWeight: 0, proteinPercentage: 30 }]);
  };

  const removeProteinRequirement = (index: number) => {
    setProteinRequirements(proteinRequirements.filter((_, i) => i !== index));
  };

  const updateProteinRequirement = (index: number, field: keyof ProteinRequirement, value: number | null) => {
    const newRequirements = [...proteinRequirements];
    newRequirements[index][field] = value as any;
    setProteinRequirements(newRequirements);
  };

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-6 h-6" />
            <span className="text-xl font-semibold">Fish Type Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentFarm.name}</span>
            <div className="w-10 h-10 rounded-full bg-[#088395] flex items-center justify-center font-semibold">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Fish Species Database</h2>
            <p className="text-gray-600 text-sm mt-1">Manage fish species with feeding, protein requirements and food types</p>
          </div>
          <Button 
            className="bg-[#088395] hover:bg-[#0A4D68]"
            onClick={() => {
              setEditingId(null);
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Fish Type
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fishTypes.map((fishType) => (
            <Card key={fishType.id} className="bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{fishType.name}</CardTitle>
                      {fishType.isActive && (
                        <Badge className="bg-[#10B981] text-white text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 italic mt-1">{fishType.scientificName}</p>
                    {fishType.arabicName && (
                      <p className="text-sm text-gray-500 mt-1">{fishType.arabicName}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#E0F4F5] flex items-center justify-center">
                    <Fish className="w-6 h-6 text-[#088395]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Critical Parameters */}
                {fishType.criticalParameters && fishType.criticalParameters.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Critical Parameters</h4>
                    <div className="flex flex-wrap gap-1">
                      {fishType.criticalParameters.map(param => (
                        <Badge key={param} variant="outline" className="text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allowed Food Types */}
                {fishType.allowedFoodTypes && fishType.allowedFoodTypes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Allowed Food Types</h4>
                    <div className="space-y-1 text-xs">
                      {fishType.allowedFoodTypes.map(id => {
                        const foodType = mockFoodTypes.find(f => f.id === id);
                        return foodType ? (
                          <div key={id} className="flex items-center gap-1 text-gray-600">
                            <Wheat className="w-3 h-3" />
                            <span>{foodType.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEdit(fishType)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}\n        </div>
      </div>

      {/* Create/Edit Modal with Tabs */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingId ? 'Edit Fish Type' : 'Create New Fish Type'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-12">
              <TabsTrigger value="basic" className="text-base">Basic Info</TabsTrigger>
              <TabsTrigger value="water" className="text-base">Water Quality</TabsTrigger>
              <TabsTrigger value="feeding" className="text-base">Feeding Rates</TabsTrigger>
              <TabsTrigger value="protein" className="text-base">Protein & Meals</TabsTrigger>
              <TabsTrigger value="food" className="text-base">Food Types</TabsTrigger>
            </TabsList>

            {/* Tab 1: Basic Information */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input 
                    placeholder="e.g., Nile Tilapia"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Scientific Name *</Label>
                  <Input 
                    placeholder="e.g., Oreochromis niloticus"
                    value={formData.scientificName}
                    onChange={(e) => setFormData({...formData, scientificName: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Arabic Name</Label>
                  <Input 
                    placeholder="e.g., البلطي النيلي"
                    value={formData.arabicName}
                    onChange={(e) => setFormData({...formData, arabicName: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Target SGR (%/day)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={formData.targetSGR}
                    onChange={(e) => setFormData({...formData, targetSGR: parseFloat(e.target.value)})}                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  placeholder="Optional description..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              {/* Critical Parameters Selection */}
              <div>
                <Label className="mb-3 block">Critical Parameters *</Label>
                <p className="text-xs text-gray-600 mb-3">Select water quality parameters that are critical for this species</p>
                <div className="grid grid-cols-4 gap-2">
                  {criticalParameterOptions.map(param => (
                    <div 
                      key={param}
                      onClick={() => toggleCriticalParameter(param)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.criticalParameters.includes(param)
                          ? 'border-[#088395] bg-[#E0F4F5]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{param}</span>
                        {formData.criticalParameters.includes(param) && (
                          <div className="w-5 h-5 rounded-full bg-[#088395] flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Water Quality Parameters */}
            <TabsContent value="water" className="space-y-4">
              <h3 className="font-semibold text-gray-900">Water Quality Parameters</h3>
              
              {/* Temperature */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Temperature (°C)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Minimum</Label>
                    <Input 
                      type="number" 
                      value={formData.tempMin}
                      onChange={(e) => setFormData({...formData, tempMin: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Optimal</Label>
                    <Input 
                      type="number" 
                      value={formData.tempOptimal}
                      onChange={(e) => setFormData({...formData, tempOptimal: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Maximum</Label>
                    <Input 
                      type="number" 
                      value={formData.tempMax}
                      onChange={(e) => setFormData({...formData, tempMax: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              {/* DO & pH */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Dissolved Oxygen (mg/L)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">Minimum</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={formData.doMin}
                        onChange={(e) => setFormData({...formData, doMin: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Safe</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={formData.doSafe}
                        onChange={(e) => setFormData({...formData, doSafe: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">pH Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">Minimum</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={formData.phMin}
                        onChange={(e) => setFormData({...formData, phMin: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Maximum</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={formData.phMax}
                        onChange={(e) => setFormData({...formData, phMax: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ammonia & Nitrite */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>NH₃ Safe (mg/L)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={formData.nh3Safe}
                    onChange={(e) => setFormData({...formData, nh3Safe: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>NH₃ Critical (mg/L)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={formData.nh3Critical}
                    onChange={(e) => setFormData({...formData, nh3Critical: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>NO₂ Max (mg/L)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={formData.no2Max}
                    onChange={(e) => setFormData({...formData, no2Max: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              {/* Performance Benchmarks */}
              <div>
                <h3 className="font-semibold text-gray-900 mt-6 mb-3">Performance Benchmarks</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>FCR Minimum (Best)</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={formData.fcrMin}
                      onChange={(e) => setFormData({...formData, fcrMin: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>FCR Maximum (Acceptable)</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={formData.fcrMax}
                      onChange={(e) => setFormData({...formData, fcrMax: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Expected Survival Rate (%)</Label>
                    <Input 
                      type="number" 
                      value={formData.survivalRate}
                      onChange={(e) => setFormData({...formData, survivalRate: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Feeding Rate Matrix */}
            <TabsContent value="feeding" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Feeding Rate Matrix</h3>
                  <p className="text-xs text-gray-600 mt-1">Define feeding rates (% of body weight) based on fish weight and water temperature</p>
                </div>
                <Button size="sm" onClick={addWeightRange}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Weight Range
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 border text-left text-sm font-medium">Weight Range (g)</th>
                      {feedingRateMatrix.temperatures.map((temp, idx) => (
                        <th key={idx} className="p-2 border text-center text-sm font-medium">{temp}°C</th>
                      ))}
                      <th className="p-2 border text-center text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedingRateMatrix.weight_ranges.map((range, weightIdx) => (
                      <tr key={weightIdx}>
                        <td className="p-2 border">
                          <div className="flex items-center gap-1">
                            <Input 
                              type="number"
                              placeholder="Min"
                              value={range.min}
                              onChange={(e) => {
                                const newRanges = [...feedingRateMatrix.weight_ranges];
                                newRanges[weightIdx].min = parseFloat(e.target.value) || 0;
                                setFeedingRateMatrix({...feedingRateMatrix, weight_ranges: newRanges});
                              }}
                              className="w-20 text-xs"
                            />
                            <span>-</span>
                            <Input 
                              type="number"
                              placeholder="Max"
                              value={range.max}
                              onChange={(e) => {
                                const newRanges = [...feedingRateMatrix.weight_ranges];
                                newRanges[weightIdx].max = parseFloat(e.target.value) || 0;
                                setFeedingRateMatrix({...feedingRateMatrix, weight_ranges: newRanges});
                              }}
                              className="w-20 text-xs"
                            />
                          </div>
                        </td>
                        {feedingRateMatrix.temperatures.map((_, tempIdx) => (
                          <td key={tempIdx} className="p-2 border">
                            <Input 
                              type="number"
                              step="0.1"
                              value={feedingRateMatrix.rates[weightIdx]?.[tempIdx] || 0}
                              onChange={(e) => updateRate(weightIdx, tempIdx, parseFloat(e.target.value) || 0)}
                              className="w-20 text-xs"
                            />
                          </td>
                        ))}
                        <td className="p-2 border text-center">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => removeWeightRange(weightIdx)}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-gray-700">
                      <p className="font-medium mb-1">How to use:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Enter fish weight ranges in grams (e.g., 10-15g, 15-20g)</li>
                        <li>Set feeding rates as percentage of body weight for each temperature</li>
                        <li>System will automatically calculate daily feed amount based on current conditions</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Protein Requirements & Meal Frequency */}
            <TabsContent value="protein" className="space-y-6">
              {/* Protein Requirements */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Protein Requirements</h3>
                    <p className="text-xs text-gray-600 mt-1">Define protein percentage requirements based on fish weight</p>
                  </div>
                  <Button size="sm" onClick={addProteinRequirement}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-2">
                  {proteinRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Min Weight (g)</Label>
                          <Input 
                            type="number"
                            placeholder="e.g., 0"
                            value={req.minWeight ?? ''}
                            onChange={(e) => updateProteinRequirement(idx, 'minWeight', e.target.value ? parseFloat(e.target.value) : null)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Weight (g)</Label>
                          <Input 
                            type="number"
                            placeholder="null = no limit"
                            value={req.maxWeight ?? ''}
                            onChange={(e) => updateProteinRequirement(idx, 'maxWeight', e.target.value ? parseFloat(e.target.value) : null)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Protein %</Label>
                          <Input 
                            type="number"
                            placeholder="e.g., 32"
                            value={req.proteinPercentage}
                            onChange={(e) => updateProteinRequirement(idx, 'proteinPercentage', parseFloat(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => removeProteinRequirement(idx)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meal Frequency Rules */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Meal Frequency Rules</h3>
                    <p className="text-xs text-gray-600 mt-1">Define number of meals per day based on fish weight</p>
                  </div>
                  <Button size="sm" onClick={addMealFrequencyRule}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-2">
                  {mealFrequencyRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Max Weight (g)</Label>
                          <Input 
                            type="number"
                            placeholder="null = any weight above"
                            value={rule.maxWeight ?? ''}
                            onChange={(e) => updateMealFrequencyRule(idx, 'maxWeight', e.target.value ? parseFloat(e.target.value) : null)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Meals Per Day</Label>
                          <Input 
                            type="number"
                            placeholder="e.g., 4"
                            value={rule.mealsPerDay}
                            onChange={(e) => updateMealFrequencyRule(idx, 'mealsPerDay', parseFloat(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => removeMealFrequencyRule(idx)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Tab 5: Allowed Food Types */}
            <TabsContent value="food" className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Allowed Food Types</h3>
                <p className="text-xs text-gray-600 mb-4">Select which food types are suitable for this fish species</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {mockFoodTypes.map(foodType => (
                  <div 
                    key={foodType.id}
                    onClick={() => toggleAllowedFoodType(foodType.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.allowedFoodTypes.includes(foodType.id)
                        ? 'border-[#088395] bg-[#E0F4F5]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wheat className="w-5 h-5 text-[#088395]" />
                        <div>
                          <p className="font-medium text-sm">{foodType.name}</p>
                        </div>
                      </div>
                      {formData.allowedFoodTypes.includes(foodType.id) && (
                        <div className="w-6 h-6 rounded-full bg-[#088395] flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="text-xs text-gray-700">
                      <p className="font-medium mb-1">Note:</p>
                      <p>Only selected food types will be available when creating feeding schedules for this fish species. Make sure to select all appropriate options.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status & Notes */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Active Status</Label>
                    <p className="text-xs text-gray-600">Enable this fish type for use in the system</p>
                  </div>
                  <Switch 
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                </div>

                <div>
                  <Label>Additional Notes</Label>
                  <Textarea 
                    placeholder="Additional notes or special requirements..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons (visible on all tabs) */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
              onClick={handleSave}
            >
              {editingId ? 'Update Fish Type' : 'Create Fish Type'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}