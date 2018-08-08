var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.FORMS = CKO.FORMS || {};
CKO.FORMS.SKILLS = CKO.FORMS.SKILLS || {};

CKO.FORMS.SKILLS.VARIABLES = {
    newform: null,
    site: null,
    loc: String(window.location),
    waitmsg: null,
    errortext: "Please fill out the fields: ",
    title: "",
    action: jQuery.QueryString["Action"],
    //directive: jQuery.QueryString["Directive"],
    directiveid: jQuery.QueryString["DirectiveID"]
}

CKO.FORMS.SKILLS.NewForm = function () {

    var v = CKO.FORMS.SKILLS.VARIABLES;

    function Init(site) {
        SP.SOD.executeOrDelayUntilScriptLoaded(function () {
            RegisterSod('core.js', site + "/_layouts/1033/core.js");
            RegisterSod('cko.forms.overrides.js', site + "/SiteAssets/js/cko.forms.overrides.js");
            RegisterSodDep('core.js', 'sp.js');
            RegisterSodDep('cko.forms.overrides.js', 'core.js');
            EnsureScriptFunc("cko.forms.overrides.js", null, function () {
                CKO.FORMS.OVERRIDES().Init();
                FormLoaded(site);
            });
        }, "sp.js");
    }

    function FormLoaded(site) {
        v.site = site;
        loadCSS(site + '/SiteAssets/css/CEWP_Forms_SkillsForms.css');

        //$("input[title*='Directive']").val(v.directive).attr("disabled", "disabled").css({"cursor": "not-allowed"});
        $("input[title*='ParentID']").val(v.directiveid).attr("disabled", "disabled").css({ "cursor": "not-allowed" });

        $("#btnSaveSkill").on("click", function () {
            SaveSkill();
        });

        $("#btnCancelSkill").on("click", function () {
            CancelSkill();
        });

        $(".ms-cui-group").each(function () {
            switch ($(this).attr("id")) {
                case "Ribbon.ListForm.Edit.Commit":
                    $(this).css({ "display": "none" });
                    break;

                case "Ribbon.ListForm.Edit.Actions":
                    $(this).css({ "display": "none" });
                    break;
            }
        });
    }

    function SaveSkill() {
        $("#FormError").remove();
        //$("input[title*='Directive']").removeAttr("disabled");
        $("input[title*='ParentID']").removeAttr("disabled");
        v.errortext = "Please fill out the fields: ";
        var goon = true;
        
        if ($("input[title='Hours']").val() === "") {
            goon = false;
            v.errortext += "Hours ";
        }
        if (goon === true) {
            $(window).on('unload', function () {
                var returndata = [];
                returndata[0] = "AddSkill";
                returndata[1] = "Skill Added";
                returndata[2] = v.action;
                returndata[3] = v.directiveid;
                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.OK, returndata);
            });
            $("input[id*='SaveItem']").trigger('click');
        }
        else {
            var ehtml = "<li id='FormError' class='ms-cui-group' style='width: 400px; background-color: red;'>";
            ehtml += "<div class='container-fluid' style='padding: 36px; text-align: center; color: black; font-size: 16px;'>";
            ehtml += v.errortext + "</div></li>";
            $("ul[id='Ribbon.ListForm.Edit']").append(ehtml);
            v.errortext = "Please fill out the fields: ";
        }
    }

    function CancelSkill() {
        SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.cancel);
    }

    return {
        Init: Init
    }
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_NewSkillForm.js');