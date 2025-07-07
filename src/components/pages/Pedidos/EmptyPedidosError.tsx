import { ClipboardX, RefreshCw, ArrowLeft, PackageSearch } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LogoDark from "@/assets/logo.png";
import LogoLight from "@/assets/logoBranco.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const ThemeAwareLogo = () => {
  return (
    <>
      {/* Logo para tema claro - escondido no tema escuro */}
      <img
        src={LogoDark}
        alt="logo polar fix"
        className="px-18 mb-1 dark:hidden"
      />
      {/* Logo para tema escuro - escondido no tema claro */}
      <img
        src={LogoLight}
        alt="logo polar fix"
        className="px-18 mb-1 hidden dark:block"
      />
    </>
  );
};
type EmptyPedidosErrorProps = {
  message?: string;
  onRetry: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  logoUrl?: string;
};

export default function EmptyPedidosError({
  message = "Não foram encontrados pedidos para o período selecionado.",
  onRetry,
  onBack,
  showBackButton = true,
}: EmptyPedidosErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full py-1">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="flex items-center justify-center pb-0">
          <ThemeAwareLogo />
        </CardHeader>

        <CardContent>
          <Alert className="bg-orange-50 border-orange-200 ">
            <ClipboardX className="h-5 w-5 text-orange-500 dark:text-black mt-1" />
            <AlertTitle className="text-orange-700 font-medium text-lg mb-2">
              Nenhum pedido encontrado
            </AlertTitle>
            <AlertDescription className="text-orange-600">
              {message}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-center mt-8">
            <div className="rounded-full bg-slate-100 p-6">
              <PackageSearch size={48} className="text-slate-400" />
            </div>
          </div>

          <div className="text-center mt-6 text-slate-600">
            <p>
              Verifique se você tem acesso aos pedidos ou se existem pedidos cadastrados no
              sistema.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3 justify-center pt-2 pb-6">
          <Button
            onClick={onRetry}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>

          {showBackButton && onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="border-slate-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
