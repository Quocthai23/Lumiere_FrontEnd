import type {Product} from "../types/product.ts";

/**
 * @param {string} s1 Chuỗi thứ nhất.
 * @param {string} s2 Chuỗi thứ hai.
 * @returns {number} Khoảng cách Levenshtein.
 */
const levenshtein = (s1: string, s2: string): number => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

/**
 * Lọc sản phẩm dựa trên truy vấn tìm kiếm, hỗ trợ tìm kiếm trong tên, mô tả và chống lỗi chính tả.
 * @param {Product[]} products Danh sách sản phẩm để tìm kiếm.
 * @param {string} query Chuỗi truy vấn của người dùng.
 * @returns {Product[]} Danh sách sản phẩm đã được lọc và xếp hạng.
 */
export const searchProducts = (products: Product[], query: string): Product[] => {
  const lowerCaseQuery = query.toLowerCase().trim();
  if (!lowerCaseQuery) return [];

  const results: { product: Product; score: number }[] = [];

  products.forEach(product => {
    const lowerCaseName = product.name.toLowerCase();
    const lowerCaseDescription = product.description.toLowerCase();
    let score = 0;

    // 1. Ưu tiên khớp chính xác (hoặc gần chính xác) trên toàn bộ tên
    if (lowerCaseName.includes(lowerCaseQuery)) {
      score += 10;
    } else {
      const nameDistance = levenshtein(lowerCaseQuery, lowerCaseName.substring(0, lowerCaseQuery.length));
      if (nameDistance <= 2) {
        score += 5;
      }
    }

    // 2. Kiểm tra khớp trong mô tả
    if (lowerCaseDescription.includes(lowerCaseQuery)) {
      score += 2;
    }

    // 3. Kiểm tra từng từ với khả năng bị lỗi chính tả
    const queryWords = lowerCaseQuery.split(' ');
    const nameWords = lowerCaseName.split(' ');
    const descriptionWords = lowerCaseDescription.split(' ');

    queryWords.forEach(queryWord => {
      const threshold = queryWord.length > 4 ? 2 : 1; // Ngưỡng lỗi cho phép

      if (nameWords.some(nameWord => levenshtein(queryWord, nameWord) <= threshold)) {
        score += 3;
      }
      if (descriptionWords.some(descWord => levenshtein(queryWord, descWord) <= threshold)) {
        score += 1;
      }
    });

    if (score > 0) {
      results.push({ product, score });
    }
  });

  // Sắp xếp kết quả theo điểm số từ cao đến thấp
  return results
    .sort((a, b) => b.score - a.score)
    .map(result => result.product);
};
