'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { FiArrowLeft, FiSave, FiDownload } from 'react-icons/fi';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Swal from 'sweetalert2';

const Spinner = ({ size = 22 }) => (
  <div className="flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="rounded-full border-4 border-indigo-500 border-t-transparent"
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

  if (loading) return <Spinner size={40} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
          >
            <FiArrowLeft /> Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => window.open(pdfUrl, '_blank')}
              className="bg-white border rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-100"
            >
              <FiDownload /> View Original
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              {saving ? <Spinner size={16} /> : <FiSave />} Save Contract
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Viewer */}
          <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow border">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <div style={{ height: '80vh' }}>
                <Viewer fileUrl={pdfUrl} defaultScale={SpecialZoomLevel.PageFit} />
              </div>
            </Worker>
          </div>

          {/* Editable Field Panel */}
          <div className="bg-white rounded-xl p-4 shadow border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Offer Letter</h3>

            {Object.entries(fields).map(([key, val]) => (
              <div key={key} className="mb-3">
                <label className="text-sm text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}
                </label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={val}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              </div>
            ))}

            <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Signature</h4>
            <SignatureCanvas ref={signatureCanvasRef} />
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
      className="w-full border rounded bg-gray-50 shadow-sm cursor-crosshair"
      style={{ height: 120 }}
    />
  );
});
