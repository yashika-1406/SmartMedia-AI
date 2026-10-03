import React from 'react';
import { Images, Cpu, ShieldCheck, HardDrive } from 'lucide-react';

export default function MetricsRow({ mediaList = [] }) {
  const total = mediaList.length;
  const tagged = mediaList.filter((m) => m.tags && (Array.isArray(m.tags) ? m.tags.length > 0 : m.tags.trim().length > 0)).length;
  const approved = mediaList.filter((m) => (m.moderationStatus || '').toLowerCase() === 'approved').length;
  const totalBytes = mediaList.reduce((acc, m) => acc + (Number(m.bytes) || 0), 0);

  const formatStorage = (bytes) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const metrics = [
    {
      id: 'total',
      label: 'Total Uploads',
      value: total,
      subtext: 'Persisted in MongoDB',
      colorBg: 'rgba(139, 92, 246, 0.15)',
      colorIcon: '#A78BFA',
      icon: Images,
    },
    {
      id: 'tagged',
      label: 'AI Analyzed & Tagged',
      value: tagged,
      subtext: `${total > 0 ? Math.round((tagged / total) * 100) : 0}% coverage`,
      colorBg: 'rgba(59, 130, 246, 0.15)',
      colorIcon: '#60A5FA',
      icon: Cpu,
    },
    {
      id: 'approved',
      label: 'Moderation Approved',
      value: approved,
      subtext: `${total > 0 ? Math.round((approved / total) * 100) : 0}% verified safe`,
      colorBg: 'rgba(16, 185, 129, 0.15)',
      colorIcon: '#34D399',
      icon: ShieldCheck,
    },
    {
      id: 'storage',
      label: 'Cloud CDN Bandwidth',
      value: formatStorage(totalBytes),
      subtext: 'Optimized via Cloudinary',
      colorBg: 'rgba(236, 72, 153, 0.15)',
      colorIcon: '#F472B6',
      icon: HardDrive,
    },
  ];

  return (
    <div className="metrics-row">
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} className="metric-card">
            <div className="metric-left">
              <div className="metric-icon-box" style={{ background: item.colorBg, color: item.colorIcon }}>
                <Icon size={22} />
              </div>
              <div className="metric-data">
                <h3>{item.value}</h3>
                <p>{item.label}</p>
              </div>
            </div>

            <div className="metric-trend">
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {item.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
