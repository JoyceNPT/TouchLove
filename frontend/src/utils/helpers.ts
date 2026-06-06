/**
 * Lấy các chữ cái đầu tiên của từng từ trong tên (tối đa 3 ký tự)
 * Ví dụ: "Nguyễn Thành Nam" -> "NTN", "John Doe" -> "JD"
 */
export const getInitials = (name?: string | null): string => {
  if (!name) return 'TL';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return words
    .map(w => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();
};
