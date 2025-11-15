'use client';

/**
 * Market Badges Component
 * Feature: 019-market-integration-optimization
 *
 * Displays market availability badges with flag colors
 */

import { Globe } from 'lucide-react';

interface Market {
  id: number;
  name: string;
  code: string;
  currency_code: string;
}

interface MarketBadgesProps {
  markets: Market[];
  maxVisible?: number;
}

export function MarketBadges({ markets, maxVisible = 3 }: MarketBadgesProps) {
  if (!markets || markets.length === 0) {
    return (
      <span className="text-xs text-gray-400 flex items-center gap-1">
        <Globe className="h-3 w-3" />
        Aucun
      </span>
    );
  }

  const visibleMarkets = markets.slice(0, maxVisible);
  const hiddenCount = markets.length - visibleMarkets.length;

  // Color mapping for common markets (can be extended)
  const getMarketColor = (code: string): string => {
    const colors: Record<string, string> = {
      FR: 'bg-blue-100 text-blue-800 border-blue-200',
      BE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CH: 'bg-red-100 text-red-800 border-red-200',
      LU: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      CA: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return colors[code] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {visibleMarkets.map((market) => (
        <span
          key={market.id}
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getMarketColor(
            market.code
          )}`}
          title={`${market.name} (${market.currency_code})`}
        >
          {market.code}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border bg-gray-50 text-gray-600 border-gray-200"
          title={`${hiddenCount} autre(s) marché(s)`}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}
