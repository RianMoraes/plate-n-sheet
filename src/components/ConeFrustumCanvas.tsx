"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ConeFrustumUnfold } from "@/lib/geometry/coneFrustum";

interface ConeFrustumCanvasProps {
  unfold: ConeFrustumUnfold;
  diameterBig: number;
  diameterSmall: number;
  height: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS DE DESENHO
 ───────────────────────────────────────────────────────────────────────────── */

function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, size = 7) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 7), toY - size * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 7), toY - size * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
}

function drawDimLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label: string, offsetX = 0, offsetY = 0, color = "#ffd166", dashed = true) {
  const mx = (x1 + x2) / 2 + offsetX;
  const my = (y1 + y2) / 2 + offsetY;
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

function drawAngleDim(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, startAngle: number, endAngle: number, label: string, color = "#a78bfa") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.stroke();
  ctx.setLineDash([]);
  const midAngle = (startAngle + endAngle) / 2;
  const tx = cx + (radius + 18) * Math.cos(midAngle);
  const ty = cy + (radius + 18) * Math.sin(midAngle);
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(label).width + 8;
  ctx.fillStyle = "#0a0e1a";
  ctx.fillRect(tx - tw / 2, ty - 9, tw, 18);
  ctx.fillStyle = color;
  ctx.fillText(label, tx, ty);
  ctx.restore();
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
 ───────────────────────────────────────────────────────────────────────────── */

export default function ConeFrustumCanvas({ unfold, diameterBig, diameterSmall, height }: ConeFrustumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);
  const [currentScale, setCurrentScale] = useState(1);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);

  const getSnappedPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const rawY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const W = canvas.width;
    const H = canvas.height;
    const { L, l, thetaRad } = unfold;
    const marginTop = 50, marginBottom = 80, marginSide = 90, labelPadTop = 50;
    const availW = W - 2 * marginSide;
    const availH = H - marginTop - marginBottom - labelPadTop;
    const sectorWidth = thetaRad < Math.PI ? 2 * L * Math.sin(thetaRad / 2) : 2 * L;
    const scale = Math.min(availW / sectorWidth, availH / L) * 0.90;
    const ox = W / 2;
    const oy = marginTop + labelPadTop + L * scale;

    const dx = rawX - ox;
    const dy = rawY - oy;
    let dist = Math.hypot(dx, dy);
    let angle = Math.atan2(dy, dx);
    let angleDiff = angle - (-Math.PI / 2);
    
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    const isInsideRadius = dist >= l * scale && dist <= L * scale;
    const isInsideAngle = Math.abs(angleDiff) <= thetaRad / 2;

    let finalX = rawX;
    let finalY = rawY;

    if (!isInsideRadius || !isInsideAngle) {
        let clampedDist = Math.max(l * scale, Math.min(L * scale, dist));
        let clampedAngleDiff = Math.max(-thetaRad / 2, Math.min(thetaRad / 2, angleDiff));
        let clampedAngle = -Math.PI / 2 + clampedAngleDiff;
        finalX = ox + clampedDist * Math.cos(clampedAngle);
        finalY = oy + clampedDist * Math.sin(clampedAngle);
    }
    return { x: finalX, y: finalY };
  }, [unfold]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { L, l, thetaRad } = unfold;
    const W = canvas.width;
    const H = canvas.height;

    const marginTop = 50, marginBottom = 80, marginSide = 90, labelPadTop = 50;
    const availW = W - 2 * marginSide;
    const availH = H - marginTop - marginBottom - labelPadTop;
    const sectorWidth = thetaRad < Math.PI ? 2 * L * Math.sin(thetaRad / 2) : 2 * L;
    const scale = Math.min(availW / sectorWidth, availH / L) * 0.90;
    setCurrentScale(scale);

    const ox = W / 2;
    const oy = marginTop + labelPadTop + L * scale;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "#ffffff08";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const startAngle = -Math.PI / 2 - thetaRad / 2;
    const endAngle = -Math.PI / 2 + thetaRad / 2;

    // Setor
    ctx.beginPath();
    ctx.arc(ox, oy, L * scale, startAngle, endAngle, false);
    ctx.arc(ox, oy, l * scale, endAngle, startAngle, true);
    ctx.closePath();
    const grad = ctx.createRadialGradient(ox, oy, l * scale, ox, oy, L * scale);
    grad.addColorStop(0, "#0f2040"); grad.addColorStop(0.5, "#0d2a50"); grad.addColorStop(1, "#0a1e38");
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = "#e94560"; ctx.lineWidth = 2; ctx.stroke();

    // Linhas radiais
    ctx.strokeStyle = "#e9456044"; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + L * scale * Math.cos(startAngle), oy + L * scale * Math.sin(startAngle)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + L * scale * Math.cos(endAngle), oy + L * scale * Math.sin(endAngle)); ctx.stroke();
    ctx.setLineDash([]);

    // Vértice
    ctx.fillStyle = "#e94560"; ctx.beginPath(); ctx.arc(ox, oy, 4, 0, Math.PI * 2); ctx.fill();

    // Cotas
    const drawLabel = (lx: number, ly: number, label: string, color: string) => {
        ctx.save(); ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const tw = ctx.measureText(label).width + 10; ctx.fillStyle = "#0a0e1a"; ctx.fillRect(lx - tw / 2, ly - 10, tw, 20);
        ctx.fillStyle = color; ctx.fillText(label, lx, ly); ctx.restore();
    };
    drawLabel(ox, oy - L * scale - 28, `⌀ ${diameterBig} mm`, "#e94560");
    drawLabel(ox, oy - l * scale + 28, `⌀ ${diameterSmall} mm`, "#58a6ff");
    drawDimLine(ctx, ox, oy, ox + L * scale * Math.cos(endAngle), oy + L * scale * Math.sin(endAngle), `L = ${unfold.L.toFixed(1)} mm`, 16, -6, "#06d6a0");
    drawDimLine(ctx, ox, oy, ox + l * scale * Math.cos(startAngle), oy + l * scale * Math.sin(startAngle), `l = ${unfold.l.toFixed(1)} mm`, -16, -6, "#06d6a0");
    drawAngleDim(ctx, ox, oy, Math.min(l * scale * 0.45, 65), startAngle, endAngle, `θ = ${unfold.thetaDeg.toFixed(1)}°`);

    // Rodapé
    ctx.fillStyle = "#484f58"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText(`h = ${height} mm  ·  s = ${unfold.s.toFixed(1)} mm (geratriz)`, W / 2, H - 15);

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
      drawDimLine(ctx, p1.x, p1.y, p2.x, p2.y, `${distReal.toFixed(2)} mm`, 0, -15, "#ffffff", false);
    } else if (measurePoints.length === 1 && hoverPoint) {
      const p1 = measurePoints[0];
      const p2 = hoverPoint;
      const distPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const distReal = distPx / scale;
      drawDimLine(ctx, p1.x, p1.y, p2.x, p2.y, `${distReal.toFixed(2)} mm`, 0, -15, "#ffffff88", true);
    }

    if (hoverPoint && measurePoints.length < 2) {
      ctx.fillStyle = "#ffffff88";
      ctx.beginPath(); ctx.arc(hoverPoint.x, hoverPoint.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
    }
  }, [unfold, diameterBig, diameterSmall, height, measurePoints, hoverPoint]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getSnappedPoint(e);
    if (!pt) return;

    if (measurePoints.length >= 2) {
      setMeasurePoints([pt]);
    } else {
      setMeasurePoints([...measurePoints, pt]);
    }
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
