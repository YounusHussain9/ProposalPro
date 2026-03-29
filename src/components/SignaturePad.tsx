"use client";
import { useRef, useEffect, useState, useCallback } from "react";

interface Props {
  value: string; // base64 data URL or ""
  onChange: (dataUrl: string) => void;
  label?: string;
}

export default function SignaturePad({ value, onChange, label = "Draw signature" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Restore saved signature when component mounts or value changes externally
  useEffect(() => {
    if (!value || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0);
    };
    img.src = value;
    setHasSignature(true);
  }, []); // only on mount

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    lastPos.current = getPos(e, canvas);
  }

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing || !canvasRef.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  }, [drawing]);

  function endDraw() {
    if (!drawing) return;
    setDrawing(false);
    lastPos.current = null;
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    setHasSignature(true);
    onChange(dataUrl);
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange("");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        {hasSignature && (
          <button type="button" onClick={clear} className="text-xs text-red-500 hover:text-red-700 transition-colors">
            Clear
          </button>
        )}
      </div>
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:border-indigo-400 transition-colors" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          className="w-full cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-gray-400">Draw your signature here</p>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">Use mouse or finger to sign</p>
    </div>
  );
}
