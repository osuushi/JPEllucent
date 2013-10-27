fs = require 'fs'
task 'build', "Build all source files", ->
    coffee = require('coffee-script').compile
    fs.readFile './src/jpelcompress.coffee', 'utf8', (err, data) ->
        throw err if err
        coffeeData = coffee data
        fs.writeFile './js/jpelcompress.js', coffeeData
        fs.writeFileSync './bin/jpelcompress', '#!/usr/bin/env node\n' + coffeeData
        {exec} = require 'child_process'
        exec 'chmod +x ./bin/jpelcompress'
    fs.readFile './src/JPEllucent.coffee', 'utf8', (err, data) ->
        throw err if err
        fs.writeFile './js/JPEllucent.js', coffee data
