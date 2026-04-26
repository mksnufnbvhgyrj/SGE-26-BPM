import { supabase } from './supabase';

export const uploadFile = async (file: File, bucketParam: string = 'documentos'): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage.from(bucketParam).upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucketParam).getPublicUrl(filePath);
  return data.publicUrl;
};
