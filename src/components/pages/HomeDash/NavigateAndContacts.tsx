import {
  AlertTriangle,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  ScanBarcode,
  ShoppingBag,
  Truck,
  Youtube,
} from "lucide-react";

export const NavigationAndContacts = () => {
  const navigationItems = [
    { title: "Pedidos", url: "/pedidos", icon: ShoppingBag },
    { title: "Boletos", url: "/boletos", icon: ScanBarcode },
    { title: "Inadimplentes", url: "/inadimplentes", icon: AlertTriangle },
    { title: "Rastrear Pedidos", url: "/rastreio-pedidos", icon: Truck },
  ];

  const contactItems = [
    {
      href: "tel:1145128600",
      title: "Comercial",
      icon: Phone,
      text: "(11) 4512-8600",
      hoverColor: "hover:bg-slate-900",
    },
    {
      href: "https://www.instagram.com/polar_fix/",
      title: "Instagram",
      icon: Instagram,
      text: "Instagram",
      hoverColor: "hover:bg-zinc-900",
    },
    {
      href: "https://api.whatsapp.com/send?phone=551145128600",
      title: "WhatsApp",
      icon: Phone,
      text: "WhatsApp",
      hoverColor: "hover:bg-[#25D366] dark:hover:bg-[#25D366]",
    },
    {
      href: "https://mail.google.com/mail/?view=cm&fs=1&to=vendas20@polarfix.com.br&su=Contato%20via%20site%20Polar%20Fix&body=Ol%C3%A1%20equipe%20Polar%20Fix%2C%0A%0AGostaria%20de%20obter%20mais%20informa%C3%A7%C3%B5es%20sobre%20os%20produtos%20e%20servi%C3%A7os%20oferecidos.%0A%0AAtenciosamente%2C%0A",
      title: "E-mail",
      icon: Mail,
      text: "E-mail",
      hoverColor: "hover:bg-red-800 dark:hover:bg-[#c4302b]",
    },
    {
      href: "https://www.linkedin.com/company/polar-fix/posts/?feedView=all",
      title: "Linkedin",
      icon: Linkedin,
      text: "Linkedin",
      hoverColor: "hover:bg-[#2867b2] dark:hover:bg-[#2867b2]",
    },
    {
      href: "https://www.youtube.com/@PolarFixHospitalar",
      title: "Youtube",
      icon: Youtube,
      text: "Youtube",
      hoverColor: "hover:bg-[#c4302b] dark:hover:bg-[#c4302b]",
    },
  ];

  return (
    <div className="my-4 md:my-5">
      <div className="flex flex-col sm:flex">
        {/* Navegação */}
        <div className="grid grid-cols-1 sm:grid-cols-4 xs:grid-cols-4 md:grid-cols-4 gap-4">
          {navigationItems.map((item, index) => (
            <a
              key={index}
              href={item.url}
              className="flex flex-col items-center justify-center bg-white dark:bg-zinc-800 py-2 px-1 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <div className="bg-primary dark:bg-zinc-700 p-2 md:p-3 rounded-full mb-1 md:mb-2">
                <item.icon size={20} className="text-white" />
              </div>
              <span className="font-medium text-sm md:text-base text-zinc-800 dark:text-zinc-100">
                {item.title}
              </span>
            </a>
          ))}
        </div>

        {/* Contatos */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 sm:grid-cols-3 gap-2 w-full mt-4">
          {contactItems.map((contact, index) => (
            <a
              key={index}
              href={contact.href}
              target={contact.href.startsWith("http") ? "_blank" : undefined}
              rel={
                contact.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              title={contact.title}
              className={`flex justify-center items-center gap-2 md:gap-3 sm:w-full bg-primary dark:bg-zinc-700 shadow-sm shadow-black dark:shadow-zinc-900 px-3 py-2 rounded-sm ${contact.hoverColor} hover:text-white text-primary-foreground dark:text-white transition-colors`}
            >
              <contact.icon
                size={contact.title === "Comercial" ? 16 : 18}
                className="flex-shrink-0"
              />
              <span className="font-medium text-sm md:text-base">
                {contact.text}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
