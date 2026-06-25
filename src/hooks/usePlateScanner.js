import { useRef, useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';

// Indian number plate: e.g. KL07AB1234 / DL 01 AB 1234
const PLATE_REGEX = /[A-Z]{2}\d{2}[A-Z]{0,3}\d{4}/g;

export function usePlateScanner() {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);

  const [scanning,    setScanning]    = useState(false);
  const [cameraOpen,  setCameraOpen]  = useState(false);
  const [preview,     setPreview]     = useState(null);
  const [ocrResult,   setOcrResult]   = useState('');
  const [plateText,   setPlateText]   = useState('');
  const [plateImage,  setPlateImage]  = useState(''); // base64 of captured/uploaded image
  const [error,       setError]       = useState('');

  const initWorker = useCallback(async () => {
    if (workerRef.current) return;
    try {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
        tessedit_pageseg_mode: '6', // 6 = Assume a single uniform block of text (handles multi-line perfectly)
      });
      workerRef.current = worker;
    } catch (e) {
      console.error('initWorker Error:', e);
      setError('Failed to initialize OCR engine. ' + (e.message || ''));
    }
  }, []);

  const openCamera = useCallback(async () => {
    setError('');
    setPreview(null);
    setOcrResult('');
    setPlateText('');
    setPlateImage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOpen(true);
      await initWorker();
    } catch {
      setError('Camera access denied. Please allow camera permission and try again.');
    }
  }, [initWorker]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

    let w = video.videoWidth  || 640;
    let h = video.videoHeight || 360;
    
    // Scale down for optimal Tesseract text height (~30-60px)
    const max = 800;
    if (w > max || h > max) {
      const ratio = Math.min(max / w, max / h);
      w *= ratio;
      h *= ratio;
    }

    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPreview(dataUrl);
    setPlateImage(dataUrl); // store camera capture as base64
    return canvas;
  }, []);

  const recognise = useCallback(async (imageSource) => {
    if (!workerRef.current) await initWorker();
    setScanning(true);
    setError('');
    try {
      const { data } = await workerRef.current.recognize(imageSource);
      let cleanRaw = data.text.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Strip leading IND / holograms that got misread
      cleanRaw = cleanRaw.replace(/^(?:IND|1ND|IN0|IN|1N|ND)/, '');

      const displayRaw = data.text.toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      setOcrResult(displayRaw);
      
      // Flexible Regex:
      // [A-Z085]{2} -> State (Letters, but allow 0,8,5)
      // [0-9A-Z]{1,2} -> RTO (Digits, but allow DL 1C, etc)
      // [A-Z085]{0,3} -> Series (Letters, but allow 0,8,5)
      // [0-9OBSZQ]{3,4} -> Number (Digits, but allow O,B,S,Z,Q)
      const PLATE_REGEX = /[A-Z085]{2}[0-9A-Z]{1,2}[A-Z085]{0,3}[0-9OBSZQ]{3,4}/g;
      
      const matches = cleanRaw.match(PLATE_REGEX);
      if (matches?.length) {
        let plate = matches[0];
        
        // Auto-correct common OCR errors based on position
        const first2 = plate.substring(0, 2).replace(/0/g, 'O').replace(/8/g, 'B').replace(/5/g, 'S');
        
        // Find trailing number string
        const numMatch = plate.match(/[0-9OBSZQ]{3,4}$/);
        const numStr = numMatch ? numMatch[0] : '';
        const middleStr = plate.substring(2, plate.length - numStr.length);
        
        const lastNums = numStr
          .replace(/O/g, '0').replace(/Q/g, '0')
          .replace(/B/g, '8')
          .replace(/S/g, '5')
          .replace(/Z/g, '2');
        
        plate = first2 + middleStr + lastNums;
        
        setPlateText(plate);
        return plate;
      } else {
        setError('No number plate detected. Try again with better lighting.');
        return null;
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError('OCR failed: ' + (err.message || err.toString()));
      return null;
    } finally {
      setScanning(false);
    }
  }, [initWorker]);

  const scanPlate = useCallback(async () => {
    const canvas = capture();
    if (!canvas) return null;
    return recognise(canvas);
  }, [capture, recognise]);

  const scanFile = useCallback(async (file) => {
    if (!file) return null;
    setError('');
    setPlateImage('');
    setOcrResult('');
    setPlateText('');
    await initWorker();

    try {
      // Convert file to base64 first so we can store it
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });
      setPreview(base64);
      setPlateImage(base64); // store uploaded image as base64

      const img = new Image();
      const canvas = await new Promise((resolve, reject) => {
        img.onload = () => {
          const cvs = document.createElement('canvas');
          let w = img.width, h = img.height;
          // Max 800px instead of 1280px to keep text thickness in Tesseract's optimal range
          const max = 800;
          if (w > max || h > max) {
            const ratio = Math.min(max / w, max / h);
            w *= ratio;
            h *= ratio;
          }
          cvs.width = w;
          cvs.height = h;
          cvs.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(cvs);
        };
        img.onerror = () => reject(new Error('Invalid image file.'));
        img.src = base64;
      });
      return recognise(canvas);
    } catch (e) {
      setError('Failed to process image file. ' + e.message);
      return null;
    }
  }, [initWorker, recognise]);

  const cleanup = useCallback(async () => {
    stopCamera();
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
  }, [stopCamera]);

  return {
    videoRef,
    cameraOpen, scanning, preview, ocrResult, plateText, plateImage, error,
    openCamera, stopCamera, capture, scanPlate, scanFile, cleanup, setError,
  };
}
