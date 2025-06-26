/*
🧮 Exercise 1: Factorial
These exercises will help you understand and master recursion in JavaScript — solving problems by having a function call itself.

✅ Instructions
Do not use loops (for, while, etc.)
Each solution must use pure recursion
Focus on defining a base case and a recursive case
Use console.log() to test your results
Write a function factorial(n) that returns the factorial of n.

The factorial of n is n * (n-1) * (n-2) * ... * 1
Example: factorial(5) should return 120

Example:
console.log(factorial(0)); // 1
console.log(factorial(5)); // 120


*/

function factorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * factorial(n - 1);
}
console.log(factorial(5));
