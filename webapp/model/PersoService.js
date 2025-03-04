sap.ui.define([], function () {
    "use strict";

    var STORAGE_KEY = "TablePersonalization"; // Unique key for localStorage

    var PersoService = {
        getPersData: function () {
            return new Promise((resolve) => {
                var sData = localStorage.getItem(STORAGE_KEY);
                var oData = sData ? JSON.parse(sData) : { aColumns: [] };
                resolve(oData);
            });
        },

        setPersData: function (oPersoData) {
            return new Promise((resolve) => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(oPersoData));
                resolve();
            });
        },

        resetPersData: function () {
            return new Promise((resolve) => {
                localStorage.removeItem(STORAGE_KEY);
                resolve();
            });
        }
    };

    return PersoService;
});
