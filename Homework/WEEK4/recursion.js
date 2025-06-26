/*
create a function to determine what is the nth item in a fibonachi sequence
*/

function fibonachi(nthitem) {
  if (nthitem === 1 || nthitem === 0) {
    return 0;
  }
  if (nthitem === 2) {
    return 1;
  }
  return fibonachi(nthitem - 1) + fibonachi(nthitem - 2);
}
console.log(fibonachi(4));
