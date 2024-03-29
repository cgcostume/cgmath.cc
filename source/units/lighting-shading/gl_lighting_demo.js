
var canvas, context, controller, gl, renderer;
let halfV = 0.0;
class LightingExample extends gloperate.Renderer {

    _defaultFBO; 	// : gloperate:DefaultFramebuffer (inherits gloperate.Framebuffer)
    
    _camera; 		// : gloperate.Camera
    _navigation; 	// : gloperate.Navigation

    _cube;		// : Float32Array
    _lights;		// : Float32Array
    _cubeBuffer;  // : WebGLBuffer
    _cubeProgram;	// : gloeprate.Program;
    _lightsBuffer;  // : WebGLBuffer
    _lightsProgram;	// : gloeprate.Program;

    _uEye;
    _uUseHalfVector;
    _sphere;

    onInitialize(context, callback, eventProvider) {

        this._defaultFBO = new gloperate.DefaultFramebuffer(context, 'DefaultFBO');
        this._defaultFBO.initialize();
        this._defaultFBO.bind();


        // setup point rendering

        // refer to https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer for more information

        // >> CHANGE POINT POSITIONS, COLORS, AND SIZES HERE:

        this._cube = new Float32Array([ // x, y, z, r, g, b
            -1.0, +1.0, +1.0,  0.0, 1.0, 1.0,//1
            +1.0, +1.0, +1.0,  1.0, 1.0, 1.0,//2
            -1.0, -1.0, +1.0,  0.0, 0.0, 1.0,//3
            +1.0, -1.0, +1.0,  1.0, 0.0, 1.0,//4
            +1.0, -1.0, -1.0,  1.0, 0.0, 0.0,//5
            +1.0, +1.0, +1.0,  1.0, 1.0, 1.0,//2
            +1.0, +1.0, -1.0,  1.0, 1.0, 0.0,//6
            -1.0, +1.0, +1.0,  0.0, 1.0, 1.0,//1
            -1.0, +1.0, -1.0,  0.0, 1.0, 0.0,//7
            -1.0, -1.0, +1.0,  0.0, 0.0, 1.0,//3
            -1.0, -1.0, -1.0,  0.0, 0.0, 0.0,//8
            +1.0, -1.0, -1.0,  1.0, 0.0, 0.0,//5
            -1.0, +1.0, -1.0,  0.0, 1.0, 0.0,//7
            +1.0, +1.0, -1.0,  1.0, 1.0, 0.0,//6
            ]);

        this._lights = new Float32Array([ // x, y, z, r, g, b
            +1.0, -1.0, -0.5,  0.0, 1.0, 1.0,//1
            +0.5, -1.0, +1.0,  1.0, 0.0, 1.0,
            +1.0, +0.5, -1.0,  1.0, 1.0, 1.0,
            //-1.0, +1.0, -1.0,  0.0, 1.0, 0.0,
            ]);

        // would be better to use gloperate.Buffer (VBOs) but requires more knowledge ...

        this._cubeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._cubeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._cube, gl.STATIC_DRAW);

        // cube init
        var vert = new gloperate.Shader(context, gl.VERTEX_SHADER, 'point.vert');
        vert.initialize(`
            precision lowp float;

            layout(location = 0) in vec3 a_vertex;
            layout(location = 1) in vec3 a_color;

            uniform mat4 u_viewProjection;

            out vec4 v_color;
            out vec4 v_position;

            void main()
            {
                v_color = vec4(a_color, 1.0);

                gl_Position = u_viewProjection * vec4(a_vertex * 0.9, 1.0);
                v_position = vec4(a_vertex, 1.0);
            }
            `);
        
