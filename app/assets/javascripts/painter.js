var vertexShaderSource = `#version 300 es
  in vec3 aPos;

  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;

  void main() {
    gl_Position = projection * view * model * vec4(aPos, 1.0);
  }
`;

var fragmentShaderSource = `#version 300 es
  precision mediump float;

  out vec4 outColor;

  void main() {

  	outColor = vec4(1, 0, 0.5, 1);
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

var mouseX;
var mouseY;
var initMouseX = 0;
var initMouseY = 0;
var rightMouseDown = false;

var targetPosX = 300;
var targetPosY = 240;

var yawAngle = 0;
var pitchAngle = 0;
var initYawAngle = 0;
var initPitchAngle = 0;

function handleMouseMove(e) {
  var canvasRect = document.getElementById("painter-canvas").getBoundingClientRect();
  mouseX = e.clientX;// - canvasRect.left + 0.5; //for some reason it goes to -0.5 when on left edge if canvas
  mouseY = e.clientY;// - canvasRect.top;
}

function handleMouseDown(e) {

  if (e.which == 1) {
    targetPosX = mouseX;
    targetPosY = mouseY;
  }
  else if (e.which == 3) {
    rightMouseDown = true;
    initMouseX = mouseX;
    initMouseY = mouseY;
  }
}

function handleMouseUp(e) {
  if (e.which == 3) {
    rightMouseDown = false;
    initYawAngle = yawAngle;
    initPitchAngle = pitchAngle;
  }
}

function handleMouseOut(e) {
  rightMouseDown = false;
}

function runPainter() { // Main game function
  // Get a WeblGL context
  var canvas = document.getElementById("painter-canvas");
  var gl = canvas.getContext("webgl2");

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove)
  canvas.addEventListener("mouseout", handleMouseOut)
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  if (!gl) {
    return;
  }

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  // Link the two shaders into a program
  var program = createProgram(gl, vertexShader, fragmentShader);

  // Look up where the vertex data needs to go
  var positionAttributeLocation = gl.getAttribLocation(program, "aPos");
  var modelUniLoc = gl.getUniformLocation(program, "model");
  var viewUniLoc = gl.getUniformLocation(program, "view");
  var projectionUniLoc = gl.getUniformLocation(program, "projection");

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
  var circleIndices = [ 0, 1, 3,    1, 2, 3,    0, 4, 2];


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

  var cameraPos = new THREE.Vector3();

  requestAnimationFrame(drawScene);

  function drawScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(255, 255, 255, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

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
    var rayClip = new THREE.Vector4(rayNds.x, rayNds.y, -1.0, 1.0);

    var viewMatrix = new THREE.Matrix4();
    var projectionMatrix = new THREE.Matrix4();
    projectionMatrix.makePerspective(left, right, top, bottom, near, far);
    //viewMatrix.makeTranslation(0, 0, -3);


    if(rightMouseDown) {
      var degToRad = (2 * Math.PI) / 360;
      yawAngle = (degToRad * (mouseX - initMouseX)) + initYawAngle
      pitchAngle = (degToRad * (mouseY - initMouseY)) + initPitchAngle


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

    var distance = 3;
    cameraPos.normalize().multiplyScalar(distance);

    var screenCenterPos = new THREE.Vector3(0, 0, 0);

    var cameraForward = (cameraPos.clone().sub(screenCenterPos)).normalize();
    var cameraRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0.0, 1.0, 0.0), cameraForward).normalize();
    var cameraUp = new THREE.Vector3().crossVectors(cameraForward, cameraRight).normalize();

    viewMatrix.makeBasis(cameraRight, cameraUp, cameraForward);
    viewMatrix = viewMatrix.premultiply(new THREE.Matrix4().makeTranslation(cameraPos.x, cameraPos.y, cameraPos.z));
    viewMatrix.getInverse(viewMatrix);

    /*
    var distance = 3;
    var cameraPosVector = new THREE.Vector3(cameraX, cameraY, cameraZ);
    cameraPosVector.normalize().multiplyScalar(distance);
    viewMatrix.lookAt(cameraPosVector, new THREE.Vector3(0.0, 0.0, 0.0), new THREE.Vector3(0.0, 1.0, 0.0))
    viewMatrix.getInverse(viewMatrix);
    console.log(viewMatrix);
    */

    gl.uniformMatrix4fv(viewUniLoc, false, viewMatrix.elements);
    gl.uniformMatrix4fv(projectionUniLoc, false, projectionMatrix.elements);

    /*
    rayClip.applyMatrix4(projectionMatrix.getInverse(projectionMatrix));
    rayClip.z = -1.0;
    rayClip.w = 0.0;

    rayClip.applyMatrix4(viewMatrix.getInverse(viewMatrix));
    var rayWor = new THREE.Vector3(rayClip.x, rayClip.y, rayClip.z);
    rayWor.normalize();
    */

    var modelMatrix = new THREE.Matrix4();
    /*
    var rayPos = new THREE.Vector3(0, 0, 3);
    var rayPos = new THREE.Vector3(0, 0, 0); //ray's position
    var position = rayPos.add(rayWor.multiplyScalar(3));
    modelMatrix.makeTranslation(position.x, position.y, position.z);
    modelMatrix.makeTranslation(0, 0, 0);
    */
    gl.uniformMatrix4fv(modelUniLoc, false, modelMatrix.elements);

    gl.bindVertexArray(circleVAO);

    const primitiveType = gl.TRIANGLES;
    const vertexCount = circleIndices.length;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(primitiveType, vertexCount, type, offset);

    requestAnimationFrame(drawScene);
  }
}

$(document).ready(function(){
  runPainter();
})
