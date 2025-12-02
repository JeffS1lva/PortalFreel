import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParcelaAtrasada } from "@/types/parcelaAtrasada";
import { formatCurrency } from "@/utils/boletos/formatters";
import {
  Building,
  Calendar,
  DollarSign,
  AlertTriangle,
  Users,
  Clock,
  CreditCard,
} from "lucide-react";

export const DashboardAnalytics = ({
  parcelas,
}: {
  parcelas: ParcelaAtrasada[];
}) => {
  // Cálculos dos resumos
  const totalEmAtraso = parcelas.reduce(
    (sum, parcela) => sum + parcela.saldoDevido,
    0
  );
  const totalEmpresas = new Set(parcelas.map((p) => p.nomeParceiroNegocio))
    .size;
  const mediaAtraso =
    parcelas.length > 0
      ? Math.round(
          parcelas.reduce((sum, p) => sum + p.diasAtraso, 0) / parcelas.length
        )
      : 0;
  // Cálculo de parcelas críticas (mais de 60 dias)
  const parcelasCriticas = parcelas.filter((p) => p.diasAtraso > 60).length;
  const valorCritico = parcelas
    .filter((p) => p.diasAtraso > 60)
    .reduce((sum, p) => sum + p.saldoDevido, 0);

  // Dados para gráficos

  // Dados para gráfico de tendência por faixa de valor

  return (
    <div className="space-y-8">
      {/* Header com animação */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-blue-600 to-yellow-600 bg-clip-text text-transparent mb-2 animate-pulse">
          Indicadores Financeiro
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Análise completa de parcelas em atraso
        </p>
      </div>

      {/* Cards de Resumo com gradientes e animações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-red-600"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Total em Atraso
            </CardTitle>
            <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-1">
              {formatCurrency(totalEmAtraso)}
            </div>
            <p className="text-sm text-gray-500 flex items-center">
              <CreditCard className="h-4 w-4 mr-1" />
              {parcelas.length} parcelas pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Empresas Devedoras
            </CardTitle>
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
              <Building className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {totalEmpresas}
            </div>
            <p className="text-sm text-gray-500 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Clientes com pendências
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Média de Atraso
            </CardTitle>
            <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {mediaAtraso}
            </div>
            <p className="text-sm text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Dias em média
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-purple-600"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Situação Crítica
            </CardTitle>
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {parcelasCriticas}
            </div>
            <p className="text-sm text-gray-500">Parcelas 60 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert para situação crítica */}
      {parcelasCriticas > 0 && (
        <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-700 dark:text-red-300">
                  Atenção: Situação Crítica Detectada!
                </h3>
                <p className="text-red-600 dark:text-red-400 mt-1">
                  {parcelasCriticas} parcelas com mais de 60 dias de atraso
                  totalizando {formatCurrency(valorCritico)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
