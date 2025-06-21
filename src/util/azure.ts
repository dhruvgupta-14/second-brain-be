import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";
import mime from "mime"
import path from "path";
import { configDotenv } from "dotenv";
configDotenv()

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = "uploads";
const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(containerName);

export const uploadToAzure = async (filePath: string): Promise<string> => {
  const blobName = path.basename(filePath);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const mimeType = mime.getType(filePath) || "application/octet-stream";
  const stream = fs.createReadStream(filePath);
  await blockBlobClient.uploadStream(stream, undefined, undefined, {
    blobHTTPHeaders: {
      blobContentType: mimeType, 
    },
  });

  return blockBlobClient.url;
};
export const deleteFromAzure = async (fileUrl: string): Promise<void> => {
  try {
    const base = ".blob.core.windows.net/";
    const baseIndex = fileUrl.indexOf(base);
    if (baseIndex === -1) throw new Error("Invalid Azure Blob Storage URL");

    const blobPath = fileUrl.substring(baseIndex + base.length); // e.g., "uploads/myfile.pdf"
    const parts = blobPath.split("/");

    // Validate and extract actual blob name (after container name)
    const containerNameFromUrl = parts.shift(); // "uploads"
    if (containerNameFromUrl !== containerName) {
      throw new Error(`Expected container "${containerName}", but got "${containerNameFromUrl}"`);
    }

    const blobName = parts.join("/"); 
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const deleteResult = await blockBlobClient.deleteIfExists();
    if (deleteResult.succeeded) {
      console.log(`Successfully deleted: ${blobName}`);
    } else {
      console.warn(`Blob not found or already deleted: ${blobName}`);
    }
  } catch (error) {
    console.error("Error deleting from Azure:", error);
  }
};
