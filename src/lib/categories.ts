import { db } from "@/lib/db";
import {
  defaultCategories,
  defaultIncomeCategories,
  legacyExpenseCategoryNames,
  legacyIncomeCategoryNames,
  retiredIncomeCategoryNames,
} from "@/lib/default-categories";

export async function initializeUserCategories(userId: string) {
  await db.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: { categoriesInitialized: true, categoryDefaultsVersion: true },
    });
    if (!user || user.categoryDefaultsVersion >= 2) return;

    const categories = await transaction.category.findMany({
      where: { userId },
      select: { id: true, name: true, type: true, icon: true, isCustom: true },
    });

    const categoriesToEnsure = user.categoriesInitialized
      ? defaultIncomeCategories
      : defaultCategories;

    for (const category of categoriesToEnsure) {
      let existing = categories.find(
        (item) =>
          item.type === category.type &&
          item.name.toLocaleLowerCase("pt-PT") === category.name.toLocaleLowerCase("pt-PT"),
      );

      if (!existing) {
        const legacyNames = category.type === "expense"
          ? legacyExpenseCategoryNames
          : legacyIncomeCategoryNames;
        const legacyName = Object.entries(legacyNames).find(
          ([, currentName]) => currentName === category.name,
        )?.[0];
        const legacy = categories.find(
          (item) =>
            !item.isCustom &&
            item.type === category.type &&
            item.name.toLocaleLowerCase("pt-PT") === legacyName?.toLocaleLowerCase("pt-PT"),
        );
        if (legacy) {
          existing = await transaction.category.update({
            where: { id: legacy.id },
            data: { name: category.name, icon: category.icon },
            select: { id: true, name: true, type: true, icon: true, isCustom: true },
          });
          categories[categories.indexOf(legacy)] = existing;
        }
      }

      if (existing) {
        if (!existing.isCustom && existing.icon !== category.icon) {
          const updated = await transaction.category.update({
            where: { id: existing.id },
            data: { icon: category.icon },
            select: { id: true, name: true, type: true, icon: true, isCustom: true },
          });
          categories[categories.indexOf(existing)] = updated;
        }
        continue;
      }

      const created = await transaction.category.upsert({
        where: {
          userId_name_type: {
            userId,
            name: category.name,
            type: category.type,
          },
        },
        create: { userId, ...category, isCustom: false },
        update: {},
        select: { id: true, name: true, type: true, icon: true, isCustom: true },
      });
      categories.push(created);
    }

    const retiredDefaults = categories.filter(
      (category) =>
        category.type === "income" &&
        !category.isCustom &&
        retiredIncomeCategoryNames.includes(category.name),
    );
    for (const category of retiredDefaults) {
      await transaction.category.update({
        where: { id: category.id },
        data: { isCustom: true },
      });
    }

    await transaction.user.update({
      where: { id: userId },
      data: { categoriesInitialized: true, categoryDefaultsVersion: 2 },
    });
  });
}
