import { compileShader, linkProgram } from "./util.js";

const slider_gl = document.getElementById("webgl_slider");
const gl = document.getElementById("webgl_canvas").getContext("webgl");

const image = new Image();
image.src = "lake.jpg";
image.onload = () => {
  const width = image.width;
  const height = image.height;

  ///////////////////////////////////////
  // image processing for webGL canvas //
  ///////////////////////////////////////

  //1. 텍스트 형태로 glsl 소스 코드 작

  //language="glsl"
  const vertex_shader_src = `
    precision mediump float;
    attribute vec2 a_position;
    attribute vec3 a_color;
    
    uniform float u_color_modifier;
    
    varying vec3 v_color;
    void main() {
        vec3 color = a_color * u_color_modifier;
        v_color = color;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  //language="glsl"
  const fragment_shader_src = `
      precision mediump float;
      varying vec3 v_color;
    void main() {
        gl_FragColor = vec4(v_color, 1.0);
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
  gl.useProgram(my_program);

  //5. vertex shader에 제공할 attribute 데이터 생성
  const buf_a_position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_position);

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0.5, -0.5, -0.3, 0.5, -0.3]),
    gl.STATIC_DRAW
  );
  const buf_a_color = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_color);

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
    gl.STATIC_DRAW
  );
  const loc_u_color_modifier = gl.getUniformLocation(
    my_program,
    "u_color_modifier"
  );

  gl.uniform1f(loc_u_color_modifier, 1.0);

  const loc_a_position = gl.getAttribLocation(my_program, "a_position");
  gl.enableVertexAttribArray(loc_a_position);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_position);
  gl.vertexAttribPointer(loc_a_position, 2, gl.FLOAT, false, 0, 0);

  const loc_a_color = gl.getAttribLocation(my_program, "a_color");
  gl.enableVertexAttribArray(loc_a_color);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_color);
  gl.vertexAttribPointer(loc_a_color, 3, gl.FLOAT, false, 0, 0);

  gl.viewport(0, 0, width, height);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  slider_gl.addEventListener("input", (e) => {
    const val = Number(e.currentTarget.value);
    gl.uniform1f(loc_u_color_modifier, val);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });
};
