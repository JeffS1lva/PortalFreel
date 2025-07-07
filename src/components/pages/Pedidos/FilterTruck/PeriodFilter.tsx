import React, { useState, useRef, useEffect } from "react";
import {
  Filter,
  ChevronDown,
  CalendarDays,
  X,
  Clock,
  Check,
} from "lucide-react";

// Interfaces
interface DateRange {
  start: Date;
  end: Date;
}

interface PeriodFilterProps {
  activeDateRange: DateRange;
  selectedPeriod: number;
  onPeriodChange: (days: number) => void;
  onCustomDateApply: (startDate: Date, endDate: Date) => void;
  className?: string;
}

// Função para formatar data
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Função para calcular diferença em dias (CORRIGIDA)
const getDaysDifference = (start: Date, end: Date): number => {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays; // Removido o +1 que estava causando o problema
};

// Opções de período predefinidas
const PERIOD_OPTIONS = [
  { label: "Últimos 7 dias", days: 7, icon: "📅" },
  { label: "Últimos 15 dias", days: 15, icon: "📊" },
  { label: "Últimos 30 dias", days: 30, icon: "📈" },
  { label: "Últimos 90 dias", days: 90, icon: "📉" },
];

const PeriodFilter: React.FC<PeriodFilterProps> = ({
  activeDateRange,
  selectedPeriod,
  onPeriodChange,
  onCustomDateApply,
  className = "p-3",
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [errors, setErrors] = useState({ start: "", end: "" });
  const [isAnimating, setIsAnimating] = useState(false);
  
  const filterRef = useRef<HTMLDivElement>(null);

  // Fechar filtro ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validação de datas
  const validateDates = (start: string, end: string) => {
    const newErrors = { start: "", end: "" };
    
    if (!start) {
      newErrors.start = "Data inicial é obrigatória";
    }
    
    if (!end) {
      newErrors.end = "Data final é obrigatória";
    }
    
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate.getTime())) {
        newErrors.start = "Data inválida";
      }
      
      if (isNaN(endDate.getTime())) {
        newErrors.end = "Data inválida";
      }
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        if (startDate > endDate) {
          newErrors.end = "Data final deve ser posterior à inicial";
        }
        
        const diffDays = getDaysDifference(startDate, endDate);
        if (diffDays > 365) {
          newErrors.end = "Período não pode exceder 365 dias";
        }
      }
    }
    
    setErrors(newErrors);
    return !newErrors.start && !newErrors.end;
  };

  // Função para aplicar período customizado
  const handleCustomDateApply = () => {
    if (!validateDates(customStartDate, customEndDate)) {
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      
      onCustomDateApply(startDate, endDate);
      setShowCustomDate(false);
      setCustomStartDate("");
      setCustomEndDate("");
      setErrors({ start: "", end: "" });
      setIsAnimating(false);
    }, 200);
  };

  // Função para lidar com mudança de período
  const handlePeriodChange = (days: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      onPeriodChange(days);
      setShowFilters(false);
      setIsAnimating(false);
    }, 150);
  };

  const handleCustomClick = () => {
    setShowCustomDate(true);
  };

  const cancelCustomDate = () => {
    setShowCustomDate(false);
    setCustomStartDate("");
    setCustomEndDate("");
    setErrors({ start: "", end: "" });
  };

  const isCustomPeriod = !PERIOD_OPTIONS.find(opt => opt.days === selectedPeriod);
  const daysDifference = getDaysDifference(activeDateRange.start, activeDateRange.end);

  return (
    <div ref={filterRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`
          group flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 w-full
          ${showFilters 
            ? 'border-blue-500 bg-blue-50 shadow-lg' 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
          }
        `}
      >
        <div className={`
          p-2 rounded-lg transition-colors duration-200
          ${showFilters ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}
        `}>
          <Filter size={16} className={showFilters ? 'text-blue-600' : 'text-gray-600'} />
        </div>
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">Período</span>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {daysDifference} dias
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-0.5">
            {formatDate(activeDateRange.start)} - {formatDate(activeDateRange.end)}
          </div>
        </div>
        
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform duration-200 ${
            showFilters ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {showFilters && (
        <div className="absolute mx-4 top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* Quick Period Options */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Períodos rápidos</span>
            </div>
            
            <div className="grid gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.days}
                  onClick={() => handlePeriodChange(option.days)}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border transition-all duration-150
                    ${selectedPeriod === option.days && !isCustomPeriod
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{option.icon}</span>
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  {selectedPeriod === option.days && !isCustomPeriod && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Custom Period */}
          <div className="p-4">
            <button
              onClick={handleCustomClick}
              className={`
                w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-150
                ${isCustomPeriod
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <CalendarDays size={16} className={isCustomPeriod ? 'text-blue-600' : 'text-gray-600'} />
                <span className="font-medium text-sm">Período personalizado</span>
              </div>
              {isCustomPeriod && <Check size={16} className="text-blue-600" />}
            </button>

            {/* Custom Date Inputs */}
            {showCustomDate && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Data inicial
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => {
                          setCustomStartDate(e.target.value);
                          if (errors.start) {
                            setErrors(prev => ({ ...prev, start: "" }));
                          }
                        }}
                        className={`
                          w-full px-3 py-2 rounded-lg border text-sm transition-colors
                          ${errors.start 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500'
                          }
                          focus:outline-none focus:ring-2 focus:ring-opacity-50
                        `}
                      />
                      {errors.start && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <X size={12} />
                          {errors.start}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Data final
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => {
                          setCustomEndDate(e.target.value);
                          if (errors.end) {
                            setErrors(prev => ({ ...prev, end: "" }));
                          }
                        }}
                        className={`
                          w-full px-3 py-2 rounded-lg border text-sm transition-colors
                          ${errors.end 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500'
                          }
                          focus:outline-none focus:ring-2 focus:ring-opacity-50
                        `}
                      />
                      {errors.end && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <X size={12} />
                          {errors.end}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCustomDateApply}
                      disabled={!customStartDate || !customEndDate || isAnimating}
                      className={`
                        flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                        ${!customStartDate || !customEndDate || isAnimating
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
                        }
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                      `}
                    >
                      {isAnimating ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Aplicando...
                        </div>
                      ) : (
                        "Aplicar"
                      )}
                    </button>
                    <button
                      onClick={cancelCustomDate}
                      className="flex-1 px-4 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isAnimating && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-xl flex items-center justify-center z-60">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Atualizando período...
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodFilter;