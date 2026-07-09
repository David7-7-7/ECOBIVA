const auditoriaDao = require('../dao/auditoriaDao');

// GET /api/auditoria?usuario=&modulo=&desde=&hasta=&pagina=&tamanoPagina=
async function consultar(req, res) {
    try {
        const { usuario, modulo, desde, hasta, pagina, tamanoPagina } = req.query;

        const resultado = await auditoriaDao.consultar({
            idUsuario: usuario ? Number(usuario) : undefined,
            modulo: modulo || undefined,
            desde: desde || undefined,
            hasta: hasta || undefined,
            pagina: pagina ? Number(pagina) : 1,
            tamanoPagina: tamanoPagina ? Number(tamanoPagina) : 50
        });

        res.json(resultado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error consultando el log de auditoría' });
    }
}

// GET /api/auditoria/exportar?usuario=&modulo=&desde=&hasta=
// Exporta como CSV (se abre directo en Excel/Sheets, sin librerías extra)
async function exportar(req, res) {
    try {
        const { usuario, modulo, desde, hasta } = req.query;

        const { rows } = await auditoriaDao.consultar({
            idUsuario: usuario ? Number(usuario) : undefined,
            modulo: modulo || undefined,
            desde: desde || undefined,
            hasta: hasta || undefined,
            pagina: 1,
            tamanoPagina: 100000 // exportación completa según filtros
        });

        const encabezados = ['idLog', 'idUsuario', 'correoUsuario', 'accion', 'modulo', 'detalle', 'ipOrigen', 'fechaHora'];
        const escaparCsv = (valor) => {
            if (valor === null || valor === undefined) return '';
            const texto = String(valor).replace(/"/g, '""');
            return `"${texto}"`;
        };

        const lineas = [
            encabezados.join(','),
            ...rows.map(fila => encabezados.map(campo => escaparCsv(fila[campo])).join(','))
        ];

        const csv = lineas.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="auditoria_${Date.now()}.csv"`);
        res.send('\uFEFF' + csv); // BOM para que Excel detecte UTF-8 correctamente
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error exportando el log de auditoría' });
    }
}

module.exports = { consultar, exportar };
