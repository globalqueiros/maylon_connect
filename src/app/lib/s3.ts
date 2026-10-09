import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!region) throw new Error("AWS_REGION não configurado.");
if (!bucket) throw new Error("AWS_S3_BUCKET não configurado.");
if (!accessKeyId) throw new Error("AWS_ACCESS_KEY_ID não configurado.");
if (!secretAccessKey) throw new Error("AWS_SECRET_ACCESS_KEY não configurado.");

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadToS3({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<{ key: string; url: string }> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    })
  );

  const url = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

  return { key, url };
}

export async function getPrivateS3Url(
  key: string,
  expiresIn = 300
): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn }
  );
}