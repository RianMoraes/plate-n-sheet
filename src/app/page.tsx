"use client";

import React, { useState, useCallback, useEffect } from "react";
import { jsPDF } from "jspdf";
import { calcConeFrustumUnfold, ConeFrustumUnfold } from "@/lib/geometry/coneFrustum";
import { calcEccentricConeUnfold, EccentricConeUnfold } from "@/lib/geometry/eccentricCone";
import { PIECE_TYPES, PieceType } from "@/types/pieces";
import ConeFrustumCanvas from "@/components/ConeFrustumCanvas";
import EccentricConeCanvas from "@/components/EccentricConeCanvas";
import Piece3D from "@/components/Piece3D";
import styles from "./page.module.css";

export default function HomePage() {
  // ─── Estados ──────────────────────────────────────────────────────────────
  const [pieceType, setPieceType] = useState<PieceType>("cone-truncado");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  const [diameterBig, setDiameterBig] = useState<number>(500);
  const [diameterSmall, setDiameterSmall] = useState<number>(300);
  const [height, setHeight] = useState<number>(400);

  const [unfold, setUnfold] = useState<ConeFrustumUnfold | EccentricConeUnfold | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // ─── Recalcula ─────────────────────────────────────────────────────────────
  const recalc = useCallback(() => {
    setError(null);
    try {
      if (pieceType === "cone-truncado") {
        const result = calcConeFrustumUnfold({ diameterBig, diameterSmall, height });
        setUnfold(result);
      } else if (pieceType === "cone-excentrico") {
        const result = calcEccentricConeUnfold({ diameterBig, diameterSmall, height });
        setUnfold(result);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
      setUnfold(null);
    }
  }, [pieceType, diameterBig, diameterSmall, height]);

  useEffect(() => {
    recalc();
  }, [recalc]);

  function handleNumber(setter: (v: number) => void, value: string) {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      setter(parsed);
    }
  }

  // ─── Exportação PDF ────────────────────────────────────────────────────────
  const exportToPdf = async () => {
    if (!unfold) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF();
      const pieceLabel = PIECE_TYPES.find(p => p.id === pieceType)?.label || "";

      // Cabeçalho
      doc.setFillColor(10, 14, 26);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Plate n Sheet", 15, 20);
      doc.setFontSize(12);
      doc.setTextColor(88, 166, 255);
      doc.text(`Relatório Técnico — ${pieceLabel}`, 15, 30);

      // Parâmetros
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("Parâmetros de Entrada", 15, 55);
      doc.setFontSize(10);
      doc.text(`• Diâmetro Maior: ${diameterBig} mm`, 20, 65);
      doc.text(`• Diâmetro Menor: ${diameterSmall} mm`, 20, 72);
      doc.text(`• Altura: ${height} mm`, 20, 79);

      // Resultados
      doc.setFontSize(14);
      doc.text("Dados Calculados", 15, 95);
      doc.setFontSize(10);
      let y = 105;
      if (pieceType === "cone-truncado" && "L" in unfold) {
        doc.text(`• Geratriz (s): ${unfold.s.toFixed(2)} mm`, 20, y); y += 7;
        doc.text(`• Raio Externo (L): ${unfold.L.toFixed(2)} mm`, 20, y); y += 7;
        doc.text(`• Raio Interno (l): ${unfold.l.toFixed(2)} mm`, 20, y); y += 7;
        doc.text(`• Ângulo do Setor: ${unfold.thetaDeg.toFixed(2)}°`, 20, y);
      } else if (pieceType === "cone-excentrico" && "patternWidth" in unfold) {
        doc.text(`• Largura da Chapa: ${unfold.patternWidth.toFixed(2)} mm`, 20, y); y += 7;
        doc.text(`• Altura da Chapa: ${unfold.patternHeight.toFixed(2)} mm`, 20, y); y += 7;
        doc.text(`• Geratriz Máxima: ${unfold.maxSlant.toFixed(2)} mm`, 20, y); y += 7;
        doc.text(`• Geratriz Mínima: ${unfold.minSlant.toFixed(2)} mm`, 20, y);
      }

      // Imagem da Planificação
      const canvas = document.querySelector("canvas");
      if (canvas && viewMode === "2d") {
        const imgData = canvas.toDataURL("image/png");
        doc.setFontSize(14);
        doc.text("Desenho da Planificação", 15, y + 20);
        // Ajustar imagem ao PDF (A4 é ~210mm de largura)
        const imgW = 180;
        const imgH = (canvas.height * imgW) / canvas.width;
        doc.addImage(imgData, "PNG", 15, y + 30, imgW, imgH);
      } else if (viewMode === "3d") {
        doc.setTextColor(255, 0, 0);
        doc.text("Aviso: Mude para a vista 2D para incluir o desenho técnico no PDF.", 15, y + 20);
      }

      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} — Plate n Sheet MVP 6`, 105, 285, { align: "center" });

      doc.save(`planificacao_${pieceType}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Houve um erro ao gerar o PDF. Verifique se o desenho 2D está visível.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.logo}>⚙ Plate n Sheet</span>
          <span className={styles.badge}>MVP 6</span>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Tipo de Peça</h2>
            <div className={styles.pieceType}>
              {PIECE_TYPES.map((type) => (
                <div
                  key={type.id}
                  className={`${styles.pieceChip} ${pieceType === type.id ? styles.pieceChipActive : ""}`}
                  onClick={() => {
                    setPieceType(type.id);
                    setUnfold(null);
                  }}
                >
                  {type.label}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Parâmetros</h2>
            <InputField
              id="input-diam-big"
              label="Diâmetro Maior"
              unit="mm"
              value={diameterBig}
              onChange={(v: string) => handleNumber(setDiameterBig, v)}
              color="#e94560"
            />
            <InputField
              id="input-diam-small"
              label="Diâmetro Menor"
              unit="mm"
              value={diameterSmall}
              onChange={(v: string) => handleNumber(setDiameterSmall, v)}
              color="#58a6ff"
            />
            <InputField
              id="input-height"
              label="Altura"
              unit="mm"
              value={height}
              onChange={(v: string) => handleNumber(setHeight, v)}
              color="#06d6a0"
            />
          </div>

          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>⚠</span>
              {error}
            </div>
          )}

          {unfold && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Dados Calculados</h2>
              <table className={styles.table}>
                <tbody>
                  {pieceType === "cone-truncado" && "L" in unfold ? (
                    <>
                      <ResultRow label="Geratriz (s)" value={unfold.s} color="#ffd166" />
                      <ResultRow label="Raio ext. (L)" value={unfold.L} color="#06d6a0" />
                      <ResultRow label="Raio int. (l)" value={unfold.l} color="#06d6a0" />
                      <ResultRow label="Ângulo (θ)" value={unfold.thetaDeg} unit="°" color="#a78bfa" />
                    </>
                  ) : pieceType === "cone-excentrico" && "patternWidth" in unfold ? (
                    <>
                      <ResultRow label="Largura Chapa" value={unfold.patternWidth} color="#ffd166" />
                      <ResultRow label="Altura Chapa" value={unfold.patternHeight} color="#06d6a0" />
                      <ResultRow label="Geratriz Max" value={unfold.maxSlant} color="#e94560" />
                      <ResultRow label="Geratriz Min" value={unfold.minSlant} color="#58a6ff" />
                    </>
                  ) : null}
                </tbody>
              </table>
              
              <button 
                id="btn-export-pdf"
                className={styles.exportBtn}
                onClick={exportToPdf}
                disabled={isExporting || !unfold}
              >
                {isExporting ? "Gerando..." : "📄 Exportar PDF"}
              </button>
            </div>
          )}
        </aside>

        <main className={styles.canvasPanel}>
          <div className={styles.canvasHeader}>
            <span className={styles.canvasTitle}>
              {PIECE_TYPES.find(p => p.id === pieceType)?.label} — {viewMode.toUpperCase()}
            </span>
            <div className={styles.viewToggle}>
              <button 
                id="view-2d-btn"
                className={`${styles.toggleBtn} ${viewMode === "2d" ? styles.toggleBtnActive : ""}`}
                onClick={() => setViewMode("2d")}
              >
                📐 Planificação 2D
              </button>
              <button 
                id="view-3d-btn"
                className={`${styles.toggleBtn} ${viewMode === "3d" ? styles.toggleBtnActive : ""}`}
                onClick={() => setViewMode("3d")}
              >
                🧊 Visualização 3D
              </button>
            </div>
          </div>

          <div className={styles.canvasWrapper}>
            {viewMode === "2d" ? (
              unfold ? (
                pieceType === "cone-truncado" ? (
                  <ConeFrustumCanvas
                    unfold={unfold as ConeFrustumUnfold}
                    diameterBig={diameterBig}
                    diameterSmall={diameterSmall}
                    height={height}
                  />
                ) : (
                  <EccentricConeCanvas
                    unfold={unfold as EccentricConeUnfold}
                    diameterBig={diameterBig}
                    diameterSmall={diameterSmall}
                    height={height}
                  />
                )
              ) : (
                <div className={styles.canvasEmpty}>
                  <span>⚠</span>
                  <p>{error ?? "Parâmetros inválidos"}</p>
                </div>
              )
            ) : (
              <Piece3D 
                type={pieceType}
                diameterBig={diameterBig}
                diameterSmall={diameterSmall}
                height={height}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function InputField({ id, label, unit, value, onChange, color }: any) {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.inputLabel}>
        <span className={styles.inputDot} style={{ background: color }} />
        {label}
      </label>
      <div className={styles.inputRow}>
        <input
          id={id}
          type="number"
          className={styles.input}
          style={{ borderColor: color + "55" }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className={styles.inputUnit}>{unit}</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, unit = "mm", decimals = 2, color }: any) {
  return (
    <tr className={styles.resultRow}>
      <td className={styles.resultLabel}>{label}</td>
      <td className={styles.resultValue} style={{ color }}>
        {value.toFixed(decimals)} {unit}
      </td>
    </tr>
  );
}
