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

function runPainter() { // Main game function
  // Get a WeblGL context
  var canvas = document.getElementById("painter-canvas");
  var gl = canvas.getContext("webgl2");

  const ZOOMFACTOR = 1;
  const CAMERAZOOMMIN = 1;
  const CAMERAZOOMMAX = 50;

  var inputs = [];

  var targetPosX = 300;
  var targetPosY = 240;

  var degToRad = (2 * Math.PI) / 360;

  var yawAngle = 45 * degToRad;
  var pitchAngle = 45 * degToRad;
  var initYawAngle = yawAngle;
  var initPitchAngle = pitchAngle;

  var cameraDistance = 5;

  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
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
    if (e.which == 3) {
      inputs.rightMouseDown = false;
      initYawAngle = yawAngle;
      initPitchAngle = pitchAngle;
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    var canvasRect = document.getElementById("painter-canvas").getBoundingClientRect();
    inputs.mouseX = e.clientX - canvasRect.left + 0.5; //for some reason it goes to -0.5 when on left edge if canvas
    inputs.mouseY = e.clientY - canvasRect.top;
  });

  canvas.addEventListener("mouseout", () => {
    inputs.rightMouseDown = false;
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
  });
  window.addEventListener("keyup", (e) => {
    if (e.code == "KeyW") {
      inputs.keyWDown = false;
    }
    if (e.code == "KeyS") {
      inputs.keySDown = false;
    }
  });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

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
  var positionAttributeLocation = gl.getAttribLocation(program, "aPos");
  var modelUniLoc = gl.getUniformLocation(program, "model");
  var viewUniLoc = gl.getUniformLocation(program, "view");
  var projectionUniLoc = gl.getUniformLocation(program, "projection");
  var vertexColorUniLoc = gl.getUniformLocation(program, "ourColor");

  var positionAttributeLocation2 = gl.getAttribLocation(billboardProgram, "vertexPosition_worldspace");
  var modelUniLoc2 = gl.getUniformLocation(billboardProgram, "model");
  var cameraUpUniLoc = gl.getUniformLocation(billboardProgram, "cameraUp_worldspace");
  var cameraRightUniLoc = gl.getUniformLocation(billboardProgram, "cameraRight_worldspace");
  var billboardCenterUniLoc = gl.getUniformLocation(billboardProgram, "billboardCenter_worldspace");
  var viewUniLoc2 = gl.getUniformLocation(billboardProgram, "view");
  var projectionUniLoc2 = gl.getUniformLocation(billboardProgram, "projection")
  var vertexColorUniLoc2 = gl.getUniformLocation(billboardProgram, "ourColor");

  var circleEdges = 30;
  var circleOrigin = 0.0;
  var circleRadius = 0.5;
  var circleAngle = (2 * Math.PI) / circleEdges;
  /*
  var circleVertices = [circleOrigin, circleOrigin, 0];
  var circleIndices = [];

  {
    // x = OriginX + r * cos(angle)
    // y = OriginY + r * sin(angle)
    var i, x, y;
    for (i = 0; i < (circleEdges + 1); i++) {
      x = circleOrigin + (circleRadius * Math.cos(i * circleAngle));
      y = circleOrigin + (circleRadius * Math.sin(i * circleAngle));

      if (i < circleEdges) {
        circleVertices.push(x, y, 0);
      }

      if (i > 0) {
        if (i != circleEdges) {
          circleIndices.push(0, i, i + 1);
        } else {
          circleIndices.push(0, i, 1);
        }
      }
    }
  }

  circleVertices.push(0, 0, 1);
  console.log(circleVertices);
  circleIndices.push(1, circleEdges/2, circleEdges);
  console.log(circleIndices);
  */

  var circleVertices = [0.5,  0.5, 0.0,     0.5, -0.5, 0.0,   -0.5, -0.5, 0.0,   -0.5,  0.5, 0.0,     0.0, 0.0, 0.5];
  var circleIndices = [0, 1, 3,    1, 2, 3,    0, 4, 2];

  const circleVAO = gl.createVertexArray();
  const circleVBO = gl.createBuffer();
  const circleEBO = gl.createBuffer();

  gl.bindVertexArray(circleVAO);

  gl.bindBuffer(gl.ARRAY_BUFFER, circleVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleEBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);

  // Tell gpu how to read in vertices
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.vertexAttribPointer(positionAttributeLocation, numComponents, type, normalize,
    stride, offset);

  gl.enableVertexAttribArray(positionAttributeLocation);

  // unbind
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  var worldGridLineVertices = [1.0, 0.0, 0.0,  0.0, 0.0, 0.0];

  const worldGridLineVAO = gl.createVertexArray();
  const worldGridLineVBO = gl.createBuffer();

  gl.bindVertexArray(worldGridLineVAO);

  gl.bindBuffer(gl.ARRAY_BUFFER, worldGridLineVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(worldGridLineVertices), gl.STATIC_DRAW);

  gl.vertexAttribPointer(positionAttributeLocation, numComponents, type, normalize,
    stride, offset);

  gl.enableVertexAttribArray(positionAttributeLocation);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  const guideGridLineVAO = gl.createVertexArray();
  const guideGridLineVBO = gl.createBuffer();

  gl.bindVertexArray(guideGridLineVAO);

  gl.bindBuffer(gl.ARRAY_BUFFER, guideGridLineVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(worldGridLineVertices), gl.STATIC_DRAW);

  gl.vertexAttribPointer(positionAttributeLocation2, numComponents, type, normalize,
    stride, offset);

  gl.enableVertexAttribArray(positionAttributeLocation2);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  var cameraPos = new THREE.Vector3();
  var position = new THREE.Vector3();
  var gridGuidePos = 5;
  var gridGuideSlideSpeed = 0.05;

  requestAnimationFrame(drawScene);

  function drawScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.18, 0.22, 0.25, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    var top, bottom, left, right;
    var fovy = 45;
    var near = 0.1;
    var far = 100;
    var aspect = gl.canvas.width / gl.canvas.height;
    top = -near * Math.tan(((fovy * Math.PI)/180)/2);
    bottom = -top;
    right = bottom * aspect;
    left = -right;


    var NDCx = (2.0 * targetPosX)/gl.canvas.width - 1.0;
    var NDCy = 1.0 - (2.0 * targetPosY)/gl.canvas.height;
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

    gl.uniformMatrix4fv(viewUniLoc, false, viewMatrix.elements);
    gl.uniformMatrix4fv(projectionUniLoc, false, projectionMatrix.elements);


    rayClip.applyMatrix4(projectionMatrix.getInverse(projectionMatrix));
    rayClip.z = -1.0;
    rayClip.w = 0.0;

    rayClip.applyMatrix4(cameraMatrix);
    var rayWor = new THREE.Vector3(rayClip.x, rayClip.y, rayClip.z);
    rayWor.normalize();

    if (inputs.mouseClick) {
      var rayPos = new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z); //ray's position
      position = rayPos.add(rayWor.multiplyScalar(cameraDistance - gridGuidePos));
      inputs.mouseClick = false;
    }

    modelMatrix.makeTranslation(position.x, position.y, position.z);
    gl.uniformMatrix4fv(modelUniLoc, false, modelMatrix.elements);

    var brushColor = new THREE.Vector4(1.0, 0.0, 0.5, 1.0);

    gl.uniform4f(vertexColorUniLoc, brushColor.x, brushColor.y, brushColor.z, brushColor.w);

    gl.bindVertexArray(circleVAO);

    var primitiveType = gl.TRIANGLES;
    var vertexCount = circleIndices.length;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(primitiveType, vertexCount, type, offset);
    gl.bindVertexArray(null);

    var worldGridScale = 5;
    var worldGridDivisions = 10;

    var worldGridLineColor = new THREE.Vector4(0.6, 0.6, 0.6, 1.0);
    var worldGridAxisColor = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);

    var i, j;
    var xTranslation, zTranslation;
    for (i = 0; i < (worldGridDivisions + 1); i++) {
      for (j = 0; j < 2; j++) {
        modelMatrix.makeScale(worldGridScale, worldGridScale, worldGridScale);
        if (j == 0) {
          xTranslation = (i / worldGridDivisions) * worldGridScale;
          zTranslation = 0;
          modelMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
        }
        else {
          zTranslation = (i / worldGridDivisions) * worldGridScale;
          xTranslation = 0;
        }

        if (i == ((Math.floor(worldGridDivisions / 2)))) {
          gl.uniform4f(vertexColorUniLoc, worldGridAxisColor.x, worldGridAxisColor.y, worldGridAxisColor.z, worldGridAxisColor.w);
        }
        else {
          gl.uniform4f(vertexColorUniLoc, worldGridLineColor.x, worldGridLineColor.y, worldGridLineColor.z, worldGridLineColor.w);
        }

        modelMatrix.premultiply(new THREE.Matrix4().makeTranslation(xTranslation, 0, -zTranslation));
        modelMatrix.premultiply(new THREE.Matrix4().makeTranslation(-(worldGridScale / 2), 0, (worldGridScale / 2)));
        gl.uniformMatrix4fv(modelUniLoc, false, modelMatrix.elements);

        gl.bindVertexArray(worldGridLineVAO);

        primitiveType = gl.LINE_STRIP;
        vertexCount = 2;
        gl.drawArrays(primitiveType, 0, vertexCount);
        gl.bindVertexArray(null);
      }
    }


    gl.useProgram(billboardProgram);

    gl.uniform3fv(cameraUpUniLoc, cameraUp.toArray());
    gl.uniform3fv(cameraRightUniLoc, cameraRight.toArray());

    gl.uniformMatrix4fv(viewUniLoc2, false, viewMatrix.elements);
    gl.uniformMatrix4fv(projectionUniLoc2, false, projectionMatrix.elements);

    if (inputs.keyWDown) {
      gridGuidePos -= gridGuideSlideSpeed;
    }
    else if (inputs.keySDown) {
      gridGuidePos += gridGuideSlideSpeed;
    }

    cameraPos.normalize().multiplyScalar(gridGuidePos);
    gl.uniform3fv(billboardCenterUniLoc, [cameraPos.x, cameraPos.y, cameraPos.z]);

    var guideGridLineColor = new THREE.Vector4(1.0, 0.6, 0.6, 0.3);
    var guideGridDivisions = 20;
    var guideGridScale = 40;

    for (i = 0; i < (guideGridDivisions + 1); i++) {
      for (j = 0; j < 2; j++) {
        modelMatrix.makeScale(guideGridScale, guideGridScale, guideGridScale);
        if (j == 0) {
          xTranslation = (i / guideGridDivisions) * guideGridScale;
          zTranslation = 0;
          modelMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
        }
        else {
          zTranslation = (i / guideGridDivisions) * guideGridScale;
          xTranslation = 0;
        }

        gl.uniform4f(vertexColorUniLoc2, guideGridLineColor.x, guideGridLineColor.y, guideGridLineColor.z, guideGridLineColor.w);

        // Center grid
        xTranslation -= guideGridScale / 2;
        zTranslation -= guideGridScale / 2;
        modelMatrix.premultiply(new THREE.Matrix4().makeTranslation(xTranslation, 0, -zTranslation));

        gl.uniformMatrix4fv(modelUniLoc2, false, modelMatrix.elements);

        gl.bindVertexArray(guideGridLineVAO);

        primitiveType = gl.LINE_STRIP;
        vertexCount = 2;
        gl.drawArrays(primitiveType, 0, vertexCount);
        gl.bindVertexArray(null);
      }
    }

    requestAnimationFrame(drawScene);
  }
}

$(document).ready(function(){
  runPainter();
})
