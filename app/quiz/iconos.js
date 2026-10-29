// Íconos de trazo del quiz (viewBox 24, trazo 1.9). Se usan con <use href="#i-...">; el sprite se inserta en la pantalla.
// Para sumar uno nuevo: copiar un <symbol> y cambiarle el id.
export const ICONOS = `
    <symbol id="i-logo" viewBox="0 0 24 24">
      <path d="M2 20 L10 5 L14 20 Z" fill="#fe5440"/>
      <path d="M12 20 L17 8 L22 20 Z" fill="#ffb43a"/>
      <path d="M8 20 L14 11 L18 20 Z" fill="#1fa39a" opacity=".92"/>
    </symbol>
    <symbol id="i-conejo" viewBox="0 0 24 24">
      <path d="M9 9.5C7.4 6.4 7.2 3.4 8.4 3c1.5-.5 2.8 2.6 3 5.6M15 9.5c1.6-3.1 1.8-6.1.6-6.5-1.5-.5-2.8 2.6-3 5.6"/>
      <path d="M12 8.4c-3.5 0-6 2.3-6 5.5 0 3.3 2.7 5.6 6 5.6s6-2.3 6-5.6c0-3.2-2.5-5.5-6-5.5z"/>
      <path d="M9.6 13.2h.01M14.4 13.2h.01M11 16.2c.6.4 1.4.4 2 0"/>
    </symbol>
    <symbol id="i-mando" viewBox="0 0 24 24">
      <rect x="2.5" y="7" width="19" height="10.5" rx="5.2"/>
      <path d="M7.5 10.2v4M5.5 12.2h4M15.6 11.2h.01M18 13.2h.01"/>
    </symbol>
    <symbol id="i-power" viewBox="0 0 24 24"><path d="M12 3v8.5M6.4 6.9a8 8 0 1 0 11.2 0"/></symbol>
    <symbol id="i-sonido" viewBox="0 0 24 24"><path d="M4 9.5v5h3.6l4.6 4v-13l-4.6 4z"/><path d="M15.6 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/></symbol>
    <symbol id="i-silencio" viewBox="0 0 24 24"><path d="M4 9.5v5h3.6l4.6 4v-13l-4.6 4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></symbol>
    <symbol id="i-foco" viewBox="0 0 24 24"><path d="M9.5 18.5h5M10.3 21h3.4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.2 1.1 2v.2h5v-.2c0-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z"/></symbol>
    <symbol id="i-corazon" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.5-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.5 12 20 12 20z"/></symbol>
    <symbol id="i-infinito" viewBox="0 0 24 24"><path d="M12 12c-2-2.6-3.6-4-5.5-4a4 4 0 0 0 0 8c1.9 0 3.5-1.4 5.5-4s3.6-4 5.5-4a4 4 0 0 1 0 8c-1.9 0-3.5-1.4-5.5-4z"/></symbol>
    <symbol id="i-ajustes" viewBox="0 0 24 24"><path d="M4 7h8M18 7h2M4 17h2M12 17h8"/><circle cx="15" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/></symbol>
    <symbol id="i-lista" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></symbol>
    <symbol id="i-reiniciar" viewBox="0 0 24 24"><path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4.5 4.5v4h4"/></symbol>
    <symbol id="i-jugar" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></symbol>
    <symbol id="i-tocar" viewBox="0 0 24 24"><path d="M9 11.5V5.8a1.6 1.6 0 0 1 3.2 0V10"/><path d="M12.2 10V8.6a1.6 1.6 0 0 1 3.2 0V11M15.4 11V10a1.6 1.6 0 0 1 3.1 0v4.5c0 3.6-2.6 6-6 6h-.6a5.4 5.4 0 0 1-4.3-2.2L4.6 14a1.5 1.5 0 0 1 2.3-1.9L9 14.2"/></symbol>
    <symbol id="i-estrella" viewBox="0 0 24 24"><path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/></symbol>
    <symbol id="i-usuario" viewBox="0 0 24 24"><circle cx="12" cy="8.3" r="3.6"/><path d="M5 20c.8-4 3.5-6 7-6s6.2 2 7 6"/></symbol>
    <symbol id="i-estudiante" viewBox="0 0 24 24"><path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.8V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.2M21.5 9.5v5"/></symbol>
    <symbol id="i-tutor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8M7 10l3 2.5 4-4"/></symbol>
    <symbol id="i-cerrar" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.6 4.6L19 7.6"/></symbol>
    <symbol id="i-flecha" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
    <symbol id="i-hoja" viewBox="0 0 24 24"><path d="M5 19c0-8 5-13.500 14.500-14.500C19.500 14 14 19 5 19z"/><path d="M5 19c2-4.500 5-7.500 9-9.500"/></symbol>
    <symbol id="i-atomo" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9.500" ry="4"/><ellipse cx="12" cy="12" rx="9.500" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.500" ry="4" transform="rotate(120 12 12)"/></symbol>
    <symbol id="i-planeta" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5.500"/><path d="M3 15.500c-.8-1.600 3-4.600 8.500-6.500s10.400-1.800 10.500-.2"/></symbol>
  
`;
