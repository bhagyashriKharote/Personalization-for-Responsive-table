sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/reusable/personalization/tablepersonalization/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.reusable.personalization.tablepersonalization.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            sap.ui.getCore().loadLibrary("sap.ui.comp");

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});