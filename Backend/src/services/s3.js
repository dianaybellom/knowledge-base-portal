const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const DOWNLOAD_URL_TTL_SECONDS = 300;

// Cliente S3 estándar: cambiar de proveedor solo requiere cambiar las variables de entorno.
// Las credenciales se leen de AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY.
let client;
function getClient() {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL_S3 || undefined,
      forcePathStyle: true,
    });
  }
  return client;
}

// Nombre seguro para usar dentro de la clave del objeto.
function toSafeKeyName(fileName) {
  return fileName.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-150);
}

// Content-Disposition con respaldo ASCII y el nombre original en UTF-8 (RFC 6266).
function buildContentDisposition(fileName) {
  const asciiFallback = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function buildComponentKey(solutionId, fileName) {
  return `components/${solutionId}/${Date.now()}-${toSafeKeyName(fileName)}`;
}

// El nombre de descarga se guarda en el objeto al subirlo: algunos proveedores compatibles
// con S3 ignoran response-content-disposition en las URL prefirmadas.
async function uploadFile({ key, body, contentType, fileName }) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
      ContentDisposition: buildContentDisposition(fileName),
    })
  );
}

async function deleteFile(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
}

// Borra varios archivos sin interrumpir el flujo: los fallos solo se registran en el log.
async function deleteFilesSafely(keys) {
  for (const key of keys) {
    try {
      await deleteFile(key);
    } catch (err) {
      console.error(`[s3] No se pudo borrar ${key}:`, err.message);
    }
  }
}

async function getDownloadUrl(key) {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS }
  );
}

module.exports = {
  DOWNLOAD_URL_TTL_SECONDS,
  buildComponentKey,
  uploadFile,
  deleteFile,
  deleteFilesSafely,
  getDownloadUrl,
};
