initDB();

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function shuffleWeights() {
    var data = document.getElementById('weights');
    if (data.value.length > 0) {
        var weights = data.value.split('\n');
        var shuffledArray = shuffleArray(weights);
        data.value = shuffledArray.join('\n');
    }
}

function showSpinner(show, msg) {
    var backdrop = document.getElementById('backdrop');
    var spinner = document.getElementById('spinner');
    var modal = document.getElementById('modal');
    if (show) {
        backdrop.style.display = 'block';
        spinner.style.display = 'block';
        modal.style.display = 'block';
        document.getElementById('spinnerText').innerText = msg;
    } else {
        backdrop.style.display = 'none';
        spinner.style.display = 'none';
        modal.style.display = 'none';
    }
}

function handleTotalCanWeight() {}

function handleCanWeight() {
    var canCount = document.getElementById('canCount');
    var canWeight = document.getElementById('canWeight');
    var totalWeight = (!isNaN(canCount.value) && !isNaN(canWeight.value)) ? (parseFloat(canCount.value) * parseFloat(canWeight.value)).toFixed(3) : 0;
    var totalWeightInput = document.getElementById('can-weight');
    totalWeightInput.value = (!isNaN(totalWeight) ? totalWeight : 0);
}

function handleWeights() {
    var data = document.getElementById('weights').value;
    var cansCount = document.getElementById('cans-count');
    var canCount = document.getElementById('canCount');
    var cansLen = data.split('\n');
    var count = 0;
    cansLen.forEach(can => {
        if (can != '') {
            count++;
        }
    });
    cansCount.innerText = 'Total Cans: ' + count;
    canCount.value = count;
}

function getBill(reqDate) {
    if (reqDate != null && reqDate != '') {
        showSpinner(true, 'Getting Bill');
        db.collection("Milk Biller").doc(reqDate).get().then((doc) => {
            if (doc.exists) {
                var dairyName = doc.data().Milk_Partner;
                var date = doc.data().Date;
                var am_pm = doc.data().AM_PM;
                var weights = doc.data().Weights;
                var weightsString = "";
                var weightsString1 = "";
                let bill = getTotalWeight(weights);
                var canWeight = doc.data().Can_Weight;
                let weight = parseFloat(bill - canWeight).toFixed(3);
                for (let i = 0; i < weights.length; i++) {
                    weightsString += weights[i] + "%0A";
                    weightsString1 += weights[i] + "  </br>";
                }
                var totalAmount = doc.data().Total_Bill;
                var milk_rate = doc.data().Milk_Rate_Per_Litre;
                var result_wa = createWhatsappString(dairyName, new Date(date).toLocaleDateString("en-GB"), am_pm, weightsString, canWeight, weight, totalAmount, bill, milk_rate);
                var result_div = createDivString(dairyName, new Date(date).toLocaleDateString("en-GB"), am_pm, weightsString1, bill, milk_rate, canWeight, weight, totalAmount);
                document.getElementById('result-div').style.display = 'block';
                document.getElementById('result').innerHTML = result_div;
                document.getElementById('whatsapp-send').addEventListener('click', () => {
                    window.location.href = createWhatsAppLink(result_wa);
                });
                showSpinner(false, '');
            } else {
                showSpinner(false, '');
                alert("No bill found");
            }
        }).catch((error) => {
            showSpinner(false, '');
            console.log("Error getting document:", error);
        });
    } else {
        alert('Select Bill date');
    }
}
if (sessionStorage.getItem('login-status') == null || sessionStorage.getItem('login-status') == false) {
    showLoginDiv(true);
    showMainDiv(false);
} else {
    showLoginDiv(false);
    showMainDiv(true);
}

