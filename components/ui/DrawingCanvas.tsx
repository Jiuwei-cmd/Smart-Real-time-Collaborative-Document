import { useRef, useState, useEffect } from 'react';

export const DrawingCanvas = ({ 
  rect, 
  isEnabled, 
  color
}: { 
  rect: { left: number; top: number; width: number; height: number }; 
  isEnabled: boolean; 
  color: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(3); // 画笔宽度状态，在组件内部管理

  // 初始化 Canvas 上下文和更新颜色/宽度
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = color; // 使用传入的颜色
      ctx.lineWidth = brushSize; // 使用内部状态的画笔宽度
      ctx.lineCap = 'round';
    }
  }, [color, brushSize]); // 当颜色或宽度改变时重新设置

  const startDrawing = (e: React.MouseEvent) => {
    if (!isEnabled) return; // 只有在启用画笔模式时才能绘制
    e.stopPropagation(); // 阻止事件冒泡，防止触发截图选择
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !isEnabled) return; // 只有在启用画笔模式时才能绘制
    e.stopPropagation(); // 阻止事件冒泡
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    }
  };

  // 滚轮事件处理：调整画笔粗细
  const handleWheel = (e: React.WheelEvent) => {
    if (!isEnabled) return; // 只在画笔启用时响应
    e.preventDefault(); // 阻止页面滚动
    e.stopPropagation(); // 阻止事件冒泡
    
    // deltaY < 0 表示向上滚动，增加画笔宽度
    // deltaY > 0 表示向下滚动，减小画笔宽度
    const delta = e.deltaY < 0 ? 1 : -1;
    const newSize = Math.max(1, Math.min(20, brushSize + delta)); // 限制在 1-20 之间
    setBrushSize(newSize);
  };

  return (
    <canvas
      ref={canvasRef}
      data-drawing-canvas="true"
      width={rect.width}
      height={rect.height}
      style={{
        position: 'absolute',
        left: rect.left,
        top: rect.top,
        zIndex: 1000000, // 位于遮罩层之上,操作按钮之下
        cursor: isEnabled ? 'crosshair' : 'default',
        touchAction: 'none',
        pointerEvents: 'auto' // 确保能接收鼠标事件
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={(e) => {
        e.stopPropagation(); // 阻止事件冒泡
        setIsDrawing(false);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation(); // 阻止事件冒泡
        setIsDrawing(false);
      }}
      onWheel={handleWheel} // 滚轮事件：调整画笔粗细
    />
  );
};