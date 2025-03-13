/**
 * pixelit - convert an image to Pixel Art, with/out grayscale and based on a color palette.
 * @author José Moreira @ <https://github.com/giventofly/pixelit>
 **/

// Use window assignment to avoid redeclaration issues
window.pixelit = class {
  constructor(config = {}) {
    //target for canvas
    this.drawto = config.to || document.getElementById("pixelitcanvas");
    //origin of uploaded image/src img
    this.drawfrom = config.from || document.getElementById("pixelitimg");
    //hide image element
    this.hideFromImg();
    //range between 0 to 100
    this.scale =
      config.scale && config.scale > 0 && config.scale <= 50
        ? config.scale * 0.01
        : 8 * 0.01;
    this.palette = config.palette || [
      [140, 143, 174],
      [88, 69, 99],
      [62, 33, 55],
      [154, 99, 72],
      [215, 155, 125],
      [245, 237, 186],
      [192, 199, 65],
      [100, 125, 52],
      [228, 148, 58],
      [157, 48, 59],
      [210, 100, 113],
      [112, 55, 127],
      [126, 196, 193],
      [52, 133, 157],
      [23, 67, 75],
      [31, 14, 28],
    ];
    this.maxHeight = config.maxHeight;
    this.maxWidth = config.maxWidth;
    this.ctx = this.drawto.getContext("2d");
    //save latest converted colors
    this.endColorStats = {};
  }

  /** hide from image */
  hideFromImg() {
    this.drawfrom.style.visibility = "hidden";
    this.drawfrom.style.position = "fixed";
    this.drawfrom.style.top = 0;
    this.drawfrom.style.left = 0;
    return this;
  }

  /**
   * @param {string} src Change the src from the image element
   */
  setFromImgSource(src) {
    this.drawfrom.src = src;
    return this;
  }

  /**
   *
   * @param {elem} elem set element to read image from
   */
  setDrawFrom(elem) {
    this.drawfrom = elem;
    return this;
  }

  /**
   *
   * @param {elem} elem set element canvas to write the image
   */
  setDrawTo(elem) {
    this.drawto = elem;
    return this;
  }

  /**
   *
   * @param {array} arr Array of rgb colors: [[int,int,int]]
   */
  setPalette(arr) {
    this.palette = arr;
    return this;
  }

  /**
   *
   * @param {int} width set canvas image maxWidth
   */
  setMaxWidth(width) {
    this.maxWidth = width;
    return this;
  }

  /**
   *
   * @param {int} Height set canvas image maxHeight
   */
  setMaxHeight(height) {
    this.maxHeight = height;
    return this;
  }

  /**
   *
   * @param {int} scale set pixelate scale [0...50]
   */
  setScale(scale) {
    this.scale = scale > 0 && scale <= 50 ? scale * 0.01 : 8 * 0.01;
    return this;
  }

  /**
   * 
    @return {arr} of current palette
   */
  getPalette() {
    return this.palette;
  }

  /**
   * color similarity between colors, lower is better
   * @param {array} rgbColor array of ints to make a rgb color: [int,int,int]
   * @param {array} compareColor array of ints to make a rgb color: [int,int,int]
   * @returns {number} limits [0-441.6729559300637]
   */

  colorSim(rgbColor, compareColor) {
    // Convert RGB to Lab for perceptual color distance
    const lab1 = this.rgbToLab(rgbColor);
    const lab2 = this.rgbToLab(compareColor);
    
    // Calculate distance in Lab space (more perceptually uniform)
    const dl = lab1.l - lab2.l;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    
    // Apply perceptual weighting (CIEDE2000 simplified)
    // Emphasize differences in chroma and hue more than lightness
    const weightL = 1.0;
    const weightC = 1.5; // Increased weight for chroma differences
    const weightH = 1.5; // Increased weight for hue differences
    
    // Calculate weighted distance
    return Math.sqrt(
      weightL * dl * dl + 
      weightC * da * da + 
      weightH * db * db
    );
  }
  
  /**
   * Convert RGB to CIE Lab color space for better perceptual color comparison
   * @param {array} rgb RGB color array [r, g, b]
   * @returns {object} Lab color object {l, a, b}
   */
  rgbToLab(rgb) {
    // First convert RGB to XYZ
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let blue = rgb[2] / 255;
    
    // Apply gamma correction
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    blue = blue > 0.04045 ? Math.pow((blue + 0.055) / 1.055, 2.4) : blue / 12.92;
    
    // Convert to XYZ using sRGB matrix
    const x = r * 0.4124 + g * 0.3576 + blue * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + blue * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + blue * 0.9505;
    
    // Convert XYZ to Lab
    // Using D65 reference white
    const xn = 0.95047;
    const yn = 1.0;
    const zn = 1.08883;
    
    const fx = x > 0.008856 ? Math.pow(x / xn, 1/3) : (7.787 * x / xn) + 16/116;
    const fy = y > 0.008856 ? Math.pow(y / yn, 1/3) : (7.787 * y / yn) + 16/116;
    const fz = z > 0.008856 ? Math.pow(z / zn, 1/3) : (7.787 * z / zn) + 16/116;
    
    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const bValue = 200 * (fy - fz);
    
    return { l, a, b: bValue };
  }

  /**
   * given actualColor, check from the paletteColors the most aproximated color
   * @param {array} actualColor rgb color to compare [int,int,int]
   * @returns {array} aproximated rgb color
   */
  similarColor(actualColor) {
    let selectedColor = [];
    let currentSim = this.colorSim(actualColor, this.palette[0]);
    let nextColor;
    this.palette.forEach((color) => {
      nextColor = this.colorSim(actualColor, color);
      if (nextColor <= currentSim) {
        selectedColor = color;
        currentSim = nextColor;
      }
    });
    return selectedColor;
  }
  //TODO someday
  /**
   * After image is pixelated returns
   * @returns {object} { color : quantity }
   */
  /*
    getColorStats(){
      return this.endColorStats;
    }
    */
  /**
   * Sets image last color stats
   */
  /*
    _setColorStats(stats={}){
      this.endColorStats = stats;
    }
    */
  /**
   * Auxiliar function to count colors
   * @param {string,object} color, current object count
   * @returns {object} {color : quantity}
   */
  /*
  _countColor(color=null,colorCount={}){
      if(!color){ return colorCount; }
      if(colorCount[color]){
        colorCount[color] += parseInt(colorCount[color]) + 1;
      }
      else {
        colorCount[color] = 1;
      }
      return colorCount;
  }
  */
  //TODO end

  /**
   * pixelate based on @author rogeriopvl <https://github.com/rogeriopvl/8bit>
   * Draws a pixelated version of an image in a given canvas
   */
  pixelate() {
    this.drawto.width = this.drawfrom.naturalWidth;
    this.drawto.height = this.drawfrom.naturalHeight;
    let scaledW = this.drawto.width * this.scale;
    let scaledH = this.drawto.height * this.scale;

    //make temporary canvas to make new scaled copy
    const tempCanvas = document.createElement("canvas");

    // Set temp canvas width/height & hide (fixes higher scaled cutting off image bottom)
    tempCanvas.width = this.drawto.width;
    tempCanvas.height = this.drawto.height;
    tempCanvas.style.visibility = "hidden";
    tempCanvas.style.position = "fixed";
    tempCanvas.style.top = "0";
    tempCanvas.style.left = "0";

    //corner case of bigger images, increase the temporary canvas size to fit everything
    if (this.drawto.width > 900 || this.drawto.height > 900) {
      //fix sclae to pixelate bigger images
      this.scale *= 0.5;
      scaledW = this.drawto.width * this.scale;
      scaledH = this.drawto.height * this.scale;
      //make it big enough to fit
      tempCanvas.width = Math.max(scaledW, scaledH) + 50;
      tempCanvas.height = Math.max(scaledW, scaledH) + 50;
    }
    // get the context
    const tempContext = tempCanvas.getContext("2d");
    // draw the image into the canvas
    tempContext.drawImage(this.drawfrom, 0, 0, scaledW, scaledH);
    document.body.appendChild(tempCanvas);
    //configs to pixelate
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.imageSmoothingEnabled = false;

    //calculations to remove extra border
    let finalWidth = this.drawfrom.naturalWidth;
    if (this.drawfrom.naturalWidth > 300) {
      finalWidth +=
        this.drawfrom.naturalWidth > this.drawfrom.naturalHeight
          ? parseInt(
              this.drawfrom.naturalWidth / (this.drawfrom.naturalWidth * this.scale)
            ) / 1.5
          : parseInt(
              this.drawfrom.naturalWidth / (this.drawfrom.naturalWidth * this.scale)
            );
    }
    let finalHeight = this.drawfrom.naturalHeight;
    if (this.drawfrom.naturalHeight > 300) {
      finalHeight +=
        this.drawfrom.naturalHeight > this.drawfrom.naturalWidth
          ? parseInt(
              this.drawfrom.naturalHeight / (this.drawfrom.naturalHeight * this.scale)
            ) / 1.5
          : parseInt(
              this.drawfrom.naturalHeight / (this.drawfrom.naturalHeight * this.scale)
            );
    }
    //draw to final canvas
    //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    this.ctx.drawImage(
      tempCanvas,
      0,
      0,
      scaledW,
      scaledH,
      0,
      0,
      finalWidth, //+ Math.max(24, 25 * this.scale),
      finalHeight //+ Math.max(24, 25 * this.scale)
    );
    //remove temp element
    tempCanvas.remove();

    return this;
  }

  /**
   * Converts image to grayscale
   */
  convertGrayscale() {
    const w = this.drawto.width;
    const h = this.drawto.height;
    var imgPixels = this.ctx.getImageData(0, 0, w, h);
    for (var y = 0; y < imgPixels.height; y++) {
      for (var x = 0; x < imgPixels.width; x++) {
        var i = y * 4 * imgPixels.width + x * 4;
        var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
        imgPixels.data[i] = avg;
        imgPixels.data[i + 1] = avg;
        imgPixels.data[i + 2] = avg;
      }
    }
    this.ctx.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
    return this;
  }

  /**
   * converts image to palette using the defined palette or default palette
   */
  convertPalette() {
    const w = this.drawto.width;
    const h = this.drawto.height;
    var imgPixels = this.ctx.getImageData(0, 0, w, h);
    for (var y = 0; y < imgPixels.height; y++) {
      for (var x = 0; x < imgPixels.width; x++) {
        var i = y * 4 * imgPixels.width + x * 4;
        //var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
        const finalcolor = this.similarColor([
          imgPixels.data[i],
          imgPixels.data[i + 1],
          imgPixels.data[i + 2],
        ]);
        imgPixels.data[i] = finalcolor[0];
        imgPixels.data[i + 1] = finalcolor[1];
        imgPixels.data[i + 2] = finalcolor[2];
      }
    }
    this.ctx.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
    return this;
  }

  /**
   * Resizes image proportionally according to a max width or max height
   * height takes precedence if definied
   */
  resizeImage() {
    //var ctx = canvas.getContext("2d")
    const canvasCopy = document.createElement("canvas");
    const copyContext = canvasCopy.getContext("2d");
    let ratio = 1.0;

    //if none defined skip
    if (!this.maxWidth && !this.maxHeight) {
      return 0;
    }

    if (this.maxWidth && this.drawto.width > this.maxWidth) {
      ratio = this.maxWidth / this.drawto.width;
    }
    //max height overrides max width
    if (this.maxHeight && this.drawto.height > this.maxHeight) {
      ratio = this.maxHeight / this.drawto.height;
    }

    canvasCopy.width = this.drawto.width;
    canvasCopy.height = this.drawto.height;
    copyContext.drawImage(this.drawto, 0, 0);

    this.drawto.width = this.drawto.width * ratio;
    this.drawto.height = this.drawto.height * ratio;
    this.ctx.drawImage(
      canvasCopy,
      0,
      0,
      canvasCopy.width,
      canvasCopy.height,
      0,
      0,
      this.drawto.width,
      this.drawto.height
    );

    return this;
  }

  /**
   * draw to canvas from image source and resize
   *
   */
  draw() {
    //draw image to canvas
    this.drawto.width = this.drawfrom.width;
    this.drawto.height = this.drawfrom.height;
    //draw
    this.ctx.drawImage(this.drawfrom, 0, 0);
    //resize is always done
    this.resizeImage();
    return this;
  }

  /**
   * Save image from canvas
   */

  saveImage() {
    const link = document.createElement("a");
    link.download = "pxArt.png";
    link.href = this.drawto
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    document.querySelector("body").appendChild(link);
    link.click();
    document.querySelector("body").removeChild(link);
  }

  //end class
}
