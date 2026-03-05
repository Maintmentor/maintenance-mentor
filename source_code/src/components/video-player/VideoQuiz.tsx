import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle, XCircle, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface QuizQuestion {
  id: string;
  timestamp: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface VideoQuizProps {
  currentTime: number;
  videoId: string;
  isVisible: boolean;
  onAnswer: () => void;
}

export const VideoQuiz: React.FC<VideoQuizProps> = ({ 
  currentTime, 
  videoId, 
  isVisible, 
  onAnswer 
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  // Sample quiz questions
  const quizQuestions: QuizQuestion[] = [
    {
      id: '1',
      timestamp: 60,
      question: 'What should you check first when adjusting bicycle brakes?',
      options: [
        'Brake pad alignment',
        'Cable tension',
        'Brake lever position',
        'Wheel alignment'
      ],
      correctAnswer: 1,
      explanation: 'Always check cable tension first as it affects all other brake adjustments.'
    },
    {
      id: '2',
      timestamp: 150,
      question: 'How much clearance should brake pads have from the rim when not engaged?',
      options: [
        '1-2mm',
        '3-4mm',
        '5-6mm',
        '7-8mm'
      ],
      correctAnswer: 0,
      explanation: 'Brake pads should have 1-2mm clearance from the rim for optimal performance.'
    },
    {
      id: '3',
      timestamp: 220,
      question: 'What indicates that brake cables need replacement?',
      options: [
        'Slight rust on the surface',
        'Frayed or broken strands',
        'Normal wear patterns',
        'Slight stretching'
      ],
      correctAnswer: 1,
      explanation: 'Frayed or broken cable strands compromise safety and require immediate replacement.'
    }
  ];

  useEffect(() => {
    // Check if there's a quiz question at the current time
    const question = quizQuestions.find(q => 
      Math.abs(q.timestamp - currentTime) <= 1 && 
      !answeredQuestions.has(q.id)
    );
    
    if (question && question !== currentQuestion) {
      setCurrentQuestion(question);
      setSelectedAnswer('');
      setShowResult(false);
      onAnswer(); // Pause the video
    }
  }, [currentTime, answeredQuestions, currentQuestion, onAnswer]);

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedAnswer) return;

    const answerIndex = parseInt(selectedAnswer);
    const correct = answerIndex === currentQuestion.correctAnswer;
    
    setIsCorrect(correct);
    setShowResult(true);
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));
  };

  const handleContinue = () => {
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setShowResult(false);
  };

  if (!isVisible || !currentQuestion) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
      <Card className="w-96 max-w-sm mx-4">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Quiz Question
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!showResult ? (
            <>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-sm mb-2">{currentQuestion.question}</p>
              </div>

              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="text-sm cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleContinue}
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                >
                  Submit Answer
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                
                {!isCorrect && (
                  <p className="text-sm text-gray-600 mb-2">
                    The correct answer was: <strong>{currentQuestion.options[currentQuestion.correctAnswer]}</strong>
                  </p>
                )}
                
                <p className="text-sm text-gray-700">
                  {currentQuestion.explanation}
                </p>
              </div>

              {isCorrect && (
                <div className="flex items-center justify-center gap-2 text-yellow-600">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">+10 points earned!</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button size="sm" onClick={handleContinue}>
                  Continue Video
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};