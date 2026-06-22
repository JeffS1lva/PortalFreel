// components/pages/MaintenancePage.tsx
"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Wrench, ExternalLink } from "lucide-react";

export function MaintenancePage() {
  const [dots, setDots] = useState("");

  // Animação dos pontinhos "..."
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Ícones flutuantes decorativos */}
        <div className="absolute top-20 left-20 text-slate-700/20 animate-bounce delay-700">
          <Wrench size={48} />
        </div>
        <div className="absolute bottom-32 right-20 text-slate-700/20 animate-bounce delay-1000">
          <AlertTriangle size={40} />
        </div>
        <div className="absolute top-1/3 right-1/4 text-slate-700/10 animate-pulse">
          <Clock size={56} />
        </div>
      </div>

      {/* Card principal */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          
          {/* Ícone principal animado */}
          <div className="mb-8 relative inline-block">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-6 shadow-lg">
              <Wrench size={64} className="text-white" style={{ 
                animation: 'spin 3s linear infinite' 
              }} />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Em Manutenção{dots}
          </h1>

          {/* Subtítulo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <AlertTriangle className="text-amber-400" size={24} />
            <p className="text-xl text-amber-200 font-medium">
              Temporariamente fora do ar
            </p>
            <AlertTriangle className="text-amber-400" size={24} />
          </div>

          {/* Descrição */}
          <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-lg mx-auto">
            Estamos realizando melhorias e atualizações em nossa plataforma 
            para oferecer uma experiência ainda melhor. Voltaremos em breve!
          </p>

          {/* Barra de progresso decorativa */}
          <div className="mb-10 max-w-md mx-auto">
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                style={{
                  width: '60%',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite linear'
                }} 
              />
            </div>
            <p className="text-slate-400 text-sm mt-2">Progresso da manutenção</p>
          </div>

          {/* Botão de ação */}
          <a
            href="https://polarfix.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-amber-500/25 group cursor-pointer"
          >
            <span>Visitar Site</span>
            <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Polar Fix Industria e Comercio de Produtos Hospitalares Ltda. Todos os direitos reservados.
            </p>
            <div className="flex items-center justify-center gap-2 mt-2 text-slate-600 text-xs">
              <Clock size={14} />
              <span>Previsão de retorno: Em breve</span>
            </div>
          </div>
        </div>

        {/* Aviso de segurança */}
        <div className="mt-6 text-center">
          <p className="text-slate-500/60 text-xs">
            🔒 Acesso à plataforma temporariamente suspenso para manutenção programada
          </p>
        </div>
      </div>

      {/* Estilos customizados para animações */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}