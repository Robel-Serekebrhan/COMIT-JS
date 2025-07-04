const guestForm = document.querySelector("form");
const guestInput = document.getElementById("guest-input");
const guestListUl = document.getElementById("guest-list");

let allGuestsList = [];

guestForm.addEventListener("submit", function (e) {
  e.preventDefault();
  addGuest();
});
function addGuest() {
  const guestName = guestInput.value.trim();
  if (guestName.length > 0) {
    allGuestsList.push(guestName);
    updateGuestItem();
    //createGuesstItem(guestName);
    guestInput.value = "";
  }
}
function updateGuestItem() {
  guestListUl.innerHTML = "";
  allGuestsList.forEach((guest, guestIndex) => {
    guesrItem = createGuesstItem(guest, guestIndex);
    allGuestsList.append(guestLi);
  });
}
function createGuesstItem(guest) {
  const guestLi = document.createElement("li");
  guestLi.innerText = guest;
  // allGuestsList.append(guestLi);
  return guestLi;
}
