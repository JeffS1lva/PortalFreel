import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParcelaAtrasada } from "@/types/parcelaAtrasada";
import { formatCurrency } from "@/utils/boletos/formatters";
import {
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  CreditCard,
} from "lucide-react";
import {
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Bar,
  Area,
  AreaChart,
} from "recharts";

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
  const maiorAtraso =
    parcelas.length > 0 ? Math.max(...parcelas.map((p) => p.diasAtraso)) : 0;
  // Cálculo de parcelas críticas (mais de 60 dias)
  const parcelasCriticas = parcelas.filter((p) => p.diasAtraso > 60).length;
  const valorCritico = parcelas
    .filter((p) => p.diasAtraso > 60)
    .reduce((sum, p) => sum + p.saldoDevido, 0);

  // Dados para gráficos
  const dadosBarras = parcelas
    .reduce((acc, parcela) => {
      const empresa = parcela.nomeParceiroNegocio;
      const existingEmpresa = acc.find((item) => item.empresa === empresa);
      if (existingEmpresa) {
        existingEmpresa.valor += parcela.saldoDevido;
        existingEmpresa.quantidade += 1;
      } else {
        acc.push({
          empresa:
            empresa.length > 15 ? empresa.substring(0, 15) + "..." : empresa,
          empresaCompleta: empresa,
          valor: parcela.saldoDevido,
          quantidade: 1,
        });
      }
      return acc;
    }, [] as Array<{ empresa: string; empresaCompleta: string; valor: number; quantidade: number }>)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8); // Top 8 empresas

  const faixasAtraso = parcelas.reduce((acc, parcela) => {
    let faixa = "";
    let cor = "";
    if (parcela.diasAtraso <= 30) {
      faixa = "1-30 dias";
      cor = "#fbbf24"; // Amarelo
    } else if (parcela.diasAtraso <= 60) {
      faixa = "31-60 dias";
      cor = "#f59e0b"; // Laranja
    } else if (parcela.diasAtraso <= 90) {
      faixa = "61-90 dias";
      cor = "#ef4444"; // Vermelho
    } else {
      faixa = "Mais de 90 dias";
      cor = "#dc2626"; // Vermelho escuro
    }

    const existing = acc.find((item) => item.faixa === faixa);
    if (existing) {
      existing.valor += parcela.saldoDevido;
      existing.quantidade += 1;
    } else {
      acc.push({ faixa, valor: parcela.saldoDevido, quantidade: 1, cor });
    }
    return acc;
  }, [] as Array<{ faixa: string; valor: number; quantidade: number; cor: string }>);

  // Dados para gráfico de tendência por faixa de valor
  const faixasValor = parcelas.reduce((acc, parcela) => {
    let faixa = "";
    if (parcela.saldoDevido <= 1000) faixa = "Até R$ 1.000";
    else if (parcela.saldoDevido <= 5000) faixa = "R$ 1.001 - R$ 5.000";
    else if (parcela.saldoDevido <= 10000) faixa = "R$ 5.001 - R$ 10.000";
    else faixa = "Acima de R$ 10.000";

    const existing = acc.find((item) => item.faixa === faixa);
    if (existing) {
      existing.valor += parcela.saldoDevido;
      existing.quantidade += 1;
    } else {
      acc.push({ faixa, valor: parcela.saldoDevido, quantidade: 1 });
    }
    return acc;
  }, [] as Array<{ faixa: string; valor: number; quantidade: number }>);

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

      {/* Gráficos principais */}
      {parcelas.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
                Top Empresas em Atraso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={dadosBarras}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor="#dc2626"
                        stopOpacity={0.7}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="empresa"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={11}
                    stroke="#6b7280"
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `R$ ${(value / 1000).toFixed(0)}k`
                    }
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: number, _name: string, _props: any) => [
                      formatCurrency(value),
                      "Valor em Atraso",
                    ]}
                    labelFormatter={(label: string, payload: any) => {
                      const item = payload?.[0]?.payload;
                      return item ? (
                        <div>
                          <p className="font-semibold">
                            {item.empresaCompleta}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.quantidade} parcela(s)
                          </p>
                        </div>
                      ) : (
                        label
                      );
                    }}
                  />
                  <Bar
                    dataKey="valor"
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <Clock className="h-6 w-6 mr-2 text-purple-600" />
                Distribuição por Tempo de Atraso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <defs>
                    {faixasAtraso.map((entry, index) => (
                      <linearGradient
                        key={index}
                        id={`pieGradient${index}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={entry.cor}
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor={entry.cor}
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={faixasAtraso}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ faixa, percent }) =>
                      `${faixa}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valor"
                  >
                    {faixasAtraso.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#pieGradient${index})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: number, _name: string, _props: any) => [
                      formatCurrency(value),
                      "Valor Total",
                    ]}
                    labelFormatter={(label: string, payload: any) => {
                      const item = payload?.[0]?.payload;
                      return item ? (
                        <div>
                          <p className="font-semibold">{label}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantidade} parcela(s)
                          </p>
                        </div>
                      ) : (
                        label
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico adicional - Distribuição por faixa de valor */}
      {parcelas.length > 0 && (
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 mb-8">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <DollarSign className="h-6 w-6 mr-2 text-green-600" />
              Análise por Faixa de Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={faixasValor}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="faixa" fontSize={12} stroke="#6b7280" />
                <YAxis
                  tickFormatter={(value) => `${value}`}
                  stroke="#6b7280"
                  label={{
                    value: "Quantidade",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: number, _name: string, _props: any) => [
                    `${value} parcela(s)`,
                    "Quantidade",
                  ]}
                  labelFormatter={(label: string, payload: any) => {
                    const item = payload?.[0]?.payload;
                    return item ? (
                      <div>
                        <p className="font-semibold">{label}</p>
                        <p className="text-sm text-gray-500">
                          Total: {formatCurrency(item.valor)}
                        </p>
                      </div>
                    ) : (
                      label
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="quantidade"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Footer com estatísticas resumidas */}
      <Card className="border-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {Math.round((parcelasCriticas / parcelas.length) * 100) || 0}%
              </div>
              <p className="text-gray-300">Parcelas Críticas</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">
                {formatCurrency(totalEmAtraso / totalEmpresas || 0)}
              </div>
              <p className="text-gray-300">Média por Empresa</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {maiorAtraso}
              </div>
              <p className="text-gray-300">Maior Atraso (dias)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
