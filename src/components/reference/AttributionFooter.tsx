// ============================================================
// Atribución de licencia CC-BY-4.0 (SRD 5.2 de Wizards of the Coast)
// Componente pequeño para pie de página y secciones de créditos.
// ============================================================

import { CC_BY_4_0_NOTICE } from '../../types/srd2024';

export const AttributionFooter = () => (
  <p className="text-[10px] leading-relaxed text-dnd-muted">
    {CC_BY_4_0_NOTICE}{' '}
    <a
      href="https://www.dndbeyond.com/srd"
      target="_blank"
      rel="noreferrer"
      className="text-sky-400/90 underline hover:text-sky-300"
    >
      Consulta el SRD 5.2
    </a>
    .
  </p>
);