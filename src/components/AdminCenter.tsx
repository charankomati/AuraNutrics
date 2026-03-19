import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, BarChart3, Database, ShieldAlert } from 'lucide-react';

interface AdminCenterProps {
  onExport?: () => void;
}

export const AdminCenter: React.FC<AdminCenterProps> = ({ onExport }) => {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [rda, setRda] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [cohortRes, rdaRes] = await Promise.all([
        fetch('/api/cohorts'),
        fetch('/api/rda')
      ]);
      setCohorts(await cohortRes.json());
      setRda(await rdaRes.json());
    };
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'auranutrics_export.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      onExport?.();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-serif mb-2">Command Center</h1>
          <p className="text-aura-muted uppercase tracking-[0.2em] text-xs">Global RDA Benchmarking & Cohort Analytics</p>
        </div>
        <div className="flex space-x-4">
          <div className="px-6 py-3 rounded-full border border-aura-ink/10 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-widest font-bold">System Nominal</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cohort Analytics */}
        <div className="lg:col-span-2 luxury-card">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <Users className="text-aura-accent" size={20} />
              <h2 className="text-2xl font-serif">Cohort Performance</h2>
            </div>
            <button 
              onClick={handleExport}
              className="text-[10px] uppercase tracking-widest font-bold text-aura-muted hover:text-aura-gold transition-colors"
            >
              Export Dataset
            </button>
          </div>
          
          <div className="space-y-6">
            {cohorts.map((cohort, i) => (
              <motion.div 
                key={cohort.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-aura-bg/30 border border-white/5 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-serif text-xl">{cohort.name}</h4>
                  <p className="text-xs text-aura-muted uppercase tracking-wider">Metabolic Efficiency: {cohort.metabolicEfficiency}%</p>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-aura-muted font-bold">Deficiency Risk</p>
                    <p className={`text-lg font-serif ${cohort.deficiencyRisk > 20 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {cohort.deficiencyRisk}%
                    </p>
                  </div>
                  <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-aura-gold" 
                      style={{ width: `${cohort.metabolicEfficiency}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RDA Benchmarks */}
        <div className="luxury-card">
          <div className="flex items-center space-x-3 mb-8">
            <BarChart3 className="text-aura-accent" size={20} />
            <h2 className="text-2xl font-serif">RDA Benchmarks</h2>
          </div>
          
          <div className="space-y-8">
            {rda && Object.entries(Object.values(rda)[0] as any).map(([key, data]: [string, any]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs uppercase tracking-widest font-bold text-aura-muted">{key}</span>
                  <span className="text-sm font-serif">{data.value} / {data.rda} {data.unit}</span>
                </div>
                <div className="h-1 w-full bg-aura-ink/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.value / data.rda) * 100}%` }}
                    className="h-full bg-aura-gold"
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-aura-accent text-aura-ink space-y-4">
            <div className="flex items-center space-x-2 text-aura-gold">
              <ShieldAlert size={16} />
              <span className="text-[10px] uppercase tracking-widest font-bold">Security Protocol</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              All cohort data is AES-256 encrypted at rest. Predictive models are validated against clinical RDA standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
