/*

Write a function createMultiplier that takes a number factor and returns a new function.
That function should take another number and return it multiplied by the factor.

📝 Requirements:
Use a closure to capture the factor
The returned function should accept one argument
Do not use global variables


Example
const double = createMultiplier(2);
console.log(double(5)); // 10

const triple = createMultiplier(3);
console.log(triple(5)); // 15

const half = createMultiplier(0.5);
console.log(half(10)); // 5


*/

function createMultiplier(factor) {
  function multiplier(x) {
    return x * factor;
  }
  return multiplier;
}
const timeN = createMultiplier(3);
console.log(timeN(5));
