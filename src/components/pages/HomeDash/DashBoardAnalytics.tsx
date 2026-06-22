import type { ParcelaAtrasada } from "@/types/parcelaAtrasada";
import { formatCurrency } from "@/utils/boletos/formatters";
import { useNavigate } from "react-router-dom";
import { tokenStore } from "@/utils/tokenStore";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

type Urgencia = "critica" | "atencao" | "recente";

function getUrgencia(dias: number): Urgencia {
  if (dias > 60) return "critica";
  if (dias > 30) return "atencao";
  return "recente";
}

const urgenciaConfig = {
  critica: {
    label: "Crítico",
    badgeBg: "bg-red-100 dark:bg-red-900/40",
    badgeText: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    glow: "shadow-red-500/20",
    diasText: "text-red-500 dark:text-red-400",
  },
  atencao: {
    label: "Atenção",
    badgeBg: "bg-amber-100 dark:bg-amber-900/40",
    badgeText: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    glow: "shadow-amber-500/20",
    diasText: "text-amber-500 dark:text-amber-400",
  },
  recente: {
    label: "Recente",
    badgeBg: "bg-sky-100 dark:bg-sky-900/40",
    badgeText: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    glow: "shadow-sky-500/20",
    diasText: "text-sky-500 dark:text-sky-400",
  },
};

function agruparPorCliente(parcelas: ParcelaAtrasada[]) {
  const map = new Map<string, { nome: string; total: number; maxDias: number; qtd: number }>();
  for (const p of parcelas) {
    const ex = map.get(p.codigoParceiroNegocio);
    if (ex) {
      ex.total += p.saldoDevido;
      ex.maxDias = Math.max(ex.maxDias, p.diasAtraso);
      ex.qtd += 1;
    } else {
      map.set(p.codigoParceiroNegocio, {
        nome: p.nomeParceiroNegocio,
        total: p.saldoDevido,
        maxDias: p.diasAtraso,
        qtd: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.maxDias - a.maxDias || b.total - a.total);
}

function getUserName() {
  try {
    const auth = tokenStore.getAuthData();
    if (auth) {
      const d = JSON.parse(auth);
      const full = d.nome || d.name || d.nomeUsuario || "";
      return full.split(" ")[0] || null;
    }
  } catch { /* */ }
  return null;
}

export const DashboardAnalytics = ({ parcelas }: { parcelas: ParcelaAtrasada[] }) => {
  const navigate = useNavigate();
  const userName = getUserName();
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const totalEmAtraso = parcelas.reduce((s, p) => s + p.saldoDevido, 0);
  const totalClientes = new Set(parcelas.map((p) => p.codigoParceiroNegocio)).size;
  const criticas = parcelas.filter((p) => p.diasAtraso > 60);
  const maiorAtraso = parcelas.length ? Math.max(...parcelas.map((p) => p.diasAtraso)) : 0;
  const clientesAgrupados = agruparPorCliente(parcelas);
  const top5 = clientesAgrupados.slice(0, 5);

  if (parcelas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl scale-150" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Carteira em dia!</h2>
          <p className="text-muted-foreground mt-1">Nenhuma parcela em atraso no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header sofisticado */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-muted/30 to-background p-5 my-4">
        {/* Ornamento de fundo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/5 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-primary/5 blur-xl" />
        </div>

        <div className="relative flex items-start justify-between gap-4">
          {/* Esquerda: avatar + textos */}
          <div className="flex items-center gap-3.5">
            {/* Avatar com inicial */}
            {userName && (
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-md shadow-primary/20 text-primary-foreground font-bold text-lg select-none">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
            )}

            <div>
              {/* Pill de saudação */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/15 mb-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-semibold text-primary tracking-wide">
                  {saudacao}{userName ? `, ${userName}` : ""}!
                </span>
              </div>

              {/* Título principal */}
              <h1 className="text-xl font-bold tracking-tight leading-tight">
                <span className="text-foreground">Visão geral</span>{" "}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  da carteira
                </span>
              </h1>
            </div>
          </div>

          {/* Direita: data em pill */}
          <div className="shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/60 border border-border/60 text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-medium capitalize whitespace-nowrap">
              {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
        </div>
      </div>

      {/* Card hero — total em atraso */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-6 shadow-2xl border border-slate-700/50">
        {/* Glow decorativo */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                Total em aberto
              </span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {formatCurrency(totalEmAtraso)}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              {parcelas.length} {parcelas.length === 1 ? "parcela" : "parcelas"} em atraso
            </p>
          </div>

          <button
            onClick={() => navigate("/inadimplentes")}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors shadow-lg shrink-0"
          >
            Ver detalhes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de progresso crítico */}
        {criticas.length > 0 && (
          <div className="relative mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                Parcelas críticas (+60 dias)
              </span>
              <span className="text-xs font-bold text-red-400">{criticas.length} de {parcelas.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400"
                style={{ width: `${(criticas.length / parcelas.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Banner crítico */}
      {criticas.length > 0 && (
        <button
          onClick={() => navigate("/inadimplentes")}
          className="group w-full flex items-center gap-4 p-4 rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-red-700 dark:text-red-300">
              {criticas.length} {criticas.length === 1 ? "cliente precisa" : "clientes precisam"} de ação imediata
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
              {formatCurrency(criticas.reduce((s, p) => s + p.saldoDevido, 0))} em situação crítica
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      )}

      {/* Métricas secundárias */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{totalClientes}</p>
            <p className="text-xs text-muted-foreground mt-1">clientes em atraso</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{maiorAtraso}</p>
            <p className="text-xs text-muted-foreground mt-1">dias, maior atraso</p>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground text-sm">Prioridades de cobrança</h2>
          </div>
          <button
            onClick={() => navigate("/inadimplentes")}
            className="text-xs text-primary font-semibold hover:underline underline-offset-2"
          >
            Ver todos →
          </button>
        </div>

        <div className="divide-y divide-border">
          {top5.map((cliente, i) => {
            const urg = getUrgencia(cliente.maxDias);
            const cfg = urgenciaConfig[urg];
            return (
              <button
                key={i}
                onClick={() => navigate("/inadimplentes")}
                className="group w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
              >
                {/* Número */}
                <span className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${i === 0 ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300" : "bg-muted text-muted-foreground"}
                `}>
                  {i + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{cliente.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <span className={`text-xs font-medium ${cfg.diasText}`}>
                      {cliente.maxDias} dias
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {cliente.qtd} {cliente.qtd === 1 ? "parcela" : "parcelas"}
                    </span>
                  </div>
                </div>

                {/* Valor + badge */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-foreground">{formatCurrency(cliente.total)}</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                    {cfg.label}
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            );
          })}
        </div>

        {clientesAgrupados.length > 5 && (
          <button
            onClick={() => navigate("/inadimplentes")}
            className="w-full px-5 py-3.5 border-t border-border text-xs text-primary font-semibold text-center hover:bg-muted/30 transition-colors"
          >
            + {clientesAgrupados.length - 5} outros clientes — ver lista completa
          </button>
        )}
      </div>
    </div>
  );
};
