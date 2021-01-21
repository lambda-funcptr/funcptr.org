#version 300 es

precision highp float;

uniform vec2 screenSize;
uniform float xScale;
uniform float phase;

out vec4 fragColor;

float smoothClamp(float x) {
    return smoothstep(-1.0f, -0.25f, x) * (1.0f - smoothstep(0.25f, 1.0f, x));
}

float harmonic(float x, float wavelength, float amp, float r_phase, float i_phase) {
    float raw = amp * i_phase * sin((x / wavelength) + r_phase);

    return raw * smoothClamp(x);
}

vec4 drawHarmonicAt(float harmonic, float y, vec4 color) {
    if (abs(harmonic - y) < 0.025f)
        return color;
    else
        return vec4 (0.0f, 0.0f, 0.0f, 0.0f);
}

void main() {
    // Normalized pixel coordinates (from -1.0 to 1.0)
    vec2 uv = 2.0f * (gl_FragCoord.xy/screenSize.xy - 0.5f);
    uv.x *= xScale;

    float h0 = harmonic(uv.x, 0.25f, 2.0f, 0.0f, cos(phase * 0.01f))  // This one looks like a cosine
             + harmonic(uv.x, 0.01f, 0.15f, phase * 0.05f, cos(phase * 0.5f))
             + harmonic(uv.x, 0.012f, 0.15f, phase * 0.04f, cos(phase * 0.2f + 1.0f))
             + harmonic(uv.x, 0.016f, 0.25f, phase * 0.001f + 1.0f, cos(phase * 0.02f + 1.0f))
             + harmonic(uv.x, 0.111f, 0.15f, phase * 0.002f + 0.5f, cos(phase * 0.05f + 1.2f))
             + harmonic(uv.x, 0.512f, 0.10f, phase * 0.004f + 0.1f, cos(phase * 1.0f + 1.2f));
    h0 = h0 / 4.0f;

    fragColor = drawHarmonicAt(h0, uv.y, vec4(1.0f, 0.25f, 0.25f, 1.0f));

    float h1 = harmonic(uv.x, 0.25f, 2.0f, 0.0f, sin(phase * 0.01f))
             + harmonic(uv.x, 0.018f, 0.15f, phase * 0.05f, cos(phase * 0.3f + 1.0f))
             + harmonic(uv.x, 1.111f, 0.10f, phase * 0.2f, cos(phase * 0.3f))
             + harmonic(uv.x, 0.013f, 0.15f, 0.0f, cos(phase * 0.3f + 10.0f))
             + harmonic(uv.x, 0.33f, 0.010f, phase * 0.2f, 1.0f)
             + harmonic(uv.x, 0.01f, 0.10f, phase * 0.004f + 0.1f, cos(phase * 1.0f + 1.2f));
    h1 = h1 / -4.0f;

    vec4 h1color =  drawHarmonicAt(h1, uv.y, vec4(0.50f, 0.50f, 1.0f, 1.0f));
    fragColor += h1color;

    float h2 = harmonic(uv.x, 0.16667f, 2.0f, radians(90.0f), cos(phase * 0.01f + radians(45.0f)))
             + harmonic(uv.x, 0.028f, 0.15f, phase * 0.01f, cos(phase * 0.3f + 3.0f))
             + harmonic(uv.x, 1.21f, 0.12f, phase * 0.2f, cos(phase * 0.5f))
             + harmonic(uv.x, 0.009f, 0.15f, 0.0f, cos(phase * 0.4f + 10.0f))
             + harmonic(uv.x, 0.41f, 0.010f, phase * 0.2f, 1.0f)
             + harmonic(uv.x, 0.02f, 0.10f, phase * 0.004f + 0.1f, cos(phase * 1.0f + 1.2f));
    h2 = h2 / 4.0f;

    vec4 h2color =  drawHarmonicAt(h2, uv.y, vec4(0.0f, 1.0f, 0.0f, 1.0f));
    fragColor += h2color;
}