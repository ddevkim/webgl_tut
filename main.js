import { compileShader, linkProgram } from "./util.js";

const gl = document.getElementById("webgl_canvas").getContext("webgl");
const slider_gl = document.getElementById("webgl_slider");

const image = new Image();
image.src = "maca.jpg";
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
      uniform mat4 u_mat_saturation;
      uniform vec4 u_vec_saturation;
      uniform sampler2D u_image;
      varying vec2 v_tex_coord;
    void main() {
        vec4 image = texture2D(u_image, v_tex_coord);
        
        //matrix 연산
        gl_FragColor = vec4(image * u_mat_saturation + u_vec_saturation);
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

  const loc_u_mat_saturation = gl.getUniformLocation(
    my_program,
    "u_mat_saturation"
  );
  const loc_u_vec_saturation = gl.getUniformLocation(
    my_program,
    "u_vec_saturation"
  );

  //prettier-ignore
  const get_saturation_mat = (s) => {
    const x = s * 2 / 3 + 1;
    const y = ((1 - x) / 2);
    return new Float32Array([
      x, y, y, 0,
      y, x, y, 0,
      y, y, x, 0,
      0, 0, 0, 1,
    ]);
  }

  const mat_saturation_mul = get_saturation_mat(0.0);
  const vec_saturation_offset = new Float32Array([0, 0, 0, 0]);

  gl.uniformMatrix4fv(loc_u_mat_saturation, false, mat_saturation_mul);
  gl.uniform4fv(loc_u_vec_saturation, vec_saturation_offset);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.viewport(0, 0, width, height);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  slider_gl.addEventListener("input", (e) => {
    const str = Number(e.currentTarget.value);
    gl.uniformMatrix4fv(loc_u_mat_saturation, false, get_saturation_mat(str));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  });
};
