import { isNumber } from "lodash";

export function calcLevenshteinDistance(str1: string, str2: string, m?: number, n?: number): number {
    m = isNumber(m) ? m : str1.length;
    n = isNumber(n) ? n : str2.length;
    // Base case: str1 is empty
    if (m === 0) {
        return n;
    }
     
    // Base case: str2 is empty
    if (n === 0) {
        return m;
    }
     
    // If the last characters of both 
    // strings are the same
    if (str1[m - 1] === str2[n - 1]) {
        return calcLevenshteinDistance(str1, str2, m - 1, n - 1);
    }
     
    // Calculate the minimum of three possible 
    // operations (insert, remove, replace)
    return 1 + Math.min(
        // Insert
        calcLevenshteinDistance(str1, str2, m, n - 1),
        // Remove
        calcLevenshteinDistance(str1, str2, m - 1, n),
        // Replace
        calcLevenshteinDistance(str1, str2, m - 1, n - 1)
    );
}