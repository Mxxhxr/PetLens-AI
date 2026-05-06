"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError("Could not access camera. Please allow camera permissions.");
    }
  };

  const captureAndAnalyze = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Frame = canvas.toDataURL("image/jpeg", 0.8);

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Frame }),
      });
      const data = await res.json();
      setAnalysis(data.result ?? "No result");
    } catch (err) {
      setAnalysis("Error contacting AI.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cameraActive) {
      intervalRef.current = setInterval(captureAndAnalyze, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraActive, captureAndAnalyze]);

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem" }}>
      <h1>PetLens AI</h1>
      <p>Point your camera at your cat to analyze their body language</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "640px", height: "480px", background: "#111", borderRadius: "12px" }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {!cameraActive && (
        <button onClick={startCamera} style={{ marginTop: "1rem", padding: "0.75rem 2rem", fontSize: "1rem" }}>
          Start Camera
        </button>
      )}

      {loading && <p style={{ marginTop: "1rem" }}>🔍 Analyzing your cat...</p>}

      {analysis && !loading && (
        <div style={{
          marginTop: "1.5rem",
          padding: "1rem 1.5rem",
          background: "#0c7600",
          borderRadius: "12px",
          maxWidth: "600px",
          textAlign: "center"
        }}>
          <strong>🐱 Cat Analysis</strong>
          <p style={{ marginTop: "0.5rem" }}>{analysis}</p>
        </div>
      )}
    </main>
  );
}