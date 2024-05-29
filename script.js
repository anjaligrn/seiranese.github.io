const urlAuth = "https://zone01normandie.org/api/auth/signin";
const urlGraph = "https://zone01normandie.org/api/graphql-engine/v1/graphql";
let usersInfo;
let allTransInfo;
let jwtToken;

let TotalProjectXP = 0
let TotalGalaxyProjectXP = 0

const creds = {
    conn: '',
    psw: '',
};

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("submit").addEventListener("click", function () {
        const conn = document.getElementById("conn");
        const psw = document.getElementById("password");
        creds.conn = conn.value;
        creds.psw = psw.value;
        fetch01API();
    });
});

function fetch01API() {
    let login = async function () {
        const headers = new Headers();
        //Basic sert pour envoyer en message des données en base64 
        headers.append('Authorization', 'Basic ' + btoa(creds.conn + ':' + creds.psw));
        try {
            const response = await fetch(urlAuth, {
                method: 'POST',
                headers: headers
            });
            const token = await response.json();
            if (response.ok) {
                console.log("connected", response)
                jwtToken = token;

                const allContent = document.getElementById("allContent");
                allContent.style.display = "block"

                fetchUserData();
            } else {
                console.log("can't connected", token.message);
                displayError()
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };
    login();
}

async function fetchUserData() {
    fetch(urlGraph, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
            query: `
        query {
            user {
                login
                attrs
                totalUp
                totalDown
                transactions ( where: {eventId: {_eq: 148}}, order_by: {createdAt:asc}){
                    amount
                    type
                    createdAt
                }
            }
            transaction(where: {type: {_eq: "xp"}}){
                id
                type
                amount 	
                objectId 	
                userId 	
                createdAt 	
                path
            }
        }`
        })
    })
        .then(response => response.json())
        .then(data => {
            usersInfo = data.data.user[0];
            allTransInfo = data.data.transaction;
            createProfilPageUser();
        })
        .catch(error => {
            console.error('Issue when collecting user infos:', error);
        });
}

async function createProfilPageUser() {
    if (usersInfo) {
        const xps = document.getElementById("xp")
        const graphs = document.getElementById("graphs")

        const content = document.getElementById("allContent");
        const connexion = document.getElementById("connexion");
        connexion.style.display = "none"

        userProfil(content)

        await exit()

        ratioGraph()
        displayGraphs(graphs)
        displayXpUser(xps)
    }
}

function userProfil(content) {
    const login = document.createElement("div");
    login.className = "infos";
    login.textContent = `Login : ${usersInfo.login}`;
    content.appendChild(login)

    const phone = document.createElement("div");
    phone.className = "infos";
    phone.textContent = `Phone : ${usersInfo.attrs.Phone}`;
    content.appendChild(phone)

    const gender = document.createElement("div");
    gender.className = "infos";
    gender.textContent = `Gender : ${usersInfo.attrs.gender}`;
    content.appendChild(gender)

    
    const email = document.createElement("div");
    email.className = "infos";
    email.textContent = `Email : ${usersInfo.attrs.email}`;
    content.appendChild(email)
    
    const address = document.createElement("div");
    address.className = "infos";
    address.textContent = `Address : ${usersInfo.attrs.addressStreet}`;
    content.appendChild(address)
}

function ratioGraph() {
    const up = document.getElementById("up");
    const down = document.getElementById("down");

    document.getElementById('textUp').textContent = "Done : " + usersInfo.totalUp + " XP"
    document.getElementById('textDown').textContent = "Received : " + usersInfo.totalDown + " XP"

    const nb = Number(usersInfo.totalUp / usersInfo.totalDown).toFixed(1)
    const widthUp = 400 * usersInfo.totalUp / 1000000;
    const widthDown = 400 * usersInfo.totalDown / 1000000;
    up.setAttribute("width", widthUp);
    down.setAttribute("width", widthDown);

    document.getElementById('ratio').textContent = "Ratio Audit : " + nb
}

