export const copyToClipboardFallback = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(resolve).catch(reject);
    } else {
      // Tương thích với HTTP (khi không có HTTPS)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Tránh việc scroll xuống cuối trang
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          resolve();
        } else {
          reject(new Error('Lỗi sao chép'));
        }
      } catch (err) {
        reject(err);
      }

      document.body.removeChild(textArea);
    }
  });
};
