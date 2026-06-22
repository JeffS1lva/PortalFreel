// src/utils/statusConfig.ts
import { Circle, Package, Ban, Check, ShoppingCart, AlertCircle, PackageOpen } from "lucide-react";

export interface StatusConfig {
  classes: string;
  icon: JSX.Element;
  text: string;
}

export const getStatusConfig = (status: string): StatusConfig => {
  const config: StatusConfig = {
    classes: "",
    icon: <Circle className="h-3 w-3 mr-1" />,
    text: status,
  };

  switch (status) {
    case "Aberto":
      config.classes = "w-32 bg-yellow-100 text-yellow-800";
      config.icon = <PackageOpen className="h-3 w-3 mr-1" />;
      config.text = "Aberto";
      break;
    case "Fechado":
      config.classes = "w-32 bg-green-100 text-green-800";
      config.icon = <Package className="h-3 w-3 mr-1" />;
      config.text = "Fechado";
      break;
    case "Cancelado":
      config.classes = "w-32 bg-red-100 text-red-800";
      config.icon = <Ban className="h-3 w-3 mr-1" />;
      config.text = "Cancelado";
      break;
    case "Liberado":
      config.classes = "w-32 bg-blue-100 text-blue-800";
      config.icon = <Check className="h-3 w-3 mr-1" />;
      config.text = "Liberado";
      break;
    case "Picking eft.":
      config.classes = "w-32 bg-purple-100 text-purple-800";
      config.icon = <ShoppingCart className="h-3 w-3 mr-1" />;
      config.text = "Picking eft.";
      break;
    case "Indisponível":
      config.classes = "w-32 bg-red-200 text-gray-800";
      config.icon = <AlertCircle className="h-3 w-3 mr-1" />;
      config.text = "Indisponível";
      break;
    default:
      config.classes = "w-32 bg-red-400 text-gray-800";
      config.icon = <Ban className="h-3 w-3 mr-1" />;
      config.text = status || "Inexistente";
  }

  return config;
};