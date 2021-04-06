export const getIdx = (i, j, width) => (j * width + i) * 4;

export const compileShader = (gl, shader_src, shader_type) => {
  const shader = gl.createShader(shader_type);
  gl.shaderSource(shader, shader_src);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(
      `Complete Compile: ${
        shader_type === gl.VERTEX_SHADER ? "vertex shader" : "fragment shader"
      }`
    );
  } else {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }
  return shader;
};

export const linkProgram = (gl, vertex_shader, fragment_shader) => {
  const program = gl.createProgram();
  gl.attachShader(program, vertex_shader);
  gl.attachShader(program, fragment_shader);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log("Complete Program Link");
  } else {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }
  return program;
};
