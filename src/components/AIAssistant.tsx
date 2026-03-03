import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Bot, 
  Send,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Brain,
  MessageCircle
} from 'lucide-react';
import { User, ChatMessage } from '../types';

interface AIAssistantProps {
  user: User;
}

export default function AIAssistant({ user }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your FishFarm360 AI Assistant. I can help you with feeding schedules, water quality issues, disease detection, and general aquaculture advice. How can I assist you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [diseaseImage, setDiseaseImage] = useState<string | null>(null);
  const [diseaseAnalysis, setDiseaseAnalysis] = useState<any>(null);

  const quickQuestions = [
    "What's the optimal feeding schedule for tilapia?",
    "How do I improve water quality?",
    "What are signs of disease in fish?",
    "How to calculate FCR?",
    "Best practices for tank maintenance"
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    // Simulate AI response
    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getAIResponse(inputMessage),
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage, aiResponse]);
    setInputMessage('');
  };

  const getAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('feeding') || lowerQuestion.includes('feed')) {
      return "For tilapia, I recommend feeding 3-4 times daily at 3-5% of body weight. The exact amount depends on fish size:\n\n• Fingerlings (1-10g): 5-10% body weight\n• Juveniles (10-50g): 4-6% body weight\n• Growers (50-200g): 3-4% body weight\n• Market size (>200g): 2-3% body weight\n\nFeed during cooler parts of the day (early morning and evening) for better appetite and oxygen levels.";
    }

    if (lowerQuestion.includes('water quality') || lowerQuestion.includes('oxygen')) {
      return "To improve water quality:\n\n1. **Increase aeration** - Use aerators or water exchange\n2. **Regular water changes** - 10-15% weekly\n3. **Monitor ammonia/nitrite** - Keep below 0.1 mg/L\n4. **Control feeding** - Remove uneaten feed after 30 minutes\n5. **Add beneficial bacteria** - Helps break down waste\n6. **Maintain pH** - Keep between 6.5-8.5\n\nYour current tank shows DO at 6.5 mg/L which is good. Aim to keep it above 5 mg/L.";
    }

    if (lowerQuestion.includes('disease') || lowerQuestion.includes('sick')) {
      return "Common disease signs to watch for:\n\n**Behavioral:**\n• Loss of appetite\n• Lethargy or gasping at surface\n• Erratic swimming\n• Rubbing against surfaces\n\n**Physical:**\n• White spots or patches\n• Frayed fins\n• Cloudy eyes\n• Swollen abdomen\n• Red sores or ulcers\n\nIf you notice these signs, isolate affected fish and use the Disease Detection feature to upload images for AI analysis.";
    }

    if (lowerQuestion.includes('fcr') || lowerQuestion.includes('conversion')) {
      return "Feed Conversion Ratio (FCR) calculation:\n\n**FCR = Total Feed Given / Weight Gained**\n\nExample:\n• Feed used: 100 kg\n• Weight gain: 75 kg (from 25kg to 100kg)\n• FCR = 100/75 = 1.33\n\nLower FCR is better (more efficient). Target FCR for tilapia: 1.2-1.5\n\nYour current tanks show FCR of 1.35, which is excellent!";
    }

    if (lowerQuestion.includes('maintenance') || lowerQuestion.includes('clean')) {
      return "Tank maintenance schedule:\n\n**Daily:**\n• Remove dead fish and debris\n• Check water quality parameters\n• Inspect equipment\n\n**Weekly:**\n• Clean filters\n• Test ammonia, nitrite, nitrate\n• 10-15% water exchange\n\n**Monthly:**\n• Deep clean tanks and equipment\n• Calibrate sensors\n• Inspect pumps and aerators\n\n**Quarterly:**\n• Full system check\n• Replace worn parts\n• Review growth performance";
    }

    return "That's a great question! Based on your farm data, I'd recommend:\n\n1. Continue monitoring your current metrics closely\n2. Maintain consistent feeding schedules\n3. Keep water quality parameters within optimal ranges\n4. Conduct bi-weekly growth sampling\n\nWould you like more specific advice on any particular aspect of your operation?";
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDiseaseImage(reader.result as string);
        // Simulate AI analysis
        setTimeout(() => {
          setDiseaseAnalysis({
            disease: 'Columnaris Disease',
            confidence: 87,
            severity: 'High',
            symptoms: [
              'White/gray patches on body',
              'Frayed fins visible',
              'Possible gill necrosis'
            ],
            treatment: 'Oxytetracycline treatment recommended. Isolate affected fish. Improve water quality immediately.',
            preventive: [
              'Maintain optimal water quality',
              'Reduce stocking density if needed',
              'Regular water changes',
              'Quarantine new fish'
            ]
          });
        }, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">AI Assistant</h1>
          <p className="text-gray-600">Get instant help and disease detection</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700">
          <Brain className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat Assistant
          </TabsTrigger>
          <TabsTrigger value="disease">
            <Camera className="w-4 h-4 mr-2" />
            Disease Detection
          </TabsTrigger>
        </TabsList>

        {/* Chat Assistant */}
        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chat Area */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Chat with AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Messages */}
                <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-purple-600">AI Assistant</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything about fish farming..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    <span className="text-xs">{question}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* AI Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm mb-1">24/7 Support</h4>
                    <p className="text-xs text-gray-600">
                      Get instant answers to your aquaculture questions anytime
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Brain className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm mb-1">Smart Recommendations</h4>
                    <p className="text-xs text-gray-600">
                      Personalized advice based on your farm's data and history
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm mb-1">Best Practices</h4>
                    <p className="text-xs text-gray-600">
                      Learn from industry experts and successful farmers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Disease Detection */}
        <TabsContent value="disease" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upload Fish Image</CardTitle>
                <p className="text-xs text-gray-600">
                  AI will analyze the image and identify potential diseases
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {diseaseImage ? (
                      <img
                        src={diseaseImage}
                        alt="Uploaded fish"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="space-y-3">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-sm">Click to upload or drag image here</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Supports JPG, PNG (max 10MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {diseaseImage && !diseaseAnalysis && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Analyzing image...</p>
                  </div>
                )}

                {diseaseImage && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setDiseaseImage(null);
                      setDiseaseAnalysis(null);
                    }}
                  >
                    Upload Different Image
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {diseaseAnalysis ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm">{diseaseAnalysis.disease}</h4>
                        <Badge variant="destructive">{diseaseAnalysis.severity} Risk</Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600">Confidence</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-600"
                                style={{ width: `${diseaseAnalysis.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm">{diseaseAnalysis.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm mb-2">Detected Symptoms</h4>
                      <ul className="space-y-1">
                        {diseaseAnalysis.symptoms.map((symptom: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                            {symptom}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm mb-2">Recommended Treatment</h4>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                        {diseaseAnalysis.treatment}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm mb-2">Preventive Measures</h4>
                      <ul className="space-y-1">
                        {diseaseAnalysis.preventive.map((measure: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                            {measure}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <Button className="w-full">
                        Save to Health Records
                      </Button>
                      <Button variant="outline" className="w-full">
                        Consult Veterinarian
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm">Upload an image to start analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How Disease Detection Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-sm mb-1">1. Upload Image</h4>
                  <p className="text-xs text-gray-600">
                    Take a clear photo of affected fish
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="text-sm mb-1">2. AI Analysis</h4>
                  <p className="text-xs text-gray-600">
                    Computer vision identifies symptoms
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="text-sm mb-1">3. Get Results</h4>
                  <p className="text-xs text-gray-600">
                    Receive diagnosis and treatment plan
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="text-sm mb-1">4. Take Action</h4>
                  <p className="text-xs text-gray-600">
                    Implement recommended treatments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
