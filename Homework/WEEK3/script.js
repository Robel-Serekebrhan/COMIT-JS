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
// 7, use objects when you need to store data as key value pairs:
// 8, use arrays to store ordered list of items
let x = 1;
let y = 1.0;
//let x = 2;
console.log(x);

//decraring a function that takes two arguments

function takesInputs(username, favoriteColor) {
  console.log(
    "Mynameis:" + username + "  " + "and my fav colour is:" + favoriteColor
  );
}
const username1 = prompt("enter the name");
const userfavoriteColor1 = prompt("enter the favorite color");

takesInputs(username1, userfavoriteColor1);
