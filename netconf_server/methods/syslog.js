/*
 * Copyright (C) 2014 Cisco Systems, Inc.
 *
 * Author: Petar Koretic <petar.koretic@sartura.hr>
 * Author: Luka Perkov <luka.perkov@sartura.hr>
 *
 * testconf is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 * along with testconf. If not, see <http://www.gnu.org/licenses/>.
 */

var netconf = require('../../core/netconf')

var methods = netconf.create_default_methods()

module.exports = methods

methods["namespace"] = { "xmlns" : "urn:ietf:params:xml:ns:yang:ietf-syslog" }

netconf.add_method(methods["edit-config"], "$..file-logging[*]", function(input)
{
	// console.log("file-logging")
	// console.log(input)

	// { code : int, msg : string}
	return { code : 0 }
})

netconf.add_method(methods["edit-config"], "$..console-logging[*]", function(input)
{
	// console.log("console-logging")
	// console.log(input)

	// { code : int, msg : string}
	return { code : 0 }
})

methods["get"] = function(filter)
{
	//console.log(filter)

	return { }
}

methods["get-config"] = function(filter)
{
	//console.log(filter)

	return { }
}
