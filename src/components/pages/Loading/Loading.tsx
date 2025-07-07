import { useState, useEffect } from 'react';
import LogoBrowser from "@/assets/logoBrowser.png"; 

// Tipos para as propriedades dos componentes
interface FancyLoadingProps {
  message?: string; // Mensagem de carregamento (agora opcional)
  isLoading: boolean;  // Estado de carregamento controlado pelo pai
  onLoadingComplete?: () => void;  // Callback quando carregamento terminar
}

interface CompanyLogoProps {
  className?: string;
  pulseColor?: string;
}

interface LinearProgressProps {
  isAnimating: boolean;
}

// Componente de Logo da Empresa
const CompanyLogo = ({ className = "", pulseColor = "bg-blue-500" }: CompanyLogoProps) => {
  return (
    <div className={`relative ${className}`}>
      {/* Logo */}
      <img
        src={LogoBrowser}
        alt="company logo"
        className="w-20"
      />
      
      {/* Efeito de pulso */}
      <div className={`absolute inset-0 rounded-full ${pulseColor} animate-ping opacity-20`}></div>
      
      {/* Efeito de brilho */}
      <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-20 animate-pulse"></div>
    </div>
  );
};

// Componente de Progresso Linear sem porcentagem
const LinearProgress = ({ isAnimating }: LinearProgressProps) => {
  return (
    <div className="relative">
      {/* Barra de progresso personalizada com fundo de gradiente animado */}
      <div className="h-4 bg-gray-200 rounded-lg overflow-hidden relative">
        {/* Barra de progresso com gradiente linear */}
        <div 
          className={`h-full w-full bg-gradient-to-r from-yellow-500 via-blue-400 to-yellow-500 rounded-lg ${isAnimating ? 'animate-gradient' : ''}`}
          style={{ 
            backgroundSize: '200% 100%',
          }}
        ></div>
      </div>
    </div>
  );
};

// Componente principal de carregamento
const FancyLoading = ({ 
  message = "Carregando dados...", 
  isLoading,
  onLoadingComplete
}: FancyLoadingProps) => {
  const [isComplete, setIsComplete] = useState(false);
  
  // Gerencia o estado completo
  useEffect(() => {
    if (!isLoading && !isComplete) {
      setIsComplete(true);
      onLoadingComplete?.();
    }
  }, [isLoading, isComplete, onLoadingComplete]);

  // Adiciona animações personalizadas ao Tailwind
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes orbit-1 {
        0% { transform: rotate(0deg) translateX(45px) rotate(0deg); }
        100% { transform: rotate(360deg) translateX(45px) rotate(-360deg); }
      }
      @keyframes orbit-2 {
        0% { transform: rotate(0deg) translateX(35px) rotate(0deg); }
        100% { transform: rotate(-360deg) translateX(35px) rotate(360deg); }
      }
      @keyframes orbit-3 {
        0% { transform: rotate(0deg) translateX(55px) rotate(0deg); }
        100% { transform: rotate(360deg) translateX(55px) rotate(-360deg); }
      }
      @keyframes orbit-4 {
        0% { transform: rotate(90deg) translateX(50px) rotate(-90deg); }
        100% { transform: rotate(-270deg) translateX(50px) rotate(270deg); }
      }
      
      @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      .animate-gradient {
        animation: gradient 5s linear infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Não exibir nada se já completou e não está mais carregando
  if (isComplete && !isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-64 w-full mt-8">
      <div className="relative mb-6">
        {/* Logo animado */}
        <div className="relative">
          <div className="absolute -inset-1 bg-blue-500 rounded-full opacity-30 blur-md animate-pulse"></div>
          <CompanyLogo className="w-28 h-28 mb-4 relative z-10" />
        </div>
        
        {/* Círculos orbitando o logo */}
        <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50" style={{ animation: 'orbit-1 3s linear infinite' }}></div>
          <div className="absolute w-2 h-2 bg-blue-300 rounded-full shadow-lg shadow-blue-500/50" style={{ animation: 'orbit-2 4s linear infinite' }}></div>
          <div className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" style={{ animation: 'orbit-3 5s linear infinite' }}></div>
          <div className="absolute w-2 h-2 bg-indigo-400 rounded-full shadow-lg shadow-indigo-500/50" style={{ animation: 'orbit-4 6s linear infinite' }}></div>
        </div>
      </div>
      
      <div className="w-full max-w-xs space-y-3">
        {/* Barra de progresso linear sem porcentagem */}
        <LinearProgress isAnimating={isLoading} />
        
        {/* Mensagem de carregamento com efeito de pulso */}
        <div className="flex flex-col items-center justify-center mt-2">
          <p className="text-center text-zinc-700 dark:text-zinc-500 font-medium text-lg animate-pulse">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente LoadingExample com capacidade de receber uma mensagem personalizada
const LoadingExample = ({ message = "Carregando dados..." }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className="p-6">
      <FancyLoading 
        message={message} 
        isLoading={isLoading}
        onLoadingComplete={() => setIsLoading(false)}
      />
    </div>
  );
};

export default LoadingExample;