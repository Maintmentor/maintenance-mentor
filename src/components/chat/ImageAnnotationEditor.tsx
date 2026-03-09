import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowRight, Circle, Square, Type, Undo, Check, X } from 'lucide-react';

interface ImageAnnotationEditorProps {
  imageUrl: string;
  onSave: (annotatedImageUrl: string) => void;
  onCancel: () => void;
}

type Tool = 'pen' | 'arrow' | 'circle' | 'rectangle' | 'text';

export default function ImageAnnotationEditor({ imageUrl, onSave, onCancel }: ImageAnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#FF0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageData[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      saveHistory();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev, imageData]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const newHistory = [...history];
    newHistory.pop();
    setHistory(newHistory);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setStartPos(pos);
    setIsDrawing(true);

    if (tool === 'text') {
      setTextPos(pos);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'text') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getMousePos(e);

    if (tool === 'pen') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'text') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getMousePos(e);

    if (tool === 'arrow') {
      drawArrow(ctx, startPos.x, startPos.y, pos.x, pos.y);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === 'rectangle') {
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    }

    setIsDrawing(false);
    saveHistory();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const addText = () => {
    if (!textInput || !textPos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.font = '24px Arial';
    ctx.fillText(textInput, textPos.x, textPos.y);
    setTextInput('');
    setTextPos(null);
    saveHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const annotatedUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSave(annotatedUrl);
  };

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#FFFFFF'];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={tool === 'pen' ? 'default' : 'outline'} onClick={() => setTool('pen')}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="sm" variant={tool === 'arrow' ? 'default' : 'outline'} onClick={() => setTool('arrow')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button size="sm" variant={tool === 'circle' ? 'default' : 'outline'} onClick={() => setTool('circle')}>
          <Circle className="h-4 w-4" />
        </Button>
        <Button size="sm" variant={tool === 'rectangle' ? 'default' : 'outline'} onClick={() => setTool('rectangle')}>
          <Square className="h-4 w-4" />
        </Button>
        <Button size="sm" variant={tool === 'text' ? 'default' : 'outline'} onClick={() => setTool('text')}>
          <Type className="h-4 w-4" />
        </Button>
        <div className="flex gap-1">
          {colors.map(c => (
            <button key={c} onClick={() => setColor(c)} 
              className={`w-8 h-8 rounded border-2 ${color === c ? 'border-black' : 'border-gray-300'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={undo} disabled={history.length <= 1}>
          <Undo className="h-4 w-4" />
        </Button>
      </div>
      {textPos && (
        <div className="flex gap-2">
          <input value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Enter text..."
            className="flex-1 px-3 py-2 border rounded" onKeyDown={e => e.key === 'Enter' && addText()} />
          <Button size="sm" onClick={addText}>Add</Button>
        </div>
      )}
      <div className="border rounded-lg overflow-hidden bg-gray-100">
        <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp} className="max-w-full h-auto cursor-crosshair" />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          <Check className="mr-2 h-4 w-4" />Save Annotation
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />Cancel
        </Button>
      </div>
    </div>
  );
}
