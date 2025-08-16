import { Router, RequestHandler } from "express";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";
import {logger} from "../utils/logger/logger"
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});


interface UploadUrlQuery {
  fileName: string;
  fileType: string;
}

interface UploadUrlResponse {
  url: string;
}

const router = Router();

const handleGetUploadUrl: RequestHandler<
  {},
  UploadUrlResponse | { error: string },
  undefined,
  UploadUrlQuery
> = async (req, res) => {
  try {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
      res.status(400).json({ error: "Missing fileName or fileType" });
      return;
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
      ContentType: fileType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ url });
  } catch (error) {
    logger.error({error},"Error generating signed URL:" );
    res.status(500).json({ error: "Internal server error" });
  }
};
router.get("/upload-url", handleGetUploadUrl);

export default router;
