// src/components/pdf-viewer/PDFError.tsx
interface PDFErrorProps {
  onClose: () => void;
}

export function PDFError({ onClose }: PDFErrorProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center max-w-md">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full inline-flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-red-500">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Não foi possível carregar o documento
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
          Estamos com dificuldades para acessar este documento no momento. 
          Por favor, tente novamente mais tarde ou contate o suporte.
        </p>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}