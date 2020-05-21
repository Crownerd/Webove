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

    const Name = document.getElementById("author").value.trim();
    const Email = document.getElementById("inputEmail").value.trim();
    const Url = document.getElementById("inputUrl").value.trim();
    const Comment = document.getElementById("texty").value.trim();

    const newOpinion =
        {
            name: Name,
            email: Email,
            url: Url,
            comment: Comment,
            created: new Date()
        };

    //console.log(trimmed_obj);
    if (newOpinion.name == "") {
        contactForm.classList.add("invalidForm-name");
        return;
    }
    if (newOpinion.email == "") {
        contactForm.classList.add("invalidForm-email");
        return;
    }
    if (newOpinion.text == "") {
        contactForm.classList.add("invalidForm-text");
        return;
    }
/*
    let opinions = [];

    if (localStorage.myTreesComments) {
        opinions = JSON.parse(localStorage.myTreesComments);
    }

    opinions.push(newOpinion);
    localStorage.myTreesComments = JSON.stringify(opinions);
    window.alert("Your opinion has been stored. Look to the console");
    //console.log("New opinion added");
    //console.log(opinions);

    //contactForm.reset(); //resets the form

    window.location.hash="#opinions";*/
    const postReqSettings = //an object wih settings of the request
        {
            method: 'POST',
            headers: {
                "X-Parse-Application-Id": "cUkl4g4awbFm1TYkQ270Qdv3O8YE8nf4oTNd8EZZ",
                "X-Parse-REST-API-Key": "FbuCGpnB30pelBl0QH8PoWU5zON0XVsM8hnhwbBZ",
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(newOpinion)
        };


    const urlSend="https://parseapi.back4app.com/classes/opinion"

    //3. Execute the request


    fetch(urlSend, postReqSettings)
        .then(response => {
            if (response.ok) {
                return Promise.resolve();
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
            }
        })
        .then( () => { //here we process the returned response data in JSON ...
            console.log("Nový koment bol pridaný.");
        })
        .catch(error => { ////here we process all the failed promises
            window.alert(`Nový koment sa nepodarilo uložiť na server. ${error}`);

        })
        .finally(() =>{
            window.location.hash="#opinions";
        });
}

function resetForm(event) {
    contactForm.reset();
}

