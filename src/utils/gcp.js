import { Storage } from "@google-cloud/storage";

export const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEYFILE_PATH, // service account JSON file
});

const bucketName = process.env.GCP_BUCKET_NAME;

export const bucket = storage.bucket(bucketName);

// Generate signed URL
export async function generateSignedUrl(fileName) {
  const options = {
    version: "v4",
    action: "read",
    expires: Date.now() + 3 * 24 * 60 * 60 * 1000, // 1 hour
  };

  const [url] = await storage
    .bucket(bucketName)
    .file(fileName)
    .getSignedUrl(options);

  return url;
}