async function exit() {
    const boutonRefresh = document.createElement("button");
    boutonRefresh.textContent = "Exit";
    boutonRefresh.className = "exit"
    boutonRefresh.addEventListener("click", function () {
        window.location.reload();
    });
    document.getElementById("allContent").appendChild(boutonRefresh)
}

let timeout
function displayError() {
    clearTimeout(timeout);
    const error = document.getElementById("errorMessage");
    error.textContent = "Wrong password or connexion entry"
    timeout = setTimeout(() => {
        error.textContent = ""
    }, 2000);
}

function displayXpUser(page) {

    const levelUser = document.createElement("div");
    levelUser.className = "level";
    levelUser.textContent= `Level: ${findLevelUser()}`;

    const xpUser = document.createElement("div")
    xpUser.className = "xpUser"
    xpUser.textContent = "Total XP : " + TotalProjectXP + "XP"

    page.appendChild(levelUser)
    page.appendChild(xpUser)
}

function displayGraphs(graphs) {
    projectsXpGainChart(graphs)
}

function projectsXpGainChart(page){
    var svgNS = "http://www.w3.org/2000/svg"

    const allprojects = allProjects()

    const graph = document.createElementNS(svgNS, "svg")
    graph.classList.add("chart")
    graph.setAttribute("width", "850")
    graph.setAttribute("height", String(allprojects.length * 20))
    graph.role = "img"

    const title = document.createElement("title")
    title.id = "title"
    title.innerHTML = "graphique du gain d'xp par projet"

    const desc = document.createElement("desc")
    desc.id = "desc"
    desc.innerHTML = "Graphique du gain d'xp par projet."

    graph.appendChild(title)
    graph.appendChild(desc)

    const sortedGraphArray = sortProjects(allprojects)
    let y = 0

    sortedGraphArray.forEach(project =>{
        const width = getProjectWidth(project)

        const g = document.createElementNS(svgNS, "g")
        g.classList.add("bar")

        const rect = document.createElementNS(svgNS, "rect")
        rect.setAttribute("width", String(width))
        rect.setAttribute("height", "19")
        rect.setAttribute("y", String(y))

        const text = document.createElementNS(svgNS, "text")
        text.setAttribute("x", String(width + 5))
        text.setAttribute("y", String(y + 8))
        text.setAttribute("dy", ".35em")
        
        const name = getProjectName(project)
        const XPamount = getProjectXP(project)
        text.innerHTML = name + " : " + XPamount + " XP"

        g.appendChild(rect)
        g.appendChild(text)
        graph.appendChild(g)

        y += 20
    })
    

    page.appendChild(graph)

}

function allProjects() {
    let all = []
    
    allTransInfo.forEach(p =>{

        if(p.path.includes("div-01") && !p.path.includes("piscine-js-retry") && !p.path.includes("checkpoint") && !p.path.includes("piscine-go") && !p.path.includes("piscine-js")){
            TotalProjectXP += p.amount
            if(p.path != "/rouen/div-01"){
                TotalGalaxyProjectXP += p.amount
                all.push(p)
            }
        }
    })
    
    return all
}

function getProjectWidth(project) {
    const xp = project.amount
    console.log(TotalGalaxyProjectXP)
    return (850 * ((Math.round((((xp * 100) / TotalGalaxyProjectXP)))) / 100))
}

function getProjectName(project) {
    const path = project.path

    return path.replace("/rouen/div-01/", '')
}

function getProjectXP(project) {
    const amount = project.amount

    return Math.round(amount)
}

function sortProjects(arr){
    return arr.sort((a, b) => a.amount - b.amount)
}

function findLevelUser(){

    let level;

    for (let i = 0; i < usersInfo.transactions.length-1; i++){
        if (usersInfo.transactions[i].type === "level"){
            level = usersInfo.transactions[i].amount
        }
    }

    return level
}


function transactionsEXP(){
    let array = [];
    for(let i = 0; i < usersInfo.transactions.length-1; i++){
        if (usersInfo.transactions[i].type ==="xp"){
            array.push(Number(usersInfo.transactions[i].amount))
        }
    }
    return array
}
