// Para surbir los archivos a Cludinaryy

import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { config } from '../config/index.js';
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret
});

export const uploadImage = async (fileBuffer, folder = 'bildyapp') => {
  const optimizedBuffer = await sharp(fileBuffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: 'webp'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(optimizedBuffer);
  });
};

export const uploadPdf = async (fileBuffer, folder= 'bildyapp/pdfs') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',
        format: 'pdf'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(fileBuffer);
  });
};

export const deleteFile = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export default { uploadImage, uploadPdf, deleteFile };
