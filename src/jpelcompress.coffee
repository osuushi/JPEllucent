###
Compresses a transparent PNG into a JSON file that JPEllucent can render on the client side.

This can be run as a standalone command, or as a module.
###

fs = require 'fs'

runStandalone = =>
    opt = require 'optimist'
    opt = opt.usage """
    Cmpress a transparent PNG to a file to be rendered by JPEllucent

    Usage:
        $0 inputPath [-o outputPath] [-c colorQuality] [-a alphaQuality]
            OR
        $0 inputPath --stdout [-c colorQuality] [-a alphaQuality]
    """
    argv = opt.demand(1)
    .describe("stdout", "Write JSON to standard output instead of file")
    .describe("o", "Output file path; by default inputPath with .json extension is used")
    .default('c', 85)
    .describe('c', "color quality between 0 and 100")
    .default('a', 60)
    .describe('a', "alpha quality between 0 and 100")
    .argv
    {c, a, stdout} = argv
    outputPath = argv.o
    [inputPath] = argv._
    @compress inputPath, c, a, (result) ->
        result = JSON.stringify result
        if stdout
            process.stdout.write result
        else
            #Get output file name
            unless outputPath?
                outputPath = "#{inputPath.substring 0, inputPath.lastIndexOf '.'}.json"
            fs.writeFile outputPath, result





{spawn} = require 'child_process'

#Extract the alpha channel from an image, passing the result to a callback
extractAlpha = (data, quality, cb) ->
    #ImageMagick extract from standard in to standard out
    child
    child = spawn "convert", "- -alpha extract -quality #{Math.round quality} -strip jpg:-".split ' '
    bufs = []
    child.stdout.on 'data', (buf) -> bufs.push buf
    child.stdout.on 'end', -> cb Buffer.concat bufs
    child.stdin.write data
    child.stdin.end()
    null

#Extract the color channel from an image, passing the result to a callback
extractColor = (data, quality, cb) ->
    child = spawn "convert", "- ( -clone 0 -alpha extract )
        ( -clone 0 -background black -flatten -alpha off )
        -delete 0 -compose Divide -composite
        -quality #{Math.round quality} -strip jpg:-".split /\s+/
    bufs = []
    child.stdout.on 'data', (buf) -> bufs.push buf
    child.stdout.on 'end', -> cb Buffer.concat bufs
    child.stdin.write data
    child.stdin.end()
    null


###
Convert an input file. Object containing data URIs will be passed to cb
###
@compress = (inputPath, colorQuality, alphaQuality, cb) ->
    #Read the data from the file
    fs.readFile inputPath, (err, inputData) ->
        throw err if err
        #Extract the alpha and color
        waitCount = 2
        buffers = {}
        color = extractColor inputData, colorQuality, (data) ->
            waitCount--
            buffers.color = data
            finishedStream()

        alpha = extractAlpha inputData, alphaQuality, (data) ->
            waitCount--
            buffers.alpha = data
            finishedStream()

        finishedStream = ->
            return if waitCount #still waiting on buffers
            #Create result object
            result = {}
            for key, buf of buffers
                buf64 = new Buffer(buf, 'binary').toString 'base64'
                result[key] = "data:image/jpeg;base64," + buf64 
            cb result









runStandalone() unless module.parent