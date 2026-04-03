import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const uploadImage = async (file: File, path?: string) => {
	if (!file) throw new Error("No file provided");

	if (!file.type.startsWith("image/")) {
		throw new Error("File must be an image");
	}

	const fileExt = file.name.split(".").pop();
	const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

	const filePath = path ? `${path}/${fileName}` : fileName;

	const { error } = await supabase.storage.from("images").upload(filePath, file);

	if (error) {
		throw error;
	}

	const { data } = supabase.storage.from("images").getPublicUrl(filePath);

	return data.publicUrl;
};

export default supabase;
