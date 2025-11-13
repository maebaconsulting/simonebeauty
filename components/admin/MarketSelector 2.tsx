'use client';

/**
 * Market Selector Component
 * Feature: 019-market-integration-optimization
 *
 * Dropdown selector for filtering admin views by market
 */

import { Globe } from 'lucide-react';
import { useMarkets } from '@/hooks/useMarkets';

interface MarketSelectorProps {
  value: number | null;
  onChange: (marketId: number | null) => void;
  className?: string;
  showAllOption?: boolean;
}

export function MarketSelector({
  value,
  onChange,
  className = '',
  showAllOption = true,
}: MarketSelectorProps) {
  const { data: marketsData, isLoading } = useMarkets({
    is_active: true,
    limit: 100,
  });

  const markets = marketsData?.data || [];

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 text-gray-400 animate-pulse" />
        <div className="h-10 w-48 bg-gray-200 rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-5 w-5 text-gray-600" />
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm font-medium"
      >
        {showAllOption && <option value="">Tous les marchés</option>}
        {markets.map((market) => (
          <option key={market.id} value={market.id}>
            {market.code} - {market.name}
          </option>
        ))}
      </select>
    </div>
  );
}
