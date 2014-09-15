/* autogenerated by testconf */

/* 2014/15/09 15:49 */

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

var netconf = require(__dirname + '/../../core/netconf')

var methods = netconf.create_default_methods()

module.exports = methods

methods["namespace"] = { "xmlns" : "urn:ietf:params:xml:ns:yang:ietf-syslog" }

/* get
	method return structure
	return { }
*/
methods["get"] = function(filter)
{
	console.log(filter)

	return { }
}

/* get-config
	method return structure
	return { }
*/
methods["get-config"] = function(filter)
{
	console.log(filter)

	return { }
}

/* edit-config
	method return structure
	return { code : int, msg : string}
	code - nonzero for error, msg:	returns ok by default
*/
netconf.add_method(methods["edit-config"], "$..syslog[*]", function(input)
{
	console.log(input)
})

netconf.add_method(methods["edit-config"], "$..global-logging[*]", function(input)
{
	console.log(input)
})

netconf.add_method(methods["edit-config"], "$..console-logging[*]", function(input)
{
	console.log(input)
})

netconf.add_method(methods["edit-config"], "$..file-logging[*]", function(input)
{
	console.log(input)
})

netconf.add_method(methods["edit-config"], "$..remote-logging[*]", function(input)
{
	console.log(input)
})

netconf.add_method(methods["edit-config"], "$..terminal-logging[*]", function(input)
{
	console.log(input)
})

netconf.add_method(methods["edit-config"], "$..all-users[*]", function(input)
{
	console.log(input)
})

