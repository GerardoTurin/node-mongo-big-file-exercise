# node-mongo-big-file-exercise

Hola! Este es un ejercicio para poner a prueba tus conocimientos de NodeJS y MongoDB. El objetivo es realizar un endpoint que reciba un archivo de ~80mb separado por comas y guarde cada uno de los registros del archivo en la base de datos.

El archivo podés descargarlo de este link:
<https://drive.google.com/file/d/1tg8dWr4RD2CeKjEdlZdTT8kLDzfITv_S/view?usp=sharing>
(está zippeado para que lo descargues rápido, descomprimilo manualmente)

Se evaluará teniendo en cuenta la prolijidad del código (indentación, comentarios y legibilidad), la performance (tiempo de procesado y memoria utilizada) y escalabilidad (si soporta archivos aún más grandes).

Para simplificarlo, hemos creado este repo starter que se conecta a la base de datos, crea el modelo y expone el endpoint `[POST] /upload` donde tenés que subir el archivo (podés probarlo con Postman). En el archivo `src/controller.js` tenés que ingresar tu código.

## Consideraciones

- Hace un fork de este repo para comenzar, y cuando tengas la solución compartí tu repositorio con quien te solicitó este ejercicio.
- Recordá correr `npm install` o `yarn install` para instalar las dependencias
- Podés usar hasta 1 librería de tu preferencia además de las incluídas.
- En el endpoint `[GET] /records` podés ver los 10 últimos registros que se procesaron.
- El archivo subido se guarda en el directorio `_temp`, recordá eliminarlo luego de utilizarlo.
- Modificá el archivo `.env` para cambiar el puerto y la conexión a la base de datos.










## Notas sobre esta prueba tecnica

### Pasos realizados para la carga del archivo CSV

1. **Recepción del archivo:**  
   El endpoint `/upload` recibe el archivo CSV y lo almacena temporalmente en al carpeta _temp.

2. **Lectura y procesamiento por lotes:**  
   Se lee el archivo utilizando streams para evitar cargarlo completamente en memoria. Los registros se agrupan en lotes de 1000 antes de ser insertados en la base de datos con operaciones `bulkWrite`, optimizando así el rendimiento y reduciendo la carga sobre MongoDB.

3. **Eliminación del archivo temporal:**  
   Una vez procesado el archivo, se elimina del directorio `_temp` para liberar espacio en disco.

### Cambio de `csv-parser` a `fast-csv`

Inicialmente utilice la librería `csv-parser`, pero se presentaron inconvenientes:

- **Manejo de streams y backpressure:**  
  `csv-parser` no ofrece un control tan fino sobre el flujo de datos y el manejo de la presión de backpressure, lo que dificultaba pausar y reanudar el procesamiento cuando los lotes/batchs estaban siendo insertados.

- **Compatibilidad y flexibilidad:**  
  `fast-csv` permitie una integración más sencilla con los streams y facilitó el procesamiento eficiente de archivos grandes.

Por esto, cambie a `fast-csv` para el procesamiento del archivo CSV en este proyecto.
