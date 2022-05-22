"use strict";

/* Magic Mirror
 * Module: MMM-Nozbe
 *
 * By ACCE
 *
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const request = require("request");

module.exports = NodeHelper.create({
    start: function () {
        console.log("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "FETCH_NOZBE") {
            this.config = payload;
            this.fetchTodos();
        }
    },

    fetchTodos: function () {
        var self = this;
        //request.debug = true;
        if (self.config.debug) {
            console.log("INFO MMM-Nozbe: in fetchTodos()");
        }

        const url = "https://api4.nozbe.com/v1/api/tasks?offset=0&sortBy=due_at"
        var options = {
            method: 'GET',
            url: url,
            headers: {
                "accept": "application/json",
                "Authorization": self.config.accessToken
            }
        }
        request(options, function (error, response, body) {
            if (error) {
                self.sendSocketNotification("FETCH_ERROR", {
                    error: error
                });
                return console.error(" ERROR - MMM-Nozbe: " + error);
            }
            if (self.config.debug) {
                console.log(body);
            }
            if ( response.statusCode == 200) {
                var result = JSON.parse(body)
                self.sendSocketNotification("TASKS", result);
            } else {

            }
        })
    }
});