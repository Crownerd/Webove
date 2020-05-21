//an array, defining the routes
export default[

    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },

    {
        hash:"article",
        target:"router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },

    {
        hash:"articles",
        target:"router-view",
        getTemplate:fetchAndDisplayArticles
    },

    {
        hash:"opinions",
        target:"router-view",
        getTemplate: createHtml4opinions
    },

    {
        hash:"addOpinion",
        target:"router-view",
        getTemplate: (targetElm) =>{
            let opinions = [];
            document.getElementById(targetElm).innerHTML = Mustache.render(document.getElementById("template-addOpinion").innerHTML,opinions);
            updateSignIn();
        }

    },

    {
        hash:"artEdit",
        target:"router-view",
        getTemplate: editArticle
    },

    {
        hash: "artDelete",
        target: "router-view",
        getTemplate: deleteArticle
    },

    {
        hash:"artInsert",
        target:"router-view",
        getTemplate: addArticle
    },
    {
        hash:"addComment",
        target:"articles",
        getTemplate: addNewAComment
    },


];

const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;

if(!localStorage.offset){
    localStorage.setItem("offset", "1");
}
if(!localStorage.totalcount){
    localStorage.setItem("totalCount", "40");
}

function createHtml4opinions(targetElm){
    /*const opinionsFromStorage=localStorage.myTreesComments;
    let opinions=[];

    if(opinionsFromStorage){
        opinions=JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn = opinion.willReturn?"I will return to this page.":"Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );*/

    const postReqSettings = //an object wih settings of the request
        {
            method: 'GET',
            headers: {
                "X-Parse-Application-Id": "cUkl4g4awbFm1TYkQ270Qdv3O8YE8nf4oTNd8EZZ",
                "X-Parse-REST-API-Key": "FbuCGpnB30pelBl0QH8PoWU5zON0XVsM8hnhwbBZ"
            }
        };


    const urlSend="https://parseapi.back4app.com/classes/opinion"

//3. Execute the request

    let opinions = [];

    fetch(urlSend, postReqSettings)
        .then(response => {      //fetch promise fullfilled (operation completed successfully)
            if (response.ok) {    //successful execution includes an error response from the server. So we have to check the return status of the response here.
                return response.json(); //we return a new promise with the response data in JSON to be processed
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
            }
        })
        .then(responseJSON => { //here we process the returned response data in JSON ...

            opinions = responseJSON.results;

            document.getElementById(targetElm).innerHTML = Mustache.render(
                document.getElementById("template-opinions").innerHTML,
                opinions
            );


        })
        .catch(error => { ////here we process all the failed promises
            window.alert(`Názory sa nepodarilo zobraziť. ${error}`);
        })
}

function fetchAndDisplayArticles(targetElm, offsetFromHash,totalCountFromHash){
    let articles =[];
    offsetFromHash=Number(offsetFromHash);
    totalCountFromHash=Number(totalCountFromHash);
    localStorage.setItem("offset", JSON.stringify(offsetFromHash));
    localStorage.setItem("totalCount", JSON.stringify(totalCountFromHash));

    const data4rendering={
        currPage:localStorage.getItem("offset"),
        pageCount:totalCountFromHash,
        articleList: articles
    };

    if(offsetFromHash>1){
        data4rendering.prevPage=offsetFromHash-1;
    }

    if(offsetFromHash<totalCountFromHash){
        data4rendering.nextPage=offsetFromHash+1;
    }

    let offset = data4rendering.currPage;

    let x = (offset * 20) - 19
    const url = "https://wt.kpi.fei.tuke.sk/api/article/?tag=gamedevelopment&max=20&offset=" + x;

    const articlesElm = document.getElementById("router-view");
    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            responseJSON.meta.totalCount = totalCountFromHash;
            addArtDetailLink2ResponseJson(responseJSON,1,1);
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles").innerHTML,
                    responseJSON
                );
            data4rendering.articleList=responseJSON.articles;
            return Promise.resolve();
        })
        .then( ()=> {

            let prrt;

            let cntRequests = data4rendering.articleList.map(
                article => fetch(`https://wt.kpi.fei.tuke.sk/api/article/${article.id}`)
            );
            return Promise.all(cntRequests);
        })
        .then(responses =>{
            let failed="";
            for(let response of responses) {
                if(!response.ok) failed+=response.url+" ";
            }
            if(failed===""){
                return responses;
            }else{
                return Promise.reject(new Error(`Failed to access the content of the articles with urls ${failed}.`));
            }
        })
        .then(responses => Promise.all(responses.map(resp => resp.json())))
        .then(articles => {
            articles.forEach((article,index) =>{
                data4rendering.articleList[index].content=article.content;
            });
            return Promise.resolve();
        })
        .then( () =>{
            let offset = localStorage.getItem("offset");
            let totalCount = localStorage.getItem("totalCount");
            document.getElementById("articleLink").href= '#articles/'+offset+'/'+ totalCount;
            renderArticles(data4rendering);


        })
        .catch (error => { ////here we process all the failed promises
            console.log(error);
        });

    function renderArticles(data) {
        articlesElm.innerHTML=Mustache.render(document.getElementById("template-articles").innerHTML, data ); //write some of the response object content to the page using Mustache
    }
}

