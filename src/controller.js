const fs = require('fs');
const fastCsv = require('fast-csv');
const Records = require('./records.model');
const { mapRow } = require('./helpers/mapRow');

const BATCH_SIZE = 1000;    // Tamaño del batch para bulkWrite. 1000 registros.

const upload = async (req, res) => {

    //TODO: Medición de rendimiento de tiempo y memoria. Descomentar para verlo en consola.
    /* const startTime = process.hrtime();
    const startHeap = process.memoryUsage().heapUsed;

    res.once('finish', () => {
        const [sec, nan] = process.hrtime(startTime);
        const respMs = sec * 1000 + nan / 1e6;
        console.log(`[SubidaArchivo] Tiempo de respuesta: ${respMs.toFixed(2)} ms`);
        
        const endHeap = process.memoryUsage().heapUsed;
        const diffMB = (endHeap - startHeap) / 1024 / 1024;
        console.log(`[SubidaArchivo] Consumo neto de heap: ${diffMB.toFixed(2)} MB`);
    }); */

    if (!req.file) return res.status(400).json({ error: 'Debes agregar un Archivo' });

    const batchRegisters = [];
    const filePath = req.file.path;

    try {
        // Parseo CSV con async iterator para mejor control de flujo.
        const parser = fs.createReadStream(filePath, { highWaterMark: 16 * 1024 })  // Tamaño de buffer de 16KB
                        .pipe(fastCsv.parse({   
                                headers: true,  // Para que primera fila sea usada como encabezados
                                ignoreEmpty: true,  // Ignora filas vacías 
                                trim: true
                            }));    
        
        // Proceso cada fila del CSV, mapeándola y agregándola al batch.
        for await (const row of parser) {
            batchRegisters.push({ 
                insertOne: { document: mapRow(row) }
            });

            // Si el batch alcanzo el tamaño definido, lo insertamos en la DB.
            if (batchRegisters.length >= BATCH_SIZE) {
                await Records.collection.bulkWrite(batchRegisters, { ordered: false });
                batchRegisters.length = 0;
            }
        }

        // Si aun quedan registros en el batch, los insertamos.
        if (batchRegisters.length) {
            await Records.collection.bulkWrite(batchRegisters, { ordered: false });
        }

        res.status(200).json({ message: 'Archivo procesado y guardado correctamente' });
    } catch (error) {
        console.error('Error en upload:', error);
        res.status(500).json({ error: 'Error procesando archivo.' });

    } finally {
        // Eliminamos el archivo de la carpeta _temp
        fs.unlink(filePath, () => { });
    }
};



const list = async (_, res) => {
    try {
        const data = await Records
            .find({})
            .limit(10)
            .lean();

        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json(err);
    }
};

module.exports = {
    upload,
    list,
};
