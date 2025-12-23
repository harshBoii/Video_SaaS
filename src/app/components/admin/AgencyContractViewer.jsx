'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { FiArrowLeft, FiSave, FiDownload } from 'react-icons/fi';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Swal from 'sweetalert2';
import React from 'react';

const Spinner = ({ size = 22 }) => (
  <div className="flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="rounded-full border-4 border-primary border-t-transparent"
      style={{ width: size, height: size }}
    />
  </div>
);

export default function ContractEditor() {
  const { tenure } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfBytes, setPdfBytes] = useState(null);
  const [saving, setSaving] = useState(false);

  const signatureCanvasRef = useRef(null);

  // Editable fields — these correspond to common placeholders in your offer letter
  const [fields, setFields] = useState({
    company_name: '',
    client_name: '',
    tenure: '',
    fee: '',
    start_date: '',
    end_date: '',
    company_email: '',
    company_mobile: '',
  });

  useEffect(() => {
    if (!tenure) return;
    const fileUrl = `http://localhost:8000/files/${tenure}`;
    setPdfUrl(fileUrl);
    fetch(fileUrl)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        setPdfBytes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load PDF file.', 'error');
      });
  }, [tenure]);

  const updateField = (key, val) => setFields((prev) => ({ ...prev, [key]: val }));

  async function buildEditedPdf() {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    let y = page.getHeight() - 100;
    const fontSize = 12;

    // Draw updated text fields onto the page
    const drawText = (label, value) => {
      page.drawText(`${label}: ${value}`, {
        x: 50,
        y,
        size: fontSize,
        font: helv,
        color: rgb(0, 0, 0),
      });
      y -= 16;
    };

    drawText('Company', fields.company_name);
    drawText('Client', fields.client_name);
    drawText('Tenure', fields.tenure);
    drawText('Fee', fields.fee);
    drawText('Start Date', fields.start_date);
    drawText('End Date', fields.end_date);
    drawText('Company Email', fields.company_email);
    drawText('Company Phone', fields.company_mobile);

    // Add signature if drawn
    if (signatureCanvasRef.current) {
      const dataUrl = signatureCanvasRef.current.toDataURL();
      const imageBytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
      const pngImage = await pdfDoc.embedPng(imageBytes);
      const { width, height } = pngImage.scale(0.4);
      page.drawImage(pngImage, {
        x: page.getWidth() - width - 50,
        y: 60,
        width,
        height,
      });
    }

    return await pdfDoc.save();
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      const newPdfBytes = await buildEditedPdf();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });

      // Upload edited PDF
      const formData = new FormData();
      formData.append('file', blob, `edited_${tenure}`);
      formData.append('filename', tenure);

      const res = await fetch('http://localhost:8000/upload-edited', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      Swal.fire('Success', 'Edited contract saved successfully.', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to save edited PDF.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size={40} />
          <p className="text-muted-foreground mt-4">Loading contract...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header with glassmorphism */}
        <div className="glass-card p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.back()}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
            >
              <FiArrowLeft className="w-5 h-5" /> Back
            </motion.button>
            
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.open(pdfUrl, '_blank')}
                className="glass-card px-4 py-2.5 flex items-center gap-2 hover:shadow-md transition-all text-foreground font-medium rounded-xl"
              >
                <FiDownload className="w-4 h-4" /> View Original
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-primary to-violet-500 text-primary-foreground rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 font-semibold"
              >
                {saving ? <Spinner size={16} /> : <FiSave className="w-4 h-4" />} Save Contract
              </motion.button>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* PDF Viewer */}
          <div className="lg:col-span-2 glass-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FiDownload className="w-5 h-5 text-primary" />
              Contract Preview
            </h3>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <div className="rounded-xl overflow-hidden border border-[var(--glass-border)]" style={{ height: '75vh' }}>
                <Viewer fileUrl={pdfUrl} defaultScale={SpecialZoomLevel.PageFit} />
              </div>
            </Worker>
          </div>

          {/* Editable Field Panel */}
          <div className="glass-card p-4 md:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <FiSave className="w-5 h-5 text-primary" />
              Edit Contract Details
            </h3>

            <div className="space-y-4 max-h-[calc(75vh-60px)] overflow-y-auto glass-scrollbar pr-2">
              {Object.entries(fields).map(([key, val]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    className="w-full border border-[var(--glass-border)] bg-[var(--glass-hover)] rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    value={val}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
              
              <div className="pt-4 border-t border-[var(--glass-border)]">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Signature
                </h4>
                <SignatureCanvas ref={signatureCanvasRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SignatureCanvas = React.forwardRef((_, ref) => {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    canvas.width = canvas.clientWidth;
    canvas.height = 120;

    const start = (e) => {
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };
    const draw = (e) => {
      if (!drawing) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    const stop = () => (drawing = false);

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop);
    ref.current = canvas;

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stop);
    };
  }, [ref]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full border border-[var(--glass-border)] rounded-xl bg-[var(--glass-hover)] shadow-sm cursor-crosshair"
      style={{ height: 120 }}
    />
  );
});
