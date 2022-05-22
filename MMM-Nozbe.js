
/**
 * @file MMM-Nozbe.js
 *
 * @author ACCE
 * @license MIT
 * 
 * @description Show tasks from nozbe. Lots of code get from MMM-Todoists
 *  
 * 
 * @see 
 */





Module.register("MMM-Nozbe",{
    defaults:{
        accessToken: "",
		textAlignToRight: false,
		type: "priority", // "completed", "priority"
        updateInterval: 60 * 1000,
        displayLastUpdate: true, //add or not a line after the tasks with the last server update time
		displayLastUpdateFormat: "dd - HH:mm:ss", //format to display the last update. See Moment.js documentation for all display possibilities
    },

    	// Define required scripts.
	getStyles: function () {
		return ["MMM-Nozbe.css"];
	},

    start: function(){
        var self = this;

        if (this.config.accessToken === "") {
			Log.error("MMM-Nozbe: AccessToken not set!");
			return;
		}

        this.sendSocketNotification("FETCH_NOZBE", this.config);
        
        this.updateIntervalID = setInterval(function () {
			self.sendSocketNotification("FETCH_NOZBE", self.config);
		}, this.config.updateInterval);

    },

    socketNotificationReceived: function (notification, payload) {
		if (notification === "TASKS") {
			if (this.config.type == "priority"){
				this.tasks = this.getPrioityTask(payload);
			} 
			else if (this.config.type == "completed"){
				this.tasks = this.getTasksFinishedLast7Day(payload);
			}
			else {
				Log.error("MMM-Nozbe - wrong typr");
			}

			if (this.config.displayLastUpdate) {
				this.lastUpdate = Date.now() / 1000; //save the timestamp of the last update to be able to display it
				Log.log("Nozbe update OK, at : " + moment.unix(this.lastUpdate).format(this.config.displayLastUpdateFormat)); //AgP
			}

			this.loaded = true;
			this.updateDom(1000);
		} else if (notification === "FETCH_ERROR") {
			Log.error("Todoist Error. Could not fetch todos: " + payload.error);
		}
	},

    getPrioityTask: function(tasks) {
        var self = this;

        if (tasks == undefined) {
			return;
		}

        // filter only to priority tasks
        result_priority = tasks.filter(v => v.priority_position != null)

        // filter not done tasks
        return  result_priority.filter(v => v.ended_at == null)

        // this.tasks = result_priority_not_done
    },

	getTasksFinishedLast7Day: function(tasks){
		var self = this;

        if (tasks == undefined) {
			return;
		}

		timeNow = Date.now()
        // filter only to priority tasks
        return tasks.filter(v => v.ended_at && v.ended_at > (timeNow-(7*24*60*60*1000)) )        
	},

    createCell: function(className, innerHTML) {
		var cell = document.createElement("div");
		cell.className = "divTableCell " + className;
		cell.innerHTML = innerHTML;
		return cell;
	},

	addColumnSpacerCell: function() {
		return this.createCell("spacerCell", "&nbsp;");
	},

	addDueDateCell: function(item) {
		var className = "bright align-right dueDate ";
		var innerHTML = "";
		
		var oneDay = 24 * 60 * 60 * 1000;
		var dueDateTime = new Date(item.due_at);
		var dueDate = new Date(dueDateTime.getFullYear(), dueDateTime.getMonth(), dueDateTime.getDate());
		var now = new Date();
		var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		var diffDays = Math.floor((dueDate - today + 7200000) / (oneDay));
		var diffMonths = (dueDate.getFullYear() * 12 + dueDate.getMonth()) - (now.getFullYear() * 12 + now.getMonth());

		if (diffDays < -1) {
			innerHTML = dueDate.toLocaleDateString(config.language, {
												"month": "short"
											}) + " " + dueDate.getDate();
			className += "xsmall overdue";
		} else if (diffDays === -1) {
			innerHTML = this.translate("YESTERDAY");
			className += "xsmall overdue";
		} else if (diffDays === 0) {
			innerHTML = this.translate("TODAY");
			if (item.is_all_day || dueDateTime >= now) {
				className += "today";
			} else {
				className += "overdue";
			}
		} else if (diffDays === 1) {
			innerHTML = this.translate("TOMORROW");
			className += "xsmall tomorrow";
		} else if (diffDays < 7) {
			innerHTML = dueDate.toLocaleDateString(config.language, {
				"weekday": "short"
			});
			className += "xsmall";
		} else if (diffMonths < 7 || dueDate.getFullYear() == now.getFullYear()) {
			innerHTML = dueDate.toLocaleDateString(config.language, {
				"month": "short"
			}) + " " + dueDate.getDate();
			className += "xsmall";
		} else if (item.due_at === "2100-12-31") {
			innerHTML = "";
			className += "xsmall";
		} else {
			innerHTML = dueDate.toLocaleDateString(config.language, {
				"month": "short"
			}) + " " + dueDate.getDate() + " " + dueDate.getFullYear();
			className += "xsmall";
		}

		if (innerHTML !== "" && !item.is_all_day) {
			function formatTime(d) {
				function z(n) {
					return (n < 10 ? "0" : "") + n;
				}
				var h = d.getHours();
				var m = z(d.getMinutes());
				if (config.timeFormat == 12) {
					return " " + (h % 12 || 12) + ":" + m + (h < 12 ? " AM" : " PM");
				} else {
					return " " + h + ":" + m;
				}
			}
			innerHTML += formatTime(dueDateTime);
		}
		return this.createCell(className, innerHTML);
	},

	getDom: function () {
	
		//Add a new div to be able to display the update time alone after all the task
		var wrapper = document.createElement("div");

		//display "loading..." if not loaded
		if (!this.loaded) {
			wrapper.innerHTML = "Loading...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}


		//New CSS based Table
		var divTable = document.createElement("div");
		divTable.className = "divTable normal small light";

		var divBody = document.createElement("div");
		divBody.className = "divTableBody";
		
		if (this.tasks === undefined) {
			return wrapper;
		}

		// // create mapping from user id to collaborator index
		// var collaboratorsMap = new Map();

		// for (var value=0; value < this.tasks.collaborators.length; value++) {
		// 	collaboratorsMap.set(this.tasks.collaborators[value].id, value);
		// }

		//Iterate through Todos
		this.tasks.forEach(item => {
			var divRow = document.createElement("div");
			//Add the Row
			divRow.className = "divTableRow" ;
			

			//Columns
			if (this.config.textAlignToRight){
				cell_css = "title bright alignRight"
			}else
				cell_css = "title bright alignLeft"

            divRow.appendChild(this.createCell(cell_css, item.name));
			// divRow.appendChild(this.addPriorityIndicatorCell(item));
			divRow.appendChild(this.addColumnSpacerCell());
			// divRow.appendChild(this.addTodoTextCell(item));
			// divRow.appendChild(this.addDueDateCell(item));
			// if (this.config.showProject) {
			// 	divRow.appendChild(this.addColumnSpacerCell());
			// 	divRow.appendChild(this.addProjectCell(item));
			// }
			// if (this.config.displayAvatar) {
			// 	divRow.appendChild(this.addAssigneeAvatorCell(item, collaboratorsMap));
			// }

			divBody.appendChild(divRow);
		});
		divTable.appendChild(divBody);

		wrapper.appendChild(divTable);


		// display the update time at the end, if defined so by the user config
		if (this.config.displayLastUpdate) {
			var updateinfo = document.createElement("div");
			updateinfo.className = "xsmall light alignCenter";
			updateinfo.innerHTML = "Update : " + moment.unix(this.lastUpdate).format(this.config.displayLastUpdateFormat);
			wrapper.appendChild(updateinfo);
		}

		return wrapper;
	}
});
