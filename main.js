import { compileShader, linkProgram } from "./util.js";

const gl = document.getElementById("webgl_canvas").getContext("webgl");
const slider_offset_x_el = document.getElementById("x_offset");
const slider_offset_y_el = document.getElementById("y_offset");

const image = new Image();
image.src = "lake.jpg";
image.onload = () => {
  const width = image.width;
  const height = image.height;

  //1. 텍스트 형태로 glsl 소스 코드 작

  //language="glsl"
  const vertex_shader_src = `
    precision mediump float;
    attribute vec2 a_position;
    
    uniform float u_offset_x;
    uniform float u_offset_y;
    void main() {
        vec2 offsets = vec2(u_offset_x, u_offset_y);
        gl_Position = vec4(a_position + offsets, 0, 1);
    }
  `;
  //language="glsl"
  const fragment_shader_src = `
      precision mediump float;
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.3, 1.0);
    }
  `;

  //2. vertex shader 소스 컴파일
  const vertex_shader = compileShader(gl, vertex_shader_src, gl.VERTEX_SHADER);

  //3. fragment shader 소스 컴파일
  const fragment_shader = compileShader(
    gl,
    fragment_shader_src,
    gl.FRAGMENT_SHADER
  );

  //4. program 링크
  const my_program = linkProgram(gl, vertex_shader, fragment_shader);

  //5. vertex shader에 제공할 attribute 데이터 생성
  const buf_a_position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_position);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0.2, -0.3, -0.3, 0.3, -0.3]),
    gl.STATIC_DRAW
  );

  gl.useProgram(my_program);

  const loc_a_position = gl.getAttribLocation(my_program, "a_position");
  gl.enableVertexAttribArray(loc_a_position);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_position);
  gl.vertexAttribPointer(loc_a_position, 2, gl.FLOAT, false, 0, 0);

  const loc_u_offset_x = gl.getUniformLocation(my_program, "u_offset_x");
  const loc_u_offset_y = gl.getUniformLocation(my_program, "u_offset_y");

  gl.uniform1f(loc_u_offset_x, 0.0);
  gl.uniform1f(loc_u_offset_y, 0.0);

  gl.viewport(0, 0, width, height);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  slider_offset_x_el.addEventListener("input", (e) => {
    const val = Number(e.currentTarget.value);
    gl.uniform1f(loc_u_offset_x, val);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });
  slider_offset_y_el.addEventListener("input", (e) => {
    const val = Number(e.currentTarget.value);
    gl.uniform1f(loc_u_offset_y, val);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });
};
