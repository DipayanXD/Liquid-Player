export const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragmentShader = `
uniform vec2 uResolution;
uniform vec2 uElementSize;
uniform float uTime;
uniform float uHover;
uniform float uDrag;
uniform vec2 uMouse;
uniform float uAlpha; // Global visibility

varying vec2 vUv;
varying vec3 vPosition;

// Noise function
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    // 1. Generate Liquid Surface Normals
    vec2 p = vUv * 3.0; // Scale noise
    
    // Animate noise
    float t = uTime * 0.5;
    
    // Base liquid movement
    float n = snoise(p + vec2(t * 0.2, t * 0.3));
    
    // Interaction Warp (Hover/Drag)
    float warp = smoothstep(0.0, 1.0, uHover) * 0.1 * sin(vUv.y * 10.0 + uTime * 5.0);
    float dragWarp = uDrag * 0.2 * snoise(p * 2.0 + t);
    
    // Combined normal disruption
    float height = n * 0.05 + warp + dragWarp;
    
    // 2. Specular / Fresnel Highlight
    // We want a glass look. Glass has highlights at edges and where light hits.
    // Let's create a soft diagonal sheen.
    vec2 lightDir = normalize(vec2(1.0, -1.0));
    float sheen = dot(normalize(vec2(vUv.x, vUv.y) + height), lightDir);
    
    // Enhance sheen
    float hilite = smoothstep(0.4, 0.6, sheen) * 0.1; // Soft fill
    float sharpHilite = smoothstep(0.8, 0.85, sheen + height) * 0.3; // Sharp glint
    
    // Edge Glow (Rim light)
    float dist = distance(vUv, vec2(0.5));
    float rim = smoothstep(0.4, 0.5, dist) * 0.2;
    
    // Liquid "Active" State color tint
    vec3 tint = vec3(0.8, 0.9, 1.0); // Cyan-ish glass
    
    // Final Color
    // We output mostly transparent, just adding the highlights (Additive Blending effectively)
    
    float alpha = hilite + sharpHilite + rim;
    
    // Cap alpha so it's not too overpowering
    alpha = clamp(alpha, 0.0, 0.4);
    
    // Apply liquid morph intensity
    float liquidIntensity = uHover * 0.2 + uDrag * 0.3;
    alpha += liquidIntensity * (snoise(vUv * 10.0 + t) * 0.5 + 0.5);
    
    // Global Visibility Fade
    alpha *= uAlpha;

    gl_FragColor = vec4(tint, alpha);
}
`;
