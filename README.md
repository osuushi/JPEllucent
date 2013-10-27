**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [How?](#how)
	- [CompressJPEl.js](#compressjpeljs)
		- [Installing](#installing)
		- [Using](#using)
	- [JPEllucent.js](#jpellucentjs)
- [Using the decoder](#using-the-decoder)
	- [Adding images dynamically](#adding-images-dynamically)
	- [Getting the raw data URI](#getting-the-raw-data-uri)
- [Should I use this?](#should-i-use-this)
- [When should/shouldn't I use this?](#when-shouldshouldn't-i-use-this)
- [Converter Requirements](#converter-requirements)
- [Browser Support](#browser-support)
- [Performance considerations](#performance-considerations)

# How?

JPEllucent comes in two parts: CompressJPEl.js and JPEllucent.js.

## CompressJPEl.js

### Installing

The easiest way to install is to run `sudo npm install -g https://github.com/osuushi/JPEllucent.git`.

Note that this depends on ImageMagick 6.6.9 or later, which must be installed separately (earlier 
versions may work, but have not been tested).
 
### Using 
This can be called from the command line like

    jpelcompress input_path [-c color_quality] [-a alpha_quality]

or it can be used as a node module and called like

    jpelcompress = require('./jpelcompress').compress;
    JPEl.compress(inputPath, colorQuality, alphaQuality, function(result) {
        doSomethingWithJPElData(result);
    });

When called from the command line, a JSON file will be created containing the compressed image. Even
at high quality, this file will typically be considerably smaller than the input PNG. The compressed
image data is encoded in base64, so it will be even smaller (by about 30%) once it is gzipped.

When used as a module, the `convert` method will pass the JPEl object (not stringified) to the
callback you provide.

## JPEllucent.js

This is the decoder for the JSON files created by jpelcompress.js. It can be found at
js/JPEllucent.js. It should be included in your HTML immediately before the closing `</body>` tag.

# Using the decoder

The simplest way to use the decoder is to use an ordinary image tag with a `data-jpel` attribute
like this:

    <img data-jpel="logo.json">

The JPEl library will automatically load logo.json and decode it. This will also work for
dynamically added image tags (see below for browser support).

## Adding images dynamically

Unless you're using a template, using the `data-jpel` attribute is a bit cumbersome. A better way is
to use `JPEl.createImage(url)`, which will create and return a new image element into which the
decoded data will be loaded.

## Getting the raw data URI

In some cases, such as when using CSS sprites, you'll need to get the data URI for the decoded image
directly. To do this, you can call `JPEl.loadImageToURI(url, callback)`. 

# Should I use this?

That depends. By using JPEllucent, you can reduce image bandwidth significantly, but at the cost of
additional processing time on the client side. As with many optimizations, you'll need to run
benchmarks to determine if the tradeoff is worthwhile. Also keep in mind that different browsers
will take different amounts of time to decode.

# When should/shouldn't I use this?

JPEl is effective for compressing images that are complex, or that have complex alpha channels. A
good rule of thumb is this: if it looks like vector art, it will probably compress better as a PNG.

# Converter Requirements

* Node.js 0.10.21 or later
* ImageMagick 6.6.9 or later

# Browser Support

JPEl will work fully in any modern browser that supports canvas pixel manipulation and the
MutationObserver API.

In browsers without adequate canvas support, the `JPEl.getFallbackURL` will be called to transform
the JSON URL. By default, this simply changes the extension to "png". So if you keep your original
PNG files next to the JPEl JSON files, the default behavior will serve them to older browsers. Of
course, you can overwrite `JPEl.getFallbackURL` to return a different URL if needed.

If MutationObserver is not available, JPEl will not attempt to fetch images that are added after
page load. If you need to support dynamically added images in browsers without MutationObserver,
you have four options:

1. Use a shim for MutationObserver.

2. Create the image by calling `JPEl.createImage(url)`, which will return an Image
element. This is the recommended way to create JPEl image elements programatically.

3. Convert the URL by calling `JPEl.loadImageToURI(url, callback)`, which will pass
the result to `callback`. You'll mainly want to do this if you're using a sprite sheet, since you
can't use the JSON file in a style sheet.

4. Call `JPEL.loadDOMImages([node=document.body])`, which will convert every image element
descendent of `node` which has a `data-jpel` attribute. This is convenient for use with templates,
but it it is by far the slowest method. For best performance, pass in `node` as the nearest ancestor
possible. Note: if the MutationObservers are available and enabled, calling `JPEl.loadDOMImages`
will have no effect. This saves you from having to feature detect before calling it.

#Performance considerations

Because JPEl has to decode images on the client side using JavaScript, it may not be appropriate
for very large images. There is a trade off of bandwidth and client side processing that you'll
need to balance.

For the sake of templating, JPEllucent uses MutationObservers to watch for new `<img>` tags with a
`data-jpel` attribute. This incurs a performance hit for all DOM modifications. If you are not
adding JPEl images to the DOM dynamically via templates, you can improve performance by calling
`JPEl.stopObservers()`, which will disable the MutationObservers.

If you *are* using templates including JPEl images, you can also improve performance by disabling
MutationObservers and then manually calling `JPEl.loadDOMImages(node)` where `node` is a node
containing the newly added image elements. 