function addArtDetailLink2ResponseJson(responseJSON){
    responseJSON.articles =
        responseJSON.articles.map(
            article =>(
                {
                    ...article,
                    detailLink:`#article/${article.id}/1/10`
                }
            )
        );
}

function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,false);
    updateSignIn();
}


/**
 * Gets an article record from a server and processes it to html according to the value of the forEdit parameter.
 * Assumes existence of the urlBase global variable with the base of the server url (e.g. "https://wt.kpi.fei.tuke.sk/api"),
 * availability of the Mustache.render() function and Mustache templates with id="template-article" (if forEdit=false)
 * and id="template-article-form" (if forEdit=true).
 * @param targetElm - id of the element to which the acquired article record will be rendered using the corresponding template
 * @param artIdFromHash - id of the article to be acquired
 * @param commentOffsetFromHash - current offset of the article list display to which the user should return
 * @param totalCommentCountFromHash - total number of articles on the server
 * @param forEdit - if false, the function renders the article to HTML using the template-article for display.
 *                  If true, it renders using template-article-form for editing.
 */
function fetchAndProcessArticle(targetElm, artIdFromHash, commentOffsetFromHash, totalCommentCountFromHash,forEdit) {
    const url = `${urlBase}/article/${artIdFromHash}`;
    commentOffsetFromHash = parseInt(commentOffsetFromHash);
    totalCommentCountFromHash = parseInt(totalCommentCountFromHash);
    let offset = localStorage.getItem("offset");
    let totalCount = localStorage.getItem("totalCount");
    let article;
    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            responseJSON.tags = responseJSON.tags.filter(tag => tag != "gamedevelopment");
            if(forEdit){
                responseJSON.formTitle="Article Edit";
                responseJSON.formSubmitCall =
                    `processArtEditFrmData(event,${artIdFromHash},${offset},${totalCount},'${urlBase}')`;
                responseJSON.submitBtTitle="Save article";
                responseJSON.urlBase=urlBase;

                responseJSON.backLink=`#article/${artIdFromHash}/${offset}/${totalCount}`;
                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
                article = responseJSON;
            }else{


                responseJSON.backLink=`#articles/${offset}/${totalCount}`;
                responseJSON.editLink=`#artEdit/${responseJSON.id}/${offset}/${totalCount}`;
                responseJSON.deleteLink=`#artDelete/${responseJSON.id}/${offset}/${totalCount}`;
                responseJSON.addCommLink=`#addComment/${responseJSON.id}/${commentOffsetFromHash}/${totalCommentCountFromHash}`;
                article = responseJSON;
                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );

            }

        })
        .then( () => {
            return fetch(`${url}/comment/?max=5&offset=${(commentOffsetFromHash * 5) - 5}`)
            //return fetch(`${url}/comment/`)
        })
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then((responseJSON) => {
            article.totalCommentPage = totalCommentCountFromHash;
            article.commentPage = commentOffsetFromHash;
            article.comments = responseJSON.comments;


            if(article.comments.length === 5){
                article.full = true;
            }else{
                article.full = false;
            }
            if(article.comments.length === 0 || (commentOffsetFromHash > 1 && !article.full) ){
                article.isEmpty = true;
            }else{
                article.isEmpty = false;
            }

            if(commentOffsetFromHash > 1){
                article.commentPrevPage=commentOffsetFromHash-1;
            }

            if(!article.isEmpty){
                article.commentNextPage=commentOffsetFromHash+1;
            }

            if(!forEdit) {
                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        article
                    );
                updateSignIn();
            }
        })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
            //updateSignIn();
        });
    //updateSignIn();
}

