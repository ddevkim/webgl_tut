import { getIdx, compileShader, linkProgram } from "./util.js";

const canvas_2d = document.getElementById("2d_canvas");
const canvas_gl = document.getElementById("webgl_canvas");
const slider_2d = document.getElementById("2d_slider");
const slider_gl = document.getElementById("webgl_slider");

const ctx_2d = canvas_2d.getContext("2d");
const gl = canvas_gl.getContext("webgl");

const image = new Image();
image.src = "lake.jpg";
image.onload = () => {
  const width = image.width;
  const height = image.height;

  ////////////////////////////////////
  // image processing for 2d canvas //
  ////////////////////////////////////

  //1. 이미지를 캔버스에 그림
  ctx_2d.drawImage(image, 0, 0, width, height);

  //2. 픽셀 데이터 배열을 로드
  const pixel_arr = ctx_2d.getImageData(0, 0, width, height).data;

  //3. 동일한 길이의 새로운 픽셀 데이터 배열을 생성 (기존 배열을 치환하지 않고 보존하기 위함)
  const proc_pixel_arr = new Uint8ClampedArray(pixel_arr.length);

  //4. 슬라이더 이벤트 등록
  slider_2d.addEventListener("input", (e) => {
    const val = Number(e.currentTarget.value) + 1;

    //5. input 이벤트: 모든 픽셀을 순회하면서 기존 픽셀 RGB값에 value 만큼 곱한 값을 새로운 배열에 반환.
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const idx = getIdx(i, j, width);
        proc_pixel_arr[idx] = pixel_arr[idx] * val;
        proc_pixel_arr[idx + 1] = pixel_arr[idx + 1] * val;
        proc_pixel_arr[idx + 2] = pixel_arr[idx + 2] * val;
        proc_pixel_arr[idx + 3] = pixel_arr[idx + 3];
      }
    }

    //6. 프로세싱 후 새로운 픽셀 배열을 다시 캔버스에 그림
    ctx_2d.putImageData(new ImageData(proc_pixel_arr, width, height), 0, 0);
  });

  ///////////////////////////////////////
  // image processing for webGL canvas //
  ///////////////////////////////////////

  //1. 텍스트 형태로 glsl 소스 코드 작

  //language="glsl"
  const vertex_shader_src = `
      //1. 소수 정밀도 선언
    precision mediump float;
      //2. vertex shader가 삼각형을 그릴 포지션 데이터 선언
    attribute vec2 a_position;
      //3. 텍스쳐 좌표 데이터 선언
    attribute vec2 a_tex_coord;
      //4. fragment shader로 넘길 텍스쳐 좌표 데이터 선언
    varying vec2 v_tex_coord;
      //5. vertex shader의 main 실행 함수
    void main() {
        //삼각형 포지션을 웹 상에서 css 좌표계로 다루는 게 편해서 a_position값은 css 좌표계 값으로 사용
        //glsl의 clipspace는 중앙에 origin이 있는 수학 좌표계를 사용
        //css 좌표계 ==> glsl clipspace 좌표계로 변환 수식 작성
        gl_Position = vec4(((a_position * 2.0) - 1.0) * vec2(1.0, -1.0), 0, 1);
        //텍스쳐 좌표를 varying 변수로 fragment shader로 넘김
        v_tex_coord = a_tex_coord;
    }
  `;
  //language="glsl"
  const fragment_shader_src = `
      //1. 정밀도 선언
      precision mediump float;
      //2. uniform 값으로 brightness 변수 데이터 선언
      uniform float u_brightness;
      //3. 이미지 텍스쳐를 샘플링 할 변수 선언
      uniform sampler2D u_image;
      //4. 선형 보간 된 텍스쳐 좌표값
      varying vec2 v_tex_coord;
    void main() {
        //이미지 rgba값 샘플링
        vec4 image = texture2D(u_image, v_tex_coord);
        //rgb 값에 brightness 변수 값을 곱해서 조정, alpha값은 원본 이미지 값 그대로 사용
        gl_FragColor = vec4(image.rgb * u_brightness, image.a);
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

  //7-1. pass vertex position attribute data to vertex shader
  const loc_a_position = gl.getAttribLocation(my_program, "a_position");
  gl.enableVertexAttribArray(loc_a_position);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_position);
  gl.vertexAttribPointer(loc_a_position, 2, gl.FLOAT, false, 0, 0);

  //7-2. pass tex coord attribute data to vertex shader
  const loc_a_tex_coord = gl.getAttribLocation(my_program, "a_tex_coord");
  gl.enableVertexAttribArray(loc_a_tex_coord);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_a_tex_coord);
  gl.vertexAttribPointer(loc_a_tex_coord, 2, gl.FLOAT, false, 0, 0);

  //7-3. pass uniform value to fragment shader
  const loc_u_brightness = gl.getUniformLocation(my_program, "u_brightness");
  gl.uniform1f(loc_u_brightness, 1.0);

  //7-4 pass texture values to fragment shader
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  //7-5 setting viewport of the canvas
  gl.viewport(0, 0, width, height);

  //7-6 render
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  //8. event register
  slider_gl.addEventListener("input", (e) => {
    const val = Number(e.currentTarget.value) + 1;
    gl.uniform1f(loc_u_brightness, val);
  });
};
