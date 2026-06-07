import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Loader2, Plus, Trash2, Film } from 'lucide-react';
import axios from '../../api/axiosInstance';

interface EditMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: any; // CoupleData['memories'][0]
  onSuccess: (updatedMemory: any) => void;
}

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;

interface SelectedFile {
  file: File;
  previewUrl: string;
}

const EditMemoryModal: React.FC<EditMemoryModalProps> = ({ isOpen, onClose, memory, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [caption, setCaption] = useState(memory?.caption || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const totalAfter = selectedFiles.length + files.length;
    if (totalAfter > MAX_FILES) {
      setError(`Tối đa ${MAX_FILES} tệp mỗi kỷ niệm. Bạn có thể thêm ${MAX_FILES - selectedFiles.length} tệp nữa.`);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const oversized = files.find(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      setError(`Tệp "${oversized.name}" vượt quá ${MAX_SIZE_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newEntries: SelectedFile[] = files.map(f => ({
      file: f,
      previewUrl: URL.createObjectURL(f)
    }));

    setSelectedFiles(prev => {
      const updated = [...prev, ...newEntries];
      setActivePreviewIdx(updated.length - 1);
      return updated;
    });
    setError(null);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    setSelectedFiles(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      const updated = prev.filter((_, i) => i !== idx);
      setActivePreviewIdx(Math.max(0, idx - 1));
      return updated;
    });
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    if (selectedFiles.length > 0) {
      selectedFiles.forEach(sf => formData.append('files', sf.file));
    }
    formData.append('caption', caption);

    try {
      const response = await axios.put(`/memories/${memory.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        onSuccess(response.data.data);
        handleClose();
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi cập nhật');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    selectedFiles.forEach(sf => URL.revokeObjectURL(sf.previewUrl));
    setSelectedFiles([]);
    setCaption(memory?.caption || '');
    setError(null);
    setActivePreviewIdx(0);
    onClose();
  };

  const activeFile = selectedFiles[activePreviewIdx];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-background w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-border"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-border">
              <div>
                <h2 className="text-xl font-bold">Cập nhật kỷ niệm</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Nếu chọn ảnh/video mới, ảnh cũ sẽ bị xóa hoàn toàn.</p>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Main Preview Area */}
              <div
                onClick={() => selectedFiles.length === 0 && fileInputRef.current?.click()}
                className={`relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors ${
                  activeFile ? 'border-primary' : 'border-muted-foreground/20 hover:border-primary/50 cursor-pointer'
                }`}
              >
                {activeFile ? (
                  <>
                    {activeFile.file.type.startsWith('video/') ? (
                      <video src={activeFile.previewUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                    ) : (
                      <img src={activeFile.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    {/* Media type badge */}
                    {activeFile.file.type.startsWith('video/') && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-[10px] font-bold">
                        <Film className="w-3 h-3" /> Video
                      </div>
                    )}
                    {/* Count badge */}
                    {selectedFiles.length > 1 && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-[10px] font-bold">
                        {activePreviewIdx + 1}/{selectedFiles.length}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {memory?.url ? (
                      <div className="w-full h-full relative group">
                        {memory.mimeType?.startsWith('video/') ? (
                          <video src={memory.url} className="w-full h-full object-cover opacity-60" />
                        ) : (
                          <img src={memory.url} alt="" className="w-full h-full object-cover opacity-60" />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-8 h-8 text-white mb-2" />
                          <p className="text-white text-sm font-bold">Nhấn để thay thế ảnh/video</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-primary/5 rounded-full mb-3">
                          <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <p className="font-medium text-sm">Nhấn để chọn ảnh hoặc video mới</p>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {selectedFiles.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {selectedFiles.map((sf, idx) => (
                    <motion.div
                      key={sf.previewUrl}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        idx === activePreviewIdx ? 'border-primary shadow-lg shadow-primary/20 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setActivePreviewIdx(idx)}
                    >
                      {sf.file.type.startsWith('video/') ? (
                        <video src={sf.previewUrl} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={sf.previewUrl} alt="" className="w-full h-full object-cover" />
                      )}
                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 hover:bg-red-500 rounded-full text-white transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </motion.div>
                  ))}

                  {/* Add more button */}
                  {selectedFiles.length < MAX_FILES && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />

              {/* Caption */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Lời nhắn cho kỷ niệm này</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Viết gì đó ngọt ngào về khoảnh khắc này..."
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg">
                  {error}
                </p>
              )}

              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Lưu kỷ niệm {selectedFiles.length > 0 ? `(${selectedFiles.length} tệp)` : ''}
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

export default EditMemoryModal;
