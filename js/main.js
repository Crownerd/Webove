function opinion2html(opinion) {
    opinion.createdDate = (new Date(opinion.created)).toDateString();
    opinion.willReturnMessage = opinion.willReturn ? "I will return to this page." : "Sorry, one visit was enough.";

    const template = document.getElementById("template").innerHTML;
    const htmlWOp = Mustache.render(template, opinion);

    delete(opinion.createdDate);
    delete(opinion.willReturnMessage);

    return htmlWOp;
}

function opinionArray2html(sourceData) {
    let htmlWithOpinions = "";

    for (const opn of sourceData) {
        htmlWithOpinions += opinion2html(opn);
    }

    return htmlWithOpinions;
}

let opinions = [];

if (localStorage.contactForm) {
    opinions = JSON.parse(localStorage.contactForm);
}
let opcontainer = document.getElementById("opcontainer");
opcontainer.innerHTML=opinionArray2html(opinions);

let contactForm = document.getElementById("contactForm");


let modal = document.getElementById("Modal");
contactForm.addEventListener("submit", processForm);
contactForm.addEventListener("reset", resetForm);

function processForm(event) {
    //1.prevent normal event (form sending) processing
    event.preventDefault();
    var trimmed_text = document.getElementById("texty").value.trim();
    trimmed_text = trimmed_text.replace(/\r?\n/g, '</br>');
    var trimmed_obj = JSON.parse('{"name":"' + document.getElementById("inputName").value.trim() + '","email":"' + document.getElementById("inputEmail").value.trim() + '","url":"' + document.getElementById("inputUrl").value.trim() + '","text":"' + trimmed_text + '","date":"' + new Date().toLocaleString() + '"}');
    //console.log(trimmed_obj);
    if (trimmed_obj.name == "") {
        contactForm.classList.add("invalidForm-name");
        return;
    }
    if (trimmed_obj.email == "") {
        contactForm.classList.add("invalidForm-email");
        return;
    }
    if (trimmed_obj.text == "") {
        contactForm.classList.add("invalidForm-text");
        return;
    }
    opinions.push(trimmed_obj);
    localStorage.contactForm = JSON.stringify(opinions);
    //window.alert("Your opinion has been stored. Look to the console");
    modal.classList.add("open");
    //console.log("New opinion added");
    //console.log(opinions);

    opcontainer.innerHTML+=opinion2html(trimmed_obj);

    contactForm.reset(); //resets the form
}

function resetForm(event) {
    contactForm.reset();
}

var modalClose = document.getElementById("Modal-Close").addEventListener("click", ModalClose);
var modalClose = document.getElementById("Modal").addEventListener("click", ModalClose);

function ModalClose(event) {
    modal.classList.remove("open");
}