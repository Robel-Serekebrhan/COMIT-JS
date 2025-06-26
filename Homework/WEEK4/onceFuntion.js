/*
Once Function
Write a function once(fn) that takes a function fn and returns a new function.
The returned function should call fn only once, no matter how many times it's invoked.
After the first call, all subsequent calls should return undefined and not invoke fn.

📝 Requirements
Use a closure to keep track of whether fn has already been called.
The returned function should:
Call fn only on the first invocation.
Ignore or return undefined on all future calls.
The original fn may take any number of arguments.
✅ Example
function greet(name) {
  console.log("Hello, " + name + "!");
}

const greetOnce = once(greet);

greetOnce("Ygor"); // Output: Hello, Ygor!
greetOnce("John"); // No output
greetOnce("Jane"); // No output


*/

function* fn(name) {
  function oncefn(name) {
    console.log("hello, " + name + " !");
  }
  yield oncefn;
}
fn("rob");
//greet("robel");
//greet("rob");
