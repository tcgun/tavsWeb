import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

/**
 * Uploads an image file to Firebase Storage and returns the download URL.
 * @param file The file to upload
 * @param path The path in storage (e.g., "posts/userId")
 * @returns Promise resolving to the download URL
 */
export async function uploadImage(file: File, path: string): Promise<string> {
    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Sadece JPEG, PNG ve WEBP formatları desteklenmektedir.");
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error("Dosya boyutu 5MB'dan küçük olmalıdır.");
    }

    try {
        // Create a unique filename to avoid collisions
        const uniqueFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const fullPath = `${path}/${uniqueFilename}`;
        const storageRef = ref(storage, fullPath);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        // Re-throw validation errors or generic error
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Resim yüklenirken bir hata oluştu.");
    }
}
