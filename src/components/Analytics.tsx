import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { 
  TrendingUp, 
  Brain,
  Target,
  Zap,
  DollarSign,
  Fish,
  Activity
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { User, Farm } from '../types';

interface AnalyticsProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function Analytics({ user, selectedFarm }: AnalyticsProps) {
  const [predictionDays, setPredictionDays] = useState([30]);
  const [feedRate, setFeedRate] = useState([3.5]);
  const [temperature, setTemperature] = useState([26]);

  // Growth Prediction Data
  const growthPrediction = [
    { week: 'Week 1', actual: 120, predicted: 122 },
    { week: 'Week 2', actual: 145, predicted: 147 },
    { week: 'Week 3', actual: 175, predicted: 173 },
    { week: 'Week 4', actual: 210, predicted: 208 },
    { week: 'Week 5', actual: 245, predicted: 248 },
    { week: 'Week 6', actual: 285, predicted: 287 },
    { week: 'Week 7', predicted: 328 },
    { week: 'Week 8', predicted: 372 },
  ];

  // Profitability Analysis
  const profitabilityData = [
    { month: 'May', revenue: 38000, costs: 28500, profit: 9500 },
    { month: 'Jun', revenue: 42000, costs: 30200, profit: 11800 },
    { month: 'Jul', revenue: 45000, costs: 31800, profit: 13200 },
    { month: 'Aug', revenue: 48000, costs: 33500, profit: 14500 },
    { month: 'Sep', revenue: 51000, costs: 35100, profit: 15900 },
    { month: 'Oct', revenue: 54000, costs: 36800, profit: 17200 },
  ];

  // FCR Trends
  const fcrTrends = [
    { date: 'Sep 15', fcr: 1.42, target: 1.40 },
    { date: 'Sep 22', fcr: 1.38, target: 1.40 },
    { date: 'Sep 29', fcr: 1.35, target: 1.40 },
    { date: 'Oct 06', fcr: 1.37, target: 1.40 },
    { date: 'Oct 13', fcr: 1.35, target: 1.40 },
    { date: 'Oct 20', fcr: 1.33, target: 1.40 },
  ];

  // KPIs
  const kpis = [
    { label: 'Predicted Weight (30 days)', value: '420g', change: '+47%', trend: 'up' },
    { label: 'Forecasted FCR', value: '1.32', change: '-5%', trend: 'down' },
    { label: 'Survival Rate Prediction', value: '96.8%', change: '+1.2%', trend: 'up' },
    { label: 'Expected ROI', value: '42%', change: '+8%', trend: 'up' },
  ];

  // Scenario simulation results
  const scenarioResults = {
    currentFeed: {
      finalWeight: 420,
      fcr: 1.32,
      cost: 3250,
      profit: 14800
    },
    optimized: {
      finalWeight: 445,
      fcr: 1.28,
      cost: 3180,
      profit: 16200
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">AI Analytics & Predictions</h1>
          <p className="text-gray-600">Data-driven insights for optimal performance</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700">
          <Brain className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{kpi.value}</div>
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                kpi.trend === 'up' ? 'text-green-600' : 'text-blue-600'
              }`}>
                <TrendingUp className="w-3 h-3" />
                {kpi.change} vs target
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Growth Prediction</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="scenario">Scenario Simulation</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        {/* Growth Prediction */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Growth Forecast Model</CardTitle>
              <p className="text-xs text-gray-600">
                Predictions based on historical data, water quality, and feeding patterns
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={growthPrediction}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis label={{ value: 'Weight (g)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    name="Actual Weight"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorPredicted)" 
                    strokeDasharray="5 5"
                    name="Predicted Weight"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Model Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm">Optimal Growth Trajectory</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Current growth rate is 3% above predicted baseline. Fish are responding well to current feeding regime.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <Target className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm">Harvest Window</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Recommended harvest at 112 days (Week 16) when fish reach optimal market size of 650-700g.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm">Growth Acceleration Opportunity</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Increasing feed protein content by 2% could improve SGR by 0.3% with minimal cost increase.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Prediction Confidence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Model Accuracy</span>
                    <span className="text-sm">94.2%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: '94.2%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Data Quality</span>
                    <span className="text-sm">91%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: '91%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Historical Match</span>
                    <span className="text-sm">88.5%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600" style={{ width: '88.5%' }} />
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-600">
                    Predictions are updated every 6 hours based on real-time sensor data and growth sampling.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profitability Dashboard */}
        <TabsContent value="profitability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenue vs Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={profitabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} name="Costs" />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Profit Margin Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profitabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="profit" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Projected Annual Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">$648,000</div>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +18% vs last year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">31.8%</div>
                <p className="text-xs text-green-600 mt-1">
                  Above industry average (28%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Break-even Point</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">Day 98</div>
                <p className="text-xs text-gray-600 mt-1">
                  14 days ahead of schedule
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scenario Simulation */}
        <TabsContent value="scenario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">What-If Scenario Planning</CardTitle>
              <p className="text-xs text-gray-600">
                Simulate different conditions to optimize your operations
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-sm">
                    Prediction Timeframe: {predictionDays[0]} days
                  </label>
                  <Slider
                    value={predictionDays}
                    onValueChange={setPredictionDays}
                    min={7}
                    max={90}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm">
                    Feed Rate: {feedRate[0]}% body weight/day
                  </label>
                  <Slider
                    value={feedRate}
                    onValueChange={setFeedRate}
                    min={2}
                    max={5}
                    step={0.1}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm">
                    Water Temperature: {temperature[0]}°C
                  </label>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    min={22}
                    max={30}
                    step={0.5}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-gray-200 rounded-lg">
                  <h4 className="text-sm mb-3">Current Settings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Predicted Final Weight</span>
                      <span>{scenarioResults.currentFeed.finalWeight}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expected FCR</span>
                      <span>{scenarioResults.currentFeed.fcr}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Feed Cost</span>
                      <span>${scenarioResults.currentFeed.cost}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span>Projected Profit</span>
                      <span className="text-blue-600">${scenarioResults.currentFeed.profit}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                  <h4 className="text-sm mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Optimized Scenario
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Predicted Final Weight</span>
                      <span className="text-green-700">{scenarioResults.optimized.finalWeight}g (+{scenarioResults.optimized.finalWeight - scenarioResults.currentFeed.finalWeight}g)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expected FCR</span>
                      <span className="text-green-700">{scenarioResults.optimized.fcr} (-0.04)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Feed Cost</span>
                      <span className="text-green-700">${scenarioResults.optimized.cost} (-$70)</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-green-200">
                      <span>Projected Profit</span>
                      <span className="text-green-700">${scenarioResults.optimized.profit} (+${scenarioResults.optimized.profit - scenarioResults.currentFeed.profit})</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                Apply Optimized Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Feed Conversion Ratio Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={fcrTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[1.2, 1.5]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="fcr" stroke="#3b82f6" strokeWidth={2} name="Actual FCR" />
                  <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target FCR" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Performance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">8.7/10</div>
                <div className="flex gap-1 mt-2">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="flex-1 h-2 bg-green-600 rounded-full" />
                  ))}
                  <div className="flex-1 h-2 bg-gray-200 rounded-full" />
                </div>
                <p className="text-xs text-gray-600 mt-2">Excellent performance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Efficiency Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">92%</div>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Top 10% of farms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sustainability Index</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">A+</div>
                <p className="text-xs text-gray-600 mt-1">
                  Low environmental impact
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