function validateLogin() {
    var loginValidation = [];
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    if (email.value == '' || email.value == null) {
        email.classList.add('slds-has-error');
        loginValidation.push(false);
    } else {
        email.classList.remove('slds-has-error');
        loginValidation.push(true);
    }
    if (password.value == '' || password.value == null) {
        password.classList.add('slds-has-error');
        loginValidation.push(false);
    } else {
        password.classList.remove('slds-has-error');
        loginValidation.push(true);
    }
    var validation = (loginValidation.indexOf(false) == -1) ? true : false;
    return validation;
}

function login() {
    email = document.getElementById('email');
    password = document.getElementById('password');
    //alert(password); 
    if (validateLogin()) {
        document.getElementById('login-btn').disabled = true;
        showSpinner(true, 'Signing in');
        firebase.auth().signInWithEmailAndPassword(email.value, password.value).then((userCredential) => {
            // Signed in
            var user = userCredential.user;
            showSpinner(false, '');
            document.getElementById('login-btn').disabled = true;
            showLoginDiv(false);
            showMainDiv(true);
            //alert(JSON.stringify(user))
            sessionStorage.setItem('login-status', true);
            var db = firebase.firestore();
            db.collection("Milk Biller").orderBy("Date", "desc").limit(1).get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    var latest = doc.data().Date.split("-");
                    var dd = latest[2];
                    var mm = latest[1];
                    var yyyy = latest[0];
                    today = yyyy + "-" + mm + "-" + dd;
                    getBill(today);
                });
            });
            // ...
        }).catch((error) => {
            document.getElementById('login-btn').disabled = false;
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(error);
            showSpinner(false, '');
            alert('You are not allowed to sign in. Kindly contact SVRMP about this error.');
        });
    }
}

function showLoginDiv(show) {
    if (show) {
        document.getElementById('login-div').style.display = "block";
    } else {
        document.getElementById('login-div').style.display = "none";
    }
}

function showMainDiv(show) {
    if (show) {
        openBiller();
        document.getElementById('main-div').style.display = "block";
    } else {
        document.getElementById('main-div').style.display = "none";
    }
}
no_of_days = parseInt(0);
amount_spent = parseInt(0);
total_cans = parseInt(0);
total_cans_weight = parseInt(0);

function getDetails() {
    var db = firebase.firestore();
    var startDate = document.getElementById('start-date').value;
    var endDate = document.getElementById('end-date').value;
    if (startDate != null && endDate != null) {
        showSpinner(true, 'Getting details');
        db.collection("Milk Biller").where("Date", ">=", startDate).where("Date", "<=", endDate).get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                no_of_days++;
                amount = doc.data().Total_Bill.split(',');
                amount_spent += parseInt(amount[0] + '' + amount[1]);
                total_cans += doc.data().Cans_Count;
                total_cans_weight += parseFloat(doc.data().Bill_Without_Can_Weight) - parseFloat(doc.data().Can_Weight);
            });
            showSpinner(false, '');
            document.getElementById('days_work_done').innerText = no_of_days;
            document.getElementById('total-cans').innerText = total_cans;
            document.getElementById('total-cans-weight').innerText = Intl.NumberFormat('en-IN').format(total_cans_weight);
            document.getElementById('total-amount').innerText = "₹ " + Intl.NumberFormat('en-IN').format(amount_spent) + "/-";
            no_of_days = parseInt(0);
            amount_spent = parseInt(0);
            total_cans = parseInt(0);
            total_cans_weight = parseInt(0);
        }).catch((error) => {
            console.log("Error getting documents: ", error);
            showSpinner(false, '');
        });
    }
}

function openBiller() {
    document.getElementById('tab-default-1').style.display = 'block';
    document.getElementById('tab-default-2').style.display = 'none';
    document.getElementsByClassName('slds-tabs_default__item')[1].classList.remove('slds-is-active');
    document.getElementsByClassName('slds-tabs_default__item')[0].classList.add('slds-is-active');
    document.getElementById('get-bill-div').style.display = "none";
}

