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
  /** Translation key (see lib/i18n). */
  tKey: string;
  href: string;
  icon: LucideIcon;
  /** Module not yet implemented in this prototype phase. */
  comingSoon?: boolean;
}

// The full ERP module map.
export const navItems: NavItem[] = [
  { tKey: "nav.dashboard", href: "/", icon: LayoutDashboard },
  { tKey: "nav.produits", href: "/produits", icon: Package },
  { tKey: "nav.achats", href: "/achats", icon: ShoppingCart },
  { tKey: "nav.ventes", href: "/ventes", icon: Receipt },
  { tKey: "nav.frais", href: "/frais", icon: Wallet },
  { tKey: "nav.stock", href: "/stock", icon: Boxes },
  { tKey: "nav.factures", href: "/factures", icon: FileText },
  { tKey: "nav.clients", href: "/clients", icon: Users },
  { tKey: "nav.fournisseurs", href: "/fournisseurs", icon: Truck },
  { tKey: "nav.rapports", href: "/rapports", icon: BarChart3 },
];
