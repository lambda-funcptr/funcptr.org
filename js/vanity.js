let headerRedrawQueued = false;

document.addEventListener('DOMContentLoaded', (event) => {
    const seed = Math.random() * 1000;
    let headerShaderReq = new XMLHttpRequest();

    headerShaderReq.onreadystatechange = function() {
        if (headerShaderReq.readyState === 4 && headerShaderReq.status === 200) {
            const headerCanvas = document.getElementById("headerCanvas");
            const gl = headerCanvas.getContext('webgl2');

            headerCanvas.width = headerCanvas.clientWidth;
            headerCanvas.height = headerCanvas.clientHeight;
            gl.viewport(0, 0, headerCanvas.width, headerCanvas.height);
        
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            let emptyVertShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(emptyVertShader, `#version 300 es

            in vec2 vertPos;

            void main()
            {
                gl_Position = vec4(vertPos, 0.0, 1.0);
            }
            `);
            gl.compileShader(emptyVertShader);
            if (!gl.getShaderParameter(emptyVertShader, gl.COMPILE_STATUS))
                console.error(gl.getShaderInfoLog(emptyVertShader));

            let headerShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(headerShader, headerShaderReq.responseText);
            gl.compileShader(headerShader);
            if (!gl.getShaderParameter(headerShader, gl.COMPILE_STATUS))
                console.error(gl.getShaderInfoLog(headerShader));

            let program = gl.createProgram();
            gl.attachShader(program, emptyVertShader);
            gl.attachShader(program, headerShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                var glslLinkErrors = gl.getProgramInfoLog(program);
                cleanup();
                console.error("Shader program did not link successfully: " + glslLinkErrors);
                return;
            }

            gl.detachShader(program, emptyVertShader);
            gl.detachShader(program, headerShader);
            gl.deleteShader(emptyVertShader);
            gl.deleteShader(headerShader);

            gl.useProgram(program);

            let phaseUniformLoc = gl.getUniformLocation(program, "phase");
            let screenSizeUniformLoc = gl.getUniformLocation(program, "screenSize");
            let xScaleUniformLoc = gl.getUniformLocation(program, "xScale");

            let buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

            const vertices = new Float32Array([
                -1, 1,
                1, 1,
                1, -1,
                -1, 1,
                1, -1,
                -1, -1
            ]);

            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            let vertAttrib = gl.getAttribLocation(program, "vertPos");

            gl.enableVertexAttribArray(vertAttrib);
            gl.vertexAttribPointer(vertAttrib, 2, gl.FLOAT, false, 0, 0);

            function queueRedraw () {
                if (!headerRedrawQueued) {
                    window.requestAnimationFrame(redrawHeader);
                    headerRedrawQueued = true;
                }
            }

            function redrawHeader (timestamp) {
                let phase = 0.001 * timestamp + window.scrollY + seed;

                gl.uniform2fv(screenSizeUniformLoc, [headerCanvas.width, headerCanvas.height]);
                gl.uniform1f(phaseUniformLoc, phase);
                gl.uniform1f(xScaleUniformLoc, window.innerWidth / 640);

                gl.drawArrays(gl.TRIANGLES, 0, 6);

                headerRedrawQueued = false;

                queueRedraw();
            }

            document.addEventListener('scroll', event => {
                queueRedraw();
            });

            window.addEventListener('resize', event => {
                headerCanvas.width = headerCanvas.clientWidth;
                headerCanvas.height = headerCanvas.clientHeight;
                gl.viewport(0, 0, headerCanvas.width, headerCanvas.height);

                queueRedraw();
            });

            function cleanup() {
                gl.useProgram(null);
                if (buffer)
                    gl.deleteBuffer(buffer);
                if (program)
                    gl.deleteProgram(program);
            }

            redrawHeader(0.0);
        }
    }

    headerShaderReq.open("GET", "/vanity/header.glsl", true);
    headerShaderReq.send();
});