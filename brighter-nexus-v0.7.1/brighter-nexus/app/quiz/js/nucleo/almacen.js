// localStorage con red de seguridad: si el navegador lo bloquea, la pantalla sigue funcionando.
export const almacen = {
  leer(clave, defecto) {
    try {
      const v = localStorage.getItem(clave);
      return v === null ? defecto : v;
    } catch (e) {
      return defecto;
    }
  },
  guardar(clave, valor) {
    try {
      localStorage.setItem(clave, valor);
    } catch (e) {
      /* sin almacenamiento: se ignora */
    }
  },
};
