const socket = io();


socket.on("connect", () => {

  console.log("connected", socket.id);

});



function sendMessage() {

  const input = document.getElementById("message");


  const message = input.value;


  if (!message) return;


  socket.emit(
    "send-message",
    message
  );


  input.value = "";

}



socket.on("receive-message", (message) => {


  const box = document.getElementById("messages");


  const p = document.createElement("p");


  p.innerText = message;


  p.className = "bg-green-600 p-2 rounded mb-2";


  box.appendChild(p);

});