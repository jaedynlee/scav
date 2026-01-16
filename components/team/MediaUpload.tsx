"use client";

import { useState, useRef } from "react";
import Button from "@/components/shared/Button";

interface MediaUploadProps {
  mediaUrls: string[];
  onMediaChange: (mediaUrls: string[]) => void;
  maxMedia?: number;
  disabled?: boolean;
}

export default function MediaUpload({
  mediaUrls,
  onMediaChange,
  maxMedia = 5,
  disabled = false,
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  function convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");

    if (mediaUrls.length + files.length > maxMedia) {
      setError(`Maximum ${maxMedia} files allowed`);
      return;
    }

    try {
      const newMedia: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          setError("Please select image or video files only");
          continue;
        }

        // 10MB limit for images, 50MB for videos
        const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxSize) {
          setError(
            `${isImage ? "Image" : "Video"} size must be less than ${isImage ? "10MB" : "50MB"}`
          );
          continue;
        }

        const base64 = await convertToBase64(file);
        newMedia.push(base64);
      }

      onMediaChange([...mediaUrls, ...newMedia]);
    } catch (err) {
      setError("Failed to process files");
      console.error(err);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveMedia(index: number) {
    const newMedia = mediaUrls.filter((_, i) => i !== index);
    onMediaChange(newMedia);
  }

  function getMediaType(url: string): "image" | "video" {
    if (url.startsWith("data:image/")) return "image";
    if (url.startsWith("data:video/")) return "video";
    // Fallback: check file extension or assume image
    return "image";
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Images/Videos <span className="text-red-500">*</span> ({mediaUrls.length}/{maxMedia})
      </label>

      {mediaUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {mediaUrls.map((mediaUrl, index) => {
            const mediaType = getMediaType(mediaUrl);
            return (
              <div key={index} className="relative">
                {mediaType === "image" ? (
                  <img
                    src={mediaUrl}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                ) : (
                  <video
                    src={mediaUrl}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    controls
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(index)}
                  disabled={disabled}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {mediaUrls.length < maxMedia && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            fullWidth
          >
            📷 Add Images/Videos
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {error}
        </p>
      )}
    </div>
  );
}
