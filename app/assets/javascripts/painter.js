var vertexShaderSource = `#version 300 es
  in vec3 aPos;

  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;

  void main() {
    gl_Position = projection * view * model * vec4(aPos, 1.0);
  }
`;

var billboardVertexShaderSource = `#version 300 es
  in vec3 vertexPosition_worldspace;

  uniform vec3 billboardCenter_worldspace;
  uniform vec3 cameraRight_worldspace;
  uniform vec3 cameraUp_worldspace;
  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;

  void main() {
    vec3 vertex = (model * vec4(vertexPosition_worldspace, 1.0f)).xyz;
    vertex = billboardCenter_worldspace
      + cameraRight_worldspace * vertex.x
      + cameraUp_worldspace * vertex.z;
    gl_Position = projection * view * vec4(vertex, 1.0f);
  }
`;

var uiVertexShaderSource = `#version 300 es
  in vec2 aPos;

  uniform mat4 model;
  uniform mat4 projection;

  void main() {
    gl_Position = projection * model * vec4(aPos, 0.0, 1.0);
  }
`

var textureShaderSource =`#version 300 es
  in vec4 vertex; // <vec2 position, vec2 texCoords>

  out vec2 texCoords;

  uniform mat4 model;
  uniform mat4 projection;

  void main() {
    texCoords = vertex.zw;
    gl_Position = projection * model * vec4(vertex.xy, 0.0, 1.0);
  }
`

var fragmentShaderSource = `#version 300 es
  precision mediump float;

  out vec4 outColor;

  uniform vec4 ourColor;

  void main() {

  	outColor = ourColor;
  }
`;

var textureFragShaderSource = `#version 300 es
  precision mediump float;

  in vec2 texCoords;
  out vec4 outColor;

  uniform sampler2D image;

  void main() {

  	outColor = texture(image, texCoords);
  }
`

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return undefined;
}

function makeGrid(gl, grid, modelMatrix, programLocs, secondaryColor) {
  var i, j;
  var xTranslation, zTranslation;

  for (i = 0; i < (grid.divisions + 1); i++) {
    for (j = 0; j < 2; j++) {
      modelMatrix.makeScale(grid.scale, grid.scale, grid.scale);
      if (j == 0) {
        xTranslation = (i / grid.divisions) * grid.scale;
        zTranslation = 0;
        modelMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
      }
      else {
        zTranslation = (i / grid.divisions) * grid.scale;
        xTranslation = 0;
      }

      gl.uniform4f(programLocs.vertexColorUni, grid.lineColor.x, grid.lineColor.y, grid.lineColor.z, grid.lineColor.w);

      xTranslation -= grid.scale / 2;
      zTranslation -= grid.scale / 2;
      modelMatrix.premultiply(new THREE.Matrix4().makeTranslation(xTranslation, 0, -zTranslation));

      if (secondaryColor && i == ((Math.floor(grid.divisions / 2)))) {
        gl.uniform4f(programLocs.vertexColorUni, grid.axisColor.x, grid.axisColor.y, grid.axisColor.z, grid.axisColor.w);
      }

      gl.uniformMatrix4fv(programLocs.modelUni, false, modelMatrix.elements);

      gl.bindVertexArray(grid.lineVAO);

      primitiveType = gl.LINE_STRIP;
      vertexCount = 2;
      gl.drawArrays(primitiveType, 0, vertexCount);
      gl.bindVertexArray(null);
    }
  }
}

function toggleFullscreen(canvas, fullscreen) {

  if (fullscreen) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
      document.msExitFullscreen();
    }
  }
  else {
    if (canvas.requestFullscreen) {
      canvas.requestFullscreen();
    } else if (canvas.mozRequestFullScreen) { /* Firefox */
      canvas.mozRequestFullScreen();
    } else if (canvas.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
      canvas.webkitRequestFullscreen();
    } else if (canvas.msRequestFullscreen) { /* IE/Edge */
      canvas.msRequestFullscreen();
    }
  }

  return !fullscreen;
}

