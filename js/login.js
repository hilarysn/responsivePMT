// login.js  --  custom login functions
// requires jQuery  --  assumed to already be loaded
// use to update the global current user variable
/*
From CKO.GLOBAL.VARIABLES
currentuser: { 
        id: null,
        login: null,
        org: null,
        type: null
    }

*/

var CKO = CKO || {};
CKO.LOGIN = CKO.LOGIN || {};

CKO.LOGIN.VARIABLES = {
    newform: null,
    site: null,
    loc: String(window.location),
    waitmsg: null,
    ctx: null,
    web: null,
    qry: null,
    user: null,
    userID: null
}

CKO.LOGIN.UserLogin = function () {
    var v = CKO.LOGIN.VARIABLES;

    function init() {
        logit("begin login script..");
        v.userID = _spPageContextInfo.userId;
        var SLASH = "/";
        var tp1 = new String(window.location.protocol);
        var tp2 = new String(window.location.host);
        var tp3 = L_Menu_BaseUrl;
        v.site = tp1 + SLASH + SLASH + tp2 + tp3;
        v.qry = v.site + "/_vti_bin/listdata.svc/KnowledgeMap?";
        v.qry += "$select=Id,Title,Organization,SharePointUser,PersonTypeValue";
        v.qry += "&$expand=SharePointUser";
        v.qry += "&$filter=(SharePointUser/Id eq " + v.userID + ")";

        jQuery.ajax({
            url: v.qry,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Login Error Getting User Info: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                CKO.GLOBAL.VARIABLES.currentuser.id = v.userID;
                CKO.GLOBAL.VARIABLES.currentuser.org = j[0]["Organization"];
                logit("ORGANIZATION: " + j[0]["Organization"]);
                CKO.GLOBAL.VARIABLES.currentuser.type = j[0]["PersonTypeValue"];
                CKO.GLOBAL.VARIABLES.currentuser.login = j[0]["SharePointUser"]["Account"];
                logit("end login script.");
            }
        });
    };


    return {
        init: init
    };
};

$(document).ready(function () {
    CKO.LOGIN.UserLogin().init();
});