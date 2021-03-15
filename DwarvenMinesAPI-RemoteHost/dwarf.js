let userToken = null;
let jwt = null;
const CONFIG = config;

function connError(){
    document.getElementById("root").setAttribute('hidden','hidden');
    document.getElementById('a1Message').innerHTML = 'Connection to server refused!';
    document.getElementById('a1').removeAttribute('hidden');
    document.getElementById('loginContainer').removeAttribute('hidden');
    sessionStorage.removeItem('jwt');
}


// Login functions
function closeAlert(){
    document.getElementById('a1').setAttribute('hidden','hidden');
}
function closeAlert2(){
    document.getElementById('a2').setAttribute('hidden','hidden');
}
function logout(){
    sessionStorage.clear();
    location.reload();
}
async function login(){
    let user = document.getElementById("username").value;
    let pass = document.getElementById("pass").value;

    let data = { username: user, pass: pass }
    
    const details = {
        method: 'POST',
        body: JSON.stringify(data)
    }
    try{
        const httpResponse = await fetch(`${CONFIG.host}/login`,details);
        this.jwt = await httpResponse.text(); // get jwt
        const status = await httpResponse.status;

        if(status === 200){
            sessionStorage.setItem('jwt',this.jwt);

            // actual object we can look at
            this.userToken = JSON.parse(atob(this.jwt.split('.')[1]));

            document.getElementById('loginContainer').setAttribute('hidden','hidden')
            this.display();
        }else{
            document.getElementById('a1Message').innerHTML = 'Invalid User/Pass!'
            document.getElementById('a1').removeAttribute('hidden');
        }
    }catch(err){
        connError();
    }
}

// Home page functions
// displays tables
async function display(){
    // checks to see if jwt was set
    if(typeof sessionStorage.getItem('jwt') === 'string'){
            this.jwt = sessionStorage.getItem('jwt')
            
            document.getElementById('loginContainer').setAttribute('hidden','hidden');
            document.getElementById("root").removeAttribute('hidden');
        
            this.userToken = JSON.parse(atob(this.jwt.split('.')[1]));

            const welcome = document.getElementById('welcome');
            const youAre = document.getElementById('youAre');
            welcome.innerHTML = `Welcome to the Expense Manager, ${this.userToken.fname}!`;
            youAre.innerHTML = `Your Miner ID is: ${this.userToken.minerId}`;

            const pendingTableBody = document.getElementById("pendingTableBody");
            const resolvedTableBody = document.getElementById("resolvedTableBody");

            const details = {
                headers: { Authorization: `${this.jwt}` }
            }
            let httpResponse = '';
            let expenses = [];
            try{
                httpResponse = await fetch(`${CONFIG.host}/expenses`,details);
                expenses = await httpResponse.json();
            }catch(err){
                connError();
            }
            // Pending Table
            let tBodyHtml = ``;
            for(const expense of expenses){
                const dateS = convertDate(expense.dateSubmitted);
                if(expense.status === 'pending'){
                    if(this.userToken.minerId === expense.minerId){
                        tBodyHtml+= `<tr class="table-info"> `
                    }else{ 
                        tBodyHtml += `<tr class="table-warning">`
                    }
                    tBodyHtml+=`
                        <td>${expense.expenseId}</td>
                        <td>${expense.minerId}</td>
                        <td>$${expense.amount}</td>
                        <td>${expense.description}</td>
                        <td>${expense.status}</td>
                        <td>${dateS.dateDisplay}</td>
                        ` 
                    if(this.userToken.foreman && this.userToken.minerId !== expense.minerId){
                        tBodyHtml+= `
                            <td>
                                <button type="button" onclick="update(${expense.expenseId},${expense.minerId},${expense.amount},'${expense.description}',${expense.dateSubmitted},true)" class="btn btn-success"  data-bs-toggle="modal" data-bs-target="#updateModal">Approve</button>
                            </td>
                            <td>
                                <button type="button" onclick="update(${expense.expenseId},${expense.minerId},${expense.amount},'${expense.description}',${expense.dateSubmitted},false)" class="btn btn-warning"  data-bs-toggle="modal" data-bs-target="#updateModal">Deny</button>
                            </td>
                            <td>
                                <button type="button" class="btn btn-danger" onclick="deleteById(${expense.expenseId})" disabled>Delete</button>
                            </td>
                        </tr>`
                    }else if(this.userToken.minerId === expense.minerId){
                        tBodyHtml+= `<td colspan="2">Awaiting approval...</td>
                            <td><button class="btn btn-danger" onclick="deleteById(${expense.expenseId})">Delete</button></td>
                        </tr>`
                    }
                    
                }
            }
            pendingTableBody.innerHTML=tBodyHtml;
            tBodyHtml = ``;

            //resolved table
            for(const expense of expenses){
                const dateS = convertDate(expense.dateSubmitted);
                const dateR = convertDate(expense.dateResolved);
                if(expense.status !== 'pending'){
                    if(expense.status ==='approved'){
                        tBodyHtml+= `
                        <tr class="table-success">`
                    }else{ 
                        tBodyHtml+= `<tr class="table-danger">`
                    }
                    tBodyHtml+= `
                        
                            <td>${expense.expenseId}</td>
                            <td>${expense.minerId}</td>
                            <td>$${expense.amount}</td>
                            <td>${expense.description}</td>
                            <td>${expense.status}</td>
                            <td>${dateS.dateDisplay}</td>
                            <td>${dateR.dateDisplay}</td>
                            <td>${expense.resolvedReason}</td>
                        </tr> `
                }
            }
            resolvedTableBody.innerHTML = tBodyHtml;
    }else{
        document.getElementById('loginContainer').removeAttribute('hidden');
    }
}

