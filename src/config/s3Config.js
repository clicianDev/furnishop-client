// AWS S3 Configuration
const S3_BUCKET_URL = 'https://furnishop-bucket.s3.ap-southeast-2.amazonaws.com';

export const getS3Url = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${S3_BUCKET_URL}/${cleanPath}`;
};

export const config = {
  s3BucketUrl: S3_BUCKET_URL,
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000'
};

export default config;
