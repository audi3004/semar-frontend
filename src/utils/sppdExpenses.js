const SPPD_COMPONENTS = [
   { id: "transportasi", label: "Transportasi", field: "rp_transportasi" },
   { id: "akomodasi", label: "Akomodasi", field: "rp_akomodasi" },
   { id: "lain-lain", label: "Lain-lain", field: "rp_lain_lain" },
];

export const getStaticSppdExpenses = (submission = {}) => {
   const expenses = Array.isArray(submission.expenses) ? submission.expenses : [];

   return SPPD_COMPONENTS.map((component) => {
      const existing = expenses.find((expense) => {
         const identity = `${expense.id || ""} ${expense.kategori || ""} ${expense.deskripsi || ""}`.toLowerCase();
         return component.id === "lain-lain"
            ? identity.includes("lain")
            : identity.includes(component.id);
      });

      return {
         id: component.id,
         deskripsi: component.label,
         kategori: component.label,
         nominal: Number(existing?.nominal ?? submission[component.field] ?? 0) || 0,
      };
   });
};