function openManage() {
    document.getElementById('tab-default-1').style.display = 'none';
    document.getElementsByClassName('slds-tabs_default__item')[0].classList.remove('slds-is-active');
    document.getElementsByClassName('slds-tabs_default__item')[1].classList.add('slds-is-active');
    document.getElementById('tab-default-2').style.display = 'block';
    document.getElementById('get-bill-div').style.display = "block";
}

function openWhatsapp(number) {
    window.location.href = "https://api.whatsapp.com/send?phone=+91" + number;
}
if (localStorage.getItem("result_div") != null && localStorage.getItem("wa") != null) {
    var div = document.getElementById('result');
    document.getElementById("result-div").style.display = 'block';
    div.innerHTML = localStorage.getItem("result_div");
    div.style.display = 'block';
    document.getElementById("whatsapp-send").addEventListener('click', () => {
        window.location.href = createWhatsAppLink(localStorage.getItem("wa"));
    });
}
var textarea = document.getElementById('weights');
var heightLimit = 200;
textarea.oninput = function() {
    textarea.style.height = "";
    textarea.style.height = Math.min(textarea.scrollHeight, heightLimit) + "px";
}

function validateSubmit() {
    var noErrorsBeforeSubmit = [];
    var weights = document.getElementById('weights');
    var result = document.getElementById('result');
    let milk_rate = document.getElementById('milk-price');
    let canWeight = document.getElementById('can-weight');
    if (!weights.value.length > 0) {
        weights.classList.add('slds-has-error');
        noErrorsBeforeSubmit.push(false);
    } else {
        weights.classList.remove('slds-has-error');
        noErrorsBeforeSubmit.push(true);
    }
    if (milk_rate.value == '' || milk_rate.value == 0 || milk_rate.value == null) {
        milk_rate.classList.add('slds-has-error');
        noErrorsBeforeSubmit.push(false);
    } else {
        milk_rate.classList.remove('slds-has-error');
        noErrorsBeforeSubmit.push(true);
    }
    if (canWeight.value == '' || canWeight.value == 0 || canWeight.value == null) {
        canWeight.classList.add('slds-has-error');
        noErrorsBeforeSubmit.push(false);
    } else {
        canWeight.classList.remove('slds-has-error');
        noErrorsBeforeSubmit.push(true);
    }
    var validation = (noErrorsBeforeSubmit.indexOf(false) == -1) ? true : false;
    return validation;
}

function calculateResult() {
    var weights = document.getElementById('weights');
    var result = document.getElementById('result');
    var resultText = weights.value;
    if (validateSubmit()) {
        result.innerHTML = alignBill(resultText);
        document.getElementById('result-div').style.display = 'block';
    }
}

function computeTotal(quantities) {
    var weights = quantities.split('\n');
    let sum = 0;
    for (let i = 0; i < weights.length && weights[i] != ""; i++) {
        sum += parseFloat(weights[i]);
    }
    return sum.toFixed(3);
}

function getTotalWeight(weights) {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
        sum += parseFloat(weights[i]);
    }
    return sum.toFixed(3);
}

function alignBill(quantities) {
    let bill = computeTotal(quantities);
    let milk_rate = parseFloat(document.getElementById('milk-price').value);
    let canWeight = parseFloat(document.getElementById('can-weight').value).toFixed(3);
    var dairyName = document.getElementById('milk-seller-list').value;
    let weight = parseFloat(bill - canWeight).toFixed(3);
    let totalAmount = parseFloat(weight * milk_rate).toFixed(0);
    totalAmount = Intl.NumberFormat('en-IN').format(totalAmount);
    var date1 = document.getElementById('date').value;
    var date = new Date(date1).toLocaleDateString("en-GB");
    var am_pm = document.getElementById('am-pm').value;
    var weights = quantities.split('\n');
    var weightsString = "";
    var weightsString1 = "";
    for (let i = 0; i < weights.length; i++) {
        weightsString += weights[i] + "%0A";
        weightsString1 += weights[i] + " </br>";
    }
    var result_wa = createWhatsappString(dairyName, date, am_pm, weightsString, canWeight, weight, totalAmount, bill, milk_rate);
    var result_div = createDivString(dairyName, date, am_pm, weightsString1, bill, milk_rate, canWeight, weight, totalAmount);
    addToDB(date1, dairyName, weights, bill, canWeight, milk_rate, totalAmount, am_pm);
    addToLS(result_div, result_wa);
    document.getElementById('whatsapp-send').addEventListener('click', () => {
        window.location.href = createWhatsAppLink(result_wa);
    });
    return result_div;
}

