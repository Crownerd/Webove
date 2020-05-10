/*
 * Created by Stefan Korecko, 2020
 * Form processing functionality
 */

/*
function processOpnFrmData(event){
    //1.prevent normal event (form sending) processing
    event.preventDefault();

    //2. Read and adjust data from the form (here we remove white spaces before and after the strings)
    const nopName = document.getElementById("nameElm").value.trim();
    const nopOpn = document.getElementById("opnElm").value.trim();
    const nopWillReturn = document.getElementById("willReturnElm").checked;

    //3. Verify the data
    if(nopName=="" || nopOpn==""){
        window.alert("Please, enter both your name and opinion");
        return;
    }

    //3. Add the data to the array opinions and local storage
    const newOpinion =
        {
            name: nopName,
            comment: nopOpn,
            willReturn: nopWillReturn,
            created: new Date()

        };


    let opinions = [];

    if(localStorage.myTreesComments){
        opinions=JSON.parse(localStorage.myTreesComments);
    }

    opinions.push(newOpinion);
    localStorage.myTreesComments = JSON.stringify(opinions);


    //5. Go to the opinions
    window.location.hash="#opinions";

}*/

let contactForm = document.getElementById("contactForm");

function processForm(event) {
    //1.prevent normal event (form sending) processing
    event.preventDefault();
    var trimmed_text = document.getElementById("texty").value.trim();
    trimmed_text = trimmed_text.replace(/\r?\n/g, '</br>');
    var trimmed_obj = JSON.parse('{"name":"' + document.getElementById("inputName").value.trim() + '","email":"' + document.getElementById("inputEmail").value.trim() + '","url":"' + document.getElementById("inputUrl").value.trim() + '","comment":"' + trimmed_text + '","created":"' + new Date() + '"}');
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

    let opinions = [];

    if (localStorage.myTreesComments) {
        opinions = JSON.parse(localStorage.myTreesComments);
    }

    opinions.push(trimmed_obj);
    localStorage.myTreesComments = JSON.stringify(opinions);
    window.alert("Your opinion has been stored. Look to the console");
    //console.log("New opinion added");
    //console.log(opinions);

    //contactForm.reset(); //resets the form

    window.location.hash="#opinions";
}

function resetForm(event) {
    contactForm.reset();
}