function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,true);
}
/*
function addArticle(targetElm){
    let article = {
        title: "",
        content: ""
    };




    getTemplate: (targetElm) =>
        document.getElementById(targetElm).innerHTML = document.getElementById("template-article-form").innerHTML

        formTitle
        formSubmitCall


    if(article.title === "" || article.content === ""){
        alert("title or content must'nt be empty");
        return;
    }

    let json = JSON.stringify(article);

    document.getElementById(targetElm).innerHTML =
        Mustache.render(
            document.getElementById("template-article-form").innerHTML, data
        );
}*/

function addArticle(targetElm) {
    /*let articleData = {
        submitBtTitle: "Add article",
        urlBase: urlBase,
        formSubmitCall: `processArtAddFormData(event,'${urlBase}')`,
        formTitle: "Add article"
    };
    console.log(articleData);
    document.getElementById(targetElm).innerHTML =
        Mustache.render(
            document.getElementById("template-article-form").innerHTML,
            articleData
        );
    updateSignIn();*/
    let dataJSON = [];
    dataJSON.formTitle="Add Article";
    dataJSON.formSubmitCall =
        `processArtAddFormData(event,'${urlBase}')`;
    dataJSON.submitBtTitle="Add article";
    dataJSON.urlBase=urlBase;
    //dataJSON.author = document.getElementById("author").innerHTML;

    document.getElementById(targetElm).innerHTML =
        Mustache.render(
            document.getElementById("template-article-form").innerHTML,
            dataJSON
        );
    updateSignIn();
}


function deleteArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    const url = `${urlBase}/article/${artIdFromHash}`;


    fetch(url, {method: 'DELETE'})
        .then(response => {
            if (response.ok) {
                return response.json();

            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .catch(error => { ////here we process all the failed promises
            const errMsgObj = {errMessage: error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        })
        .finally(() => {
            window.location.href = `#articles/${offsetFromHash}/${totalCountFromHash}`;
        });

}

function addNewAComment(targetElm, artIdFromHash,  offsetFromHash, totalCountFromHash) {
    const newCommData = {
        text: document.getElementById("commentAdd").value.trim(),
        author: document.getElementById("author").value.trim(),
    };
    artIdFromHash = parseInt(artIdFromHash);
    offsetFromHash = parseInt(offsetFromHash);
    totalCountFromHash = parseInt(totalCountFromHash);

    if (!(newCommData.text && newCommData.author)) {
        window.alert("Please, enter article title and content");
        return;
    }
    const postReqSettings = //an object wih settings of the request
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
            },
            body: JSON.stringify(newCommData)
        };
    fetch(`${urlBase}/article/${artIdFromHash}/comment`, postReqSettings)  //now we need the second parameter, an object wih settings of the request.
        .then(response => {      //fetch promise fullfilled (operation completed successfully)
            if (response.ok) {    //successful execution includes an error response from the server. So we have to check the return status of the response here.
                return response.json(); //we return a new promise with the response data in JSON to be processed
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
            }
        })
        .then(responseJSON => { //here we process the returned response data in JSON ...
            window.location.hash=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;
        })
        .catch(error => { ////here we process all the failed promises
            window.alert("Error adding comment to the server!");
            window.location.hash=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;
        });
}

