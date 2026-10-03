import React from 'react';
import { Clock, Cpu, CheckCircle2, Video, TrendingUp } from 'lucide-react';

export default function MetricsRow({ stats }) {
  const defaultMetrics = [
    {
      id: 'total',
      label: 'Total Assets',
      value: stats?.total ? stats.total.toLocaleString() : '1,248',
      trend: '+12%',
      colorBg: 'rgba(139, 92, 246, 0.15)',
      colorIcon: '#A78BFA',
      icon: Clock,
      bars: [30, 45, 35, 60, 50, 75, 90],
      barColor: '#A78BFA',
    },
    {
      id: 'analyzed',
      label: 'AI Analyzed',
      value: stats?.analyzed ? stats.analyzed.toLocaleString() : '892',
      trend: '+18%',
      colorBg: 'rgba(59, 130, 246, 0.15)',
      colorIcon: '#60A5FA',
      icon: Cpu,
      bars: [25, 40, 55, 45, 70, 80, 95],
      barColor: '#60A5FA',
    },
    {
      id: 'approved',
      label: 'Approved',
      value: stats?.approved ? stats.approved.toLocaleString() : '860',
      trend: '+14%',
      colorBg: 'rgba(16, 185, 129, 0.15)',
      colorIcon: '#34D399',
      icon: CheckCircle2,
      bars: [35, 50, 45, 65, 60, 80, 88],
      barColor: '#34D399',
    },
    {
      id: 'videos',
      label: 'Videos',
      value: stats?.videos ? stats.videos.toLocaleString() : '124',
      trend: '+8%',
      colorBg: 'rgba(236, 72, 153, 0.15)',
      colorIcon: '#F472B6',
      icon: Video,
      bars: [20, 30, 25, 50, 45, 60, 70],
      barColor: '#F472B6',
    },
  ];

  return (
    <div className="metrics-row">
      {defaultMetrics.map((item) => {
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
              <span className="trend-badge positive">
                <TrendingUp size={11} />
                {item.trend}
              </span>

              {/* Mini Sparkline Bar Chart */}
              <svg className="sparkline-svg" viewBox="0 0 50 20">
                {item.bars.map((height, i) => (
                  <rect
                    key={i}
                    x={i * 7}
                    y={20 - (height / 100) * 18}
                    width="4"
                    height={(height / 100) * 18}
                    rx="1.5"
                    fill={item.barColor}
                    opacity={0.4 + (i / item.bars.length) * 0.6}
                  />
                ))}
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
