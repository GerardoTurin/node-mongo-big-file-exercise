const fs = require('fs');
const fastCsv = require('fast-csv');
const Records = require('./records.model');
const { pipeline, Transform } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);

const upload = async (req, res) => {

    // TODO: Medir rendimiento ( variables ), descomentar para verlo en consola.
    //const startTime = process.hrtime();
    //const startHeap = process.memoryUsage().heapUsed;


    if (!req.file) return res.status(400).json({ error: 'Debes agregar un Archivo' });

    const BATCH_SIZE = 1000;    // Tamaño del batch para bulkWrite. 1000 registros.
    const batch = [];

    const bulker = new Transform({
        objectMode: true,   // Permitir trabajar con objetos.
        transform(row, _, done) {   // Transformar cada fila del CSV en un objeto para insertarlo.
            batch.push({
                insertOne: {
                    document: {
                        id: +row.id,
                        firstname: row.firstname,
                        lastname: row.lastname,
                        email: row.email,
                        email2: row.email2,
                        profession: row.profession
                    }
                }
            });

            if (batch.length >= BATCH_SIZE) {
                this.pause(); // Si el batch está lleno, pausar el stream
                
                // Ejecutar bulkWrite para insertar el batch
                Records.collection
                    .bulkWrite(batch, { ordered: false, w: 0 }) // w: 0: Es para no esperar confirmación
                    .then(() => { batch.length = 0; this.resume(); done() })    // Limpiar el batch y reanudar el stream
                    .catch(done);

            } else done();  // Si no está lleno, continuar con el siguiente registro
        },
        final(done) {
            if (!batch.length) return done();       // Si el batch está vacío, termina.

            // Si hay registros pendientes, ejecutar bulkWrite
            Records.collection  
                .bulkWrite(batch, { ordered: false, w: 0 })
                .then(() => { batch.length = 0; done() })
                .catch(done);
        }
    });

    try {
        // Leo el archivo CSV y proceso.
        await pipelineAsync(
            fs.createReadStream(req.file.path, { highWaterMark: 16 * 1024 }),   // Leo en bloques de 16KB
            fastCsv.parse({ headers: true }),   // Parsear el CSV con encabezados para que los nombres de las columnas sean accesibles
            bulker
        );

        res.status(200).json({ message: 'Archivo procesado y guardado Correctamente' });
    } catch {
        res.status(500).json({ error: 'Error procesando archivo.' });

    } finally {
        fs.unlink(req.file.path, () => { });    // Eliminar el archivo de _temp después de procesarlo
    }


    // TODO: Medir rendimiento, descomentar para verlo en consola.

    /* res.on('finishProcess', () => {
        const [sec, nan] = process.hrtime(startTime);          // CalculO tiempo
        const respMs = sec * 1000 + nan / 1e6;               // Convierto a milisegundos
        console.log(`[SubidaArchivo] Tiempo de respuesta: ${respMs.toFixed(2)} ms`);


        const endHeap = process.memoryUsage().heapUsed;
        const diffMB = (endHeap - startHeap) / 1024 / 1024;
        console.log(`[SubidaArchivo] Consumo neto de heap: ${diffMB.toFixed(2)} MB`);
    }); */
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
