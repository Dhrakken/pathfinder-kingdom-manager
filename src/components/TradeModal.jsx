import React, { useState, useMemo } from 'react';
import { 
  Coins, ArrowRightLeft, TrendingUp, TrendingDown, 
  Wheat, TreePine, Gem, Mountain, X, CheckCircle
} from 'lucide-react';
import { COMMODITY_BASE_VALUES, tradeCommodities, calculateTradeValue } from '../engine/commerceEngine.js';

const COMMODITY_ICONS = {
  food: Wheat,
  lumber: TreePine,
  luxuries: Gem,
  ore: Mountain,
  stone: () => <div className="w-5 h-5 bg-gray-400 rounded" />,
};

const COMMODITY_COLORS = {
  food: 'text-amber-400',
  lumber: 'text-green-400',
  luxuries: 'text-pink-400',
  ore: 'text-orange-400',
  stone: 'text-gray-400',
};

export default function TradeModal({ state, onClose, onTrade, onLog }) {
  const [tradeType, setTradeType] = useState('sell');
  const [selectedCommodity, setSelectedCommodity] = useState('food');
  const [amount, setAmount] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const currentRP = state.resources?.rp || 0;
  const currentCommodity = state.resources?.[selectedCommodity] || 0;
  
  // Estimate trade value (without modifier until roll)
  const estimatedValue = useMemo(() => {
    return calculateTradeValue(selectedCommodity, amount, tradeType, 1.0);
  }, [selectedCommodity, amount, tradeType]);
  
  const canTrade = useMemo(() => {
    if (amount <= 0) return false;
    if (tradeType === 'sell') return currentCommodity >= amount;
    return currentRP >= estimatedValue;
  }, [tradeType, amount, currentCommodity, currentRP, estimatedValue]);
  
  const handleTrade = () => {
    setError(null);
    
    const tradeResult = tradeCommodities(state, tradeType, selectedCommodity, amount);
    
    if (!tradeResult.success) {
      setError(tradeResult.error);
      return;
    }
    
    setResult(tradeResult);
    
    // Log the result
    const degreeLabel = {
      criticalSuccess: 'Critical Success!',
      success: 'Success',
      failure: 'Failure',
      criticalFailure: 'Critical Failure!',
    }[tradeResult.result.degree];
    
    onLog?.(`Trade (${tradeType} ${amount} ${selectedCommodity}): ${degreeLabel}`, 
      tradeResult.result.degree.includes('Success') ? 'success' : 'failure');
    for (const msg of tradeResult.log) {
      onLog?.(msg, 'info');
    }
  };
  
  const handleConfirm = () => {
    if (result) {
      onTrade(result.state);
    }
    onClose();
  };
  
  const commodities = Object.keys(COMMODITY_BASE_VALUES);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Trade Commodities
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {!result ? (
          <>
            {/* Trade Type */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTradeType('sell')}
                className={`flex-1 py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors ${
                  tradeType === 'sell'
                    ? 'bg-green-500/20 border border-green-500 text-green-400'
                    : 'bg-gray-800 border border-gray-700 text-gray-400'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Sell
              </button>
              <button
                onClick={() => setTradeType('buy')}
                className={`flex-1 py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors ${
                  tradeType === 'buy'
                    ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                    : 'bg-gray-800 border border-gray-700 text-gray-400'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                Buy
              </button>
            </div>
            
            {/* Commodity Selection */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Commodity</label>
              <div className="grid grid-cols-5 gap-2">
                {commodities.map(commodity => {
                  const Icon = COMMODITY_ICONS[commodity];
                  const current = state.resources?.[commodity] || 0;
                  const isSelected = selectedCommodity === commodity;
                  
                  return (
                    <button
                      key={commodity}
                      onClick={() => setSelectedCommodity(commodity)}
                      className={`p-3 rounded text-center transition-colors ${
                        isSelected
                          ? 'bg-yellow-500/20 border border-yellow-500'
                          : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className={`mx-auto mb-1 ${COMMODITY_COLORS[commodity]}`}>
                        {typeof Icon === 'function' ? <Icon className="w-5 h-5 mx-auto" /> : Icon}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">{commodity}</div>
                      <div className="text-sm font-bold">{current}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Amount */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Amount ({tradeType === 'sell' ? `max ${currentCommodity}` : 'any'})
              </label>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setAmount(Math.max(1, amount - 1))}
                  className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={tradeType === 'sell' ? currentCommodity : 99}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center"
                />
                <button
                  onClick={() => setAmount(amount + 1)}
                  className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700"
                >
                  +
                </button>
                {tradeType === 'sell' && (
                  <button
                    onClick={() => setAmount(currentCommodity)}
                    className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 text-xs"
                  >
                    Max
                  </button>
                )}
              </div>
            </div>
            
            {/* Estimate */}
            <div className="bg-white/5 rounded p-4 mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Base Value:</span>
                <span>{COMMODITY_BASE_VALUES[selectedCommodity]} RP each</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">
                  {tradeType === 'sell' ? 'Estimated Gain:' : 'Estimated Cost:'}
                </span>
                <span className={`text-xl font-bold ${tradeType === 'sell' ? 'text-green-400' : 'text-blue-400'}`}>
                  {tradeType === 'sell' ? '+' : '-'}{estimatedValue} RP
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Final value depends on Trade skill check
              </div>
            </div>
            
            {/* Current Status */}
            <div className="bg-white/5 rounded p-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Your RP:</span>
                <span className="text-yellow-400 font-bold">{currentRP}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your {selectedCommodity}:</span>
                <span className="font-bold">{currentCommodity}</span>
              </div>
            </div>
            
            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded p-3 mb-4 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleTrade}
                disabled={!canTrade}
                className={`flex-1 py-2 px-4 rounded font-medium flex items-center justify-center gap-2 ${
                  canTrade
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Coins className="w-5 h-5" />
                {tradeType === 'sell' ? 'Sell' : 'Buy'}
              </button>
              <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Result Display */}
            <div className={`rounded p-4 mb-4 ${
              result.result.degree === 'criticalSuccess' ? 'bg-green-500/20' :
              result.result.degree === 'success' ? 'bg-blue-500/20' :
              result.result.degree === 'failure' ? 'bg-yellow-500/20' :
              'bg-red-500/20'
            }`}>
              <div className={`text-lg font-bold mb-2 ${
                result.result.degree === 'criticalSuccess' ? 'text-green-400' :
                result.result.degree === 'success' ? 'text-blue-400' :
                result.result.degree === 'failure' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {result.result.degree === 'criticalSuccess' ? 'Critical Success!' :
                 result.result.degree === 'success' ? 'Success' :
                 result.result.degree === 'failure' ? 'Failure' :
                 'Critical Failure!'}
              </div>
              
              <div className="text-sm text-gray-300 mb-2">
                Trade check: {result.result.roll} + {result.result.modifier} = {result.result.total} vs DC {result.result.dc}
              </div>
              
              <div className="space-y-1">
                {result.log.map((msg, i) => (
                  <div key={i} className="text-sm text-gray-200">{msg}</div>
                ))}
              </div>
            </div>
            
            {/* Confirm */}
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 px-4 rounded font-medium bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Confirm Trade
              </button>
              <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
