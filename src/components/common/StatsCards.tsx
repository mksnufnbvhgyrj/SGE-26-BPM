import React from 'react';
import { Users, CheckCircle, Sun, Activity } from 'lucide-react';
import { DashboardStats } from '../../types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total de Policiais',
      value: stats.totalMembers,
      icon: Users,
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Ativos',
      value: stats.activeMembers,
      icon: CheckCircle,
      color: 'bg-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Em Férias',
      value: stats.onVacation,
      icon: Sun,
      color: 'bg-yellow-600',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Audiências Próximas',
      value: stats.upcomingAudiencias,
      icon: Activity,
      color: 'bg-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} ${card.textColor} rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
