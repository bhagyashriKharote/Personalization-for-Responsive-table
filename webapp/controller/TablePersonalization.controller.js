sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/p13n/Engine",
    "sap/m/p13n/SelectionController",
    "sap/m/p13n/SortController",
    "sap/m/p13n/GroupController",
    "sap/m/p13n/MetadataHelper",
    "sap/ui/model/Sorter",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/ui/core/library",
    "sap/m/table/ColumnWidthController",
    "com/reusable/personalization/tablepersonalization/model/MetadataHelper"
], function(Controller, JSONModel, Engine, SelectionController, SortController, GroupController, MetadataHelper, Sorter, ColumnListItem, Text, coreLibrary, ColumnWidthController, TableMetadata) {
    "use strict";

    return Controller.extend("com.reusable.personalization.tablepersonalization.controller.TablePersonalization", {

        onInit: function() {
            var oModel = new JSONModel();
            oModel.loadData("/model/data.json");

            oModel.attachRequestCompleted(function() {
                this.getView().setModel(oModel);
                this._registerForP13n();
            }.bind(this));
        },

        _registerForP13n: function() {
            var oTable = this.byId("idEmployeeTable");

            this.oMetadataHelper = new MetadataHelper(TableMetadata); //Load Metadata Dynamically

            Engine.getInstance().register(oTable, {
                helper: this.oMetadataHelper,
                controller: {
                    Columns: new SelectionController({
                        targetAggregation: "columns",
                        control: oTable
                    }),
                    Sorter: new SortController({
                        control: oTable
                    }),
                    Groups: new GroupController({
                        control: oTable
                    }),
                    ColumnWidth: new ColumnWidthController({
                        control: oTable
                    })
                }
            });

            Engine.getInstance().attachStateChange(this.handleStateChange.bind(this));
        },

        onGoPress: function() {
            var oTable = this.byId("idEmployeeTable");
            var oModel = this.getView().getModel();
            var aFilters = [];
        
            // Get filter values
            var sDepartment = this.byId("departmentInput").getValue();
            var sTitle = this.byId("titleInput").getValue();
            var sSkills = this.byId("skillsInput").getValue();
        
            // Apply filters if values exist
            if (sDepartment) {
                aFilters.push(new sap.ui.model.Filter("Department", sap.ui.model.FilterOperator.Contains, sDepartment));
            }
            if (sTitle) {
                aFilters.push(new sap.ui.model.Filter("Title", sap.ui.model.FilterOperator.Contains, sTitle));
            }
            if (sSkills) {
                aFilters.push(new sap.ui.model.Filter("Skills", sap.ui.model.FilterOperator.Contains, sSkills));
            }
        
            // Apply filter to table binding
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },
        

        onPersonalizePress: function(oEvt) {
            var oTable = this.byId("idEmployeeTable");
            Engine.getInstance().show(oTable, ["Columns", "Sorter", "Groups"], {
                contentHeight: "35rem",
                contentWidth: "32rem",
                source: oEvt.getSource()
            });
        },

        onFilterPress: function () {
            var oFilterBar = this.getView().byId("filterBar"); // Replace with actual FilterBar ID
            if (oFilterBar) {
                var bVisible = oFilterBar.getVisible();
                oFilterBar.setVisible(!bVisible);
            } else {
                sap.m.MessageToast.show("Filter Bar not found");
            }
        },
        
        onHideFilterPress: function () {
            var oFilterBar = this.getView().byId("filterBar");
            oFilterBar.setVisible(!oFilterBar.getVisible());
        },

        beforeOpenColumnMenu: function(oEvt) {
			var oMenu = this.byId("menu");
			var oColumn = oEvt.getParameter("openBy");
			var oSortItem = oMenu.getQuickActions()[0].getItems()[0];
			var oGroupItem = oMenu.getQuickActions()[1].getItems()[0];

			oSortItem.setKey(this._getKey(oColumn));
			oSortItem.setLabel(oColumn.getHeader().getText());
			oSortItem.setSortOrder(oColumn.getSortIndicator());

			oGroupItem.setKey(this._getKey(oColumn));
			oGroupItem.setLabel(oColumn.getHeader().getText());
			oGroupItem.setGrouped(oColumn.data("grouped"));
		},

        _getKey: function(oControl) {
			return this.getView().getLocalId(oControl.getId());
		},

        handleStateChange: function(oEvt) {
            var oTable = this.byId("idEmployeeTable");
            var oState = oEvt.getParameter("state");

            if (!oState) {
                return;
            }

            var aSorter = [];

            oState.Groups.forEach(function(oGroup) {
                aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oGroup.key).path, false, true));
            }.bind(this));

            oState.Sorter.forEach(function(oSorter) {
                var oExistingSorter = aSorter.find(function(oSort){
                    return oSort.sPath === this.oMetadataHelper.getProperty(oSorter.key).path;
                }.bind(this));

                if (oExistingSorter) {
                    oExistingSorter.bDescending = !!oSorter.descending;
                } else {
                    aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
                }
            }.bind(this));

            oTable.getColumns().forEach(function(oColumn, iIndex){
				oColumn.setVisible(false);
				oColumn.setWidth(oState.ColumnWidth[this._getKey(oColumn)]);
				oColumn.setSortIndicator(coreLibrary.SortOrder.None);
				oColumn.data("grouped", false);
			}.bind(this));

			oState.Sorter.forEach(function(oSorter) {
				var oCol = this.byId(oSorter.key);
				if (oSorter.sorted !== false) {
					oCol.setSortIndicator(oSorter.descending ? coreLibrary.SortOrder.Descending : coreLibrary.SortOrder.Ascending);
				}
			}.bind(this));

			oState.Groups.forEach(function(oSorter) {
				var oCol = this.byId(oSorter.key);
				oCol.data("grouped", true);
			}.bind(this));

			oState.Columns.forEach(function(oProp, iIndex){
				var oCol = this.byId(oProp.key);
				oCol.setVisible(true);

				oTable.removeColumn(oCol);
				oTable.insertColumn(oCol, iIndex);
			}.bind(this));

            var aCells = oState.Columns.map(function(oColumnState) {
                return new Text({
                    text: "{" + this.oMetadataHelper.getProperty(oColumnState.key).path + "}"
                });
            }.bind(this));

            oTable.bindItems({
                templateShareable: false,
                path: "/employees",
                sorter: aSorter,
                template: new ColumnListItem({
                    cells: aCells
                })
            });
        },

        onColumnHeaderItemPress: function(oEvt) {
			var oTable = this.byId("idEmployeeTable");

			var oColumnHeaderItem = oEvt.getSource();
			var sPanel = "Columns";
			if (oColumnHeaderItem.getIcon().indexOf("group") >= 0) {
				sPanel = "Groups";
			} else if (oColumnHeaderItem.getIcon().indexOf("sort") >= 0) {
				sPanel = "Sorter";
			}

			Engine.getInstance().show(oTable, [sPanel], {
				contentHeight: "35rem",
				contentWidth: "32rem",
				source: oTable
			});
		},

        onSort: function(oEvt) {
			var oSortItem = oEvt.getParameter("item");
			var oTable = this.byId("idEmployeeTable");
			var sAffectedProperty = oSortItem.getKey();
			var sSortOrder = oSortItem.getSortOrder();

			//Apply the state programatically on sorting through the column menu
			//1) Retrieve the current personalization state
			Engine.getInstance().retrieveState(oTable).then(function(oState){

				//2) Modify the existing personalization state --> clear all sorters before
				oState.Sorter.forEach(function(oSorter){
					oSorter.sorted = false;
				});

				if (sSortOrder !== coreLibrary.SortOrder.None) {
					oState.Sorter.push({
						key: sAffectedProperty,
						descending:  sSortOrder === coreLibrary.SortOrder.Descending
					});
				}

				//3) Apply the modified personalization state to persist it in the VariantManagement
				Engine.getInstance().applyState(oTable, oState);
			});
		},

		onGroup: function(oEvt) {
			var oGroupItem = oEvt.getParameter("item");
			var oTable = this.byId("idEmployeeTable");
			var sAffectedProperty = oGroupItem.getKey();

			//1) Retrieve the current personalization state
			Engine.getInstance().retrieveState(oTable).then(function(oState){

				//2) Modify the existing personalization state --> clear all groupings before
				oState.Groups.forEach(function(oSorter){
					oSorter.grouped = false;
				});

				if (oGroupItem.getGrouped()) {
					oState.Groups.push({
						key: sAffectedProperty
					});
				}

				//3) Apply the modified personalization state to persist it in the VariantManagement
				Engine.getInstance().applyState(oTable, oState);
			});
		},


        onColumnMove: function(oEvt) {
            var oTable = this.byId("idEmployeeTable");
            var oDraggedColumn = oEvt.getParameter("draggedControl");
            var oDroppedColumn = oEvt.getParameter("droppedControl");

            if (oDraggedColumn === oDroppedColumn) {
                return;
            }

            var sDropPosition = oEvt.getParameter("dropPosition");
            var iDraggedIndex = oTable.indexOfColumn(oDraggedColumn);
            var iDroppedIndex = oTable.indexOfColumn(oDroppedColumn);
            var iNewPos = iDroppedIndex + (sDropPosition === "Before" ? 0 : 1) + (iDraggedIndex < iDroppedIndex ? -1 : 0);
            var sKey = oDraggedColumn.getId();

            Engine.getInstance().retrieveState(oTable).then(function(oState) {
                var oCol = oState.Columns.find(function(oColumn) {
                    return oColumn.key === sKey;
                }) || { key: sKey };
                oCol.position = iNewPos;

                Engine.getInstance().applyState(oTable, { Columns: [oCol] });
            });
        },

        onColumnResize: function(oEvt) {
            var oTable = this.byId("idEmployeeTable");
            var oColumn = oEvt.getParameter("column");
            var sWidth = oEvt.getParameter("width");

            var oColumnState = {};
            oColumnState[oColumn.getId()] = sWidth;

            Engine.getInstance().applyState(oTable, { ColumnWidth: oColumnState });
        }
    });
});
