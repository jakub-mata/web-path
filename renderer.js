const button = document.getElementById("send-button");
button.addEventListener("click", () => {startHopping();});


function startHopping() {
    showStartMessage();
    const inputWebsite = document.getElementById("input").value
    window.electronAPI.sendMessage("hello there");
    
}

function showStartMessage() {
    button.innerText = "Done";
}