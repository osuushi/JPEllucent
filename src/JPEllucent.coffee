
imgcache = {}
@JPEl = new class
    #Create an image URI from a URL, passing it to a callback
    loadImageToURI: (url, cache = yes, cb) ->
        #Handle omitted cache option
        unless cb?
            cb = cache
            cache = yes

        #Fallback when needed
        if needsFallback()
            cb @getFallbackURL url
            return

        if cache and imgcache[url]?
            cb imgcache[url]
            return
        getJSON url, (data) ->
            canvas = document.createElement 'canvas'
            #Load images
            color = new Image
            alpha = new Image
            count = 2
            alpha.onload = color.onload = ->
                count--
                return if count
                #Resize the canvas
                [w,h] = [color.width, color.height]
                canvas.width = w
                canvas.height = h

                #draw alpha into the canvas
                cx = canvas.getContext '2d'
                cx.globalCompositeOperation = 'copy'
                cx.drawImage alpha, 0, 0

                ##Convert grayscale to alpha

                maskData = cx.getImageData 0, 0, w, h
                {data} = maskData
                
                #Since we don't care about the rgb values, we can simply push the blue value into
                #the alpha channel by offsetting it by 1.
                if data.set? #check if the set method is available
                    #Create a view into the data which is one byte shorter; otherwise, the copy 
                    #would fail
                    offsetData = data.subarray(0, data.length - 1)
                    data.set offsetData, 1
                else
                    #Fall back on ordinary loop
                    for i in [0...4*data.length] by 4
                        data[i+3] = data[i]

                cx.putImageData maskData, 0, 0
                
                cx.globalCompositeOperation = 'source-in'
                cx.drawImage color, 0, 0
                result = canvas.toDataURL()
                imgcache[url] = result if cache
                cb result

            color.src = data.color
            alpha.src = data.alpha

    createImage: (url, cache = yes) =>
        img = new Image
        @loadImageToURI url, cache, (dataURI) -> img.src = dataURI
        img

    isObserving: no
    startObservers: ->
        return unless MutationObserver
        return if @isObserving
        addObserver.observe document.body,
            childList: true
            subtree: true

        changeObserver.observe document.body,
            attributes: true
            subtree: true
            attributeFilter: ["data-jpel"]
        @isObserving = yes

    stopObservers: ->
        return unless MutationObserver
        return unless @isObserving
        addObserver?.disconnect()
        changeObserver?.disconnect()
        @isObserving = no

    #You can change this to your own callback. By default, the extension will simply be changed
    #to "png" in unsupported browsers.
    getFallbackURL: (jsonURL) ->
        "#{jsonURL.substring 0, jsonURL.lastIndexOf '.'}.png"

    loadDOMImages: (node) ->
        return if @isObserving
        node ?= document.body
        for img in node.getElementsByTagName('img')
            loadImageNode img

    emptyCache: -> imgcache = {}

#Feature detection
needsFallback = ->
    fallback = no

    try
        #Test canvas
        canvas = document.createElement 'canvas'
        cx = canvas.getContext '2d'
        #Test typed array
        new Uint8ClampedArray
    catch e
        fallback = yes

    needsFallback = -> fallback #cache result
    fallback


#ajax helper
getJSON = (url, cb) ->
    req = new XMLHttpRequest
    req.onload = -> cb JSON.parse @responseText
    req.open 'get', url, yes
    req.send()

#Helper to convert image tag with jpel attribute
loadImageNode = (node) ->
    if url = node.getAttribute('data-jpel')
        JPEl.loadImageToURI url, (dataURL) -> node.src = dataURL

#Load images already in the page
JPEl.loadDOMImages()


#Set up mutation observers
if MutationObserver?
    addObserver = new MutationObserver (records) ->
        for r in records
            for n in r.addedNodes ? [] when n.nodeName is 'IMG'
                loadImageNode n
    changeObserver = new MutationObserver (records) ->
        for r in records
            loadImageNode r.target

    JPEl.startObservers()