function runPainter() { // Main game function
  // Get a WeblGL context
  var canvas = document.getElementById("painter-canvas");
  var gl = canvas.getContext("webgl2");

  const enterFullscreenImg = new Image();
  enterFullscreenImg.src = '/assets/jim_512.jpg';

  const ZOOMFACTOR = 1;
  const CAMERAZOOMMIN = 1;
  const CAMERAZOOMMAX = 50;

  var inputs = [];
  var programLocs = [];
  var billboardProgramLocs = [];
  var guideGrid = [];
  var worldGrid = [];
  var paintBrush = [];


  var colors = [
    [0, 0, 0],  // black
    [1, 1, 1],  // white
    [1, 0, 0],  // red
    [1, 0.5, 0],  // orange
    [1, 1, 0],  // yellow
    [0, 1, 0],  // green
    [0, 0, 1],  // blue
    [1, 0, 1] // purple
  ];

  var colorCoords = [];


  var targetPosX = 300;
  var targetPosY = 240;
  var canvasRect;

  var degToRad = (2 * Math.PI) / 360;

  var yawAngle = 45 * degToRad;
  var pitchAngle = 45 * degToRad;
  var initYawAngle = yawAngle;
  var initPitchAngle = pitchAngle;

  var cameraDistance = 5;
  var fullscreen = false;

  // --- MOUSE HANDLING ---

  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (inputs.mouseX == null || inputs.mouseY == null) {
      canvasRect = document.getElementById("painter-canvas").getBoundingClientRect();
      inputs.mouseX = e.clientX - canvasRect.left + 0.5;
      inputs.mouseY = e.clientY - canvasRect.top;
    }
    if (e.which == 1) {
      //targetPosX = inputs.mouseX;
      //targetPosY = inputs.mouseY;
      inputs.mouseClick = true;
    }
    else if (e.which == 3) {
      inputs.rightMouseDown = true;
      inputs.initMouseX = inputs.mouseX;
      inputs.initMouseY = inputs.mouseY;
    }
  });

  canvas.addEventListener("mouseup", (e) => {
    e.preventDefault();
    if (e.which == 1) {
      inputs.mouseClick = false;
    }
    else if (e.which == 3) {
      inputs.rightMouseDown = false;
      initYawAngle = yawAngle;
      initPitchAngle = pitchAngle;
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    canvasRect = document.getElementById("painter-canvas").getBoundingClientRect();
    inputs.mouseX = e.clientX - canvasRect.left + 0.5; //for some reason it goes to -0.5 when on left edge if canvas
    inputs.mouseY = e.clientY - canvasRect.top;
  });

  canvas.addEventListener("mouseout", () => {
    inputs.rightMouseDown = false;
    inputs.mouseClick = false;
  });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    if (e.deltaY > 0) {
      cameraDistance += ZOOMFACTOR;
    }
    else {
      cameraDistance -= ZOOMFACTOR;
    }

    if (cameraDistance > CAMERAZOOMMAX) {
      cameraDistance = CAMERAZOOMMAX;
    }
    else if (cameraDistance < CAMERAZOOMMIN) {
      cameraDistance = CAMERAZOOMMIN;
    }

    console.log("zoom: " + cameraDistance);
  });

  // --- KEYBOARD HANDLING ---
  window.addEventListener("keydown", (e) => {
    if (e.code == "KeyW") {
      inputs.keyWDown = true;
    }
    if (e.code == "KeyS") {
      inputs.keySDown = true;
    }
    if ((e.code == "Enter") && (e.altKey)) {
      fullscreen = toggleFullscreen(canvas, fullscreen);
    }
  });
  /*
  window.addEventListener("fullscreenchange", () => {
    if (fullscreen) {
      fullscreen = toggleFullscreen(canvas, fullscreen);
    }
  });
  window.addEventListener("mozfullscreenchange", () => {
    if (fullscreen) {
      fullscreen = toggleFullscreen(canvas, fullscreen);
    }
  });
  window.addEventListener("webkitfullscreenchange", () => {
    if (!fullscreen) {
      canvas.width = 640;
      canvas.height = 480;
    }
  });
  window.addEventListener("msfullscreenchange", () => {
    if (fullscreen) {
      fullscreen = toggleFullscreen(canvas, fullscreen);
    }
  });
  */

  window.addEventListener("keyup", (e) => {
    if (e.code == "KeyW") {
      inputs.keyWDown = false;
    }
    if (e.code == "KeyS") {
      inputs.keySDown = false;
    }
  });
  canvas.addEventListener("contextmenu", (e) => { e.preventDefault(); });

  // --- TOUCH HANDLING ---
  var tpCache = [];

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();

    canvasRect = document.getElementById("painter-canvas").getBoundingClientRect();
    inputs.mouseX = e.touches[0].clientX - canvasRect.left + 0.5;
    inputs.mouseY = e.touches[0].clientY - canvasRect.top;


    if (e.targetTouches.length == 2) {
      // Cache the touch points for later processing of 2-touch pinch/zoom
      for (var i=0; i < e.targetTouches.length; i++) {
        tpCache.push(e.targetTouches[i]);
      }
      inputs.rightMouseDown = true;
      inputs.initMouseX = inputs.mouseX;
      inputs.initMouseY = inputs.mouseY;
      inputs.mouseClick = false;
    }
    else if (e.targetTouches.length == 1) {
      //targetPosX = inputs.mouseX;
      //targetPosY = inputs.mouseY;
      inputs.mouseClick = true;
    }
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (inputs.rightMouseDown) {
      inputs.mouseClick = false;
    }
    canvasRect = document.getElementById("painter-canvas").getBoundingClientRect()
    inputs.mouseX = e.targetTouches[0].clientX - canvasRect.left + 0.5;
    inputs.mouseY = e.targetTouches[0].clientY - canvasRect.top;

    if (e.targetTouches.length == 2 && e.changedTouches.length == 2) {
      // Check if the two target touches are the same ones that started
      // the 2-touch
      var point1=-1, point2=-1;
      for (var i=0; i < tpCache.length; i++) {
        if (tpCache[i].identifier == e.targetTouches[0].identifier) {
          point1 = i;
        }
        if (tpCache[i].identifier == e.targetTouches[1].identifier) {
          point2 = i;
        }
      }
      if (point1 >=0 && point2 >= 0) {
        // Calculate the difference between the start and move coordinates
        var diff1 = Math.abs(tpCache[point1].clientX - e.targetTouches[0].clientX);
        var diff2 = Math.abs(tpCache[point2].clientX - e.targetTouches[1].clientX);
        var nonABSDiff1 = tpCache[point1].clientX - e.targetTouches[0].clientX;
        var nonABSDiff2 = tpCache[point2].clientX - e.targetTouches[1].clientX;

        // This threshold is device dependent as well as application specific
        var PINCH_THRESHHOLD = e.target.clientWidth / 12;
        if (diff1 >= PINCH_THRESHHOLD && diff2 >= PINCH_THRESHHOLD)
        {
          var pinchZoomFactor = ZOOMFACTOR / 2;
          if (!((e.targetTouches[0].clientX > tpCache[point1].clientX)
              && (e.targetTouches[1].clientX > tpCache[point2].clientX))
              && !((e.targetTouches[0].clientX < tpCache[point1].clientX)
              && (e.targetTouches[1].clientX < tpCache[point2].clientX))) {
            // If both points are not bigger AND both are not smaller than initial values
            /*
            if ((tpCache[point1].clientX) > (tpCache[point2].clientX)) {
              pinchZoomFactor *= -1;
            }

            if ((nonABSDiff1 < 0) && (nonABSDiff2 > 0)) {
              cameraDistance -= pinchZoomFactor; // ZOOM IN
            }
            else if ((nonABSDiff1 > 0) && (nonABSDiff2 < 0)) {
              cameraDistance += pinchZoomFactor; // ZOOM OUT
            }
            */

            if ((tpCache[point1].clientX) > (tpCache[point2].clientX)) {
              if ((nonABSDiff1 < 0) && (nonABSDiff2 > 0)) {
                cameraDistance -= pinchZoomFactor; // ZOOM IN
              }
              else if ((nonABSDiff1 > 0) && (nonABSDiff2 < 0)) {
                cameraDistance += pinchZoomFactor; // ZOOM OUT
              }
            }
            else if ((tpCache[point1].clientX) < (tpCache[point2].clientX)) {
              if ((nonABSDiff1 > 0) && (nonABSDiff2 < 0)) {
                cameraDistance -= pinchZoomFactor; // ZOOM IN
              }
              else if ((nonABSDiff1 < 0) && (nonABSDiff2 > 0)) {
                cameraDistance += pinchZoomFactor; // ZOOM OUT
              }
            }

          }
        }


        if (cameraDistance > CAMERAZOOMMAX) {
          cameraDistance = CAMERAZOOMMAX;
        }
        else if (cameraDistance < CAMERAZOOMMIN) {
          cameraDistance = CAMERAZOOMMIN;
        }
      }
      else {
        tpCache = [];
      }
    }
  });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (e.targetTouches.length == 0) {
      inputs.mouseClick = false;
      inputs.rightMouseDown = false;
      initYawAngle = yawAngle;
      initPitchAngle = pitchAngle;
    }
  });

  canvas.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    inputs.mouseClick = false;
    inputs.rightMouseDown = false;
    initYawAngle = yawAngle;
    initPitchAngle = pitchAngle;
  });

  /*
  // --- IMAGE LOADING ---
  enterFullscreenImg.addEventListener("load", () => {
    gl.useProgram(texProgram);

    gl.activeTexture(gl.TEXTURE0);
    const enterFullscreenTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, enterFullscreenTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, enterFullscreenImg);

    gl.uniform1i(texImageUni, 0);

    requestAnimationFrame(drawScene);
  });
  */

  if (!gl) {
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  var billboardShader = createShader(gl, gl.VERTEX_SHADER, billboardVertexShaderSource);
  var uiShader = createShader(gl, gl.VERTEX_SHADER, uiVertexShaderSource);
  var texShader = createShader(gl, gl.VERTEX_SHADER, textureShaderSource);
  var texFragShader = createShader(gl, gl.FRAGMENT_SHADER, textureFragShaderSource);

  // Link the two shaders into a program
  var program = createProgram(gl, vertexShader, fragmentShader);
  var billboardProgram = createProgram(gl, billboardShader, fragmentShader);
  var uiProgram = createProgram(gl, uiShader, fragmentShader);
  var texProgram = createProgram(gl, texShader, texFragShader);

  // Look up where the vertex data needs to go
  programLocs.positionAttrib = gl.getAttribLocation(program, "aPos");
  programLocs.modelUni = gl.getUniformLocation(program, "model");
  programLocs.viewUni = gl.getUniformLocation(program, "view");
  programLocs.projectionUni = gl.getUniformLocation(program, "projection");
  programLocs.vertexColorUni = gl.getUniformLocation(program, "ourColor");

  billboardProgramLocs.positionAttrib = gl.getAttribLocation(billboardProgram, "vertexPosition_worldspace");
  billboardProgramLocs.modelUni = gl.getUniformLocation(billboardProgram, "model");
  billboardProgramLocs.cameraUpUni = gl.getUniformLocation(billboardProgram, "cameraUp_worldspace");
  billboardProgramLocs.cameraRightUni = gl.getUniformLocation(billboardProgram, "cameraRight_worldspace");
  billboardProgramLocs.billboardCenterUni = gl.getUniformLocation(billboardProgram, "billboardCenter_worldspace");
  billboardProgramLocs.viewUni = gl.getUniformLocation(billboardProgram, "view");
  billboardProgramLocs.projectionUni = gl.getUniformLocation(billboardProgram, "projection")
  billboardProgramLocs.vertexColorUni = gl.getUniformLocation(billboardProgram, "ourColor");

  uiPositionAttrib = gl.getAttribLocation(uiProgram, "aPos");
  uiModelUni = gl.getUniformLocation(uiProgram, "model");
  uiProjectionUni = gl.getUniformLocation(uiProgram, "projection");
  uiVertexColorUni = gl.getUniformLocation(uiProgram, "ourColor");

  texPositionAttrib = gl.getAttribLocation(texProgram, "vertex");
  texModelUni = gl.getUniformLocation(texProgram, "model");
  texProjectionUni = gl.getUniformLocation(texProgram, "projection");
  texImageUni = gl.getUniformLocation(texProgram, "image");


  // --- SPHERE ---
  var stackCount = 30; // Sphere divisions Vertically
  var sectorCount = 30; // Sphere divisions Horizontally
  var sphereRadius = 0.5;
  var sphereVertices = [];
  var sphereIndices = [];
  {
    var x, y, z, xy, i, j;
    var stackAngle, sectorAngle;
    var stackStep = Math.PI / stackCount;
    var sectorStep = (2 * Math.PI) / sectorCount;

    for (i = 0; i <= stackCount; ++i) {
      stackAngle = (Math.PI / 2) - i * stackStep;
      xy = sphereRadius * Math.cos(stackAngle);
      z = sphereRadius * Math.sin(stackAngle);

      for (j = 0; j <= sectorCount; ++j) {
        sectorAngle = j * sectorStep;

        x = xy * Math.cos(sectorAngle);
        y = xy * Math.sin(sectorAngle);
        sphereVertices.push(x, y, z);
      }
    }

    var k1, k1;
    for (i = 0; i < stackCount; ++i) {
      k1 = i * (sectorCount + 1); // beginning of current stack
      k2 = k1 + sectorCount + 1;

      for (j = 0; j < sectorCount; ++j, ++k1, ++k2) {
        // 2 triangles per sector excluding first and last stacks
        // k1 => k2 => k1+1
        if (i != 0) {
          sphereIndices.push(k1, k2, (k1 + 1));
        }

        // k1+1 => k2 => k2+1
        if (i != (stackCount - 1))
        {
          sphereIndices.push((k1 + 1), k2, (k2 + 1));
        }
      }
    }
  }

  const sphereVAO = gl.createVertexArray();
  const sphereVBO = gl.createBuffer();
  const sphereEBO = gl.createBuffer();
  gl.bindVertexArray(sphereVAO);

  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertices), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereEBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereIndices), gl.STATIC_DRAW);

  // Tell gpu how to read in vertices
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.vertexAttribPointer(programLocs.positionAttrib, numComponents, type, normalize,
    stride, offset);
  gl.enableVertexAttribArray(programLocs.positionAttrib);

  // unbind
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  // --- GRID ---
  worldGrid.lineVertices = [1.0, 0.0, 0.0,  0.0, 0.0, 0.0];

  worldGrid.lineVAO = gl.createVertexArray();
  worldGrid.lineVBO = gl.createBuffer();
  gl.bindVertexArray(worldGrid.lineVAO);

  gl.bindBuffer(gl.ARRAY_BUFFER, worldGrid.lineVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(worldGrid.lineVertices), gl.STATIC_DRAW);

  gl.vertexAttribPointer(programLocs.positionAttrib, numComponents, type, normalize,
    stride, offset);
  gl.enableVertexAttribArray(programLocs.positionAttrib);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  guideGrid.lineVAO = worldGrid.lineVAO;


  // --- SQUARE ---
  var squareVertices = [
    0.0, 0.0,
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0
  ];

  var squareIndices = [
    0, 1, 3,
    1, 2, 3
  ];

  const squareVAO = gl.createVertexArray();
  const squareVBO = gl.createBuffer();
  const squareEBO = gl.createBuffer();
  gl.bindVertexArray(squareVAO);

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertices), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareEBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareIndices), gl.STATIC_DRAW);

  gl.vertexAttribPointer(uiPositionAttrib, 2, type, normalize, stride, offset);
  gl.enableVertexAttribArray(uiPositionAttrib);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  // --- TEXTURE ---
  var texVertices = [
    // Pos      // Tex Coords
    1.0, 1.0,   1.0, 1.0,
    1.0, 0.0,   1.0, 0.0,
    0.0, 0.0,   0.0, 0.0,
    0.0, 1.0,   0.0, 1.0
  ];

  var texIndices = [
    0, 1, 3,
    1, 2, 3
  ];

  const texVAO = gl.createVertexArray();
  const texVBO = gl.createBuffer();
  const texEBO = gl.createBuffer();
  gl.bindVertexArray(texVAO);

  gl.bindBuffer(gl.ARRAY_BUFFER, texVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texVertices), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, texEBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(texIndices), gl.STATIC_DRAW);

  gl.vertexAttribPointer(texPositionAttrib, 4, type, normalize, stride, offset);
  gl.enableVertexAttribArray(texPositionAttrib);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);



  var NDCx = 0;
  var NDCy = 0;

  var cameraPos = new THREE.Vector3();
  var position = new THREE.Vector3();
  guideGrid.pos = 0;
  guideGrid.slideSpeed = 0.5;

  var brushColor = new THREE.Vector4(colors[6][0], colors[6][1], colors[6][2], 1.0);
  var numColors = colors.length;
  var squareSize, i;

  requestAnimationFrame(drawScene);

  function drawScene() {

    if (!fullscreen) {
      canvas.height = window.innerHeight * 0.8;
      canvas.width = window.innerWidth * 0.8;
    }
    else {
      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.18, 0.22, 0.25, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var top, bottom, left, right;
    var fovy = 45;
    var near = 0.1;
    var far = 100;
    var aspect = gl.canvas.width / gl.canvas.height;
    top = -near * Math.tan(((fovy * Math.PI)/180)/2);
    bottom = -top;
    right = bottom * aspect;
    left = -right;

    NDCx = ((2.0 * inputs.mouseX) / gl.canvas.width) - 1.0;
    NDCy = 1.0 - ((2.0 * inputs.mouseY) / gl.canvas.height);
    var rayNds = new THREE.Vector3(NDCx, NDCy, 1.0);
    var rayClip = new THREE.Vector4(rayNds.x, rayNds.y, -1.0, 1.0); //direction vector pointing into screen

    var cameraMatrix = new THREE.Matrix4();
    var projectionMatrix = new THREE.Matrix4();
    var modelMatrix = new THREE.Matrix4();
    projectionMatrix.makePerspective(left, right, top, bottom, near, far);

    if (inputs.rightMouseDown) {
      yawAngle = (degToRad * (inputs.mouseX - inputs.initMouseX)) + initYawAngle
      pitchAngle = (degToRad * (inputs.mouseY - inputs.initMouseY)) + initPitchAngle

      var pitchAngleLimit = 89.9 * degToRad;
      if (pitchAngle > pitchAngleLimit) {
        pitchAngle = pitchAngleLimit;
      }
      else if (pitchAngle < -pitchAngleLimit) {
        pitchAngle = -pitchAngleLimit;
      }
    }

    cameraPos.y = -Math.sin(pitchAngle);
    cameraPos.x = -Math.cos(pitchAngle) * Math.sin(yawAngle);
    cameraPos.z = Math.cos(pitchAngle) * Math.cos(yawAngle);

    cameraPos.normalize().multiplyScalar(cameraDistance);

    var screenCenterPos = new THREE.Vector3(0, 0, 0);

    var cameraForward = (cameraPos.clone().sub(screenCenterPos)).normalize();
    var cameraRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0.0, 1.0, 0.0), cameraForward).normalize();
    var cameraUp = new THREE.Vector3().crossVectors(cameraForward, cameraRight).normalize();

    cameraMatrix.makeBasis(cameraRight, cameraUp, cameraForward);
    cameraMatrix = cameraMatrix.premultiply(new THREE.Matrix4().makeTranslation(cameraPos.x, cameraPos.y, cameraPos.z));
    // have to pre-multiply because 3js makes an identity matrix with the translation instead of applying to existing
    var viewMatrix = new THREE.Matrix4().getInverse(cameraMatrix);

    gl.useProgram(program);
    gl.uniformMatrix4fv(programLocs.viewUni, false, viewMatrix.elements);
    gl.uniformMatrix4fv(programLocs.projectionUni, false, projectionMatrix.elements);


    rayClip.applyMatrix4(new THREE.Matrix4().getInverse(projectionMatrix));
    rayClip.z = -1.0;
    rayClip.w = 0.0;

    rayClip.applyMatrix4(cameraMatrix);
    var rayWor = new THREE.Vector3(rayClip.x, rayClip.y, rayClip.z);
    rayWor.normalize();

    if (inputs.mouseClick) {
      var colorSelect = false;
      for (i = 0; i < numColors; i++) {
        if (((inputs.mouseY > colorCoords[i][1]) && (inputs.mouseY < (colorCoords[i][1] + squareSize))) &&
          ((inputs.mouseX > colorCoords[i][0]) && (inputs.mouseX < (colorCoords[i][0] + squareSize)))) {

          brushColor.set(colors[i][0], colors[i][1], colors[i][2], 1.0);
          colorSelect = true;
        }
      }

      if (!colorSelect) {
        //targetPosX = inputs.mouseX;
        //targetPosY = inputs.mouseY;
        var rayPos = new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z); //ray's position
        position = rayPos.add(rayWor.multiplyScalar(cameraDistance - guideGrid.pos));
        paintBrush.push({position: new THREE.Vector3(position.x, position.y, position.z),
          color: new THREE.Vector4(brushColor.x, brushColor.y, brushColor.z, brushColor.w)});
      }
    }


    // --- DRAW BRUSH STROKES ---
    for (i = 0; i < paintBrush.length; i++) {
      modelMatrix.makeTranslation(paintBrush[i].position.x, paintBrush[i].position.y, paintBrush[i].position.z);
      gl.uniformMatrix4fv(programLocs.modelUni, false, modelMatrix.elements);
      gl.uniform4f(programLocs.vertexColorUni, paintBrush[i].color.x, paintBrush[i].color.y, paintBrush[i].color.z, paintBrush[i].color.w);

      gl.bindVertexArray(sphereVAO);

      var primitiveType = gl.TRIANGLES;
      var vertexCount = sphereIndices.length;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(primitiveType, vertexCount, type, offset);
      gl.bindVertexArray(null);
    }


    // --- DRAW WORLD GRID ---
    worldGrid.scale = 30;
    worldGrid.divisions = worldGrid.scale * 2;

    var worldGridAlpha = 0.5;
    worldGrid.lineColor = new THREE.Vector4(0.6, 0.6, 0.6, worldGridAlpha);
    worldGrid.axisColor = new THREE.Vector4(0.0, 0.0, 0.0, worldGridAlpha);

    makeGrid(gl, worldGrid, modelMatrix, programLocs, true);


    // --- DRAW GUIDE GRID ---
    gl.useProgram(billboardProgram);

    gl.uniform3fv(billboardProgramLocs.cameraUpUni, cameraUp.toArray());
    gl.uniform3fv(billboardProgramLocs.cameraRightUni, cameraRight.toArray());

    gl.uniformMatrix4fv(billboardProgramLocs.viewUni, false, viewMatrix.elements);
    gl.uniformMatrix4fv(billboardProgramLocs.projectionUni, false, projectionMatrix.elements);

    var zoomLevelFactor = 1;//cameraDistance / 10;
    if (inputs.keyWDown && (guideGrid.pos > -(CAMERAZOOMMAX - 2))) {
      guideGrid.pos -= guideGrid.slideSpeed * zoomLevelFactor;
    }
    else if (inputs.keySDown && (guideGrid.pos < (CAMERAZOOMMAX - 1))) {
      guideGrid.pos += guideGrid.slideSpeed * zoomLevelFactor;
    }

    cameraPos.normalize().multiplyScalar(guideGrid.pos);
    gl.uniform3fv(billboardProgramLocs.billboardCenterUni, [cameraPos.x, cameraPos.y, cameraPos.z]);

    guideGrid.lineColor = new THREE.Vector4(1.0, 0.6, 0.6, 0.5);
    guideGrid.scale = 30;
    guideGrid.divisions = worldGrid.divisions;

    makeGrid(gl, guideGrid, modelMatrix, billboardProgramLocs, false);


    // --- DRAW COLOR SELECTION SQUARES ---
    gl.useProgram(uiProgram);

    near = -1.0;
    far = 1.0;
    projectionMatrix.makeOrthographic(0, gl.canvas.width, 0, gl.canvas.height, near, far);
    gl.uniformMatrix4fv(uiProjectionUni, false, projectionMatrix.elements);

    squareSize = canvas.width / 16;
    var colorSelectionOffset = 100;

    if (gl.canvas.width <= 768) {
      squareSize = canvas.width / 10;
      colorSelectionOffset = 10;
    }

    var colorSelectionWidth = gl.canvas.width - (2 * colorSelectionOffset);
    var colorSelectionX = colorSelectionWidth / numColors;
    var colorSelectionY = 20;
    var squareX;
    var squareColor;
    colorCoords = []

    for (i = 0; i < numColors; i++) {
      squareX = colorSelectionX * i + colorSelectionOffset;
      colorCoords.push([squareX, colorSelectionY]);

      modelMatrix.makeScale(squareSize, squareSize, 0);
      modelMatrix.premultiply(new THREE.Matrix4().makeTranslation(squareX, colorSelectionY, 0));
      gl.uniformMatrix4fv(uiModelUni, false, modelMatrix.elements);
      squareColor = colors[i];
      gl.uniform4f(uiVertexColorUni, squareColor[0], squareColor[1], squareColor[2], 1.0);

      gl.bindVertexArray(squareVAO);
      var primitiveType = gl.TRIANGLES;
      var vertexCount = squareIndices.length;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(primitiveType, vertexCount, type, offset);
      gl.bindVertexArray(null);
    }

    /*
    // --- DRAW TEXTURES ---
    gl.useProgram(texProgram);
    gl.uniformMatrix4fv(texProjectionUni, false, projectionMatrix.elements);

    var texPosX = (7 * gl.canvas.width) / 8;
    var texPosY = (15 * gl.canvas.height) / 16;

    modelMatrix.makeTranslation(texPosX, texPosY, 0);
    gl.uniformMatrix4fv(texModelUni, false, modelMatrix.elements);

    gl.bindVertexArray(texVAO);
    var primitiveType = gl.TRIANGLES;
    var vertexCount = texIndices.length;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(primitiveType, vertexCount, type, offset);
    gl.bindVertexArray(null);
    */

    requestAnimationFrame(drawScene);
  }
}

$(document).ready(function(){
  runPainter();
})
