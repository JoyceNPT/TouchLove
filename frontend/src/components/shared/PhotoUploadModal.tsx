import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string;
  onSuccess: (newMemory: any) => void;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({ isOpen, onClose, coupleId, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 10MB');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', caption);

    try {
      const response = await axios.post(`/api/memories/${coupleId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onSuccess(response.data.data);
        handleClose();
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi tải ảnh');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setCaption('');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-background w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-border"
          >
            <div className="p-6 flex items-center justify-between border-b border-border">
              <h2 className="text-xl font-bold">Thêm kỷ niệm mới</h2>
              <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                  preview ? 'border-primary' : 'border-muted-foreground/20 hover:border-primary/50'
                }`}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <p className="text-white font-medium text-sm">Thay đổi ảnh</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-primary/5 rounded-full mb-3">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-medium">Nhấn để chọn ảnh</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG tối đa 10MB</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Lời nhắn cho bức ảnh</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Viết gì đó ngọt ngào về khoảnh khắc này..."
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg">
                  {error}
                </p>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Lưu kỷ niệm
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PhotoUploadModal;
