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
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML
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

function createHtml4opinions(targetElm){
    const opinionsFromStorage=localStorage.myTreesComments;
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
    );
}

function fetchAndDisplayArticles(targetElm, offsetFromHash,totalCountFromHash){
    let articles =[];
    offsetFromHash=Number(offsetFromHash);
    totalCountFromHash=Number(totalCountFromHash);
    const data4rendering={
        currPage:offsetFromHash,
        pageCount:totalCountFromHash,
        articleList: articles
    };

    if(offsetFromHash>1){
        data4rendering.prevPage=offsetFromHash-1;
    }

    if(offsetFromHash<totalCountFromHash){
        data4rendering.nextPage=offsetFromHash+1;
    }

    let offset = data4rendering.currPage * 10;

    const url = "http://wt.kpi.fei.tuke.sk/api/article/?max=20&offset=" + offset;
    //const url = "http://wt.kpi.fei.tuke.sk/api/article/?max=10&offset=0";

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
            addArtDetailLink2ResponseJson(responseJSON);
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
                article => fetch(`http://wt.kpi.fei.tuke.sk/api/article/${article.id}`)
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

            renderArticles(data4rendering);


        })
        .catch (error => { ////here we process all the failed promises
            console.log(error);
        });

    function renderArticles(data) {
        articlesElm.innerHTML=Mustache.render(document.getElementById("template-articles").innerHTML, data ); //write some of the response object content to the page using Mustache
        //articlesElm.innerHTML = Mustache.render(document.getElementById("template-articles").innerHTML, data );
    }
}

/*function fetchAndDisplayArticles(targetElm, current,totalCount){

    let articles =[];
    current=parseInt(current);
    totalCount=parseInt(totalCount);
    const data4rendering={
        currPage:current,
        pageCount:totalCount,
        articleList: articles
    };

    if(current>1){
        data4rendering.prevPage=current-1;
    }

    if(current<totalCount){
        data4rendering.nextPage=current+1;
    }

    let urlQuery = "";

    if (data4rendering.currPage && data4rendering.pageCount){
        urlQuery=`?offset=${data4rendering.currPage}&max=${articlesPerPage}`;
    }else{
        urlQuery=`?max=${articlesPerPage}`;
    }

    const url = `${urlBase}/article${urlQuery}`;

    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            addArtDetailLink2ResponseJson(responseJSON);
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles").innerHTML,
                    responseJSON
                );
        })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
}*/

function addArtDetailLink2ResponseJson(responseJSON){
    responseJSON.articles =
        responseJSON.articles.map(
            article =>(
                {
                    ...article,
                    detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
                }
            )
        );
}

function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,false);
}


/**
 * Gets an article record from a server and processes it to html according to the value of the forEdit parameter.
 * Assumes existence of the urlBase global variable with the base of the server url (e.g. "https://wt.kpi.fei.tuke.sk/api"),
 * availability of the Mustache.render() function and Mustache templates with id="template-article" (if forEdit=false)
 * and id="template-article-form" (if forEdit=true).
 * @param targetElm - id of the element to which the acquired article record will be rendered using the corresponding template
 * @param artIdFromHash - id of the article to be acquired
 * @param offsetFromHash - current offset of the article list display to which the user should return
 * @param totalCountFromHash - total number of articles on the server
 * @param forEdit - if false, the function renders the article to HTML using the template-article for display.
 *                  If true, it renders using template-article-form for editing.
 */
function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash,forEdit) {
    offsetFromHash /= 10;
    const url = `${urlBase}/article/${artIdFromHash}`;
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


            if(forEdit){
                responseJSON.formTitle="Article Edit";
                responseJSON.formSubmitCall =
                    `processArtEditFrmData(event,${artIdFromHash},${offsetFromHash},${totalCountFromHash},'${urlBase}')`;
                responseJSON.submitBtTitle="Save article";
                responseJSON.urlBase=urlBase;

                responseJSON.backLink=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
                article = responseJSON;
            }else{

                responseJSON.backLink=`#articles/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink=`#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink=`#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.addCommLink=`#addComment/${responseJSON.id}`;
                article = responseJSON;
                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
            }

        })
        .then( () => {
            return fetch(`${url}/comment`)
        })
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then((responseJSON) => {
            article.comments = responseJSON.comments;
            if(!forEdit) {
                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        article
                    );
            }
        })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });

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
    let articleData = {
        submitBtTitle: "Save article",
        urlBase: urlBase,
        formSubmitCall: `processArtAddFrmData(event,'${urlBase}')`,
        formTitle: "Add article"
    };

    document.getElementById(targetElm).innerHTML =
        Mustache.render(
            document.getElementById("template-article-form").innerHTML,
            articleData
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

function addNewAComment(targetElm, artIdFromHash) {
    const newCommData = {
        text: document.getElementById("commentAdd").value.trim(),
        author: document.getElementById("commentAuthor").value.trim(),
    };

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
            window.location.hash=`#article/${artIdFromHash}`;
        })
        .catch(error => { ////here we process all the failed promises
            window.alert("Error adding comment to the server!");
            window.location.hash=`#article/${artIdFromHash}`;
        });
}

