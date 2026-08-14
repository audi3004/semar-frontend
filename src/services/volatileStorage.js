// Penyimpanan kompatibilitas untuk state UI lama. Data hanya hidup selama tab aktif
// dan tidak pernah ditulis ke Web Storage browser.
const values = new Map();

export const volatileStorage = {
  getItem(key) {
    return values.has(String(key)) ? values.get(String(key)) : null;
  },
  setItem(key, value) {
    values.set(String(key), String(value));
  },
  removeItem(key) {
    values.delete(String(key));
  },
  clear() {
    values.clear();
  }
};

globalThis.appStorage = volatileStorage;

export default volatileStorage;
