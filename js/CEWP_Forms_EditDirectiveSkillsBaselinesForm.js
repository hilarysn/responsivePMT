var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.FORMS = CKO.FORMS || {};
CKO.FORMS.SKILLSBASELINES = CKO.FORMS.SKILLSBASELINES || {};

CKO.FORMS.SKILLSBASELINES.VARIABLES = {
    newform: null,
    site: null,
    loc: String(window.location),
    waitmsg: null,
    errortext: "Please fill out the fields: ",
    title: "",
    action: jQuery.QueryString["Action"]
};

CKO.FORMS.SKILLSBASELINES.EditForm = function () {

    var v = CKO.FORMS.SKILLSBASELINES.VARIABLES;

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

        $("input[title*='ParentID']").val(v.directiveid).attr("disabled", "disabled").css({ "cursor": "not-allowed" }); 
        //1. Need to make today only possible entry for for BaselineDate
        //2. Need to populate TotalProjectedHours and TotalExpendedHours
        $("input[title*='BaselineDate']").attr("disabled", "disabled").css({ "cursor": "not-allowed" });
        $("input[title*='TotalProjectedHours']").val(v.totalprojectedhours).removeAttr("disabled");
        $("input[title*='TotalExpendedHours']").val(v.totalexpendedhours).removeAttr("disabled");

        $("#btnSaveBaseline").on("click", function () {
            SaveBaseline();
        });

        $("#btnCancelBaseline").on("click", function () {
            CancelBaseline();
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

    function SaveBaseline() {
        $("#FormError").remove();
        //$("input[title*='Directive']").removeAttr("disabled");
        $("input[title*='ParentID']").removeAttr("disabled");
        $("input[title*='TotalProjectedHours']").removeAttr("disabled");
        $("input[title*='TotalExpendedHours']").removeAttr("disabled");
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
                returndata[1] = "Skill Updated";
                returndata[2] = v.action;
                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.OK, returndata);
            });
            $(".ms-cui-group").each(function () {
                switch ($(this).attr("id")) {
                    case "Ribbon.ListForm.Edit.Commit":
                        $(this).css({ "display": "block" });
                        break;

                    //case "Ribbon.ListForm.Edit.Actions":
                    //    $(this).css({ "display": "none" });
                    //    break;
                }
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

    function CancelBaseline() {
        SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.cancel);
    }

    return {
        Init: Init
    };
};

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_EditDirectiveSkillsBaselinesForm.js');