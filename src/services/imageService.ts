import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export const imageService = {
    uploadImage: async (base64String: string, path: string): Promise<string> => {
        try {
            // WORKAROUND: Firebase Storage requires Blaze plan for some regions/projects.
            // We will store the Base64 string directly in Firestore for now.
            // Ideally, we should compress this if it's too large, but for now we pass it through.
            // The CameraCapture component should handle resizing if needed.

            console.warn("Storage is disabled. Using Base64 string directly.");
            return base64String;

            /* Original Code for Reference (when Storage is available):
            const storageRef = ref(storage, path);
            await uploadString(storageRef, base64String, 'data_url');
            const url = await getDownloadURL(storageRef);
            return url;
            */
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    }
};
