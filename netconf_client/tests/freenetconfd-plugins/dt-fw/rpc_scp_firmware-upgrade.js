/*
 * Copyright (C) 2015 Deutsche Telekom AG.
 *
 * Author: Mislav Novakovic <mislav.novakovic@sartura.hr>
 *
 * testconf is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 * along with testconf. If not, see <http://www.gnu.org/licenses/>.
 */

var netconf_client = require('../../../netconf_client')
var util = require('util');

var address = "address"
var password = "password"

var xml = '<firmware-download xmlns="urn:ietf:params:xml:ns:yang:ietf-system-openwrt">' +
		'<address>' + address + '</address>' +
		'<install-target>test_1</install-target>' +
		'<timeframe>0</timeframe>' +
		'<retry-count>3</retry-count>' +
		'<retry-interval>5</retry-interval>' +
		'<retry-interval-increment>20</retry-interval-increment>' +
		'<password>' + password + '</password>' +
	'</firmware-download>'

netconf_client.create().then(function(client)
{
	client.send(xml).thenDefault(function(reply)
	{
		console.log(reply)
		console.log(util.inspect(reply, {showHidden: false, depth: null}));
		client.send_close().thenDefault()
	})
})
