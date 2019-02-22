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

var fragmentShaderSource = `#version 300 es
  precision mediump float;

  out vec4 outColor;

  uniform vec4 ourColor;

  void main() {

  	outColor = ourColor;
  }
`;

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
  const DEFAULT_WIDTH = 640;
  const DEFAULT_HEIGHT = 480;

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
    canvas.width = DEFAULT_WIDTH;
    canvas.height = DEFAULT_HEIGHT;
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  return !fullscreen;
}

function runPainter() { // Main game function
  // Get a WeblGL context
  var canvas = document.getElementById("painter-canvas");
  var gl = canvas.getContext("webgl2");

  canvas.width = 640;
  canvas.height = 480;

  const ZOOMFACTOR = 1;
  const CAMERAZOOMMIN = 1;
  const CAMERAZOOMMAX = 50;

  var inputs = [];
  var programLocs = [];
  var billboardProgramLocs = [];
  var guideGrid = [];
  var worldGrid = [];
  var paintBrush = [];

  var targetPosX = 300;
  var targetPosY = 240;
  var canvasRect = document.getElementById("painter-canvas").getBoundingClientRect();

  var degToRad = (2 * Math.PI) / 360;

  var yawAngle = 45 * degToRad;
  var pitchAngle = 45 * degToRad;
  var initYawAngle = yawAngle;
  var initPitchAngle = pitchAngle;

  var cameraDistance = 5;
  var fullscreen = false;

  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (inputs.mouseX == null || inputs.mouseY == null) {
      inputs.mouseX = e.clientX - canvasRect.left + 0.5;
      inputs.mouseY = e.clientY - canvasRect.top;
    }
    if (e.which == 1) {
      targetPosX = inputs.mouseX;
      targetPosY = inputs.mouseY;
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
    var leftOffset = 0;
    var topOffset = 0;
    if (!fullscreen) {
      leftOffset = canvasRect.left;
      topOffset = canvasRect.top;
    }
    inputs.mouseX = e.clientX - leftOffset + 0.5; //for some reason it goes to -0.5 when on left edge if canvas
    inputs.mouseY = e.clientY - topOffset;
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

  window.addEventListener("keyup", (e) => {
    if (e.code == "KeyW") {
      inputs.keyWDown = false;
    }
    if (e.code == "KeyS") {
      inputs.keySDown = false;
    }
  });
  canvas.addEventListener("contextmenu", (e) => { e.preventDefault(); });


  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (inputs.mouseX == null || inputs.mouseY == null) {
      inputs.mouseX = e.touches[0].clientX - canvasRect.left + 0.5;
      inputs.mouseY = e.touches[0].clientY - canvasRect.top;
    }

    if (e.touches.length == 1) {
      targetPosX = inputs.mouseX;
      targetPosY = inputs.mouseY;
      inputs.mouseClick = true;
    }
    else if (e.touches.length == 2) {
      inputs.rightMouseDown = true;
      inputs.initMouseX = inputs.mouseX;
      inputs.initMouseY = inputs.mouseY;
    }
  });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (e.touches.length == 0) {
      inputs.mouseClick = false;
    }
    else if (e.touches.length == 1) {
      inputs.rightMouseDown = false;
      initYawAngle = yawAngle;
      initPitchAngle = pitchAngle;
    }
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    inputs.mouseX = e.touches[0].clientX - canvasRect.left + 0.5;
    inputs.mouseY = e.touches[0].clientY - canvasRect.top;
  });

  if (!gl) {
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  var billboardShader = createShader(gl, gl.VERTEX_SHADER, billboardVertexShaderSource);

  // Link the two shaders into a program
  var program = createProgram(gl, vertexShader, fragmentShader);
  var billboardProgram = createProgram(gl, billboardShader, fragmentShader);

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
  gl.vertexAttribPointer(billboardProgramLocs.positionAttrib, numComponents, type, normalize,
    stride, offset);

  gl.enableVertexAttribArray(billboardProgramLocs.positionAttrib);

  // unbind
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


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


  var NDCx = 0;
  var NDCy = 0;

  var cameraPos = new THREE.Vector3();
  var position = new THREE.Vector3();
  guideGrid.pos = 0;
  guideGrid.slideSpeed = 0.5;

  requestAnimationFrame(drawScene);

  function drawScene() {
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

    NDCx = (2.0 * targetPosX)/gl.canvas.width - 1.0;
    NDCy = 1.0 - (2.0 * targetPosY)/gl.canvas.height;
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
      targetPosX = inputs.mouseX;
      targetPosY = inputs.mouseY;
      var rayPos = new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z); //ray's position
      position = rayPos.add(rayWor.multiplyScalar(cameraDistance - guideGrid.pos));
      paintBrush.push({position: new THREE.Vector3(position.x, position.y, position.z)});
    }

    var brushColor = new THREE.Vector4(0.0, 0.5, 1.0, 1.0);

    for (var i = 0; i < paintBrush.length; i++) {
      modelMatrix.makeTranslation(paintBrush[i].position.x, paintBrush[i].position.y, paintBrush[i].position.z);
      gl.uniformMatrix4fv(programLocs.modelUni, false, modelMatrix.elements);
      gl.uniform4f(programLocs.vertexColorUni, brushColor.x, brushColor.y, brushColor.z, brushColor.w);

      gl.bindVertexArray(sphereVAO);

      var primitiveType = gl.TRIANGLES;
      var vertexCount = sphereIndices.length;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(primitiveType, vertexCount, type, offset);
      gl.bindVertexArray(null);
    }


    worldGrid.scale = 5;
    worldGrid.divisions = 10;

    worldGrid.lineColor = new THREE.Vector4(0.6, 0.6, 0.6, 1.0);
    worldGrid.axisColor = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);

    makeGrid(gl, worldGrid, modelMatrix, programLocs, true);

    gl.useProgram(billboardProgram);

    gl.uniform3fv(billboardProgramLocs.cameraUpUni, cameraUp.toArray());
    gl.uniform3fv(billboardProgramLocs.cameraRightUni, cameraRight.toArray());

    gl.uniformMatrix4fv(billboardProgramLocs.viewUni, false, viewMatrix.elements);
    gl.uniformMatrix4fv(billboardProgramLocs.projectionUni, false, projectionMatrix.elements);

    if (inputs.keyWDown && (guideGrid.pos > -(CAMERAZOOMMAX - 1))) {
      guideGrid.pos -= guideGrid.slideSpeed;
    }
    else if (inputs.keySDown && (guideGrid.pos < (CAMERAZOOMMAX - 1))) {
      guideGrid.pos += guideGrid.slideSpeed;
    }

    cameraPos.normalize().multiplyScalar(guideGrid.pos);
    gl.uniform3fv(billboardProgramLocs.billboardCenterUni, [cameraPos.x, cameraPos.y, cameraPos.z]);

    guideGrid.lineColor = new THREE.Vector4(1.0, 0.6, 0.6, 0.5);
    guideGrid.scale = 20;
    guideGrid.divisions = worldGrid.divisions;

    makeGrid(gl, guideGrid, modelMatrix, billboardProgramLocs, false);


    requestAnimationFrame(drawScene);
  }
}

$(document).ready(function(){
  runPainter();
})
