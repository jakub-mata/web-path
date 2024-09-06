document.getElementById("explore-button").setAttribute("onclick", "tableFill()")

function tableFill() {
    setupTable();
    let table = document.getElementById("traceroute-table");
    let row = table.insertRow(1);

    let cellHop = row.insertCell(0);
    cellHop.innerHTML = "0";
    let cellIP = row.insertCell(1);
    cellIP.innerHTML = "192.128.0.1";
    let cellName = row.insertCell(2);
    cellName.innerHTML = "Aligator"
}

function setupTable() {
    document.getElementById("table-header").style.visibility = "visible";
}