        var frag = new gloperate.Shader(context, gl.FRAGMENT_SHADER, 'point.frag');
        var fragString = `
            precision lowp float;

            layout(location = 0) out vec4 fragColor;
            uniform vec3 u_eye;
            uniform float u_useHalfVector;

            in vec4 v_color;
            in vec4 v_position;

            vec3 computeNormalFromPosition(in vec3 position) {

                vec3 N = position;

                if(abs(N.y) < abs(N.z) && abs(N.x) < abs(N.z)) {
                N = vec3(0.0, 0.0, sign(N.z));
                }
                else if(abs(N.x) < abs(N.y) && abs(N.z) < abs(N.y)) {
                N = vec3(0.0, sign(N.y), 0.0);
                }
                else if(abs(N.y) < abs(N.x) && abs(N.z) < abs(N.x)) {
                N = vec3(sign(N.x), 0.0, 0.0);
                }

                // NVIDIA QUADRO WORKAROUNDS (WS: Pleasers) 
                // return (floor(abs(N) + vec3(2.0)) - vec3(2.0)) * sign(N);
                // return (round(abs(N) - vec3(0.4999))) * sign(N);
                
                //return floor(abs(N)) * sign(N);
                return normalize(position);
            }

            const float PI = 3.1415926535897932384626433832795;
            const float DEG2RAD = PI / 180.0;
            
            vec3 phong(in vec3 lightPosition, in vec4 lightColor, in vec3 position, in vec3 normal, in vec3 eye) {

                // all of the following light computations are done in World Space

                float intensity = 0.0;
                float specular = 0.4;
                float shininess = 25.0;

                vec3 N = normalize(normal); 
                vec3 L = normalize(lightPosition - position); // surface position to light
                vec3 E = normalize(eye - position); // surface position to camera.eye  
                vec3 R = normalize(reflect(-L, N));
                vec3 H = normalize(L + E);

                float NdotL = max(dot(N, L), 0.0); // lambert
                float EdotN = max(dot(E, N), 0.0);
                float EdotR = max(dot(E, R), 0.0);
                float NdotH = max(dot(N, H), 0.0);
                float LdotE = max(dot(L, E), 0.0);

                //vec3 R = normalize(2.0*N*NdotL - L);

                float diffuse = NdotL;
                float specularBlinnPhong = max(0.0, pow(NdotH, shininess))*smoothstep(0.0,0.1,NdotL); // blinn-phong *step(0.0, dot(N, L))
                float specularPhong = pow(max(0.0, dot(R,E)),7.0)*smoothstep(0.0,0.1,NdotL); // phongstep(0.0, dot(N, L))
                    specular = mix(specularPhong,specularBlinnPhong,u_useHalfVector);
                vec3 result = (specular + diffuse*0.5) * lightColor.rgb * lightColor.w;
                
                return result;

            }

            void main(void)
            {

                //todo fix positions
                fragColor = vec4(0.1,0.1,0.1,1.0);
                vec3 lightPos = vec3(1.0,0.5,-1.5);
                vec3 light = phong(lightPos, vec4(0.5,1.0,0.8,1.0),v_position.xyz, computeNormalFromPosition(v_position.xyz),u_eye);
                //fragColor += vec4(light.xyz,1.0);// vec4(computeNormalFromPosition(v_position.xyz)*0.5+0.5,0.0);//v_color;
                /*lightPos = vec3(1.0,4.5,5.5);
                light = phong(lightPos, vec4(1.0,0.5,0.8,1.0),v_position.xyz, computeNormalFromPosition(v_position.xyz),u_eye);
                //fragColor += vec4(light.xyz,0.0);// vec4(computeNormalFromPosition(v_position.xyz)*0.5+0.5,1.0);//v_color;
                lightPos = vec3(4.5,-5.5,1.0);
                light = phong(lightPos, vec4(1.0,0.8,0.5,1.0),v_position.xyz, computeNormalFromPosition(v_position.xyz),u_eye);
                //fragColor += vec4(light.xyz,0.0);// vec4(computeNormalFromPosition(v_position.xyz)*0.5+0.5,1.0);//v_color;
                */

            `;
        var stride = 6;
        for(let i = 0; i<this._lights.length;i+=stride){
        console.log(this._lights[i]+","+this._lights[i+1]+","+this._lights[i+2]);
            fragString += `
                lightPos = vec3(`+this._lights[i]+","+this._lights[i+1]+","+this._lights[i+2]+`);
                light = phong(lightPos, vec4(`+this._lights[i+3]+","+this._lights[i+4]+","+this._lights[i+5]+`,1.0), v_position.xyz, computeNormalFromPosition(v_position.xyz),u_eye);
                fragColor += vec4(light.xyz,0.0);;
                `
        }
        fragString +=`
            }`;
        frag.initialize(fragString);

        this._cubeProgram = new gloperate.Program(context, 'PointProgram');
        this._cubeProgram.initialize([vert, frag], false);

        this._cubeProgram.link();
        this._cubeProgram.bind();

        this._cubeProgram.attribute('a_vertex', 0);
        this._cubeProgram.attribute('a_color', 1);

            
        this._sphere = new gloperate.GeosphereGeometry(context, 'Sphere');
        this._sphere.initialize();


