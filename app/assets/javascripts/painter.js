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

/**
 * Resize a canvas to match the size its displayed.
 * @param {HTMLCanvasElement} canvas The canvas to resize.
 * @param {number} [multiplier] amount to multiply by.
 *    Pass in window.devicePixelRatio for native pixels.
 * @return {boolean} true if the canvas was resized.
 * @memberOf module:webgl-utils
 */
function resizeCanvasToDisplaySize(canvas, multiplier) {
  multiplier = multiplier || 1;
  var width  = canvas.clientWidth  * multiplier | 0;
  var height = canvas.clientHeight * multiplier | 0;
  if (canvas.width !== width ||  canvas.height !== height) {
    canvas.width  = width;
    canvas.height = height;
    return true;
  }
  return false;
}

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

var mouseDown = false;
var mouseX = 300;
var mouseY = 240;

function handleMouseDown(e) {
  var canvasRect = document.getElementById("painter-canvas").getBoundingClientRect();
  mouseDown = true;
  mouseX = e.clientX - canvasRect.left;
  mouseY = e.clientY - canvasRect.top;
}

function handleMouseUp(e) {
  mouseDown = false;
}

function runPainter() { // Main game function
  // Get a WeblGL context
  var canvas = document.getElementById("painter-canvas");
  var gl = canvas.getContext("webgl2");

  canvas.addEventListener("mousedown", handleMouseDown, false);
  canvas.addEventListener("mouseup", handleMouseUp, false);

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
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindVertexArray(null);

  requestAnimationFrame(drawScene);

  function drawScene() {
    resizeCanvasToDisplaySize(gl.canvas);

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

    /*
    var zMultiplier = 10;
    var mouseXTranslation = zMultiplier * ((mouseX/gl.canvas.width)-0.5);
    var mouseYTranslation = zMultiplier * ((mouseY/gl.canvas.height)-0.5);
    */

    var x = (2.0 * mouseX)/gl.canvas.width - 1.0;
    var y = 1.0 - (2.0 * mouseY)/gl.canvas.height;
    var rayNds = new THREE.Vector3(x, y, 1.0);
    var rayClip = new THREE.Vector4(rayNds.x, rayNds.y, -1.0, 1.0);
    console.log(rayNds);
    console.log("ray clip " + rayClip);

    var viewMatrix = new THREE.Matrix4();
    var projectionMatrix = new THREE.Matrix4();
    projectionMatrix.makePerspective(left, right, top, bottom, near, far);

    var inverseProjectionMatrix = new THREE.Matrix4(); //this all seems unnecessary?
    var rayEye = new THREE.Vector4();
    rayEye = rayEye.copy(rayClip.applyMatrix4(inverseProjectionMatrix.getInverse(projectionMatrix)));
    rayEye.z = -1.0;
    rayEye.w = 0.0;
    console.log(rayEye);

    viewMatrix.makeTranslation(0, 0, -3);

    var inverseViewMatrix = new THREE.Matrix4();
    var multiplyVector = new THREE.Vector4();
    multiplyVector = multiplyVector.copy(rayEye.applyMatrix4(inverseViewMatrix.getInverse(viewMatrix)));
    console.log(multiplyVector);
    var rayWor = new THREE.Vector3(multiplyVector.x, multiplyVector.y, multiplyVector.z);
    console.log(rayWor);
    rayWor = rayWor.normalize();



    gl.uniformMatrix4fv(viewUniLoc, false, viewMatrix.elements);
    gl.uniformMatrix4fv(projectionUniLoc, false, projectionMatrix.elements);

    var modelMatrix = new THREE.Matrix4();
    //rayWor = rayWor * 3;
    var cameraPos = new THREE.Vector3(0, 0, 3);
    var position = rayWor.sub(cameraPos);
    position = (position.normalize()) * 3;
    modelMatrix.makeTranslation(rayWor.x, rayWor.y, 0);
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
