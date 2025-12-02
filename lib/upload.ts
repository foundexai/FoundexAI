// Image upload utility - ready for Cloudinary integration
export const uploadImage = async (file: File): Promise<string> => {
  // For now, return a data URL for local development
  // TODO: Replace with Cloudinary upload when credentials are ready

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  // Cloudinary upload code (uncomment when credentials are ready):
  /*
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET!);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
  */
};