        //lights init            
        this._lightsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._lightsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._lights, gl.STATIC_DRAW);

        var vert2 = new gloperate.Shader(context, gl.VERTEX_SHADER, 'light.vert');
        vert2.initialize(`
            precision lowp float;

            layout(location = 0) in vec3 a_vertex;
            layout(location = 1) in vec3 a_color;

            uniform mat4 u_viewProjection;

            out vec4 v_color;

            void main()
            {
                v_color = vec4(a_color, 1.0);

                gl_Position = u_viewProjection * vec4(a_vertex*0.75, 1.0);
                gl_PointSize = 20.0;
            }
            `);
        
        var frag2 = new gloperate.Shader(context, gl.FRAGMENT_SHADER, 'light.frag');
        frag2.initialize(`
            precision lowp float;

            layout(location = 0) out vec4 fragColor;

            in vec4 v_color;

            void main(void)
            {
                vec2 uv = gl_PointCoord.xy * 2.0 - 1.0;

                float zz = dot(uv, uv);
                if(zz > 1.0)
                    discard;

                fragColor = v_color;
            }
            `);

        this._lightsProgram = new gloperate.Program(context, 'LightProgram');
        this._lightsProgram.initialize([vert2, frag2], false);

        this._lightsProgram.link();
        this._lightsProgram.bind();

        this._lightsProgram.attribute('a_vertex', 0);
        this._lightsProgram.attribute('a_color', 1);
        
        this._camera = new gloperate.Camera();
        this._camera.center = gloperate.vec3.fromValues(0.0, 0.0, 0.0);
        this._camera.up = gloperate.vec3.fromValues(0.0, 1.0, 0.0);
        this._camera.eye = gloperate.vec3.fromValues(0.0, 0.0, 4.0);
        this._camera.near = 0.1;
        this._camera.far = 16.0;

        this._navigation = new gloperate.Navigation(callback, eventProvider);
        this._navigation.camera = this._camera;
        this._navigation.onWheel = ()=>0;

        
        this._uEye = this._cubeProgram.uniform("u_eye");
        this._uUseHalfVector = this._cubeProgram.uniform("u_useHalfVector");



        return true;
    }

    onUninitialize() {
        super.uninitialize();

        this._defaultFBO.uninitialize();

        gl.deleteBuffer(this._cubeBuffer);
        this._cubeProgram.uninitialize();
        this._sphere.uninitialize();
    }

    onDiscarded() { 
        this._altered.alter('canvasSize');
        this._altered.alter('clearColor');
    }

    onUpdate() { 
        this._navigation.update();

        return this._altered.any || this._camera.altered; // update only on change
        // return true; // continuous rendering
    }

    onPrepare() { 
        if (this._altered.canvasSize) {
            this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];
            this._camera.viewport = this._canvasSize;
        }

        if (this._altered.clearColor) {
            this._defaultFBO.clearColor(this._clearColor);
        }

        this._altered.reset();
        this._camera.altered = false;
        
        this._clearColor=[0,0,0,0];
        this._defaultFBO.clearColor(this._clearColor);
    }

    onFrame() {
    
        // clear previous rendering

        this._defaultFBO.bind(); 
        this._defaultFBO.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, true, false);

        gl.viewport(0, 0, this._frameSize[0], this._frameSize[1]);

        gl.enable(gl.DEPTH_TEST);

        // render cube

        this._cubeProgram.bind();
        gl.uniformMatrix4fv(this._cubeProgram.uniform('u_viewProjection'), 
            gl.GL_FALSE, this._camera.viewProjection);
        gl.uniform3fv(this._uEye, this._camera.eye);
        gl.uniform1f(this._uUseHalfVector, halfV);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._lightsBuffer);

        // refer to https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer for more information

        
        this._sphere.bind();
        this._sphere.draw();
        this._sphere.unbind();

        this._cubeProgram.unbind();

        this._lightsProgram.bind();
        gl.uniformMatrix4fv(this._lightsProgram.uniform('u_viewProjection'), 
            gl.GL_FALSE, this._camera.viewProjection);
        gl.uniform3fv(this._uEye, this._camera.eye);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._lightsBuffer);
       let stride = 6 * Float32Array.BYTES_PER_ELEMENT;
        gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, stride, 0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, stride, 3 * Float32Array.BYTES_PER_ELEMENT);	    
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);

        gl.drawArrays(gl.POINTS, 0, this._lights.length / 6);
        gl.bindBuffer(gl.ARRAY_BUFFER, gloperate.Buffer.DEFAULT_BUFFER);

        gl.disableVertexAttribArray(0);
        gl.disableVertexAttribArray(1);
        this._lightsProgram.unbind();
        // render more ...
    }

    onSwap() { }

}


function initialize() {

    var canvasElement = document.getElementById('canvas');
    canvas = new gloperate.Canvas(canvasElement, {
        alpha: true, antialias: true, depth: true, failIfMajorPerformanceCaveat: false,
        premultipliedAlpha: false, preserveDrawingBuffer: false, stencil: false,
    });

    var blocker = new gloperate.viewer.EventBlocker(canvas.element);
    blocker.block('contextmenu');

    canvasElement.addEventListener('click', (event) => {
        if (event.ctrlKey) { gloperate.viewer.Fullscreen.toggle(canvasElement); }
    });

    context = canvas.context;
    controller = canvas.controller;
    gl = canvas.context.gl;

    renderer = new LightingExample();
    canvas.renderer = renderer;
}

window.onload = function () {
    initialize();
}
