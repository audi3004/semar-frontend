const unitName = (unit) => unit?.nama_unit || unit?.name || "";

const hierarchyFromSubmission = (submission) => {
  const directUnit = submission?.petugas?.unit || submission?.maker?.unit;
  if (directUnit) {
    const units = [];
    const visited = new Set();
    let current = directUnit;
    while (current && !visited.has(current.id_unit ?? current.id)) {
      const id = current.id_unit ?? current.id;
      if (id !== undefined) visited.add(id);
      units.push(current);
      current = current.indukUnit || current.parentUnit || current.parent;
    }
    return units;
  }

  return Array.isArray(submission?.unitHierarchy)
    ? submission.unitHierarchy
    : [];
};

export const resolveSubmissionWorkUnits = (submission) => {
  const hierarchy = hierarchyFromSubmission(submission);

  return {
    unitGi: unitName(hierarchy[0]) || submission?.garduInduk || submission?.unitGi || "-",
    unitUltg: unitName(hierarchy[1]) || submission?.unitUltg || submission?.ultg || "-",
    unitUpt: unitName(hierarchy[2]) || submission?.unitUpt || submission?.upt || "-",
  };
};
