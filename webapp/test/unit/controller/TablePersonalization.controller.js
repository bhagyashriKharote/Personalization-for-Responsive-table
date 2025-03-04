/*global QUnit*/

sap.ui.define([
	"comreusablepersonalization/tablepersonalization/controller/TablePersonalization.controller"
], function (Controller) {
	"use strict";

	QUnit.module("TablePersonalization Controller");

	QUnit.test("I should test the TablePersonalization controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
