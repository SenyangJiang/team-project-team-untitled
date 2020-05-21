import {tiny, defs} from './common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;

export class Balance_Ball extends Scene
{
  constructor()
  {                  // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();
    // At the beginning of our program, load one of each of these shape
    // definitions onto the GPU.  NOTE:  Only do this ONCE per shape it
    // would be redundant to tell it again.  You should just re-use the
    // one called "box" more than once in display() to draw multiple cubes.
    // Don't define more than one blueprint for the same thing here.
    this.shapes = { 'ball' : new Subdivision_Sphere( 4 ),
                    'box': new Cube()
                  };

    // *** Materials: *** Define a shader, and then define materials that use
    // that shader.  Materials wrap a dictionary of "options" for the shader.
    // Here we use a Phong shader and the Material stores the scalar
    // coefficients that appear in the Phong lighting formulas so that the
    // appearance of particular materials can be tweaked via these numbers.
    const phong = new defs.Phong_Shader();
    this.materials = { plastic: new Material( phong,
        { ambient: .2, diffusivity: 1, specularity: .5, color: color( .9,.5,.9,1 ) } ),
      ball: new Material( phong,
        { ambient: 1, diffusivity: 1, specularity:  1, color: color( .9,.5,.9,1 ) } ),
    };

    this.initial_camera_location = Mat4.look_at( vec3( 0,10,20 ), vec3( 0,0,0 ), vec3( 0,1,0 ) );

    this.ball = Mat4.identity();
    this.vx = 0;
    this.vz = 0;

    this.left = this.right = this.forward = this.back = this.safe = false;
  }
  make_control_panel()
  {                                 // make_control_panel(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    // this.key_triggered_button( "Fixed View",  [ "b" ], () => this.attached = () => this.ball );
    // this.key_triggered_button( "Panorama View",  [ "p" ], () => this.attached = () => this.initial_camera_location );
    this.key_triggered_button( "Fixed View",  [ "b" ], () => this.attached = () => Mat4.look_at(
                                          vec3(this.ball[0][3], this.ball[1][3] + 2, this.ball[2][3] + 10),
                                          vec3(this.ball[0][3], this.ball[1][3], this.ball[2][3]),
                                          vec3(0,1,1)));
    this.key_triggered_button( "Panorama View",  [ "p" ], () => this.attached = () => Mat4.look_at( vec3( 0,30,0 ), vec3( 0,0,0 ), vec3( 0,0,-1 ) ) );
    this.new_line();
    this.key_triggered_button( "Left",  [ "j" ], () => this.left = true );
    this.key_triggered_button( "Right",  [ "l" ], () => this.right = true );
    this.new_line();
    this.key_triggered_button( "Forward",  [ "i" ], () => this.forward = true );
    this.key_triggered_button( "Back",  [ "k" ], () => this.back = true );
  }
  display( context, program_state )
  {                                                // display():  Called once per frame of animation.

    // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
    if( !context.scratchpad.controls )
    { this.children.push( context.scratchpad.controls = new defs.Movement_Controls() );

      // Define the global camera and projection matrices, which are stored in program_state.  The camera
      // matrix follows the usual format for transforms, but with opposite values (cameras exist as
      // inverted matrices).  The projection matrix follows an unusual format and determines how depth is
      // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() and
      // orthographic() automatically generate valid matrices for one.  The input arguments of
      // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.
      program_state.set_camera( this.initial_camera_location );
    }
    program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 100 );

    // *** Lights: *** Values of vector or point lights.  They'll be consulted by
    // the shader when coloring shapes.  See Light's class definition for inputs.
    program_state.lights = [ new Light( vec4(5,-10,5,1), color( 1,1,1,1 ), 1000000 )];

    /**********************************
     Start coding down here!!!!
     **********************************/
    const t = program_state.animation_time/1000;
    const dt = program_state.animation_delta_time/1000;
    
    const g = 9.8;
    const blue = color( 0,0,1,1 ), yellow = color( 1,1,0,1 );

    this.ball = this.ball.times(Mat4.translation(this.vx*dt,0,this.vz*dt));

    /* draw boxes */
    let box_m = Mat4.identity().times(Mat4.translation(0,-1.2,-2)).times(Mat4.scale(1.2,0.2,1));
    for (var i = 0; i < 8; i++){
      this.shapes.box.draw(context, program_state, box_m, this.materials.ball);
      box_m = box_m.times(Mat4.translation(0,0,2));
    }
    for (var i = 0; i < 4; i++){
      this.shapes.box.draw(context, program_state, box_m, this.materials.ball);
      box_m = box_m.times(Mat4.translation(2,0,0));
    }
    for (var i = 0; i < 9; i++){
      this.shapes.box.draw(context, program_state, box_m, this.materials.ball);
      box_m = box_m.times(Mat4.translation(0,0,-2));
    }

    /* falling */
    if (this.ball[2][3] >= -3.8 && this.ball[2][3] <= 13 && this.ball[0][3] >= -1.8 && this.ball[0][3] <= 1.8){
      this.safe = true;
    }
    if (this.ball[2][3] >= 13 && this.ball[2][3] <= 15.8 && this.ball[0][3] >= -1.8 && this.ball[0][3] <= 9.8){
      this.safe = true;
    }
    if (this.ball[2][3] >= -4.8  && this.ball[2][3] <= 13 && this.ball[0][3] >= 6.2 && this.ball[0][3] <= 9.8){
      this.safe = true;
    }
    if (!this.safe){
      this.ball = this.ball.times(Mat4.translation(0,-0.05*t, 0));
    }
    /* ------ end ------ */

    if (this.left) {
      this.vx = this.vx - 50 * dt;
    } else {
      if (this.vx < 0) {
        this.vx = this.vx + 10 * dt;
        if (this.vx > 0) {
          this.vx = 0;
        }
      }
    }

    if (this.right) {
      this.vx = this.vx + 50 * dt;
    } else {
      if (this.vx > 0) {
        this.vx = this.vx - 10 * dt;
        if (this.vx < 0) {
          this.vx = 0;
        }
      }
    }

    if (this.forward) {
      this.vz = this.vz - 50 * dt;
    } else {
      if (this.vz < 0) {
        this.vz = this.vz + 10 * dt;
        if (this.vz > 0) {
          this.vx = 0;
        }
      }
    }

    if (this.back) {
      this.vz = this.vz + 50 * dt;
    } else {
      if (this.vz > 0) {
        this.vz = this.vz - 10 * dt;
        if (this.vz < 0) {
          this.vz = 0;
        }
      }
    }

    this.left = this.right = this.forward = this.back = this.safe = false;
    console.log(this.left);

    /// do rotation here??
    this.shapes.ball.draw( context, program_state, this.ball, this.materials.ball.override( blue ) );
    if (typeof this.attached !== 'undefined') {
      program_state.set_camera(this.attached().times(Mat4.translation(0, -2, -10)));
    }
  }
}