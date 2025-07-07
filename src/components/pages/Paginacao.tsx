import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

interface PaginacaoProps {
  currentPage: number; // Página atual (base 1)
  pageCount: number; // Total de páginas
  onPageChange: (page: number) => void; // Função para mudar de página
}

export const Paginacao = ({
  currentPage,
  pageCount,
  onPageChange,
}: PaginacaoProps) => {
  return (
    <Pagination>
      <PaginationContent>
        {/* Botão "Anterior" */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            // Desabilitar o botão se não houver página anterior
            style={{ pointerEvents: currentPage > 1 ? "auto" : "none" }}
            className={currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""}
          />
        </PaginationItem>

        {/* Lógica para mostrar apenas 3 páginas */}
        {(() => {
          const pages = [];

          // Sempre mostrar 3 páginas
          if (pageCount <= 3) {
            // Se houver 3 ou menos páginas, mostrar todas
            for (let i = 1; i <= pageCount; i++) {
              pages.push(
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === i}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(i);
                    }}
                  >
                    {i}
                  </PaginationLink>
                </PaginationItem>
              );
            }
          } else {
            // Se houver mais de 3 páginas, mostrar apenas 3
            if (currentPage <= 2) {
              // Páginas iniciais: 1 2 3
              for (let i = 1; i <= 3; i++) {
                pages.push(
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(i);
                      }}
                    >
                      {i}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
            } else if (currentPage >= pageCount - 1) {
              // Páginas finais: N-2 N-1 N
              for (let i = pageCount - 2; i <= pageCount; i++) {
                pages.push(
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(i);
                      }}
                    >
                      {i}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
            } else {
              // Páginas do meio: X-1 X X+1
              for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pages.push(
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(i);
                      }}
                    >
                      {i}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
            }
          }

          return pages;
        })()}

        {/* Botão "Próximo" */}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < pageCount) onPageChange(currentPage + 1);
            }}
            // Desabilitar o botão se não houver próxima página
            style={{ pointerEvents: currentPage < pageCount ? "auto" : "none" }}
            className={
              currentPage >= pageCount ? "opacity-50 cursor-not-allowed" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};