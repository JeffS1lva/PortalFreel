// src/components/pdf-viewer/PDFLoading.tsx
export function PDFLoading() {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center max-w-md">
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-500">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        </div>
        <p className="font-medium text-gray-900 dark:text-white">Carregando seu Documento</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aguarde um momento</p>
      </div>
    </div>
  );
}