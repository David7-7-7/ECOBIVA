import api from '../api/api';

/**
 * Obtener término de garantía vigente para una categoría específica
 */
export const obtenerTerminoGarantia = async (categoria) => {
  try {
    const response = await api.get(`/terminos-garantia/categoria/${categoria}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener término de garantía:', error);
    return null;
  }
};

/**
 * Obtener todos los términos vigentes de garantía
 */
export const obtenerTerminosVigentes = async () => {
  try {
    const response = await api.get('/terminos-garantia?vigentes=true');
    return response.data || [];
  } catch (error) {
    console.error('Error al obtener términos vigentes:', error);
    return [];
  }
};

/**
 * Registrar aprobación/rechazo del diagnóstico con firma digital (opcional)
 * Si imagenFirma es null, se usa método 'remoto_asesor'
 */
export const registrarAprobacion = async (idOrden, {
  aprobado,
  notas = null,
  imagenFirma = null,
  metodoCaptura = 'remoto_asesor',
  terminosAceptados = false
}) => {
  try {
    const response = await api.patch(
      `/ordenes/${idOrden}/aprobacion`,
      {
        aprobado,
        notas,
        imagenFirma,
        metodoCaptura,
        terminosAceptados
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error al registrar aprobación:', error);
    throw error;
  }
};
