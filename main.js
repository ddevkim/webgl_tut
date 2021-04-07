import { compileShader, linkProgram } from "./util.js";

const gl = document.getElementById("webgl_canvas").getContext("webgl");
const slider_gl = document.getElementById("webgl_slider");

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
    attribute vec2 a_tex_coord;
    varying vec2 v_tex_coord;
    void main() {
        gl_Position = vec4(((a_position * 2.0) - 1.0) * vec2(1.0, -1.0), 0, 1);
        v_tex_coord = a_tex_coord;
    }
  `;
  //language="glsl"
  const fragment_shader_src = `
      precision mediump float;
      uniform mat4 u_mat_hue;
      uniform vec4 u_vec_hue;
      uniform sampler2D u_image;
      varying vec2 v_tex_coord;
    void main() {
        vec4 image = texture2D(u_image, v_tex_coord);
        
        //matrix 연산
        gl_FragColor = vec4(image * u_mat_hue + u_vec_hue);
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
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
    gl.STATIC_DRAW
  );
  const buf_a_tex_coord = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_tex_coord);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
    gl.STATIC_DRAW
  );

  //6. fragment shader에 제공할 uniform texture 데이터 생성
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  //7. Initial Rendering
  gl.useProgram(my_program);

  const loc_a_position = gl.getAttribLocation(my_program, "a_position");
  gl.enableVertexAttribArray(loc_a_position);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_position);
  gl.vertexAttribPointer(loc_a_position, 2, gl.FLOAT, false, 0, 0);

  const loc_a_tex_coord = gl.getAttribLocation(my_program, "a_tex_coord");
  gl.enableVertexAttribArray(loc_a_tex_coord);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_tex_coord);
  gl.vertexAttribPointer(loc_a_tex_coord, 2, gl.FLOAT, false, 0, 0);

  const loc_u_mat_hue = gl.getUniformLocation(my_program, "u_mat_hue");
  const loc_u_vec_hue = gl.getUniformLocation(my_program, "u_vec_hue");

  //prettier-ignore
  const get_hue_mat = (angle) => {
    angle *= 360;
    const rotation = angle / 180 * Math.PI;
    const x = Math.cos(rotation);
    const y = Math.sin(rotation);
    const RC = 0.213;
    const GC = 0.715;
    const BC = 0.072;
    return new Float32Array([
      RC + x * (1 - RC) + y * (-RC), GC + x * (-GC) + y * (-GC), BC + x * (-BC) + y * (1 - BC), 0,
      RC + x * (-RC) + y * 0.143, GC + x * (1 - GC) + y * 0.14, BC + x * (-BC) + y * -0.283, 0,
      RC + x * (-RC) + y * (RC - 1), GC + x * (-GC) + y * (GC), BC + x * (1 - BC) + y * BC, 0,
      0, 0, 0, 1,
    ]);
  }

  const mat_hue_mul = get_hue_mat(0.0);
  const vec_hue_offset = new Float32Array([0, 0, 0, 0]);

  gl.uniformMatrix4fv(loc_u_mat_hue, false, mat_hue_mul);
  gl.uniform4fv(loc_u_vec_hue, vec_hue_offset);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.viewport(0, 0, width, height);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  slider_gl.addEventListener("input", (e) => {
    const str = Number(e.currentTarget.value);
    gl.uniformMatrix4fv(loc_u_mat_hue, false, get_hue_mat(str));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  });
};
