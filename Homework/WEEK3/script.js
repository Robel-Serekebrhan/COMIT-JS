let person1 = { name: "allice", age: 25 };

let person2 = { ...person1 };
person2.favoriteColor = "blue";

console.log(person1);

console.log(person2);

/* 
. primitive data types are the building blocks of data 
types and they are immutable, meaning once assigned
a variable they(their value can not be change) 
. there are seven types of primitive data types which
are: */
/* 1, numbers; both intigers and floating point numbers
eg.
*/
let x = 1;
let y = 1.0;
//let x = 2;
console.log(x);

//decraring a function that takes two arguments

function takesInput(name, favoriteColor) {
  console.log("Mynameis '${name} and my favorite color is: '${favoriteColor}");
}
//const takesInput = funtion(name, favoriteColor);

//console.log(takesInput);
takesInput("robel", "blue");
