import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Wallet,
  Boxes,
  FileText,
  Users,
  Truck,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Module not yet implemented in this prototype phase. */
  comingSoon?: boolean;
}

// The full ERP module map. Only Dashboard + Produits are live in this phase;
// the rest are shown as "Bientôt" so the demo conveys the full scope.
export const navItems: NavItem[] = [
  { label: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { label: "Produits", href: "/produits", icon: Package },
  { label: "Achats", href: "/achats", icon: ShoppingCart },
  { label: "Ventes", href: "/ventes", icon: Receipt },
  { label: "Frais", href: "/frais", icon: Wallet },
  { label: "Stock", href: "/stock", icon: Boxes },
  { label: "Factures", href: "/factures", icon: FileText, comingSoon: true },
  { label: "Clients", href: "/clients", icon: Users },
  {
    label: "Fournisseurs",
    href: "/fournisseurs",
    icon: Truck,
  },
  { label: "Rapports", href: "/rapports", icon: BarChart3, comingSoon: true },
];
