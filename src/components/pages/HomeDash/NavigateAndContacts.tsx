import {
  AlertTriangle,
  ArrowUpRight,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  ScanBarcode,
  ShoppingBag,
  Truck,
  Youtube,
} from "lucide-react";

const navItems = [
  {
    title: "Pedidos",
    description: "Consulte e acompanhe seus pedidos",
    url: "/pedidos",
    icon: ShoppingBag,
    gradient: "from-blue-500 to-indigo-600",
    glow: "shadow-blue-500/25",
    ring: "group-hover:ring-blue-500/30",
  },
  {
    title: "Boletos",
    description: "Acesse e gerencie seus boletos",
    url: "/boletos",
    icon: ScanBarcode,
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/25",
    ring: "group-hover:ring-violet-500/30",
  },
  {
    title: "Inadimplentes",
    description: "Veja parcelas e contas em atraso",
    url: "/inadimplentes",
    icon: AlertTriangle,
    gradient: "from-rose-500 to-red-600",
    glow: "shadow-rose-500/25",
    ring: "group-hover:ring-rose-500/30",
  },
  {
    title: "Rastrear Pedidos",
    description: "Acompanhe a entrega em tempo real",
    url: "/rastreio-pedidos",
    icon: Truck,
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/25",
    ring: "group-hover:ring-emerald-500/30",
  },
];

const contactItems = [
  {
    href: "tel:1145128600",
    label: "Comercial",
    sub: "(11) 4512-8600",
    icon: Phone,
    bg: "bg-slate-800 hover:bg-slate-700",
    iconBg: "bg-slate-600",
  },
  {
    href: "https://api.whatsapp.com/send?phone=551145128600",
    label: "WhatsApp",
    sub: "Fale conosco",
    icon: Phone,
    bg: "bg-[#128C7E] hover:bg-[#0f7568]",
    iconBg: "bg-[#075E54]",
  },
  {
    href: "https://mail.google.com/mail/?view=cm&fs=1&to=vendas20@polarfix.com.br&su=Contato%20via%20site%20Polar%20Fix",
    label: "E-mail",
    sub: "vendas@polarfix",
    icon: Mail,
    bg: "bg-red-600 hover:bg-red-700",
    iconBg: "bg-red-800",
  },
  {
    href: "https://www.instagram.com/polar_fix/",
    label: "Instagram",
    sub: "@polar_fix",
    icon: Instagram,
    bg: "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:opacity-90",
    iconBg: "bg-white/20",
  },
  {
    href: "https://www.linkedin.com/company/polar-fix/",
    label: "LinkedIn",
    sub: "polar-fix",
    icon: Linkedin,
    bg: "bg-[#0077B5] hover:bg-[#006097]",
    iconBg: "bg-[#005885]",
  },
  {
    href: "https://www.youtube.com/@PolarFixHospitalar",
    label: "YouTube",
    sub: "@PolarFixHospitalar",
    icon: Youtube,
    bg: "bg-[#CC0000] hover:bg-[#aa0000]",
    iconBg: "bg-[#990000]",
  },
];

export const NavigationAndContacts = () => {
  return (
    <div className="space-y-6">

      {/* Navegação rápida */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-0.5">
          Acesso rápido
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {navItems.map((item) => (
            <a
              key={item.url}
              href={item.url}
              className={`group relative flex flex-col gap-3 p-4 rounded-2xl border border-border bg-card hover:border-transparent transition-all duration-300 hover:shadow-xl ${item.glow} hover:ring-2 ${item.ring} hover:-translate-y-0.5`}
            >
              {/* Ícone */}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg ${item.glow}`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>

              {/* Texto */}
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {item.description}
                </p>
              </div>

              {/* Seta */}
              <ArrowUpRight className="absolute top-4 right-4 w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>
          ))}
        </div>
      </div>

      {/* Contatos */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-0.5">
          Fale com a Polar Fix
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {contactItems.map((c) => (
            <a
              key={c.href}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`group flex items-center gap-2.5 px-3 py-3 rounded-2xl ${c.bg} transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
            >
              <div className={`w-8 h-8 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0`}>
                <c.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-none">{c.label}</p>
                <p className="text-[10px] text-white/70 mt-0.5 truncate">{c.sub}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
