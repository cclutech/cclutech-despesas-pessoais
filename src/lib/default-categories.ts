export const defaultIncomeCategories = [
  { name: "Salário", type: "income" as const, icon: "BriefcaseBusiness" },
  { name: "Poupança", type: "income" as const, icon: "PiggyBank" },
  { name: "Depósitos", type: "income" as const, icon: "Landmark" },
];

export const defaultExpenseCategories = [
  { name: "Animais", type: "expense" as const, icon: "Cat", color: "#2F9B69" },
  { name: "Carro", type: "expense" as const, icon: "CarFront", color: "#7D8794" },
  { name: "Casa", type: "expense" as const, icon: "House", color: "#4F86C6" },
  { name: "Comida", type: "expense" as const, icon: "ShoppingBasket", color: "#E27698" },
  { name: "Comunicação", type: "expense" as const, icon: "Phone", color: "#9674CE" },
  { name: "Contas", type: "expense" as const, icon: "BadgeEuro", color: "#C79736" },
  { name: "Entretenimento", type: "expense" as const, icon: "Martini", color: "#E78A45" },
  { name: "Esportes", type: "expense" as const, icon: "PersonStanding", color: "#43A99B" },
  { name: "Higiene pessoal", type: "expense" as const, icon: "Brush", color: "#71879D" },
  { name: "Presentes", type: "expense" as const, icon: "Gift", color: "#DF91A9" },
  { name: "Restaurante", type: "expense" as const, icon: "Utensils", color: "#55A879" },
  { name: "Roupas", type: "expense" as const, icon: "Shirt", color: "#8B6CC8" },
  { name: "Saúde", type: "expense" as const, icon: "Thermometer", color: "#D96C6A" },
  { name: "Táxi", type: "expense" as const, icon: "CarTaxiFront", color: "#B59434" },
  { name: "Transporte", type: "expense" as const, icon: "BusFront", color: "#D95D5D" },
];

export const defaultCategories = [
  ...defaultIncomeCategories,
  ...defaultExpenseCategories.map(({ name, type, icon }) => ({ name, type, icon })),
];

export const legacyExpenseCategoryNames: Record<string, string> = {
  Alimentação: "Comida",
  Habitação: "Casa",
  Lazer: "Entretenimento",
};

export const legacyIncomeCategoryNames: Record<string, string> = {
  "Poupança salário": "Poupança",
};

export const retiredIncomeCategoryNames = ["Outros rendimentos"];