async function deleteById(id){
    try{ 
        this.jwt = sessionStorage.getItem('jwt');
        const details = {
            method: 'DELETE',
            headers: { Authorization: `${this.jwt}` }
        }
        const httpResponse = await fetch(`${CONFIG.host}/expenses/${id}`,details);
        const status = await httpResponse.status;
        console.log(status);
    }catch(err){
        connError();
    }
    this.display();
}

// Brings up modal with expense info
async function update(expenseId, minerId,amount,description,date, approve){
    
        this.jwt = sessionStorage.getItem('jwt')
        const title = document.getElementById('updateModalTitle');
        const expenseInfo = document.getElementById('expenseInfo');
        const updateReason = document.getElementById('updateReason');
        updateReason.value = '';
        const updateButton = document.getElementById('updateModalButton');

        httpResponse = '';
        let name = '';
        const details = {
            headers: { Authorization: `${this.jwt}` }
        }
        try{
            httpResponse = await fetch(`${CONFIG.host}/miner/${minerId}`,details);
            name = await httpResponse.text();
        }catch(err){
            connError();
        }
        dateF = convertDate(date);

        expenseInfo.innerHTML = `
            <h5>Submitted by: ${name}</h5>
            <p>Amount: $${amount}</p>
            <p>Description: ${description}</p>
            <p>Date: ${dateF.dateDisplay} at ${dateF.timeDisplay} EST</p>
        `
        // user clicked on Approve
        if(approve){
            title.innerHTML = 'Approve this expense request:';
            updateReason.setAttribute('placeholder','Reason for approval...');
            updateButton.setAttribute('class', 'btn btn-success');
            updateButton.innerHTML='Approve Request';
            updateButton.setAttribute('onclick',`updateFinal(${expenseId},${amount},'approved')`);          
        }else{ //user clicked on Deny
            title.innerHTML = 'Deny this expense request:';
            updateReason.setAttribute('placeholder','Reason for denial...');
            updateButton.setAttribute('class', 'btn btn-danger');
            updateButton.innerHTML='Deny Request';
            updateButton.setAttribute('onclick',`updateFinal(${expenseId},${amount},'denied')`);
        }
}

// executes update in database
async function updateFinal(id,amount,status){
    
        this.jwt = sessionStorage.getItem('jwt')
        const updateReason = document.getElementById('updateReason');

        if(updateReason.value.length < 299){
            const expenseUpate = {
                status: status,
                amount: amount,
                resolvedReason: updateReason.value
            }  
            const details = {
                method: 'PUT',
                headers: { Authorization: `${this.jwt}` },
                body: JSON.stringify(expenseUpate)
            }
            let httpStatus = ''
            let e = ''
            
            try{
                const httpResponse = await fetch(`${CONFIG.host}/expenses/${id}`,details);
                httpStatus = await httpResponse.status;
                e = await httpResponse.json();
            }catch(err){
                connError();
            }
            
            console.log(httpStatus)
            document.getElementById('a2').setAttribute('hidden','hidden');
            
            this.display();
        }else{
            updateReason.value = '';
            document.getElementById('a2Message').innerHTML = 'Description input exceeds text constraints'
            document.getElementById('a2').removeAttribute('hidden');
        }
}


// Create
async function create(){
        this.jwt = sessionStorage.getItem('jwt')
        this.userToken = JSON.parse(atob(this.jwt.split('.')[1]));

        const amount = document.getElementById('amountInput');
        if (amount.value > 0){
            const description = document.getElementById('descriptionInput');
            const expense = {
                minerId: this.userToken.minerId,
                amount: amount.value,
                description: description.value
            }  
            const details = {
                method: 'POST',
                headers: { Authorization: `${this.jwt}` },
                body: JSON.stringify(expense)
            }
            let httpStatus= '';
            let httpResponse = '';
            try{
                httpResponse = await fetch(`${CONFIG.host}/expenses`,details);
                httpStatus = await httpResponse.status;
            
                console.log(httpStatus);
                if(httpStatus === 201){
                    const e = await httpResponse.json();
                    console.log(e);
                    amount.value = '';
                    description.value = '';
                    this.display();
                    document.getElementById('a2').setAttribute('hidden','hidden');
                }else{
                    document.getElementById('a2Message').innerHTML = 'Input exceeds value or text constraints'
                    document.getElementById('a2').removeAttribute('hidden');
                    amount.value = '';
                    description.value = '';
            }
            }catch(err){
                connError();
            }

        }else{
            document.getElementById('a2').removeAttribute('hidden');
        }
  
}


// helper function for Unix epoch date conversion
function convertDate(d){
    const dateFormatted = new Date(d * 1000);
    // Hours part from the timestamp
    const hours = dateFormatted.getHours();
    // Minutes part from the timestamp
    const minutes = "0" + dateFormatted.getMinutes();
    // Seconds part from the timestamp
    const seconds = "0" + dateFormatted.getSeconds();

    const dateDisplay = (dateFormatted.getMonth()+1) + '/' + dateFormatted.getDate() + '/' +dateFormatted.getFullYear();
    // Will display time in 10:30:23 format
    const timeDisplay = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

    return {dateDisplay,timeDisplay}
}

