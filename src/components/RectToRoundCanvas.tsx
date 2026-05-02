"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { RectToRoundUnfold } from "@/lib/geometry/rectToRound";

interface RectToRoundCanvasProps {
  unfold: RectToRoundUnfold;
  rectLength: number;
  rectWidth: number;
  diameterSmall: number;
  height: number;
}

function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, size = 7) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 7), toY - size * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 7), toY - size * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
}

function drawDimLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label: string, color = "#ffd166", dashed = true) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  if (dashed) ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  drawArrow(ctx, mx, my, x1, y1);
  drawArrow(ctx, mx, my, x2, y2);
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(label).width + 8;
  ctx.fillStyle = "#0a0e1a";
  ctx.fillRect(mx - tw / 2, my - 9, tw, 18);
  ctx.fillStyle = color;
  ctx.fillText(label, mx, my);
  ctx.restore();
}

export default function RectToRoundCanvas({ unfold, rectLength, rectWidth, diameterSmall, height }: RectToRoundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);

  const getSnappedPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !unfold || !("basePoints" in unfold)) return null;
    const rect = canvas.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const rawY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const { basePoints, topPoints, minX, maxX, minY, maxY } = unfold;
    const W = canvas.width;
    const H = canvas.height;

    const margin = 60;
    const patternW = maxX - minX;
    const patternH = maxY - minY;
    const scale = Math.min((W - 2 * margin) / patternW, (H - 2 * margin) / patternH);

    const drawOffsetX = (W - patternW * scale) / 2 - minX * scale;
    const drawOffsetY = (H - patternH * scale) / 2 - minY * scale;

    const polygon = [];
    for (let i = 0; i < basePoints.length; i++) {
        polygon.push({ x: basePoints[i].x * scale + drawOffsetX, y: basePoints[i].y * scale + drawOffsetY });
    }
    for (let i = topPoints.length - 1; i >= 0; i--) {
        polygon.push({ x: topPoints[i].x * scale + drawOffsetX, y: topPoints[i].y * scale + drawOffsetY });
    }

    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = ((yi > rawY) !== (yj > rawY)) && (rawX < (xj - xi) * (rawY - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }

    let finalX = rawX;
    let finalY = rawY;

    if (!isInside) {
        let minDist = Infinity;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const a = polygon[j];
            const b = polygon[i];
            const atob = { x: b.x - a.x, y: b.y - a.y };
            const atop = { x: rawX - a.x, y: rawY - a.y };
            const len2 = atob.x * atob.x + atob.y * atob.y;
            let dot = atop.x * atob.x + atop.y * atob.y;
            const t = Math.min(1, Math.max(0, len2 > 0 ? dot / len2 : 0));
            const closestX = a.x + atob.x * t;
            const closestY = a.y + atob.y * t;
            const dist = Math.hypot(rawX - closestX, rawY - closestY);
            if (dist < minDist) {
                minDist = dist;
                finalX = closestX;
                finalY = closestY;
            }
        }
    }
    return { x: finalX, y: finalY };
  }, [unfold]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !unfold || !("basePoints" in unfold)) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { basePoints, topPoints, minX, maxX, minY, maxY } = unfold;
    const W = canvas.width;
    const H = canvas.height;

    const margin = 60;
    const patternW = maxX - minX;
    const patternH = maxY - minY;
    const scale = Math.min((W - 2 * margin) / patternW, (H - 2 * margin) / patternH);

    const drawOffsetX = (W - patternW * scale) / 2 - minX * scale;
    const drawOffsetY = (H - patternH * scale) / 2 - minY * scale;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "#ffffff08";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Triangulação (linhas de dobra)
    ctx.strokeStyle = "#ffffff11";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < basePoints.length; i++) {
        const bp = basePoints[i];
        const tp = topPoints[i];
        ctx.beginPath();
        ctx.moveTo(bp.x * scale + drawOffsetX, bp.y * scale + drawOffsetY);
        ctx.lineTo(tp.x * scale + drawOffsetX, tp.y * scale + drawOffsetY);
        ctx.stroke();
        if (i < basePoints.length - 1) {
            const bpNext = basePoints[i+1];
            ctx.beginPath();
            ctx.moveTo(tp.x * scale + drawOffsetX, tp.y * scale + drawOffsetY);
            ctx.lineTo(bpNext.x * scale + drawOffsetX, bpNext.y * scale + drawOffsetY);
            ctx.stroke();
        }
    }

    // Contornos
    const drawPath = (points: {x:number, y:number}[], color: string) => {
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.moveTo(points[0].x * scale + drawOffsetX, points[0].y * scale + drawOffsetY);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x * scale + drawOffsetX, points[i].y * scale + drawOffsetY);
        ctx.stroke();
    };
    drawPath(basePoints, "#e94560");
    drawPath(topPoints, "#58a6ff");

    // Laterais
    ctx.beginPath(); ctx.strokeStyle = "#06d6a0";
    ctx.moveTo(basePoints[0].x * scale + drawOffsetX, basePoints[0].y * scale + drawOffsetY);
    ctx.lineTo(topPoints[0].x * scale + drawOffsetX, topPoints[0].y * scale + drawOffsetY);
    ctx.moveTo(basePoints[basePoints.length-1].x * scale + drawOffsetX, basePoints[basePoints.length-1].y * scale + drawOffsetY);
    ctx.lineTo(topPoints[topPoints.length-1].x * scale + drawOffsetX, topPoints[topPoints.length-1].y * scale + drawOffsetY);
    ctx.stroke();

    // Cotas básicas
    ctx.fillStyle = "#8b949e"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText(`Largura da Chapa: ${patternW.toFixed(1)} mm`, W / 2, H - 25);
    ctx.fillText(`Altura da Chapa: ${patternH.toFixed(1)} mm`, W / 2, H - 10);

    // ─── MEDIÇÃO ───────────────────────────────────────────────────────────
    measurePoints.forEach((p, i) => {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 1; ctx.stroke();
    });
  
    if (measurePoints.length === 2) {
        const [p1, p2] = measurePoints;
        const distPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const distReal = distPx / scale;
        drawDimLine(ctx, p1.x, p1.y, p2.x, p2.y, `${distReal.toFixed(2)} mm`, "#ffffff", false);
    } else if (measurePoints.length === 1 && hoverPoint) {
        const p1 = measurePoints[0];
        const p2 = hoverPoint;
        const distPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const distReal = distPx / scale;
        drawDimLine(ctx, p1.x, p1.y, p2.x, p2.y, `${distReal.toFixed(2)} mm`, "#ffffff88", true);
    }

    if (hoverPoint && measurePoints.length < 2) {
        ctx.fillStyle = "#ffffff88";
        ctx.beginPath(); ctx.arc(hoverPoint.x, hoverPoint.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
    }
  }, [unfold, measurePoints, hoverPoint]);

  useEffect(() => { draw(); }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getSnappedPoint(e);
    if (!pt) return;
    if (measurePoints.length >= 2) setMeasurePoints([{ x: pt.x, y: pt.y }]);
    else setMeasurePoints([...measurePoints, { x: pt.x, y: pt.y }]);
  };

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={900}
        height={620}
        onClick={handleCanvasClick}
        onMouseMove={(e) => {
          const pt = getSnappedPoint(e);
          if (pt) setHoverPoint(pt);
        }}
        onMouseLeave={() => setHoverPoint(null)}
        onContextMenu={(e) => { e.preventDefault(); setMeasurePoints([]); }}
        style={{ width: "100%", maxWidth: 900, height: "auto", borderRadius: 8, border: "1px solid #21262d", cursor: "crosshair" }}
      />
      <div style={{ position: "absolute", top: 10, right: 10, color: "#8b949e", fontSize: "10px", pointerEvents: "none" }}>
        Botão esquerdo: Medir | Botão direito: Limpar
      </div>
    </div>
  );
}