function createWhatsappString(dairyName, date, am_pm, weightsString, canWeight, weight, totalAmount, bill, milk_rate) {
    return "*" + dairyName + "*%0A*Date*: " + date + " _(" + am_pm + ")_%0A%0A" + weightsString + "————————%0A*" + bill + "*%0A" + "– _" + canWeight + "_ (Empty Cans)%0A——————————%0A_*" + weight + "*_ × " + milk_rate + "%0A———————%0A*₹ " + totalAmount + "/-*";
}

function createDivString(dairyName, date, am_pm, weightsString1, bill, milk_rate, canWeight, weight, totalAmount) {
    return "<b>" + dairyName + "</b></br> <b> Date </b>: " + date + " <i> (" + am_pm + ") </i> </br> </br>" + weightsString1 + "-------------  </br> <b> " + bill + " </b> </br>" + "–   <i> " + canWeight + " </b> <i> (Empty Cans) </i> </br>-------------  </br>" + weight + " × " + milk_rate + "  </br>-------------  </br> <b> ₹" + totalAmount + " / - </b>";
}

function createWhatsAppLink(message) {
    return "whatsapp://send?text=" + message;
}

function addToLS(div, wa) {
    localStorage.setItem("result_div", div);
    localStorage.setItem("wa", wa);
}

function addToDB(date, milkpartner, weights, bill, canweight, milkrate, totalBill, am_pm) {
    showSpinner(true, 'Calculating the Bill');
    var db = firebase.firestore();
    db.collection("Milk Biller").doc(date).set({
        Date: date,
        AM_PM: am_pm,
        Milk_Partner: milkpartner,
        Weights: weights,
        Cans_Count: weights.length,
        Bill_Without_Can_Weight: bill,
        Can_Weight: canweight,
        Milk_Rate_Per_Litre: milkrate,
        Total_Bill: totalBill
    }).then(() => {
        showSpinner(false, '');
        console.log("Document successfully written!");
    }).catch((error) => {
        showSpinner(false, '');
        console.error("Error writing document: ", error);
    });
}

function initDB() {
    const firebaseConfig = {
        apiKey: "AIzaSyABU3wrmKgVumYiW6MVBWn5CFg20k2LkiE",
        authDomain: "srivenkataramanamilk-products.firebaseapp.com",
        databaseURL: "https://srivenkataramanamilk-products-default-rtdb.firebaseio.com",
        projectId: "srivenkataramanamilk-products",
        storageBucket: "srivenkataramanamilk-products.appspot.com",
        messagingSenderId: "305866360345",
        appId: "1:305866360345:web:3919e57a4360fd2cdb0c88",
        measurementId: "G-LCHPSC45B5"
    };
    firebase.initializeApp(firebaseConfig);
}
// initDB();
var db = firebase.firestore();
db.collection("Milk Sellers").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        var option = document.createElement('option');
        option.value = doc.data().Seller_Name + ", " + doc.data().Seller_Place;
        option.innerText = doc.id;
        document.getElementById('milk-seller-list').appendChild(option);
    });
});
var date = new Date();
var day = date.getDate();
var month = date.getMonth() + 1;
var year = date.getFullYear();
if (month < 10) month = "0" + month;
if (day < 10) day = "0" + day;
var today = year + "-" + month + "-" + day;
document.getElementById("date").value = today;
//showMainDiv(true)