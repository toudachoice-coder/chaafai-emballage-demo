import type { Database } from "./types";

// Stable ids for seed data so cross-references (movements, sales, invoices)
// stay consistent on first load.
const now = new Date();
const iso = (daysAgo = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const CAT = {
  alimentaire: "cat_alimentaire",
  carton: "cat_carton",
  sachets: "cat_sachets",
  hygiene: "cat_hygiene",
  consommables: "cat_consommables",
  matiere: "cat_matiere",
  autres: "cat_autres",
};

export function createSeedDatabase(): Database {
  const categories = [
    { id: CAT.alimentaire, name: "Emballage Alimentaire", createdAt: iso(40) },
    { id: CAT.carton, name: "Emballage Carton", createdAt: iso(40) },
    { id: CAT.sachets, name: "Sachets & Sacs", createdAt: iso(40) },
    { id: CAT.hygiene, name: "Hygiène & Protection", createdAt: iso(40) },
    {
      id: CAT.consommables,
      name: "Consommables Professionnels",
      createdAt: iso(40),
    },
    { id: CAT.matiere, name: "Matière Première", createdAt: iso(40) },
    { id: CAT.autres, name: "Autres", createdAt: iso(40) },
  ];

  const products = [
    {
      id: "prod_boite",
      name: "Boîte alimentaire plastique",
      categoryId: CAT.alimentaire,
      unit: "paquet (50)",
      costPrice: 28,
      sellPrice: 42,
      stock: 120,
      minStock: 30,
      sku: "ALI-BTE-01",
    },
    {
      id: "prod_sachet_kraft",
      name: "Sachet kraft",
      categoryId: CAT.sachets,
      unit: "paquet (100)",
      costPrice: 18,
      sellPrice: 30,
      stock: 24,
      minStock: 40,
      sku: "SAC-KRA-02",
    },
    {
      id: "prod_gants",
      name: "Gants jetables",
      categoryId: CAT.hygiene,
      unit: "boîte (100)",
      costPrice: 22,
      sellPrice: 38,
      stock: 75,
      minStock: 20,
      sku: "HYG-GAN-03",
    },
    {
      id: "prod_serviettes",
      name: "Serviettes papier",
      categoryId: CAT.consommables,
      unit: "carton (24)",
      costPrice: 45,
      sellPrice: 68,
      stock: 60,
      minStock: 15,
      sku: "CON-SRV-04",
    },
    {
      id: "prod_carton_patisserie",
      name: "Carton pâtisserie",
      categoryId: CAT.carton,
      unit: "paquet (25)",
      costPrice: 35,
      sellPrice: 55,
      stock: 12,
      minStock: 25,
      sku: "CAR-PAT-05",
    },
    {
      id: "prod_film",
      name: "Film alimentaire",
      categoryId: CAT.alimentaire,
      unit: "rouleau",
      costPrice: 16,
      sellPrice: 27,
      stock: 90,
      minStock: 20,
      sku: "ALI-FLM-06",
    },
    {
      id: "prod_gobelets",
      name: "Gobelets carton",
      categoryId: CAT.carton,
      unit: "paquet (50)",
      costPrice: 20,
      sellPrice: 33,
      stock: 8,
      minStock: 30,
      sku: "CAR-GOB-07",
    },
    {
      id: "prod_barquette",
      name: "Barquette aluminium",
      categoryId: CAT.alimentaire,
      unit: "paquet (50)",
      costPrice: 32,
      sellPrice: 49,
      stock: 140,
      minStock: 35,
      sku: "ALI-BRQ-08",
    },
  ].map((p) => ({ ...p, createdAt: iso(35), updatedAt: iso(2) }));

  const clients = [
    {
      id: "cli_baraka",
      name: "Snack Al Baraka",
      contact: "M. Rachid",
      phone: "0661-223344",
      email: "contact@albaraka.ma",
      address: "Av. Hassan II, Casablanca",
      createdAt: iso(30),
    },
    {
      id: "cli_atlas",
      name: "Café Atlas",
      contact: "Mme Salma",
      phone: "0662-556677",
      email: "cafe.atlas@gmail.com",
      address: "Rue de Fès, Rabat",
      createdAt: iso(28),
    },
    {
      id: "cli_amine",
      name: "Pâtisserie Amine",
      contact: "M. Amine",
      phone: "0663-889900",
      email: "patisserie.amine@gmail.com",
      address: "Bd Mohammed V, Marrakech",
      createdAt: iso(25),
    },
    {
      id: "cli_salam",
      name: "Supermarché Salam",
      contact: "Service achats",
      phone: "0664-112233",
      email: "achats@salam.ma",
      address: "Zone Industrielle, Tanger",
      createdAt: iso(20),
    },
  ];

  const suppliers = [
    {
      id: "sup_carton",
      name: "Fournisseur Carton Maroc",
      contact: "M. Tazi",
      phone: "0522-334455",
      email: "ventes@cartonmaroc.ma",
      address: "Zone Industrielle Sidi Bernoussi, Casablanca",
      createdAt: iso(45),
    },
    {
      id: "sup_plastique",
      name: "Plastique Pro",
      contact: "Mme Nadia",
      phone: "0522-667788",
      email: "commande@plastiquepro.ma",
      address: "Ain Sebaa, Casablanca",
      createdAt: iso(45),
    },
    {
      id: "sup_papier",
      name: "Papier & Hygiène Distribution",
      contact: "M. Karim",
      phone: "0537-445566",
      email: "info@papierhygiene.ma",
      address: "Témara",
      createdAt: iso(45),
    },
  ];

  const purchases = [
    {
      id: "pur_1",
      supplierId: "sup_carton",
      items: [
        {
          productId: "prod_carton_patisserie",
          name: "Carton pâtisserie",
          qty: 50,
          unitPrice: 35,
        },
        {
          productId: "prod_gobelets",
          name: "Gobelets carton",
          qty: 40,
          unitPrice: 20,
        },
      ],
      total: 50 * 35 + 40 * 20,
      date: iso(14),
      createdAt: iso(14),
    },
    {
      id: "pur_2",
      supplierId: "sup_plastique",
      items: [
        {
          productId: "prod_boite",
          name: "Boîte alimentaire plastique",
          qty: 100,
          unitPrice: 28,
        },
        {
          productId: "prod_film",
          name: "Film alimentaire",
          qty: 60,
          unitPrice: 16,
        },
      ],
      total: 100 * 28 + 60 * 16,
      date: iso(9),
      createdAt: iso(9),
    },
    {
      id: "pur_3",
      supplierId: "sup_papier",
      items: [
        {
          productId: "prod_serviettes",
          name: "Serviettes papier",
          qty: 40,
          unitPrice: 45,
        },
        {
          productId: "prod_gants",
          name: "Gants jetables",
          qty: 50,
          unitPrice: 22,
        },
      ],
      total: 40 * 45 + 50 * 22,
      date: iso(5),
      createdAt: iso(5),
    },
  ];

  const sales = [
    {
      id: "sal_1",
      clientId: "cli_baraka",
      items: [
        {
          productId: "prod_boite",
          name: "Boîte alimentaire plastique",
          qty: 30,
          unitPrice: 42,
        },
        {
          productId: "prod_film",
          name: "Film alimentaire",
          qty: 20,
          unitPrice: 27,
        },
      ],
      total: 30 * 42 + 20 * 27,
      status: "paid" as const,
      date: iso(8),
      createdAt: iso(8),
    },
    {
      id: "sal_2",
      clientId: "cli_amine",
      items: [
        {
          productId: "prod_carton_patisserie",
          name: "Carton pâtisserie",
          qty: 35,
          unitPrice: 55,
        },
      ],
      total: 35 * 55,
      status: "unpaid" as const,
      date: iso(4),
      createdAt: iso(4),
    },
    {
      id: "sal_3",
      clientId: "cli_salam",
      items: [
        {
          productId: "prod_barquette",
          name: "Barquette aluminium",
          qty: 60,
          unitPrice: 49,
        },
        {
          productId: "prod_serviettes",
          name: "Serviettes papier",
          qty: 18,
          unitPrice: 68,
        },
      ],
      total: 60 * 49 + 18 * 68,
      status: "partial" as const,
      date: iso(2),
      createdAt: iso(2),
    },
    {
      id: "sal_4",
      clientId: "cli_atlas",
      items: [
        {
          productId: "prod_gobelets",
          name: "Gobelets carton",
          qty: 25,
          unitPrice: 33,
        },
        {
          productId: "prod_gants",
          name: "Gants jetables",
          qty: 15,
          unitPrice: 38,
        },
      ],
      total: 25 * 33 + 15 * 38,
      status: "paid" as const,
      date: iso(1),
      createdAt: iso(1),
    },
  ];

  const expenses = [
    {
      id: "exp_1",
      label: "Transport / Livraison",
      category: "Logistique",
      amount: 850,
      date: iso(7),
      createdAt: iso(7),
    },
    {
      id: "exp_2",
      label: "Loyer dépôt",
      category: "Loyer",
      amount: 3500,
      date: iso(6),
      createdAt: iso(6),
    },
    {
      id: "exp_3",
      label: "Électricité",
      category: "Charges",
      amount: 620,
      date: iso(3),
      createdAt: iso(3),
    },
  ];

  const invoices = [
    {
      id: "inv_1",
      number: "FAC-2026-001",
      saleId: "sal_1",
      clientId: "cli_baraka",
      amount: sales[0].total,
      status: "paid" as const,
      date: iso(8),
      dueDate: iso(-7),
      createdAt: iso(8),
    },
    {
      id: "inv_2",
      number: "FAC-2026-002",
      saleId: "sal_2",
      clientId: "cli_amine",
      amount: sales[1].total,
      status: "unpaid" as const,
      date: iso(4),
      dueDate: iso(-11),
      createdAt: iso(4),
    },
    {
      id: "inv_3",
      number: "FAC-2026-003",
      saleId: "sal_3",
      clientId: "cli_salam",
      amount: sales[2].total,
      status: "partial" as const,
      date: iso(2),
      dueDate: iso(-13),
      createdAt: iso(2),
    },
  ];

  // Derive stock movements from the seeded purchases (in) and sales (out).
  const movements = [
    ...purchases.flatMap((p) =>
      p.items.map((it, idx) => ({
        id: `mov_p_${p.id}_${idx}`,
        productId: it.productId,
        type: "in" as const,
        qty: it.qty,
        reason: `Achat ${p.id.toUpperCase()}`,
        date: p.date,
        createdAt: p.date,
      }))
    ),
    ...sales.flatMap((s) =>
      s.items.map((it, idx) => ({
        id: `mov_s_${s.id}_${idx}`,
        productId: it.productId,
        type: "out" as const,
        qty: it.qty,
        reason: `Vente ${s.id.toUpperCase()}`,
        date: s.date,
        createdAt: s.date,
      }))
    ),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    categories,
    products,
    clients,
    suppliers,
    purchases,
    sales,
    expenses,
    movements,
    invoices,
  };
}
