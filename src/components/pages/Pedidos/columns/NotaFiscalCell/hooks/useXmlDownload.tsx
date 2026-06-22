import { useNavigate } from "react-router-dom";
import axios from "@/utils/axiosConfig";
import { toast } from "sonner";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";

interface UseXmlDownloadParams {
  companyCode: string;
  chaveNFe: string;
  notaFiscal: string | number;
  enabled: boolean;
}

export const useXmlDownload = ({
  companyCode,
  chaveNFe,
  notaFiscal,
  enabled,
}: UseXmlDownloadParams) => {
  const navigate = useNavigate();

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!enabled) return;

    try {
      const token = tokenStore.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${apiBase}/FileXML/download/${companyCode}/NFe${chaveNFe}.xml`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/zip",
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/xml" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `nota-${notaFiscal}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      toast.success(`Download da nota ${notaFiscal} concluído!`, {
        description: "Arquivo .zip salvo com sucesso.",
        duration: 5000,
        style: {
          backgroundColor: "white",
          color: "green",
          boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
        },
      });
    } catch (error) {
      toast.error("Erro ao baixar XML", {
        description: "Verifique os dados da nota ou tente novamente.",
        style: {
          backgroundColor: "white",
          color: "red",
          boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
        },
      });
    }
  };

  return { handleDownload };
};