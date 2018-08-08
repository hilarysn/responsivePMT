var CKO = CKO || {};
CKO.FORMS = CKO.FORMS || {};

CKO.FORMS.VARIABLES = {
    template: null,
    loc: String(window.location)
}

CKO.FORMS.OVERRIDES = function () {
    var v = CKO.FORMS.VARIABLES;

    function Init() {
        v.template = document.querySelector("[data-role='form']");
        if (!v.template) {
            // should not get here, but just in case
            alert("No template defined! Using standard form");
        }
        else {
            if (v.loc.indexOf("NewForm.aspx") > 0 || v.loc.indexOf("EditForm.aspx") > 0 || v.loc.indexOf("DispForm.aspx") > 0) {
                $(".ms-formtable").hide();
                $(".ms-formtoolbar").hide();
                overrideform();
            }
            else {
                //if (v.loc.indexOf("DispForm.aspx") > 0) {
                //    $(".ms-formtoolbar").hide();
                //    $(".ms-formtable").contents().appendTo("#tabMain");
                //    $("div[data-role='form']").show();
                //}
                //else {
                    alert("Not a form page!");
                //}
            }
        }
    }

    function overrideform() {
        // loop through the template fields and clone the original SharePoint drawn form controls
        
        $("div[data-field]").each(function (z) {
            var field = $(this).attr("data-field");
            var target = $(this);
            $("td.ms-formbody").each(function (idx) {
                if (this.innerHTML.indexOf('FieldName="' + field + '"') != -1) {
                    $(this).contents().appendTo(target);
                }
            });
        });
        
        $("div[data-role='form']").show();
    }

    return {
        Init: Init
    }
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('cko.forms.overrides.js');