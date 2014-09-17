testconf
========

The aim of this project is to provide a NETCONF testing suite.

_testconf_ is implemented in Node.js and supports testing of both NETCONF
clients and NETCONF servers. That way developers can easily test new features,
find out if there are any regressions and experiment with NETCONF in general.
It can be used to run interoperability tests as well.

Extending _testconf_ with your custom defined tests shortens the time spent on
repetitive tasks and helps to pinpoint bugs. We encourage you to send us your
tests or tell us about the features that you would like to have tested.

### Installation

#### Prerequisites
    # Ubuntu (14.04)
    apt-get install nodejs npm libkrb5-dev libssl-dev
    sudo ln -sf /usr/bin/nodejs /usr/bin/node
    
    # Arch Linux
    sudo pacman -S python2
    export PYTHON=python2
    
#### Installation
    git clone https://github.com/freenetconf/testconf.git
    cd testconf
    npm install

### Running default tests

#### Start default netconf test server
    # sudo is required if port in config (core/config.js) is 830 (default)
    node netconf_server/tests/default_server_example.js
    
#### Run all client tests
    cd netconf_client/tests
    make
    
#### Trace
    Test details can be found in 'logs' directory.
