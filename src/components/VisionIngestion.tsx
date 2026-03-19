import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeFoodImage, NutritionalAnalysis } from '../services/geminiService';

interface VisionIngestionProps {
  onAnalysisComplete: (analysis: NutritionalAnalysis) => void;
}

export const VisionIngestion: React.FC<VisionIngestionProps> = ({ onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setPreview(reader.result as string);
      await performAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  const performAnalysis = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeFoodImage(base64);
      onAnalysisComplete(result);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="luxury-card overflow-hidden relative">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-serif mb-2">Vision Ingestion</h2>
          <p className="text-aura-muted text-sm uppercase tracking-widest">Computer Vision Pipeline</p>
        </div>

        <div 
          className="w-full aspect-video rounded-2xl border-2 border-dashed border-aura-muted/20 flex items-center justify-center relative bg-aura-bg/50 cursor-pointer hover:bg-aura-bg transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex flex-col items-center space-y-2 text-aura-muted">
              <Camera size={48} strokeWidth={1} />
              <span className="text-sm font-light">Capture or Upload Meal</span>
            </div>
          )}
          
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white rounded-2xl"
              >
                <Loader2 className="animate-spin mb-4" size={32} />
                <span className="text-sm tracking-widest uppercase font-medium">Architecting Intelligence...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />

        <div className="flex space-x-4 w-full">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-4 px-6 rounded-full border border-aura-ink/10 flex items-center justify-center space-x-2 hover:bg-aura-gold hover:text-aura-bg transition-all duration-500 group"
          >
            <Upload size={18} className="group-hover:-translate-y-1 transition-transform" />
            <span className="text-xs uppercase tracking-widest font-semibold">Upload Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};
